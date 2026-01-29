
import React, { useState, useEffect, useCallback } from 'react';
import { Word, WordStatus, UserStats, StudyHistory, Collection, DailyMission } from './types';
import { INITIAL_WORDS, SRS_INTERVALS, INITIAL_MUSIC_TRACKS } from './constants';
import Layout from './components/Layout';
import HomeView from './pages/HomeView';
import LibraryView from './pages/LibraryView';
import AddWordView from './pages/AddWordView';
import AnalyticsView from './pages/AnalyticsView';

import { lazy, Suspense } from 'react'

const ProfileView = lazy(() => import('./pages/ProfileView'))

import FlashcardView from './pages/FlashcardView';
import ReviewSession from './pages/ReviewSession';
import BlackHoleMission from './pages/BlackHoleMission';
import MusicPlayer from './components/MusicPlayer';
import CollectionView from './pages/CollectionView';
import WelcomeModal from './components/WelcomeModal';
import StatsDetailView from './pages/StatsDetailView';
import { dataService, initDataService } from './services/dataService';
import { getAllTracks, seedTracks } from './services/audioDb';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [words, setWords] = useState<Word[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [stats, setStats] = useState<UserStats>({
    userName: 'Vortex Learner',
    streak: 0,
    totalWords: 0,
    masteredCount: 0,
    lastStudyDate: new Date().toISOString().split('T')[0],
    longestStreak: 0,
    joinDate: Date.now(),
    unlockedAchievements: [],
    avatarUrl: 'https://i.imgur.com/pwc352v.png',
    coverPhotoUrl: 'https://i.imgur.com/W2u212j.jpeg',
  });
  const [history, setHistory] = useState<StudyHistory[]>([]);
  const [isMusicOpen, setIsMusicOpen] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [isMissionReviewing, setIsMissionReviewing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('vortex_theme') as 'light' | 'dark') || 'dark';
  });
  const [selectedVoiceName, setSelectedVoiceName] = useState<string | null>(
    () => localStorage.getItem('vortex_voice_name')
  );

  const [viewingCollection, setViewingCollection] = useState<Collection | null>(null);
  const [reviewQueue, setReviewQueue] = useState<Word[]>([]);
  const [collectionFlashcardSession, setCollectionFlashcardSession] = useState<Collection | null>(null);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [viewingStatsDetail, setViewingStatsDetail] = useState<'all' | 'mastered' | null>(null);

  const getReviewQueue = useCallback(() => words.filter(w => w.nextReviewAt <= Date.now()), [words]);
<Suspense fallback={<div>Loading...</div>}>
  <ProfileView />
