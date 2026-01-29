
import React from 'react';
import { UserStats, Word } from '../types';
import { Flame, BookOpen, Trophy, Play, Sparkles, PlusCircle, Target } from 'lucide-react';
import StudyVibe from '../components/StudyVibe';

interface HomeViewProps {
  stats: UserStats;
  words: Word[];
  queueLength: number;
  onStartReview: () => void;
  onQuickStart: () => void;
  onStartMission: () => void;
}

const HomeView: React.FC<HomeViewProps> = ({ stats, words, queueLength, onStartReview, onQuickStart, onStartMission }) => {
  const isNewUser = words.length === 0;
  const mission = stats.dailyMission;
  const showMission = mission && !mission.completed && mission.wordIds.length > 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <section>
        <h2 className="text-3xl font-bold mb-2">
          {isNewUser ? "Welcome to Vortex!" : "Welcome back, Learner!"}
        </h2>
        <p className="text-slate-500 dark:text-slate-400">
          {isNewUser ? "Master any language, one card at a time." : `You're on a ${stats.streak} day streak. Keep it up!`}
        </p>
      </section>

      {isNewUser ? (
        <div className="bg-indigo-600 rounded-3xl p-8 md:p-12 text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Sparkles className="w-48 h-48" />
          </div>
          <div className="relative z-10 max-w-lg">
            <h3 className="text-2xl font-bold mb-4">Jumpstart your vocabulary</h3>
            <p className="text-indigo-100 mb-8 leading-relaxed">
              Don't start from scratch. We've prepared a "Starter Pack" with 10 essential words to help you learn the system in 2 minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={onQuickStart}
                className="flex items-center justify-center px-8 py-4 bg-white text-indigo-600 font-bold rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-xl"
              >
                <PlusCircle className="w-5 h-5 mr-2" />
                Add Starter Pack
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center">
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-600 dark:text-orange-500 mr-4">
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Daily Streak</p>
              <p className="text-2xl font-bold">{stats.streak} Days</p>
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-500 mr-4">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Stored Words</p>
              <p className="text-2xl font-bold">{stats.totalWords}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-500/10 rounded-xl flex items-center justify-center text-green-600 dark:text-green-500 mr-4">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Mastered</p>
              <p className="text-2xl font-bold">{stats.masteredCount}</p>
            </div>
          </div>
        </div>
      )}

      {showMission && (
        <div className="bg-slate-900 rounded-3xl p-8 md:p-12 text-white relative overflow-hidden shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="absolute -bottom-16 -right-16 opacity-[0.03] text-white">
             <svg width="400" height="400" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v4h-2zm0 6h2v2h-2z"/></svg>
          </div>
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
            <div className="w-20 h-20 bg-rose-500/10 border-2 border-rose-500/20 rounded-full flex items-center justify-center text-rose-500 flex-shrink-0 animate-pulse">
                <Target className="w-10 h-10"/>
            </div>
            <div className="text-center md:text-left">
              <h3 className="text-xl font-bold mb-2 text-white">Daily Mission: Black Hole Alert</h3>
              <p className="text-slate-400 mb-6 max-w-md">
                A few memories are being pulled into the void of forgetfulness. Recover <span className="text-white font-bold">{mission.wordIds.length} words</span> to secure your knowledge.
              </p>
              <button 
                onClick={onStartMission}
                className={`flex items-center justify-center w-full md:w-auto px-8 py-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-2xl transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-rose-500/20`}
              >
                <Play className="w-5 h-5 mr-2 fill-current" />
                Begin Recovery
              </button>
            </div>
          </div>
        </div>
      )}

      {!isNewUser && (
        <div className="bg-slate-800 dark:bg-indigo-900/50 rounded-3xl p-8 md:p-12 text-white dark:text-indigo-200 relative overflow-hidden shadow-2xl border border-slate-700 dark:border-white/10">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <BookOpen className="w-48 h-48" />
          </div>
          <div className="relative z-10">
            <h3 className="text-2xl font-bold mb-4 text-white">Ready for today's review?</h3>
            <p className="text-slate-300 dark:text-indigo-200/60 mb-8 max-w-md">
              You have <span className="text-white font-bold">{queueLength} words</span> waiting in your queue.
            </p>
            <button 
              onClick={onStartReview}
              disabled={queueLength === 0}
              className={`flex items-center px-8 py-4 bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-400 disabled:bg-slate-700 dark:disabled:bg-slate-800 disabled:cursor-not-allowed text-white font-bold rounded-2xl transition-all transform hover:scale-105 active:scale-95 shadow-xl shadow-indigo-500/20`}
            >
              <Play className="w-5 h-5 mr-2 fill-current" />
              Start Today's Review
            </button>
            {queueLength === 0 && (
              <p className="mt-4 text-sm text-green-400 font-medium">All caught up! Excellent work.</p>
            )}
          </div>
        </div>
      )}
      
      {!isNewUser && (
        <section>
          <StudyVibe />
        </section>
      )}
    </div>
  );
};

export default HomeView;
