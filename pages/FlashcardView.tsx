
import React, { useState, useMemo, useEffect } from 'react';
import { Word, Collection } from '../types';
import { Layers, X, ArrowLeft, ArrowRight, Volume2, Trophy } from 'lucide-react';

interface FlashcardViewProps {
  words: Word[];
  collections?: Collection[];
  onExit?: () => void;
  collectionName?: string;
  selectedVoiceName: string | null;
}

const FlashcardView: React.FC<FlashcardViewProps> = ({ words, collections, onExit, collectionName, selectedVoiceName }) => {
  const isModal = !!onExit;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSessionActive, setIsSessionActive] = useState(isModal);
  const [activeVoice, setActiveVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [wordCount, setWordCount] = useState<number | 'all'>(10);
  const [sessionWords, setSessionWords] = useState<Word[]>([]);
  const [isSessionComplete, setIsSessionComplete] = useState(false);

  useEffect(() => {
    const loadVoices = () => {
      const allVoices = window.speechSynthesis.getVoices();
      if (allVoices.length === 0) return;
      
      let foundVoice: SpeechSynthesisVoice | undefined;

      if (selectedVoiceName) {
        foundVoice = allVoices.find(v => v.name === selectedVoiceName);
      }
      
      if (!foundVoice) {
        const voicePriority = [
          (v: SpeechSynthesisVoice) => v.lang === 'en-US' && /male/i.test(v.name) && /google/i.test(v.name),
          (v: SpeechSynthesisVoice) => v.lang === 'en-US' && /male/i.test(v.name),
          (v: SpeechSynthesisVoice) => v.lang === 'en-US' && /google/i.test(v.name),
          (v: SpeechSynthesisVoice) => v.lang === 'en-US',
        ];
        for (const condition of voicePriority) {
          foundVoice = allVoices.find(condition);
          if (foundVoice) break;
        }
      }

      if (foundVoice) {
        setActiveVoice(foundVoice);
      }
    };
    if ('speechSynthesis' in window) {
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    return () => {
       if ('speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, [selectedVoiceName]);
  
  const availableWords = useMemo(() => {
    if (isModal) return words;
    if (selectedTopic === 'all') return words;
    
    const collection = collections?.find(c => c.id === selectedTopic);
    if (!collection) return [];
    
    const wordMap = new Map(words.map(w => [w.id, w]));
    return collection.wordIds.map(id => wordMap.get(id)).filter(Boolean) as Word[];
  }, [words, collections, selectedTopic, isModal]);

  useEffect(() => {
    if (isModal) {
      const shuffled = words
        .map(value => ({ value, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map(({ value }) => value);
      setSessionWords(shuffled);
    }
  }, [isModal, words]);

  const handleStartSession = () => {
    const shuffled = availableWords
      .map(value => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }) => value);

    const finalCount = wordCount === 'all' ? shuffled.length : Math.min(wordCount, shuffled.length);
    
    setSessionWords(shuffled.slice(0, finalCount));
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsSessionComplete(false);
    setIsSessionActive(true);
  };

  const handleFinishSession = () => {
    setIsSessionComplete(false);
    setIsSessionActive(false);
    setSelectedTopic('all');
    setWordCount(10);
  };
  
  const showCompletionScreen = () => {
    setIsSessionComplete(true);
  };
  
  const handleCompletionAction = () => {
    if (onExit) {
      onExit();
    } else {
      handleFinishSession();
    }
  };

  const handleExitClick = () => {
    if (isSessionActive) {
      showCompletionScreen();
    } else if (onExit) {
      onExit();
    } else {
      handleFinishSession();
    }
  };

  const handleNext = () => {
    setIsFlipped(false);
    setTimeout(() => {
      if (currentIndex === sessionWords.length - 1) {
        showCompletionScreen();
      } else {
        setCurrentIndex(prev => prev + 1);
      }
    }, 150);
  };
  
  const handlePrev = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex(prev => (prev - 1 + sessionWords.length) % sessionWords.length);
    }, 150);
  };

  const playSound = (text: string) => {
    if (text && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      if (activeVoice) {
        utterance.voice = activeVoice;
      }
      window.speechSynthesis.speak(utterance);
    }
  };

  if (words.length === 0) {
    return (
      <div className="text-center py-20 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <Layers className="w-16 h-16 text-slate-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold">Your Deck is Empty</h3>
        <p className="text-slate-500 mt-2">Add some words to your library to start using Flashcards.</p>
      </div>
    );
  }

  const isFullyCompleted = isSessionComplete && currentIndex === sessionWords.length - 1;

  if (isSessionComplete) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl animate-in fade-in duration-500">
         <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 mb-6">
            <Trophy className="w-12 h-12" />
          </div>
        <h2 className="text-3xl font-bold">{isFullyCompleted ? 'Session Complete!' : 'Session Ended'}</h2>
        <p className="text-slate-500 mt-2 max-w-md">
          {isFullyCompleted
            ? `Fantastic work! You've successfully reviewed all ${sessionWords.length} cards.`
            : `Great effort! You've reviewed ${currentIndex + 1} out of ${sessionWords.length} cards.`
          }
        </p>
        <p className="font-bold text-lg my-6">Consistency is key to mastery. 🧠</p>
        <button
          onClick={handleCompletionAction}
          className="px-10 py-5 bg-indigo-600 text-white font-bold rounded-2xl text-lg hover:bg-indigo-700 transition-all transform hover:scale-105 active:scale-95 shadow-2xl shadow-indigo-500/20"
        >
          {onExit ? 'Done' : 'Back to Setup'}
        </button>
      </div>
    );
  }
  
  if (!isSessionActive && !isModal) {
    const wordCountOptions = [10, 20, 50];
    const maxWords = availableWords.length;
    const currentWordCount = wordCount === 'all' ? maxWords : Math.min(wordCount, maxWords);

    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl animate-in fade-in duration-500">
         <div className="w-24 h-24 bg-indigo-100 dark:bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-500 mb-6">
            <Layers className="w-12 h-12" />
          </div>
        <h2 className="text-3xl font-bold">Setup Your Session</h2>
        <p className="text-slate-500 mt-2 max-w-md">
          Choose a topic and how many words you'd like to review.
        </p>
        <div className="my-8 w-full max-w-xs space-y-4">
          <div>
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block mb-2">Topic</label>
            <select value={selectedTopic} onChange={(e) => setSelectedTopic(e.target.value)} className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all text-sm">
              <option value="all">All Words ({words.length})</option>
              {collections?.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name} ({c.wordIds.length})</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block mb-2">Quantity</label>
            <div className="grid grid-cols-4 gap-2">
              {wordCountOptions.map(count => (
                <button key={count} onClick={() => setWordCount(count)} disabled={maxWords < count} className={`px-2 py-3 rounded-lg text-sm font-bold transition-colors disabled:opacity-40 ${wordCount === count ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}>
                  {count}
                </button>
              ))}
              <button onClick={() => setWordCount('all')} className={`px-2 py-3 rounded-lg text-sm font-bold transition-colors ${wordCount === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}>
                All
              </button>
            </div>
          </div>
        </div>
        <button onClick={handleStartSession} disabled={maxWords === 0} className="px-10 py-5 bg-indigo-600 text-white font-bold rounded-2xl text-lg hover:bg-indigo-700 transition-all transform hover:scale-105 active:scale-95 shadow-2xl shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed">
          Start Session ({currentWordCount} cards)
        </button>
      </div>
    );
  }

  const currentWord = sessionWords[currentIndex];
  
  const containerClass = isModal
    ? "fixed inset-0 z-[200] bg-slate-100 dark:bg-slate-900 flex flex-col animate-in fade-in duration-300"
    : "flex flex-col h-full animate-in fade-in duration-300";

  return (
    <div className={containerClass}>
       <header className="p-4 flex items-center justify-between">
        <button onClick={handleExitClick} className="p-2 text-slate-400 hover:text-slate-800 dark:hover:text-white">
          <X className="w-6 h-6" />
        </button>
        <span className="text-sm font-bold text-slate-500">
          {currentIndex + 1} / {sessionWords.length}
        </span>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 overflow-hidden">
        <div onClick={() => setIsFlipped(!isFlipped)} className="card-flip w-full max-w-md h-[450px] cursor-pointer">
          <div className={`card-inner h-full ${isFlipped ? 'is-flipped' : ''}`}>
            {/* Front */}
            <div className="card-front bg-white dark:bg-slate-900 rounded-3xl shadow-lg border border-slate-200 dark:border-slate-800 p-8 flex flex-col items-center justify-between">
                <div></div>
                <div className="text-center">
                    {currentWord?.imageUrl && (
                        <div className="w-full max-w-[250px] aspect-video mx-auto mb-6 rounded-xl overflow-hidden shadow-md bg-slate-100 dark:bg-slate-800">
                            <img src={currentWord.imageUrl} alt={currentWord.term} className="w-full h-full object-cover" />
                        </div>
                    )}
                    <h2 className={`font-bold text-indigo-600 dark:text-indigo-400 text-center ${currentWord?.imageUrl ? 'text-4xl' : 'text-5xl'}`}>{currentWord?.term}</h2>
                    {currentWord?.ipa && (
                        <p className={`text-slate-500 dark:text-slate-400 font-mono ${currentWord?.imageUrl ? 'text-lg mt-2 mb-4' : 'text-xl mb-6'}`}>/{currentWord.ipa}/</p>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); playSound(currentWord?.term); }} className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 hover:text-indigo-600 hover:bg-indigo-100 dark:hover:bg-indigo-500/20">
                        <Volume2 className="w-6 h-6" />
                    </button>
                </div>
                <p className="text-slate-400 dark:text-slate-500 text-sm animate-pulse pt-4">Tap to reveal</p>
            </div>
            {/* Back */}
            <div className="card-back bg-white dark:bg-slate-900 rounded-3xl shadow-lg border border-slate-200 dark:border-slate-800 p-6 flex flex-col overflow-hidden">
              <div className="w-full h-full flex flex-col overflow-y-auto custom-scrollbar -mr-2 pr-2 touch-pan-y">
                {currentWord?.imageUrl ? (
                  <div className="w-full mb-4 flex-shrink-0 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center overflow-hidden">
                    <img src={currentWord.imageUrl} alt={currentWord.term} className="w-full h-auto max-h-[150px] object-contain" />
                  </div>
                ) : (
                   <div className="w-full mb-4 flex-shrink-0 h-24 flex items-center justify-center bg-slate-100 dark:bg-slate-800/50 rounded-lg text-slate-400">
                    <Layers className="w-10 h-10 opacity-50" />
                  </div>
                )}
                <p className="text-xl font-bold text-center mb-4">{currentWord?.definition}</p>
                {currentWord?.example && (
                  <div className="w-full border-t border-slate-100 dark:border-slate-800 my-3 pt-3">
                    <p className="text-sm text-slate-500 dark:text-slate-400 italic">"{currentWord.example}"</p>
                  </div>
                )}
                <div className="flex flex-wrap gap-2 justify-center mt-auto pt-4 flex-shrink-0">
                  {currentWord?.tags && currentWord.tags.map(tag => (
                    <span key={tag} className="text-[10px] px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold">{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="p-4 flex justify-center items-center gap-4">
        <button onClick={handlePrev} className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full font-bold shadow-md">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <button onClick={handleNext} className="px-12 py-4 bg-indigo-600 text-white rounded-full font-bold shadow-lg shadow-indigo-500/30 flex items-center gap-2">
          Next <ArrowRight className="w-5 h-5" />
        </button>
      </footer>
    </div>
  );
};

export default FlashcardView;
