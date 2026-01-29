
import { LocalTrack } from '../types';

const DB_NAME = 'VortexAudioDB';
const DB_VERSION = 2;
const STORE_NAME = 'tracks';

// Helper to convert base64 string to Blob
const base64ToBlob = (base64: string, mimeType: string): Blob => {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
};

export const initAudioDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const saveTrack = async (track: LocalTrack): Promise<void> => {
  const db = await initAudioDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(track);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const updateTracksOrder = async (tracks: LocalTrack[]): Promise<void> => {
  const db = await initAudioDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    tracks.forEach((track, index) => {
      store.put({ ...track, order: index });
    });
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};

export const getAllTracks = async (): Promise<LocalTrack[]> => {
  const db = await initAudioDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => {
      const results = request.result as LocalTrack[];
      return resolve(results.sort((a, b) => a.order - b.order));
    };
    request.onerror = () => reject(request.error);
  });
};

export const deleteTrack = async (id: string): Promise<void> => {
  const db = await initAudioDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const seedTracks = async (initialTracks: Omit<LocalTrack, 'id' | 'addedAt' | 'order' | 'blob'>[]): Promise<void> => {
  const existingTracks = await getAllTracks();
  if (existingTracks.length === 0) {
    const db = await initAudioDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    initialTracks.forEach((track, index) => {
      let trackToSave: LocalTrack = {
        ...track,
        id: Math.random().toString(36).substr(2, 9),
        addedAt: Date.now(),
        order: index,
      };

      if (track.base64Data && track.mimeType) {
        trackToSave.blob = base64ToBlob(track.base64Data, track.mimeType);
        delete trackToSave.base64Data;
        delete trackToSave.mimeType;
      }
      store.add(trackToSave);
    });

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }
};
