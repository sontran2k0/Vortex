
export enum WordStatus {
  NEW = 'NEW',
  LEARNING = 'LEARNING',
  MASTERED = 'MASTERED'
}

export interface Word {
  id: string;
  term: string;
  definition: string;
  example: string;
  status: WordStatus;
  nextReviewAt: number; // timestamp
  createdAt: number;
  tags: string[];
  imageUrl?: string; // Optional URL for an illustrative image
  isFavorite?: boolean;
  ipa?: string; // International Phonetic Alphabet
}

export interface Collection {
  id:string;
  name: string;
  icon: string; // An emoji
  wordIds: string[];
  createdAt: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: number | null;
  category: 'milestone' | 'streak' | 'perfection';
}

export interface DailyMission {
  date: string; // YYYY-MM-DD
  wordIds: string[];
  completed: boolean;
}

export interface UserStats {
  userName: string; // Added for personal profile
  streak: number;
  totalWords: number;
  masteredCount: number;
  lastStudyDate: string; // YYYY-MM-DD
  longestStreak: number;
  firstWordId?: string;
  joinDate: number;
  unlockedAchievements: string[]; // IDs
  avatarUrl?: string; // Optional URL for user's avatar (web URL or data:image/base64)
  coverPhotoUrl?: string; // Optional URL for user's profile cover photo
  dailyMission?: DailyMission;
}

export interface StudyHistory {
  date: string;
  count: number;
}

export interface LocalTrack {
  id: string;
  title: string;
  artist: string;
  duration: number;
  blob?: Blob;
  url?: string;
  base64Data?: string; // Optional base64 string for audio
  mimeType?: string;  // Mime type for base64 audio
  addedAt: number;
  order: number;
}