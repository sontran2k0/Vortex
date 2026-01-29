
import { Word, UserStats, StudyHistory, Collection } from '../types';

const DB_NAME = 'VortexDataDB';
const DB_VERSION = 2;
const STORE_WORDS = 'words';
const STORE_STATS = 'stats';
const STORE_HISTORY = 'history';
const STORE_COLLECTIONS = 'collections';

const initDataDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_WORDS)) {
        db.createObjectStore(STORE_WORDS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_STATS)) {
        db.createObjectStore(STORE_STATS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_HISTORY)) {
        db.createObjectStore(STORE_HISTORY, { keyPath: 'date' });
      }
      if (!db.objectStoreNames.contains(STORE_COLLECTIONS)) {
        db.createObjectStore(STORE_COLLECTIONS, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const localDbSaveWords = async (words: Word[]): Promise<void> => {
  const db = await initDataDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_WORDS, 'readwrite');
    const store = transaction.objectStore(STORE_WORDS);
    store.clear();
    words.forEach(word => store.put(word));
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};

export const localDbGetWords = async (): Promise<Word[]> => {
  const db = await initDataDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_WORDS, 'readonly');
    const store = transaction.objectStore(STORE_WORDS);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const localDbSaveStats = async (stats: UserStats): Promise<void> => {
  const db = await initDataDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_STATS, 'readwrite');
    const store = transaction.objectStore(STORE_STATS);
    store.put({ ...stats, id: 'current_stats' });
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};

export const localDbGetStats = async (): Promise<UserStats | null> => {
  const db = await initDataDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_STATS, 'readonly');
    const store = transaction.objectStore(STORE_STATS);
    const request = store.get('current_stats');
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
};

export const localDbSaveHistory = async (history: StudyHistory[]): Promise<void> => {
  const db = await initDataDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_HISTORY, 'readwrite');
    const store = transaction.objectStore(STORE_HISTORY);
    store.clear();
    history.forEach(item => store.put(item));
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};

export const localDbGetHistory = async (): Promise<StudyHistory[]> => {
  const db = await initDataDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_HISTORY, 'readonly');
    const store = transaction.objectStore(STORE_HISTORY);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const localDbSaveCollections = async (collections: Collection[]): Promise<void> => {
  const db = await initDataDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_COLLECTIONS, 'readwrite');
    const store = transaction.objectStore(STORE_COLLECTIONS);
    store.clear();
    collections.forEach(collection => store.put(collection));
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};

export const localDbGetCollections = async (): Promise<Collection[]> => {
  const db = await initDataDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_COLLECTIONS, 'readonly');
    const store = transaction.objectStore(STORE_COLLECTIONS);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};
