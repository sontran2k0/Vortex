
import { WordStatus, Word, LocalTrack } from './types'; // Import LocalTrack from types

export const INITIAL_WORDS: Word[] = [
  {
    id: '1',
    term: 'Ephemeral',
    definition: 'Lasting for a very short time.',
    example: 'The beauty of a sunset is ephemeral, but its memory can last forever.',
    status: WordStatus.NEW,
    nextReviewAt: Date.now(),
    createdAt: Date.now(),
    tags: ['Academic'],
    imageUrl: 'https://picsum.photos/seed/ephemeral/400/300',
    ipa: 'ɪˈfɛmərəl'
  },
  {
    id: '2',
    term: 'Serendipity',
    definition: 'The occurrence and development of events by chance in a happy or beneficial way.',
    example: 'It was pure serendipity that I met my best friend on that rainy afternoon.',
    status: WordStatus.LEARNING,
    nextReviewAt: Date.now() - 1000 * 60 * 60, // Overdue
    createdAt: Date.now() - 1000 * 60 * 60 * 24,
    tags: ['Positive'],
    imageUrl: 'https://picsum.photos/seed/serendipity/400/300',
    ipa: 'ˌsɛrənˈdɪpɪti'
  },
  {
    id: '3',
    term: 'Meticulous',
    definition: 'Showing great attention to detail; very careful and precise.',
    example: 'He was meticulous about keeping his workplace clean and organized.',
    status: WordStatus.MASTERED,
    nextReviewAt: Date.now() + 1000 * 60 * 60 * 24 * 7,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 30,
    tags: ['Work'],
    imageUrl: 'https://picsum.photos/seed/meticulous/400/300',
    ipa: 'məˈtɪkjələs'
  }
];

export const SRS_INTERVALS = {
  [WordStatus.NEW]: 1000 * 60 * 60 * 24, // 1 day
  [WordStatus.LEARNING]: 1000 * 60 * 60 * 24 * 3, // 3 days
  [WordStatus.MASTERED]: 1000 * 60 * 60 * 24 * 10, // 10 days
  FORGOT: 1000 * 60 * 10, // 10 minutes
};

// Use Omit to exclude properties that will be added by seedTracks
export const INITIAL_MUSIC_TRACKS: Omit<LocalTrack, 'id' | 'addedAt' | 'order' | 'blob'>[] = [];