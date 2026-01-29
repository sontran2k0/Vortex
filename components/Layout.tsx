
import React, { useState, useEffect } from 'react';
import { Home, BookOpen, PlusSquare, BarChart2, User, Music, Moon, Sun, Cloud, CloudOff, RefreshCw, Layers } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  toggleMusic: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  isOnline: boolean;
  isSyncing: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, toggleMusic, theme, toggleTheme, isOnline, isSyncing }) => {
  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'library', label: 'Library', icon: BookOpen },
    { id: 'flashcards', label: 'Flashcards', icon: Layers },
    { id: 'add', label: 'New Word', icon: PlusSquare },
    { id: 'analytics', label: 'Stats', icon: BarChart2 },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  const renderStatusIndicator = (compact: boolean) => {
    if (isSyncing) {
      return (
        <div className={`bg-indigo-500 text-white font-bold px-2 py-0.5 rounded-full flex items-center gap-1.5 shadow-lg animate-pulse ${compact ? 'text-[9px]' : 'text-[10px]'}`}>
          <RefreshCw className={`w-3 h-3 animate-spin ${compact ? 'w-2 h-2' : ''}`} />
          {compact ? '' : 'SYNCING'}
        </div>
      );
    } else if (isOnline) {
      return (
        <div className={`bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-full flex items-center gap-1.5 border border-emerald-500/20 ${compact ? 'text-[9px]' : 'text-[10px]'}`}>
          <Cloud className={`w-3 h-3 ${compact ? 'w-2 h-2' : ''}`} />
          {compact ? '' : 'ONLINE'}
        </div>
      );
    } else {
      return (
        <div className={`bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold px-2 py-0.5 rounded-full flex items-center gap-1.5 border border-amber-500/20 ${compact ? 'text-[9px]' : 'text-[10px]'}`}>
          <CloudOff className={`w-3 h-3 ${compact ? 'w-2 h-2' : ''}`} />
          {compact ? '' : 'OFFLINE'}
        </div>
      );
    }
  };

  return (
    <div className={`flex flex-col min-h-screen pb-20 md:pb-0 md:pl-64`}>
      {/* Sidebar - Desktop */}
      <aside className={`hidden md:flex flex-col fixed inset-y-0 left-0 w-64 border-r z-50 transition-colors ${theme === 'dark' ? 'bg-slate-900/80 backdrop-blur-xl border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
        <div className="p-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">
            Vortex Cards
          </h1>
          <div className="mt-3">
            {renderStatusIndicator(false)}
          </div>
        </div>
        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-xl transition-all ${
                activeTab === item.id
                  ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                  : `text-slate-500 dark:text-slate-400 hover:text-indigo-500 dark:hover:text-white ${theme === 'dark' ? 'hover:bg-slate-800/50' : 'hover:bg-slate-200'}`
              }`}
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="p-4 mt-auto space-y-2">
          <button
            onClick={toggleTheme}
            className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-xl transition-all ${theme === 'dark' ? 'text-slate-400 hover:bg-slate-800/50' : 'text-slate-500 hover:bg-slate-200'}`}
          >
            {theme === 'dark' ? <Sun className="w-5 h-5 mr-3" /> : <Moon className="w-5 h-5 mr-3" />}
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
          <button
            onClick={toggleMusic}
            className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-xl transition-all ${theme === 'dark' ? 'text-slate-400 hover:bg-slate-800/50' : 'text-slate-500 hover:bg-slate-200'}`}
          >
            <Music className="w-5 h-5 mr-3" />
            Study Music
          </button>
        </div>
      </aside>

      {/* Header - Mobile */}
      <header className={`md:hidden flex items-center justify-between p-4 border-b sticky top-0 z-40 backdrop-blur-xl transition-colors ${theme === 'dark' ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50/80 border-slate-200'}`}>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">
            Vortex
          </h1>
          {renderStatusIndicator(true)}
        </div>
        <div className="flex items-center gap-2">
           <button onClick={toggleTheme} className="p-2 text-slate-500 dark:text-slate-400">
            {theme === 'dark' ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
          </button>
          <button onClick={toggleMusic} className="p-2 text-slate-500 dark:text-slate-400">
            <Music className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 max-w-5xl mx-auto w-full">
        {children}
      </main>

      {/* Bottom Nav - Mobile */}
      <nav className={`md:hidden fixed bottom-0 left-0 right-0 border-t flex justify-around p-2 z-50 backdrop-blur-xl transition-all ${theme === 'dark' ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50/80 border-slate-200'}`}>
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center p-2 rounded-lg transition-all ${
              activeTab === item.id ? 'text-indigo-500 scale-110' : 'text-slate-400'
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[10px] mt-1 font-bold">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Layout;
