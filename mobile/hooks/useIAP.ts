import { useState, useEffect, useCallback } from 'react';
import {
  initConnection,
  endConnection,
  getSubscriptions,
  requestSubscription,
  getAvailablePurchases,
  finishTransaction,
  type Subscription,
  type SubscriptionPurchase,
  type Purchase,
  PurchaseError,
  purchaseErrorListener,
  purchaseUpdatedListener,
} from 'react-native-iap';
import { Platform } from 'react-native';
import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';

// Product IDs registrados nas lojas (devem coincidir com o backend PRO_PRODUCT_IDS)
const SKU_MONTHLY = 'com.errario.app.pro.monthly';
const SKU_YEARLY  = 'com.errario.app.pro.yearly';
export const SKUS = [SKU_MONTHLY, SKU_YEARLY];

export interface IAPProduct {
  sku: string;
  title: string;
  price: string;
  localizedPrice: string;
  currency: string;
  isYearly: boolean;
}

// ─────────────────────────────────────────────
// Validação server-side após compra
// ─────────────────────────────────────────────

async function validateWithBackend(purchase: Purchase): Promise<void> {
  if (Platform.OS === 'ios') {
    await api.post('/billing/validate-iap/apple', {
      transactionId: purchase.transactionId,
      productId: purchase.productId,
    });
  } else {
    await api.post('/billing/validate-iap/google', {
      purchaseToken: (purchase as SubscriptionPurchase).purchaseToken,
      subscriptionId: purchase.productId,
    });
  }
}

// ─────────────────────────────────────────────
// Hook principal
// ─────────────────────────────────────────────

export function useIAP() {
  const [products, setProducts] = useState<IAPProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);

  const refreshUser = useAuthStore((state) => state.refreshUser);

  // Inicializa conexão IAP e busca os produtos
  useEffect(() => {
    let purchaseUpdateSub: ReturnType<typeof purchaseUpdatedListener>;
    let purchaseErrorSub: ReturnType<typeof purchaseErrorListener>;

    async function init() {
      try {
        await initConnection();

        // Listener de compra concluída
        purchaseUpdateSub = purchaseUpdatedListener(async (purchase) => {
          try {
            setIsPurchasing(true);
            await validateWithBackend(purchase);
            await finishTransaction({ purchase, isConsumable: false });
            await refreshUser(); // Atualiza tier no store
            setError(null);
          } catch {
            setError('Falha ao confirmar a compra. Entre em contato com o suporte.');
          } finally {
            setIsPurchasing(false);
          }
        });

        // Listener de erro de compra
        purchaseErrorSub = purchaseErrorListener((err: PurchaseError) => {
          if (err.code !== 'E_USER_CANCELLED') {
            setError(err.message ?? 'Erro durante a compra');
          }
          setIsPurchasing(false);
        });

        // Carrega produtos das lojas
        const subs = await getSubscriptions({ skus: SKUS });
        setProducts(
          subs.map((s: Subscription) => ({
            sku: s.productId,
            title: s.title ?? '',
            price: s.price ?? '',
            localizedPrice: s.localizedPrice ?? '',
            currency: s.currency ?? '',
            isYearly: s.productId === SKU_YEARLY,
          }))
        );
      } catch (err) {
        // Falha silenciosa em simulador sem conta de loja configurada
        console.warn('IAP init failed (simulador?):', err);
      }
    }

    void init();

    return () => {
      purchaseUpdateSub?.remove();
      purchaseErrorSub?.remove();
      endConnection().catch(() => null);
    };
  }, [refreshUser]);

  // Inicia o fluxo de compra nativo (IAP sheet da Apple/Google)
  const subscribe = useCallback(async (sku: string) => {
    setError(null);
    setIsPurchasing(true);
    try {
      await requestSubscription({ sku });
      // O resultado chega via purchaseUpdatedListener
    } catch (err) {
      if ((err as PurchaseError).code !== 'E_USER_CANCELLED') {
        setError('Não foi possível iniciar a compra. Tente novamente.');
      }
      setIsPurchasing(false);
    }
  }, []);

  // Restaura compras anteriores (obrigatório pela Apple)
  const restorePurchases = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const purchases = await getAvailablePurchases();
      if (purchases.length === 0) {
        setError('Nenhuma compra anterior encontrada.');
        return;
      }

      // Valida a compra mais recente com o backend
      const latest = purchases[0];
      await validateWithBackend(latest);
      await refreshUser();
    } catch {
      setError('Falha ao restaurar compras. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }, [refreshUser]);

  return {
    products,
    isLoading,
    error,
    isPurchasing,
    subscribe,
    restorePurchases,
    monthlyProduct: products.find((p) => p.sku === SKU_MONTHLY),
    yearlyProduct: products.find((p) => p.sku === SKU_YEARLY),
  };
}
