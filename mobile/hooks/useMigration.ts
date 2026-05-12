import { useState } from 'react';
import { api } from '../lib/api';
import { getDatabase } from '../lib/sqlite';
import { NoteRepo } from '../db/repositories/NoteRepo';
import { useAuthStore } from '../store/authStore';

export interface MigrationResult {
  imported: number;
  skipped: number;
  failed: number;
}

export interface MigrationState {
  status: 'idle' | 'running' | 'done' | 'error';
  progress: number; // 0–100
  result: MigrationResult | null;
  error: string | null;
}

// Migra todas as notas do SQLite local para o PostgreSQL na cloud.
// Deve ser chamado imediatamente após o upgrade para Pro ser confirmado.
export function useMigration() {
  const [state, setState] = useState<MigrationState>({
    status: 'idle',
    progress: 0,
    result: null,
    error: null,
  });

  const refreshUser = useAuthStore((s) => s.refreshUser);

  async function startMigration() {
    setState({ status: 'running', progress: 0, result: null, error: null });

    try {
      // 1. Lê todas as notas locais
      setState((s) => ({ ...s, progress: 20 }));
      const db = await getDatabase();
      const repo = new NoteRepo(db);
      const notes = await repo.getAllForMigration();

      if (notes.length === 0) {
        setState({ status: 'done', progress: 100, result: { imported: 0, skipped: 0, failed: 0 }, error: null });
        return;
      }

      setState((s) => ({ ...s, progress: 40 }));

      // 2. Envia para o backend em lotes de 50
      const BATCH = 50;
      let imported = 0;
      let skipped = 0;
      let failed = 0;

      for (let i = 0; i < notes.length; i += BATCH) {
        const batch = notes.slice(i, i + BATCH);

        const res = await api.post<{
          success: boolean;
          data: MigrationResult;
        }>('/migrations/from-local', { notes: batch });

        imported += res.data.data.imported;
        skipped += res.data.data.skipped;
        failed += res.data.data.failed;

        const progress = 40 + Math.round(((i + BATCH) / notes.length) * 50);
        setState((s) => ({ ...s, progress: Math.min(progress, 90) }));
      }

      // 3. Atualiza dados do usuário (storageMode já foi atualizado no backend pelo IAP validate)
      await refreshUser();

      setState({
        status: 'done',
        progress: 100,
        result: { imported, skipped, failed },
        error: null,
      });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Falha na migração. Seus dados locais estão seguros.';

      setState((s) => ({ ...s, status: 'error', error: message }));
    }
  }

  function reset() {
    setState({ status: 'idle', progress: 0, result: null, error: null });
  }

  return { ...state, startMigration, reset };
}
