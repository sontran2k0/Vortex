
import React, { useState, useEffect, useMemo } from 'react';
import { Word } from '../types';
import { Target, X, Check, BrainCircuit } from 'lucide-react';

interface BlackHoleMissionProps {
  missionWords: Word[];
  allWords: Word[];
  onComplete: (results: { wordId: string, correct: boolean }[]) => void;
}

interface MissionQuestion {
  word: Word;
  options: string[];
  correctAnswer: string;
}

const shuffleArray = <T,>(array: T[]): T[] => {
  return [...array].sort(() => Math.random() - 0.5);
};

const BlackHoleMission: React.FC<BlackHoleMissionProps> = ({ missionWords, allWords, onComplete }) => {
  const [questions, setQuestions] = useState<MissionQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [results, setResults] = useState<{ wordId: string, correct: boolean }[]>([]);

  useEffect(() => {
    const generateQuestions = () => {
      const missionQuestions = missionWords.map(word => {
        const distractors = allWords
          .filter(w => w.id !== word.id)
          .sort(() => 0.5 - Math.random())
          .slice(0, 3)
          .map(w => w.term);
        
        const options = shuffleArray([...distractors, word.term]);
        
        return {
          word,
          options,
          correctAnswer: word.term
        };
      });
      setQuestions(shuffleArray(missionQuestions));
    };

    generateQuestions();
  }, [missionWords, allWords]);

  const handleAnswerSelect = (answer: string) => {
    if (feedback) return;

    const isCorrect = answer === questions[currentIndex].correctAnswer;
    setSelectedAnswer(answer);
    setFeedback(isCorrect ? 'correct' : 'incorrect');
    setResults(prev => [...prev, { wordId: questions[currentIndex].word.id, correct: isCorrect }]);

    setTimeout(() => {
      setFeedback(null);
      setSelectedAnswer(null);
      setCurrentIndex(prev => prev + 1);
    }, 1500);
  };
  
  const correctAnswersCount = results.filter(r => r.correct).length;

  if (questions.length === 0) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">Loading Mission...</div>;
  }
  
  if (currentIndex >= questions.length) {
    return (
       <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-900 text-white text-center animate-in fade-in duration-500">
         <div className="w-24 h-24 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-emerald-500/20">
           <BrainCircuit className="w-12 h-12" />
         </div>
         <h2 className="text-3xl font-bold mb-2">Recovery Complete!</h2>
         <p className="text-slate-400 mb-4">You successfully retrieved your memories from the black hole.</p>
         <div className="text-6xl font-black my-6">
           {correctAnswersCount} <span className="text-2xl font-bold text-slate-500">/ {questions.length}</span>
         </div>
         <p className="text-lg font-medium text-slate-300">Words Recovered</p>
         <button 
           onClick={() => onComplete(results)}
           className="w-full max-w-sm mt-10 bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20"
         >
           Return to Dashboard
         </button>
       </div>
    );
  }

  const currentQuestion = questions[currentIndex];

  return (
    <div className="min-h-screen flex flex-col bg-slate-900 text-white">
      <header className="p-4 flex items-center justify-between bg-black/20 backdrop-blur-md border-b border-slate-800/50">
        <div className="flex items-center gap-2 text-rose-400">
            <Target className="w-5 h-5"/>
            <h1 className="text-sm font-bold uppercase tracking-widest">Memory Recovery Mission</h1>
        </div>
        <span className="text-xs font-bold text-slate-500 whitespace-nowrap">
          {currentIndex + 1} / {questions.length}
        </span>
      </header>
      <div className="h-1 bg-slate-800">
        <div 
          className="h-full bg-rose-500 transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      <main className="flex-1 flex flex-col items-center justify-center p-4 overflow-hidden text-center">
        <div className="w-full max-w-2xl animate-in fade-in slide-in-from-bottom-5 duration-500">
          <p className="text-sm font-bold text-slate-400 mb-4 uppercase tracking-widest">Definition:</p>
          <p className="text-2xl md:text-3xl font-medium leading-relaxed mb-12 min-h-[100px]">
            "{currentQuestion.word.definition}"
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentQuestion.options.map((option, index) => {
              let buttonClass = 'bg-slate-800 hover:bg-slate-700 border-slate-700';
              let icon = null;

              if (feedback && option === selectedAnswer) {
                if (feedback === 'correct') {
                  buttonClass = 'bg-emerald-500 border-emerald-400';
                  icon = <Check className="w-5 h-5" />;
                } else {
                  buttonClass = 'bg-rose-600 border-rose-500';
                  icon = <X className="w-5 h-5" />;
                }
              } else if (feedback && option === currentQuestion.correctAnswer) {
                  buttonClass = 'bg-emerald-500 border-emerald-400';
                  icon = <Check className="w-5 h-5" />;
              }

              return (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(option)}
                  disabled={!!feedback}
                  className={`w-full p-5 rounded-2xl border text-left font-bold text-lg transition-all duration-300 transform-gpu disabled:cursor-not-allowed flex items-center justify-between ${buttonClass}`}
                >
                  <span>{option}</span>
                  {icon}
                </button>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
};

export default BlackHoleMission;