
import React from 'react';
import { Play, X, Sun, Moon } from 'lucide-react';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartReview: () => void;
  userName: string;
  reviewCount: number;
}

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return { text: 'Good morning', icon: <Sun className="w-12 h-12" /> };
  if (hour < 18) return { text: 'Good afternoon', icon: <Sun className="w-12 h-12" /> };
  return { text: 'Good evening', icon: <Moon className="w-12 h-12" /> };
};

const WelcomeModal: React.FC<WelcomeModalProps> = ({ isOpen, onClose, onStartReview, userName, reviewCount }) => {
  if (!isOpen) return null;

  const { text: greetingText, icon: greetingIcon } = getGreeting();
  
  const handleStartReviewClick = () => {
    onStartReview();
  };

  return (
    <div 
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full text-center p-8 md:p-12 space-y-6 transform-gpu animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-24 h-24 bg-indigo-100 dark:bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-500 mx-auto">
          {greetingIcon}
        </div>
        
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{greetingText}, {userName}!</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            {reviewCount > 0 
              ? `You have ${reviewCount} words ready for review today.`
              : `You're all caught up! Great job.`
            }
          </p>
        </div>
        
        <div className="space-y-3">
          <button
            onClick={handleStartReviewClick}
            disabled={reviewCount === 0}
            className="w-full flex items-center justify-center gap-2 px-8 py-4 bg-indigo-600 text-white font-bold rounded-2xl text-lg transition-all transform hover:scale-105 active:scale-95 shadow-xl shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play className="w-6 h-6" />
            Start Today's Review
          </button>
          <button
            onClick={onClose}
            className="w-full py-3 text-slate-500 dark:text-slate-400 font-bold rounded-2xl text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeModal;
