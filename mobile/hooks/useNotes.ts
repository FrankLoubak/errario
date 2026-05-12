import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { getDatabase } from '../lib/sqlite';
import { NoteRepo } from '../db/repositories/NoteRepo';
import { useStorageMode } from './useStorageMode';
import type { Note, CreateNoteInput, UpdateNoteInput } from '../types/note';

// Chaves de cache React Query
const NOTES_KEY = 'notes';
const ANALYTICS_KEY = 'notes-analytics';

// ─────────────────────────────────────────────
// Tipos da API REST
// ─────────────────────────────────────────────

interface ApiListResponse {
  success: boolean;
  data: { notes: Note[]; total: number; hasMore: boolean };
}

interface ApiNoteResponse {
  success: boolean;
  data: { note: Note };
}

// ─────────────────────────────────────────────
// Adaptadores: SQLite ↔ API (mesma interface)
// ─────────────────────────────────────────────

async function fetchNotesLocal(subject?: string): Promise<{ notes: Note[]; total: number }> {
  const db = await getDatabase();
  const repo = new NoteRepo(db);
  return repo.findAll({ status: 'active', subject });
}

async function fetchNotesCloud(subject?: string): Promise<{ notes: Note[]; total: number }> {
  const params = new URLSearchParams({ status: 'active', limit: '100', offset: '0' });
  if (subject) params.set('subject', subject);
  const res = await api.get<ApiListResponse>(`/notes?${params}`);
  const { notes, total } = res.data.data;
  return { notes, total };
}

async function createNoteLocal(input: CreateNoteInput): Promise<Note> {
  const db = await getDatabase();
  const repo = new NoteRepo(db);
  return repo.create(input);
}

async function createNoteCloud(input: CreateNoteInput): Promise<Note> {
  const res = await api.post<ApiNoteResponse>('/notes', input);
  return res.data.data.note;
}

async function updateNoteLocal(id: string, input: UpdateNoteInput): Promise<Note> {
  const db = await getDatabase();
  const repo = new NoteRepo(db);
  const note = await repo.update(id, input);
  if (!note) throw new Error('Nota não encontrada');
  return note;
}

async function updateNoteCloud(id: string, input: UpdateNoteInput): Promise<Note> {
  const res = await api.patch<ApiNoteResponse>(`/notes/${id}`, input);
  return res.data.data.note;
}

async function deleteNoteLocal(id: string): Promise<void> {
  const db = await getDatabase();
  const repo = new NoteRepo(db);
  await repo.softDelete(id);
}

async function deleteNoteCloud(id: string): Promise<void> {
  await api.delete(`/notes/${id}`);
}

// ─────────────────────────────────────────────
// Hook principal
// ─────────────────────────────────────────────

export function useNotes(subject?: string) {
  const mode = useStorageMode();
  const isCloud = mode === 'CLOUD';
  const queryClient = useQueryClient();

  const notesQuery = useQuery({
    queryKey: [NOTES_KEY, mode, subject],
    queryFn: () => (isCloud ? fetchNotesCloud(subject) : fetchNotesLocal(subject)),
    staleTime: isCloud ? 2 * 60 * 1000 : Infinity, // Cloud: 2min; Local: nunca refetch automático
  });

  const createMutation = useMutation({
    mutationFn: (input: CreateNoteInput) =>
      isCloud ? createNoteCloud(input) : createNoteLocal(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [NOTES_KEY] });
      queryClient.invalidateQueries({ queryKey: [ANALYTICS_KEY] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateNoteInput }) =>
      isCloud ? updateNoteCloud(id, input) : updateNoteLocal(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [NOTES_KEY] });
      queryClient.invalidateQueries({ queryKey: [ANALYTICS_KEY] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      isCloud ? deleteNoteCloud(id) : deleteNoteLocal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [NOTES_KEY] });
      queryClient.invalidateQueries({ queryKey: [ANALYTICS_KEY] });
    },
  });

  const sync = useCallback(async () => {
    if (isCloud) {
      await queryClient.invalidateQueries({ queryKey: [NOTES_KEY] });
    }
  }, [isCloud, queryClient]);

  return {
    notes: notesQuery.data?.notes ?? [],
    total: notesQuery.data?.total ?? 0,
    isLoading: notesQuery.isLoading,
    isError: notesQuery.isError,
    error: notesQuery.error,
    refetch: notesQuery.refetch,
    sync, // chamado pelo useAppStateSync (Pro)
    createNote: createMutation.mutateAsync,
    updateNote: (id: string, input: UpdateNoteInput) =>
      updateMutation.mutateAsync({ id, input }),
    deleteNote: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

// ─────────────────────────────────────────────
// Hook de analytics (pizza chart)
// ─────────────────────────────────────────────

interface AnalyticsData {
  total: number;
  totalFavorites: number;
  bySubject: { subject: string; count: number; percentage: number }[];
}

async function fetchAnalyticsLocal(): Promise<AnalyticsData> {
  const db = await getDatabase();
  const repo = new NoteRepo(db);
  const { notes } = await repo.findAll({ status: 'active' });

  const bySubjectMap = new Map<string, number>();
  for (const note of notes) {
    const key = note.subject || 'Sem matéria';
    bySubjectMap.set(key, (bySubjectMap.get(key) ?? 0) + 1);
  }

  const total = notes.length;
  const bySubject = Array.from(bySubjectMap.entries())
    .map(([subject, count]) => ({
      subject,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  return {
    total,
    totalFavorites: notes.filter((n) => n.favorite).length,
    bySubject,
  };
}

async function fetchAnalyticsCloud(): Promise<AnalyticsData> {
  const res = await api.get<{ success: boolean; data: AnalyticsData }>('/notes/analytics');
  return res.data.data;
}

export function useNoteAnalytics() {
  const mode = useStorageMode();
  const isCloud = mode === 'CLOUD';

  return useQuery({
    queryKey: [ANALYTICS_KEY, mode],
    queryFn: () => (isCloud ? fetchAnalyticsCloud() : fetchAnalyticsLocal()),
    staleTime: 5 * 60 * 1000,
  });
}
