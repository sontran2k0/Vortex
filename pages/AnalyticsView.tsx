
import React, { useMemo, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Word, WordStatus, StudyHistory, UserStats } from '../types';
import { BarChart2, TrendingUp, Calendar, BookOpen, Star, Trophy, Sparkles, BookText, Flame, Target, PlusSquare, Play, X } from 'lucide-react';
import { generateProgressStory, getStreakRank } from '../services/storyService';

interface AnalyticsViewProps {
  history: StudyHistory[];
  words: Word[];
  stats: UserStats;
  setActiveTab: (tab: string) => void; 
  onQuickStart: () => void;
  theme: 'light' | 'dark';
}

interface AchievementDetail {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  story: string;
}

const ACHIEVEMENTS_LIST: AchievementDetail[] = [
  // Milestones
  { id: 'first_memory', title: 'First Memory Forged', description: 'Created your first flashcard.', icon: '🚀', category: 'milestone', story: "The first spark. A single concept pulled from the ether and anchored in your mind. This is how galaxies are born, one star at a time. The Vortex recognizes your potential." },
  { id: 'word_warrior', title: 'Vocabulary Warrior', description: 'Added 100 words to your library.', icon: '⚔️', category: 'milestone', story: "One hundred memories, a hundred battles won against the void of forgetting. You are no longer just a learner; you are a warrior of the mind, building an arsenal of knowledge." },
  { id: 'librarian', title: 'Librarian', description: 'Added 500 words to your library.', icon: '🏛️', category: 'milestone', story: "Five hundred concepts now reside within your mental fortress. You are not just collecting knowledge; you are curating a grand library, a bastion against ignorance." },
  { id: 'word_hunter', title: 'Word Hunter', description: 'Added 1000 words to your library.', icon: '🏹', category: 'milestone', story: "A thousand words, a thousand trophies. You move through the world of ideas with a hunter's precision, tracking and capturing new concepts with ease. The Vortex flows through you." },
  { id: 'collector', title: 'The Collector', description: 'Created your first collection.', icon: '🗂️', category: 'milestone', story: "Order from chaos. You've created your first collection, a specialized nexus of thought. By categorizing knowledge, you give it new power and context." },
  { id: 'polymath', title: 'The Polymath', description: 'Organized words into 5 collections.', icon: '📜', category: 'milestone', story: "Five streams of knowledge converge. Your mind is becoming a crossroads of ideas, connecting disparate fields into a unified web of understanding. This is the path of a true polymath." },
  // Streaks
  { id: 'bronze_mind', title: 'Bronze Mind', description: 'Maintained a 3-day study streak.', icon: '🥉', category: 'streak', story: "Three days of unbroken focus. The echoes of your commitment are beginning to resonate within the Vortex. A foundation of bronze is strong and dependable." },
  { id: 'silver_mind', title: 'Silver Mind', description: 'Maintained a 7-day study streak.', icon: '🛡️', category: 'streak', story: "A full week of dedication. Your mental discipline shines like polished silver, reflecting a clear and focused will. The path of mastery is lit by this consistency." },
  { id: 'gold_mind', title: 'Gold Mind', description: 'Maintained a 14-day study streak.', icon: '🔶', category: 'streak', story: "Two weeks of consistency. Your focus has a golden hue, a valuable asset in the cosmos of knowledge. You are building a treasure of habits." },
  { id: 'diamond_mind', title: 'Diamond Mind', description: 'Maintained a 30-day study streak.', icon: '💠', category: 'streak', story: "Thirty days. A habit is no longer just formed; it is crystallized. Your mind has the resilience and clarity of a diamond, forged under the pressure of daily effort." },
  { id: 'mythic_mind', title: 'Mythic Mind', description: 'Achieve a 60-day streak.', icon: '💎', category: 'streak', story: "Two moons have waxed and waned, yet your focus has not. This is true mastery of habit. The Vortex itself bends to such unwavering dedication, revealing deeper secrets." },
  // Perfection
  { id: 'rising_intellect', title: 'Rising Intellect', description: 'Mastered 10 cards in total.', icon: '🧠', category: 'perfection', story: "Ten concepts fully mastered. These are not just memorized facts; they are foundational pillars upon which you will build mountains of wisdom." },
  { id: 'quick_learner', title: 'Quick Learner', description: 'Mastered a word within 3 days.', icon: '⚡️', category: 'perfection', story: "Lightning in a bottle. You grasped a concept and secured it in your long-term memory with incredible speed. Your mind is adapting, learning how to learn more efficiently." },
  { id: 'prodigy', title: 'Vortex Prodigy', description: 'Mastered 100 words.', icon: '🌠', category: 'perfection', story: "One hundred pieces of knowledge, locked away in the vault of mastery. You are a prodigy of the Vortex, your intellect shining like a distant, brilliant star." },
];


