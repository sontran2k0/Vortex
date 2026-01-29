
import { UserStats, Word, StudyHistory } from '../types';

export const generateProgressStory = (stats: UserStats, words: Word[], history: StudyHistory[]): string[] => {
  const story: string[] = [];
  const now = Date.now();
  const daysSinceJoin = Math.floor((now - stats.joinDate) / (1000 * 60 * 60 * 24));
  const totalWords = words.length;
  const masteredWords = stats.masteredCount;

  // Opening
  if (daysSinceJoin === 0) {
    story.push("Your adventure with Vortex Cards begins today. A fresh slate for a mind eager to grow.");
  } else if (daysSinceJoin === 1) {
    story.push("It's day two of your Vortex journey. A new habit is taking root.");
  } else {
    story.push(`You've been diligently building your vocabulary for **${daysSinceJoin} days**.`);
  }

  // First Word Recall
  const firstWord = words.find(w => w.id === stats.firstWordId);
  if (firstWord) {
    story.push(`It all started with "**${firstWord.term}**," your very first flashcard. That single step marked the beginning of your expanded knowledge.`);
  } else if (totalWords > 0) {
    story.push(`You've already added ${totalWords} words to your collection, each one a step forward in your learning.`);
  } else {
    story.push("Your library awaits its first entries. What new words will you conquer?");
  }

  // Achievement Narratives
  if (masteredWords > 0) {
    story.push(`A testament to your dedication, you've successfully mastered **${masteredWords} words**! Your memory is actively strengthening, cementing new concepts.`);
  }

  // Consistency & Streak
  if (stats.streak > 0) {
    story.push(`Your current streak stands at an impressive **${stats.streak} days**. This consistency is the secret sauce to unlocking true mastery.`);
  }
  
  if (stats.longestStreak > stats.streak) {
    story.push(`Your personal best, a **${stats.longestStreak}-day streak**, shows your incredible potential. Each day is a chance to surpass that record.`);
  } else if (stats.longestStreak === stats.streak && stats.streak > 0 && daysSinceJoin > stats.streak) {
    story.push(`You're currently matching your longest streak of **${stats.longestStreak} days**! Keep pushing to set a new personal record.`);
  }

  // Study Activity
  const totalReviews = history.reduce((sum, entry) => sum + entry.count, 0);
  if (totalReviews > 0) {
    story.push(`You've completed **${totalReviews} review sessions** across your journey, reinforcing your understanding with every card.`);
  }

  // Overall Progress
  if (totalWords > 0 && masteredWords > 0) {
    const learningRate = (masteredWords / totalWords) * 100;
    if (learningRate >= 75) {
      story.push(`With **${learningRate.toFixed(0)}% of your words mastered**, you're swiftly becoming an expert in your chosen vocabulary.`);
    } else if (learningRate >= 50) {
      story.push(`You've mastered over half of your library (${learningRate.toFixed(0)}%), transforming from a learner into a seasoned practitioner.`);
    } else if (learningRate > 0) {
        story.push(`You're steadily progressing with **${learningRate.toFixed(0)}% of your words mastered**. Every little step counts towards grand achievements.`);
    }
  }

  // Closing Encouragement
  story.push("The path to knowledge is continuous. Keep exploring, keep reviewing, and keep forging your powerful memory. Your journey continues!");

  return story;
};

export const getStreakRank = (streak: number) => {
  if (streak >= 60) return { title: 'Mythic Mind', color: 'from-purple-500 to-pink-500', gem: '💎', tier: 5 };
  if (streak >= 30) return { title: 'Diamond Mind', color: 'from-cyan-400 to-blue-600', gem: '💠', tier: 4 };
  if (streak >= 14) return { title: 'Gold Mind', color: 'from-yellow-400 to-orange-500', gem: '🔶', tier: 3 };
  if (streak >= 7) return { title: 'Silver Mind', color: 'from-slate-300 to-slate-500', gem: '⚪️', tier: 2 };
  if (streak >= 3) return { title: 'Bronze Mind', color: 'from-orange-400 to-amber-700', gem: '🥉', tier: 1 };
  return { title: 'Initiate', color: 'from-neutral-400 to-neutral-500', gem: '🌱', tier: 0 };
};