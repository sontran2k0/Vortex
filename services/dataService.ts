import { Word, UserStats, StudyHistory, Collection } from '../types';
import * as localDb from './localDb';

export type StorageLocation = 'local';

interface DataService {
  getWords: () => Promise<Word[]>;
  saveWords: (words: Word[]) => Promise<void>;
  getStats: () => Promise<UserStats | null>;
  saveStats: (stats: UserStats) => Promise<void>;
  getHistory: () => Promise<StudyHistory[]>;
  saveHistory: (history: StudyHistory[]) => Promise<void>;
  getCollections: () => Promise<Collection[]>;
  saveCollections: (collections: Collection[]) => Promise<void>;
}

export const dataService: DataService = {
  getWords: localDb.localDbGetWords,
  saveWords: localDb.localDbSaveWords,
  getStats: localDb.localDbGetStats,
  saveStats: localDb.localDbSaveStats,
  getHistory: localDb.localDbGetHistory,
  saveHistory: localDb.localDbSaveHistory,
  getCollections: localDb.localDbGetCollections,
  saveCollections: localDb.localDbSaveCollections,
};

export const initDataService = async (): Promise<void> => {
  // This function is now a no-op as the service is hard-coded to use localDb.
  return Promise.resolve();
};
