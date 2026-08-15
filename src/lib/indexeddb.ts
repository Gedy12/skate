import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Skate, Session, SyncOperation } from '@/types';

interface SkateHouseDB extends DBSchema {
  skates: {
    key: string;
    value: Skate;
  };
  sessions: {
    key: string;
    value: Session;
  };
  sync_queue: {
    key: string;
    value: SyncOperation;
  };
}

let dbPromise: Promise<IDBPDatabase<SkateHouseDB>> | null = null;

export const initDB = () => {
  if (typeof window === 'undefined') return null; // Avoid running on server
  if (!dbPromise) {
    dbPromise = openDB<SkateHouseDB>('skatehouse_db', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('skates')) {
          db.createObjectStore('skates', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('sessions')) {
          db.createObjectStore('sessions', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('sync_queue')) {
          db.createObjectStore('sync_queue', { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
};

// Data Access Methods
export const getSkates = async (): Promise<Skate[]> => {
  const db = await initDB();
  if (!db) return [];
  return db.getAll('skates');
};

export const saveSkate = async (skate: Skate) => {
  const db = await initDB();
  if (db) await db.put('skates', skate);
};

export const getSessions = async (): Promise<Session[]> => {
  const db = await initDB();
  if (!db) return [];
  return db.getAll('sessions');
};

export const getSession = async (id: string): Promise<Session | undefined> => {
  const db = await initDB();
  if (!db) return undefined;
  return db.get('sessions', id);
};

export const saveSession = async (session: Session) => {
  const db = await initDB();
  if (db) await db.put('sessions', session);
};

export const getSyncQueue = async (): Promise<SyncOperation[]> => {
  const db = await initDB();
  if (!db) return [];
  return db.getAll('sync_queue');
};

export const saveSyncOperation = async (op: SyncOperation) => {
  const db = await initDB();
  if (db) await db.put('sync_queue', op);
};

export const removeSyncOperation = async (id: string) => {
  const db = await initDB();
  if (db) await db.delete('sync_queue', id);
};

export const clearLocalData = async () => {
  const db = await initDB();
  if (db) {
    await db.clear('skates');
    await db.clear('sessions');
    await db.clear('sync_queue');
  }
};