</Suspense>

  useEffect(() => {
    initDataService().then(() => {
      loadData();
    });

    const handleStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleStatus);
    window.addEventListener('offline', handleStatus);
    return () => {
      window.removeEventListener('online', handleStatus);
      window.removeEventListener('offline', handleStatus);
    };
  }, []);

  const loadData = async () => {
    try {
      const dbWords = await dataService.getWords();
      const dbStats = await dataService.getStats();
      const dbHistory = await dataService.getHistory();
      const dbCollections = await dataService.getCollections();
      const dbAudioTracks = await getAllTracks();

      if (dbWords && dbWords.length > 0) setWords(dbWords);
      if (dbStats) {
        setStats(prev => ({ 
          ...prev, 
          ...dbStats, 
          userName: dbStats.userName || 'Vortex Learner',
          avatarUrl: dbStats.avatarUrl || 'https://i.imgur.com/pwc352v.png',
          coverPhotoUrl: dbStats.coverPhotoUrl || 'https://i.imgur.com/W2u212j.jpeg',
        }));
      }
      if (dbHistory && dbHistory.length > 0) setHistory(dbHistory);
      if (dbCollections && dbCollections.length > 0) setCollections(dbCollections);
      if (dbAudioTracks.length === 0) {
        await seedTracks(INITIAL_MUSIC_TRACKS);
      }
    } catch (err) {
      console.error("Data Load Error", err);
    } finally {
      setIsDataLoaded(true);
    }
  };

  useEffect(() => {
    if (isDataLoaded && words.length > 0) {
      const today = new Date().toISOString().split('T')[0];
      const lastWelcomeDate = localStorage.getItem('vortex_last_welcome_date');

      if (today !== lastWelcomeDate) {
        setShowWelcomeModal(true);
        localStorage.setItem('vortex_last_welcome_date', today);
      }
    }
  }, [isDataLoaded, words.length]);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      const timer = setTimeout(() => Notification.requestPermission(), 5000);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    const queue = getReviewQueue();
    const mission = stats.dailyMission;
    const isMissionAvailable = mission && !mission.completed && mission.wordIds.length > 0;

    if ((queue.length > 0 || isMissionAvailable) && Notification.permission === 'granted') {
      const lastNotified = localStorage.getItem('vortex_last_notification_date');
      const today = new Date().toISOString().split('T')[0];
      if (lastNotified !== today) {
        const missionWordCount = isMissionAvailable ? mission.wordIds.length : 0;
        sendNotification(queue.length, missionWordCount);
        localStorage.setItem('vortex_last_notification_date', today);
      }
    }
  }, [words, stats.dailyMission, getReviewQueue]);

  const sendNotification = async (reviewCount: number, missionWordCount: number) => {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      const title = missionWordCount > 0 ? 'Black Hole Alert!' : 'Vortex Cards';
      const body = missionWordCount > 0 
        ? `The Black Hole has taken ${missionWordCount} of your words! Let's go get them back.`
        : `You have ${reviewCount} words waiting today. Ready for a quick session?`;
      
      registration.showNotification(title, { body, icon: 'https://i.imgur.com/pwc352v.png', badge: 'https://i.imgur.com/pwc352v.png', tag: 'review-reminder', renotify: true } as any);
    }
  };
  
  useEffect(() => {
    const persist = async () => {
      try {
        await dataService.saveWords(words);
        await dataService.saveStats(stats);
        await dataService.saveHistory(history);
        await dataService.saveCollections(collections);
      } catch (err) {
        console.error("Data Save Error", err);
      }
    };
    if (isDataLoaded) {
      persist();
    }
  }, [words, stats, history, collections, isDataLoaded]);

  useEffect(() => {
    if (isDataLoaded) {
        const today = new Date().toISOString().split('T')[0];
        const queue = getReviewQueue();
        if (stats.dailyMission?.date !== today && queue.length > 0) {
            const missionSize = Math.min(queue.length, Math.max(3, Math.floor(queue.length * 0.2)));
            const missionWords = [...queue].sort(() => 0.5 - Math.random()).slice(0, missionSize);
            setStats(prev => ({ ...prev, dailyMission: { date: today, wordIds: missionWords.map(w => w.id), completed: false } }));
        }
    }
  }, [isDataLoaded, words, stats.dailyMission, getReviewQueue]);


  useEffect(() => {
    if (viewingCollection?.id) {
      const freshCollection = collections.find(c => c.id === viewingCollection.id);
      setViewingCollection(freshCollection || null);
    }
  }, [collections, viewingCollection?.id]);

  useEffect(() => {
    if (isOnline) {
      setIsSyncing(true);
      const timer = setTimeout(() => setIsSyncing(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  useEffect(() => {
    localStorage.setItem('vortex_theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    const checkAchievements = () => {
      const newAchievements = [...stats.unlockedAchievements];
      let changed = false;
      const trigger = (id: string) => { if (!newAchievements.includes(id)) { newAchievements.push(id); changed = true; } };
      if (words.length >= 1) trigger('first_memory');
      if (words.length >= 100) trigger('word_warrior');
      if (words.length >= 500) trigger('librarian');
      if (words.length >= 1000) trigger('word_hunter');
      if (stats.masteredCount >= 10) trigger('rising_intellect');
      if (stats.masteredCount >= 100) trigger('prodigy');
      if (stats.streak >= 3) trigger('bronze_mind');
      if (stats.streak >= 7) trigger('silver_mind');
      if (stats.streak >= 14) trigger('gold_mind');
      if (stats.streak >= 30) trigger('diamond_mind');
      if (stats.streak >= 60) trigger('mythic_mind');
      if (collections.length >= 1) trigger('collector');
      if (collections.length >= 5) trigger('polymath');
      if (changed) { setStats(prev => ({ ...prev, unlockedAchievements: newAchievements })); }
    };
    if (isDataLoaded) checkAchievements();
  }, [words.length, stats.masteredCount, stats.streak, collections.length, isDataLoaded, stats.unlockedAchievements]);

  const addWord = (newWord: Omit<Word, 'id' | 'createdAt' | 'status' | 'nextReviewAt'>, collectionId?: string): boolean => {
    const termExists = words.some(w => w.term.toLowerCase().trim() === newWord.term.toLowerCase().trim());
    if (termExists) {
      console.warn(`Word "${newWord.term}" already exists.`);
      return false;
    }
    const wordId = Math.random().toString(36).substr(2, 9);
    const word: Word = { ...newWord, id: wordId, createdAt: Date.now(), status: WordStatus.NEW, nextReviewAt: Date.now() };
    setWords(prev => [...prev, word]);
    setStats(prev => ({ ...prev, totalWords: prev.totalWords + 1, firstWordId: prev.totalWords === 0 ? wordId : prev.firstWordId }));
    if (collectionId && collectionId !== 'none') { handleAddWordsToCollection(collectionId, [wordId]); }
    return true;
  };

  const updateWordSRS = (wordId: string, known: boolean) => {
    const today = new Date().toISOString().split('T')[0];
    let wasQuickLearn = false;
    const updatedWords = words.map(w => {
      if (w.id !== wordId) return w;
      let nextStatus = w.status;
      let nextReviewAt = Date.now();
      if (known) {
        if (w.status === WordStatus.NEW) nextStatus = WordStatus.LEARNING;
        else if (w.status === WordStatus.LEARNING) nextStatus = WordStatus.MASTERED;
        if (nextStatus === WordStatus.MASTERED && w.status !== WordStatus.MASTERED && (Date.now() - w.createdAt < 3 * 24 * 60 * 60 * 1000)) { wasQuickLearn = true; }
        nextReviewAt += SRS_INTERVALS[nextStatus];
      } else {
        nextStatus = WordStatus.NEW;
        nextReviewAt += SRS_INTERVALS.FORGOT;
      }
      return { ...w, status: nextStatus, nextReviewAt };
    });
    setWords(updatedWords);
    setStats(prev => {
      let newStreak = prev.lastStudyDate !== today ? prev.streak + 1 : prev.streak;
      const newAchievements = [...prev.unlockedAchievements];
      if (wasQuickLearn && !newAchievements.includes('quick_learner')) { newAchievements.push('quick_learner'); }
      return { ...prev, streak: newStreak, lastStudyDate: today, longestStreak: Math.max(prev.longestStreak, newStreak), masteredCount: updatedWords.filter(w => w.status === WordStatus.MASTERED).length, unlockedAchievements: newAchievements };
    });
    setHistory(prev => {
      const existingToday = prev.find(h => h.date === today);
      return existingToday ? prev.map(h => h.date === today ? { ...h, count: h.count + 1 } : h) : [...prev, { date: today, count: 1 }];
    });
  };

  const handleQuickStart = () => {
    setWords(prev => {
      const existingTerms = new Set(prev.map(w => w.term.toLowerCase()));
      const newWords = INITIAL_WORDS.filter(w => !existingTerms.has(w.term.toLowerCase()));
      return [...prev, ...newWords];
    });
    setStats(prev => ({ ...prev, totalWords: prev.totalWords + INITIAL_WORDS.length, firstWordId: prev.totalWords === 0 ? INITIAL_WORDS[0].id : prev.firstWordId }));
  };

  const handleStartReview = () => { setReviewQueue(getReviewQueue()); setIsReviewing(true); };
  const handleStartMission = () => { if (stats.dailyMission?.wordIds.length) { const missionWords = words.filter(w => stats.dailyMission!.wordIds.includes(w.id)); setReviewQueue(missionWords); setIsMissionReviewing(true); } };
  const handleCompleteMission = (results: { wordId: string, correct: boolean }[]) => { results.forEach(result => updateWordSRS(result.wordId, result.correct)); setIsMissionReviewing(false); setStats(prev => ({ ...prev, dailyMission: prev.dailyMission ? { ...prev.dailyMission, completed: true } : prev.dailyMission })); };
  const handleStartCollectionFlashcards = (collectionId: string) => { const c = collections.find(c => c.id === collectionId); if (c) setCollectionFlashcardSession(c); };
  const handleUpdateUserName = (newName: string) => { setStats(prev => ({ ...prev, userName: newName })); };
  const handleUpdateVoice = (voiceName: string) => { setSelectedVoiceName(voiceName); localStorage.setItem('vortex_voice_name', voiceName); };
  const handleUpdateUserAvatarUrl = (newAvatarUrl?: string) => { setStats(prev => ({ ...prev, avatarUrl: newAvatarUrl })); };
  const handleUpdateCoverPhotoUrl = (newCoverUrl?: string) => { setStats(prev => ({...prev, coverPhotoUrl: newCoverUrl })); };
  const handleCreateCollection = (name: string, icon: string): string => { const newCollection: Collection = { id: Math.random().toString(36).substr(2, 9), name, icon, wordIds: [], createdAt: Date.now() }; setCollections(prev => [...prev, newCollection]); return newCollection.id; };
  const handleAddWordsToCollection = (collectionId: string, wordIdsToAdd: string[]) => { setCollections(prev => prev.map(c => c.id === collectionId ? { ...c, wordIds: Array.from(new Set([...c.wordIds, ...wordIdsToAdd])) } : c)); };
  const handleRemoveWordsFromCollection = (collectionId: string, wordIdsToRemove: string[]) => { setCollections(prev => prev.map(c => c.id === collectionId ? { ...c, wordIds: c.wordIds.filter(id => !wordIdsToRemove.includes(id)) } : c)); };
  const handleDeleteCollection = (collectionId: string) => { setCollections(prev => prev.filter(c => c.id !== collectionId)); setViewingCollection(null); };
  const handleUpdateCollection = (collectionId: string, name: string, icon: string) => { setCollections(prev => prev.map(c => c.id === collectionId ? { ...c, name, icon } : c)); };
  const handleViewCollection = (collectionId: string) => { const c = collections.find(c => c.id === collectionId); if (c) setViewingCollection(c); };
  const handleExitCollectionView = () => setViewingCollection(null);
  const handleViewStatsDetail = (type: 'all' | 'mastered') => setViewingStatsDetail(type);
  const handleExitStatsDetail = () => setViewingStatsDetail(null);

  if (!isDataLoaded) {
    return <div className="min-h-screen flex items-center justify-center dark:bg-slate-900 text-slate-500">Loading your Vortex...</div>;
  }

  if (viewingStatsDetail) { return <StatsDetailView words={words} initialTab={viewingStatsDetail} onBack={handleExitStatsDetail} /> }
  if (collectionFlashcardSession) { const collectionWords = words.filter(w => collectionFlashcardSession.wordIds.includes(w.id)); return <FlashcardView words={collectionWords} onExit={() => setCollectionFlashcardSession(null)} collectionName={collectionFlashcardSession.name} selectedVoiceName={selectedVoiceName} />; }
  if (isMissionReviewing) { return <BlackHoleMission missionWords={reviewQueue} allWords={words} onComplete={handleCompleteMission} />; }
  if (isReviewing) { return <ReviewSession sessionWords={reviewQueue} onComplete={() => setIsReviewing(false)} onReview={updateWordSRS} selectedVoiceName={selectedVoiceName} />; }
  if (viewingCollection) { return <Layout activeTab="profile" setActiveTab={setActiveTab} toggleMusic={() => setIsMusicOpen(!isMusicOpen)} theme={theme} toggleTheme={() => setTheme(theme === 'light' ? 'dark' : 'light')} isOnline={isOnline} isSyncing={isSyncing}><CollectionView collection={viewingCollection} allWords={words} collections={collections} onBack={handleExitCollectionView} onWordsUpdate={setWords} onRemoveWordsFromCollection={handleRemoveWordsFromCollection} onAddWordsToCollection={handleAddWordsToCollection} onDeleteCollection={handleDeleteCollection} onUpdateCollection={handleUpdateCollection} onStartFlashcards={handleStartCollectionFlashcards} onAddNewWord={addWord} selectedVoiceName={selectedVoiceName} /></Layout>; }

  return (
    <>
      <WelcomeModal isOpen={showWelcomeModal} onClose={() => setShowWelcomeModal(false)} onStartReview={() => { setShowWelcomeModal(false); handleStartReview(); }} userName={stats.userName} reviewCount={getReviewQueue().length} />
      <Layout activeTab={activeTab} setActiveTab={setActiveTab} toggleMusic={() => setIsMusicOpen(!isMusicOpen)} theme={theme} toggleTheme={() => setTheme(theme === 'light' ? 'dark' : 'light')} isOnline={isOnline} isSyncing={isSyncing}>
        {activeTab === 'home' && <HomeView stats={stats} words={words} queueLength={getReviewQueue().length} onStartReview={handleStartReview} onQuickStart={handleQuickStart} onStartMission={handleStartMission} />}
        {activeTab === 'library' && <LibraryView words={words} onWordsUpdate={setWords} collections={collections} onAddWordsToCollection={handleAddWordsToCollection} onCreateCollection={handleCreateCollection} selectedVoiceName={selectedVoiceName} />}
        {activeTab === 'flashcards' && <FlashcardView words={words} collections={collections} selectedVoiceName={selectedVoiceName} />}
        {activeTab === 'add' && <AddWordView onAdd={addWord} collections={collections} onCreateCollection={handleCreateCollection} setActiveTab={setActiveTab} selectedVoiceName={selectedVoiceName} />}
        {activeTab === 'analytics' && <AnalyticsView history={history} words={words} stats={stats} setActiveTab={setActiveTab} onQuickStart={handleQuickStart} theme={theme} />}
        {activeTab === 'profile' && <ProfileView stats={stats} theme={theme} toggleTheme={() => setTheme(theme === 'light' ? 'dark' : 'light')} onUpdateUserName={handleUpdateUserName} onUpdateAvatarUrl={handleUpdateUserAvatarUrl} onUpdateCoverPhotoUrl={handleUpdateCoverPhotoUrl} collections={collections} onCreateCollection={handleCreateCollection} onViewCollection={handleViewCollection} selectedVoiceName={selectedVoiceName} onUpdateVoice={handleUpdateVoice} onViewStatsDetail={handleViewStatsDetail} storageLocation={'local'} />}
        {isMusicOpen && <MusicPlayer onClose={() => setIsMusicOpen(false)} />}
      </Layout>
    </>
  );
};

export default App;