const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
  const renderContent = useMemo(() => {
    const boldedContent = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    return <span dangerouslySetInnerHTML={{ __html: boldedContent }} />;
  }, [content]);

  return <>{renderContent}</>;
};

const AnalyticsView: React.FC<AnalyticsViewProps> = ({ history, words, stats, setActiveTab, onQuickStart, theme }) => {
  const [selectedAchievement, setSelectedAchievement] = useState<AchievementDetail | null>(null);

  const masteredCount = words.filter(w => w.status === WordStatus.MASTERED).length;
  const totalWords = words.length;

  const story = useMemo(() => generateProgressStory(stats, words, history), [stats, words, history]);
  const streakRank = getStreakRank(stats.streak);

  if (totalWords === 0 && history.length === 0) {
    return (
      <div className="space-y-10 animate-in fade-in duration-500 pb-20 text-center">
        <h2 className="text-3xl font-bold flex items-center justify-center">
          <BarChart2 className="w-8 h-8 mr-3 text-indigo-400" />
          Your Learning Journey
        </h2>
        <p className="text-slate-400 mt-1 max-w-lg mx-auto">
          This is where your learning progress comes alive! Once you start adding words and completing reviews, your personalized analytics will appear here.
        </p>

        <div className="bg-slate-900 rounded-[2.5rem] p-8 md:p-12 border border-slate-800 shadow-2xl shadow-indigo-500/10 relative overflow-hidden max-w-xl mx-auto">
          <div className="absolute top-0 right-0 p-10 opacity-5">
            <BookText className="w-64 h-64" />
          </div>
          <div className="relative z-10 space-y-6">
            <div className="flex items-center justify-center gap-2 text-indigo-400 font-bold text-sm uppercase tracking-widest">
              <Sparkles className="w-4 h-4" />
              Start Your Adventure
            </div>
            <p className="text-lg md:text-xl text-slate-300 leading-relaxed font-medium">
              Your journey dashboard is waiting for you to take the first step!
              Add your first word or jump into a quick starter pack to see your stats grow.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
              <button 
                onClick={() => setActiveTab('add')}
                className="flex items-center justify-center px-6 py-3 bg-indigo-600 text-white font-bold rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-indigo-500/20"
              >
                <PlusSquare className="w-5 h-5 mr-2" />
                Add First Word
              </button>
              <button 
                onClick={() => { onQuickStart(); setActiveTab('home'); }}
                className="flex items-center justify-center px-6 py-3 bg-emerald-600 text-white font-bold rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-emerald-500/20"
              >
                <Play className="w-5 h-5 mr-2" />
                Quick Start Review
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold flex items-center">
            <BarChart2 className="w-8 h-8 mr-3 text-indigo-400" />
            Your Learning Journey
          </h2>
          <p className="text-slate-400 mt-1">A narrative of your growth and consistency in Vortex Cards.</p>
        </div>
        <div className={`px-4 py-2 rounded-2xl bg-gradient-to-r ${streakRank.color} text-white font-bold flex items-center shadow-lg`}>
          <span className="mr-2 text-xl">{streakRank.gem}</span>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase opacity-80 tracking-widest leading-none">Current Rank</span>
            <span className="text-sm">{streakRank.title}</span>
          </div>
        </div>
      </div>

      <section className="bg-slate-900/50 p-8 rounded-3xl border border-slate-800 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-700">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="text-center">
            <BookOpen className="w-10 h-10 text-indigo-400 mx-auto mb-3" />
            <p className="text-3xl font-bold">{totalWords}</p>
            <p className="text-xs text-slate-400 uppercase font-bold tracking-widest mt-1">Total Words</p>
          </div>
          <div className="text-center">
            <Star className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
            <p className="text-3xl font-bold">{masteredCount}</p>
            <p className="text-xs text-slate-400 uppercase font-bold tracking-widest mt-1">Mastered</p>
          </div>
          <div className="text-center">
            <Flame className="w-10 h-10 text-orange-400 mx-auto mb-3" />
            <p className="text-3xl font-bold">{stats.streak}</p>
            <p className="text-xs text-slate-400 uppercase font-bold tracking-widest mt-1">Current Streak</p>
          </div>
          <div className="text-center">
            <Trophy className="w-10 h-10 text-amber-400 mx-auto mb-3" />
            <p className="text-3xl font-bold">{stats.longestStreak}</p>
            <p className="text-xs text-slate-400 uppercase font-bold tracking-widest mt-1">Longest Streak</p>
          </div>
        </div>
      </section>

      <section className="animate-in fade-in slide-in-from-bottom-2 duration-900">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-indigo-400">
          <BookText className="w-5 h-5" />
          Your Learning Narrative
        </h3>
        <div className="bg-slate-900 rounded-[2.5rem] p-8 md:p-12 border border-slate-800 shadow-2xl shadow-indigo-500/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-5">
            <BookText className="w-64 h-64" />
          </div>
          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm uppercase tracking-widest">
              <Sparkles className="w-4 h-4" />
              The Journey So Far
            </div>
            <div className="space-y-4 max-w-2xl">
              {story.map((para, i) => (
                <p key={i} className="text-lg md:text-xl text-slate-300 leading-relaxed font-medium">
                  <MarkdownRenderer content={para} />
                </p>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="animate-in fade-in slide-in-from-bottom-2 duration-1300">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xl font-bold flex items-center gap-2 text-indigo-400">
            <Trophy className="w-6 h-6" />
            Achievement Gallery
          </h3>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            {stats.unlockedAchievements.length} / {ACHIEVEMENTS_LIST.length} Unlocked
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {ACHIEVEMENTS_LIST.map((item) => {
            const isUnlocked = stats.unlockedAchievements.includes(item.id);
            if (isUnlocked) {
              return (
                <button 
                  key={item.id} 
                  onClick={() => setSelectedAchievement(item)}
                  className="bg-slate-800 rounded-3xl h-48 p-4 flex flex-col items-center justify-center text-center shadow-lg hover:shadow-indigo-500/20 transition-all transform hover:-translate-y-1 border border-slate-700 hover:border-indigo-500"
                >
                  <div className="w-14 h-14 mb-3 rounded-xl flex items-center justify-center text-3xl bg-slate-900">
                    {item.icon}
                  </div>
                  <p className="font-bold text-sm text-white">{item.title}</p>
                  <p className="text-xs text-slate-400 mt-1">{item.description}</p>
                </button>
              );
            } else {
              return (
                <div key={item.id} className="relative h-48 p-4 flex flex-col items-center justify-center text-center bg-slate-800/20 rounded-3xl border border-dashed border-slate-700">
                  <div className="w-14 h-14 mb-3 rounded-xl flex items-center justify-center text-3xl bg-slate-800 grayscale opacity-50">
                    {item.icon}
                  </div>
                  <p className="font-bold text-sm text-slate-500">{item.title}</p>
                  <p className="text-xs text-slate-600 mt-1">{item.description}</p>
                </div>
              );
            }
          })}
        </div>
      </section>
      
      {selectedAchievement && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setSelectedAchievement(null)}>
          <div className="bg-slate-900 p-8 rounded-3xl shadow-2xl border border-slate-800 max-w-md w-full text-center space-y-6 transform-gpu animate-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()}>
            <div className="w-24 h-24 text-5xl bg-slate-800 rounded-2xl flex items-center justify-center mx-auto ring-4 ring-slate-700">
              {selectedAchievement.icon}
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">{selectedAchievement.title}</h3>
              <p className="text-sm text-slate-400 mt-1">{selectedAchievement.description}</p>
            </div>
            <div className="h-px bg-slate-800" />
            <p className="text-slate-300 leading-relaxed">{selectedAchievement.story}</p>
            <button
              onClick={() => setSelectedAchievement(null)}
              className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsView;