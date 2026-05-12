import { useEffect, useRef } from 'react';
import { useAuthStore } from '../store/authStore';

// AdMob ativado apenas no Mês 4+ para não prejudicar crescimento orgânico inicial (ADR #7).
// Enquanto ADMOB_ENABLED = false, todas as funções são no-ops sem custo de runtime.
const ADMOB_ENABLED = process.env.EXPO_PUBLIC_ADMOB_ENABLED === 'true';

export function useInterstitialAd(_adUnitId: string) {
  const user = useAuthStore((s) => s.user);
  const isPro = user?.tier === 'PRO' || user?.tier === 'ENTERPRISE';

  // Pro users never see ads
  const shouldShowAds = ADMOB_ENABLED && !isPro;

  const showAd = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!shouldShowAds) return;

    let mounted = true;

    async function loadInterstitial() {
      try {
        const {
          InterstitialAd,
          AdEventType,
          TestIds,
        } = await import('react-native-google-mobile-ads');

        const unitId = __DEV__ ? TestIds.INTERSTITIAL : _adUnitId;
        const ad = InterstitialAd.createForAdRequest(unitId, {
          requestNonPersonalizedAdsOnly: true,
        });

        ad.addAdEventListener(AdEventType.LOADED, () => {
          if (mounted) showAd.current = () => ad.show();
        });

        ad.addAdEventListener(AdEventType.CLOSED, () => {
          if (mounted) {
            showAd.current = null;
            loadInterstitial();
          }
        });

        ad.load();
      } catch {
        // AdMob não disponível neste ambiente — silencia
      }
    }

    loadInterstitial();
    return () => { mounted = false; };
  }, [shouldShowAds, _adUnitId]);

  return {
    show: () => { showAd.current?.(); },
    isEnabled: shouldShowAds,
  };
}
