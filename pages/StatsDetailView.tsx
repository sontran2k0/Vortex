
import React, { useState, useMemo, useEffect } from 'react';
import { Word, WordStatus } from '../types';
import { ArrowLeft, BookOpen, Star, BrainCircuit } from 'lucide-react';

interface StatsDetailViewProps {
  words: Word[];
  initialTab: 'all' | 'mastered';
  onBack: () => void;
}

const statusColors: { [key in WordStatus]: string } = {
  [WordStatus.NEW]: 'bg-blue-500',
  [WordStatus.LEARNING]: 'bg-orange-500',
  [WordStatus.MASTERED]: 'bg-emerald-500',
};

const WORDS_PER_PAGE = 15;

const StatsDetailView: React.FC<StatsDetailViewProps> = ({ words, initialTab, onBack }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'learning' | 'mastered'>(initialTab);
  const [currentPage, setCurrentPage] = useState(1);

  const filteredWords = useMemo(() => {
    let filtered = words;
    if (activeTab === 'learning') {
      filtered = words.filter(w => w.status === WordStatus.NEW || w.status === WordStatus.LEARNING);
    } else if (activeTab === 'mastered') {
      filtered = words.filter(w => w.status === WordStatus.MASTERED);
    }
    return filtered.sort((a, b) => a.term.localeCompare(b.term));
  }, [words, activeTab]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  const totalPages = Math.ceil(filteredWords.length / WORDS_PER_PAGE);
  const paginatedWords = filteredWords.slice((currentPage - 1) * WORDS_PER_PAGE, currentPage * WORDS_PER_PAGE);

  const TabButton = ({ tab, label, icon: Icon }: { tab: string, label: string, icon: React.ElementType }) => {
    const getCount = () => {
        if (tab === 'all') return words.length;
        if (tab === 'learning') return words.filter(w => w.status !== WordStatus.MASTERED).length;
        if (tab === 'mastered') return words.filter(w => w.status === WordStatus.MASTERED).length;
        return 0;
    }
    
    return (
        <button
          onClick={() => setActiveTab(tab as any)}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold border-b-4 transition-all ${
            activeTab === tab 
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' 
              : 'border-transparent text-slate-400 hover:text-indigo-500 hover:border-indigo-500/30'
          }`}
        >
          <Icon className="w-4 h-4" />
          {label} ({getCount()})
        </button>
    )
  };

  return (
    <div className="min-h-screen flex flex-col animate-in fade-in duration-300">
      <header className="p-4 flex items-center justify-between bg-slate-100/80 dark:bg-slate-900/50 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/50 sticky top-0 z-10">
        <button onClick={onBack} className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="font-bold text-lg">My Words</h1>
        <div className="w-8"></div>
      </header>

      <div className="border-b border-slate-200 dark:border-slate-800 sticky top-[65px] z-10 bg-slate-50 dark:bg-slate-900 flex">
        <TabButton tab="all" label="All Words" icon={BookOpen} />
        <TabButton tab="learning" label="Learning" icon={BrainCircuit} />
        <TabButton tab="mastered" label="Mastered" icon={Star} />
      </div>

      <main className="flex-1 p-4">
        {paginatedWords.length > 0 ? (
          <div className="space-y-3">
            {paginatedWords.map(word => (
              <div key={word.id} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center">
                <div className={`w-2 h-2 rounded-full mr-4 flex-shrink-0 ${statusColors[word.status]}`} />
                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate text-slate-800 dark:text-slate-200">{word.term}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{word.definition}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-slate-500 font-bold">No words in this category.</p>
          </div>
        )}
      </main>

      {totalPages > 1 && (
        <footer className="p-4 bg-slate-100/80 dark:bg-slate-900/50 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800/50 flex items-center justify-center gap-2 text-sm">
          <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-3 py-1 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-lg disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800">Prev</button>
          <span className="font-bold text-slate-500">Page {currentPage} of {totalPages}</span>
          <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="px-3 py-1 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-lg disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800">Next</button>
        </footer>
      )}
    </div>
  );
};

export default StatsDetailView;
