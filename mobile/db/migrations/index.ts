import type { SQLiteDatabase } from 'expo-sqlite';
import {
  SCHEMA_VERSION,
  CREATE_NOTES_TABLE,
  CREATE_PLANNER_CARDS_TABLE,
  CREATE_REVIEW_DATES_TABLE,
  CREATE_META_TABLE,
  CREATE_INDEXES,
  META_KEYS,
} from '../schema';

// Executa todas as migrations necessárias para chegar na versão atual
// expo-sqlite gerencia o estado de versão via user_version PRAGMA
export async function runMigrations(db: SQLiteDatabase): Promise<void> {
  await db.withTransactionAsync(async () => {
    const result = await db.getFirstAsync<{ user_version: number }>(
      'PRAGMA user_version'
    );
    const currentVersion = result?.user_version ?? 0;

    if (currentVersion < 1) {
      await migration_v1(db);
    }

    // Futuras migrations seguem o padrão:
    // if (currentVersion < 2) { await migration_v2(db); }

    await db.runAsync(`PRAGMA user_version = ${SCHEMA_VERSION}`);
  });
}

// Migration v1: schema inicial
async function migration_v1(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(CREATE_META_TABLE);
  await db.execAsync(CREATE_NOTES_TABLE);
  await db.execAsync(CREATE_PLANNER_CARDS_TABLE);
  await db.execAsync(CREATE_REVIEW_DATES_TABLE);
  await db.execAsync(CREATE_INDEXES);

  // Inicializa o metadata da v1
  await db.runAsync(
    'INSERT OR IGNORE INTO meta (key, value) VALUES (?, ?)',
    [META_KEYS.SCHEMA_VERSION, '1']
  );
  await db.runAsync(
    'INSERT OR IGNORE INTO meta (key, value) VALUES (?, ?)',
    [META_KEYS.STORAGE_MODE, 'LOCAL']
  );
}
