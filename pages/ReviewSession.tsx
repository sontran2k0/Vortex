
import React, { useState, useEffect } from 'react';
import { Word } from '../types';
import { X, Check, Volume2, ArrowLeft, Layers, ImageIcon } from 'lucide-react';

interface ReviewSessionProps {
  sessionWords: Word[];
  onComplete: () => void;
  onReview: (id: string, known: boolean) => void;
  selectedVoiceName: string | null;
}

const ReviewSession: React.FC<ReviewSessionProps> = ({ sessionWords, onComplete, onReview, selectedVoiceName }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [activeVoice, setActiveVoice] = useState<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    setIsFlipped(false);
  }, [currentIndex]);

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

  if (!sessionWords || sessionWords.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 text-center max-w-sm w-full animate-in zoom-in-95">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Session Complete!</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8">You reviewed 0 words today. Time to add some new vocabulary!</p>
          <button 
            onClick={onComplete}
            className="w-full bg-slate-800 dark:bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-slate-700 dark:hover:bg-indigo-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }
  
  const currentWord = sessionWords[currentIndex];
  if (!currentWord) {
    console.error("ReviewSession: Encountered an undefined word in the session queue. Aborting session.");
    onComplete();
    return null;
  }

  const handleAction = (known: boolean) => {
    onReview(currentWord.id, known);
    if (currentIndex < sessionWords.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onComplete();
    }
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

  return (
    <div className="min-h-screen flex flex-col">
      <header className="p-4 flex items-center justify-between bg-slate-100/80 dark:bg-slate-900/50 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/50">
        <button onClick={onComplete} className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex-1 px-8">
          <div className="h-2 bg-slate-200/50 dark:bg-slate-800/50 rounded-full overflow-hidden">
            <div 
              className="h-full bg-indigo-600 transition-all duration-500"
              style={{ width: `${((currentIndex + 1) / sessionWords.length) * 100}%` }}
            />
          </div>
        </div>
        <span className="text-xs font-bold text-slate-500 whitespace-nowrap">
          {currentIndex + 1} / {sessionWords.length}
        </span>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 overflow-hidden">
        <div onClick={() => setIsFlipped(!isFlipped)} className="card-flip w-full max-w-md h-[500px] cursor-pointer">
            <div className={`card-inner h-full ${isFlipped ? 'is-flipped' : ''}`}>
                {/* Front */}
                <div className="card-front bg-white dark:bg-slate-900 rounded-3xl shadow-lg border border-slate-200 dark:border-slate-800 p-8 flex flex-col items-center justify-between">
                    <div></div>
                    <div className="text-center">
                       {currentWord.imageUrl && (
                          <div className="w-full max-w-[250px] aspect-video mx-auto mb-6 rounded-xl overflow-hidden shadow-md bg-slate-100 dark:bg-slate-800">
                              <img src={currentWord.imageUrl} alt={currentWord.term} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <h2 className={`font-bold text-indigo-600 dark:text-indigo-400 text-center ${currentWord.imageUrl ? 'text-4xl' : 'text-5xl'}`}>{currentWord.term}</h2>
                        {currentWord.ipa && (
                          <p className={`text-slate-500 dark:text-slate-400 font-mono ${currentWord.imageUrl ? 'text-lg mt-2 mb-4' : 'text-xl mb-6'}`}>/{currentWord.ipa}/</p>
                        )}
                        <button onClick={(e) => { e.stopPropagation(); playSound(currentWord.term); }} className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 hover:text-indigo-600 hover:bg-indigo-100 dark:hover:bg-indigo-500/20">
                            <Volume2 className="w-6 h-6" />
                        </button>
                    </div>
                    <p className="text-slate-400 dark:text-slate-500 text-sm animate-pulse pt-4">Tap to reveal</p>
                </div>
                {/* Back */}
                <div className="card-back bg-white dark:bg-slate-900 rounded-3xl shadow-lg border border-slate-200 dark:border-slate-800 p-6 flex flex-col overflow-hidden">
                    <div className="w-full h-full flex flex-col overflow-y-auto custom-scrollbar -mr-2 pr-2 touch-pan-y">
                       {currentWord.imageUrl ? (
                          <div className="w-full mb-4 flex-shrink-0 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center overflow-hidden">
                            <img src={currentWord.imageUrl} alt={currentWord.term} className="w-full h-auto max-h-[150px] object-contain" />
                          </div>
                        ) : (
                           <div className="w-full mb-4 flex-shrink-0 h-24 flex items-center justify-center bg-slate-100 dark:bg-slate-800/50 rounded-lg text-slate-400">
                            <Layers className="w-10 h-10 opacity-50" />
                          </div>
                        )}
                        <div className="flex-1 min-h-0 text-center">
                          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-2 uppercase tracking-widest">Definition</p>
                          <h3 className="text-xl font-bold mb-4 leading-tight">{currentWord.definition}</h3>
                          {currentWord.example && (
                            <>
                              <div className="w-full h-px bg-slate-100 dark:bg-slate-800 my-4" />
                              <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-2">Example:</p>
                              <p className="text-sm text-slate-600 dark:text-slate-400 italic">"{currentWord.example}"</p>
                            </>
                          )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </main>

      <footer className="p-4 bg-slate-100/80 dark:bg-slate-900/50 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800/50 flex justify-center gap-4">
        <button 
          onClick={() => handleAction(false)}
          className="flex-1 py-4 bg-rose-500 text-white rounded-2xl font-bold hover:bg-rose-600 transition-colors flex items-center justify-center shadow-lg shadow-rose-500/20"
        >
          <X className="w-5 h-5 mr-2" />
          Forgot
        </button>
        <button 
          onClick={() => handleAction(true)}
          className="flex-1 py-4 bg-emerald-500 text-white rounded-2xl font-bold hover:bg-emerald-600 transition-colors flex items-center justify-center shadow-lg shadow-emerald-500/20"
        >
          <Check className="w-5 h-5 mr-2" />
          Known
        </button>
      </footer>
    </div>
  );
};

export default ReviewSession;
