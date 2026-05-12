import type { SQLiteDatabase } from 'expo-sqlite';
import { randomUUID } from 'expo-crypto';
import type { Note, CreateNoteInput, UpdateNoteInput, NoteStatus } from '../../types/note';
import { FREE_TIER_NOTE_LIMIT } from '../schema';

function rowToNote(row: Record<string, unknown>): Note {
  return {
    id: row.id as string,
    localId: row.local_id as string,
    title: row.title as string,
    body: row.body as string,
    subject: row.subject as string,
    tags: JSON.parse(row.tags as string) as string[],
    favorite: (row.favorite as number) === 1,
    status: row.status as NoteStatus,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export class NoteRepo {
  constructor(private db: SQLiteDatabase) {}

  async findAll(options?: {
    status?: NoteStatus;
    subject?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ notes: Note[]; total: number }> {
    const status = options?.status ?? 'active';
    const limit = options?.limit ?? 50;
    const offset = options?.offset ?? 0;

    const whereSubject = options?.subject
      ? 'AND subject = ?'
      : '';
    const params = options?.subject
      ? [status, options.subject, limit, offset]
      : [status, limit, offset];

    const rows = await this.db.getAllAsync<Record<string, unknown>>(
      `SELECT * FROM notes WHERE status = ? ${whereSubject} ORDER BY updated_at DESC LIMIT ? OFFSET ?`,
      params
    );

    const countRow = await this.db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM notes WHERE status = ? ${whereSubject}`,
      options?.subject ? [status, options.subject] : [status]
    );

    return {
      notes: rows.map(rowToNote),
      total: countRow?.count ?? 0,
    };
  }

  async findById(id: string): Promise<Note | null> {
    const row = await this.db.getFirstAsync<Record<string, unknown>>(
      'SELECT * FROM notes WHERE id = ? AND status != ?',
      [id, 'deleted']
    );
    return row ? rowToNote(row) : null;
  }

  async countActive(): Promise<number> {
    const result = await this.db.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) as count FROM notes WHERE status = 'active'"
    );
    return result?.count ?? 0;
  }

  async create(input: CreateNoteInput): Promise<Note> {
    const activeCount = await this.countActive();
    if (activeCount >= FREE_TIER_NOTE_LIMIT) {
      throw new Error(`QUOTA_EXCEEDED:${FREE_TIER_NOTE_LIMIT}`);
    }

    const id = randomUUID();
    const now = new Date().toISOString();

    await this.db.runAsync(
      `INSERT INTO notes (id, local_id, title, body, subject, tags, favorite, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)`,
      [
        id,
        id,
        input.title,
        input.body,
        input.subject,
        JSON.stringify(input.tags ?? []),
        input.favorite ? 1 : 0,
        now,
        now,
      ]
    );

    return (await this.findById(id))!;
  }

  async update(id: string, input: UpdateNoteInput): Promise<Note | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const now = new Date().toISOString();
    const updates: string[] = [];
    const values: unknown[] = [];

    if (input.title !== undefined) { updates.push('title = ?'); values.push(input.title); }
    if (input.body !== undefined) { updates.push('body = ?'); values.push(input.body); }
    if (input.subject !== undefined) { updates.push('subject = ?'); values.push(input.subject); }
    if (input.tags !== undefined) { updates.push('tags = ?'); values.push(JSON.stringify(input.tags)); }
    if (input.favorite !== undefined) { updates.push('favorite = ?'); values.push(input.favorite ? 1 : 0); }
    if (input.status !== undefined) { updates.push('status = ?'); values.push(input.status); }

    if (updates.length === 0) return existing;

    updates.push('updated_at = ?');
    values.push(now);
    values.push(id);

    await this.db.runAsync(
      `UPDATE notes SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    return this.findById(id);
  }

  async softDelete(id: string): Promise<void> {
    await this.db.runAsync(
      "UPDATE notes SET status = 'deleted', updated_at = ? WHERE id = ?",
      [new Date().toISOString(), id]
    );
  }

  async getAllForMigration(): Promise<Note[]> {
    const rows = await this.db.getAllAsync<Record<string, unknown>>(
      "SELECT * FROM notes WHERE status != 'deleted' ORDER BY created_at ASC"
    );
    return rows.map(rowToNote);
  }
}
