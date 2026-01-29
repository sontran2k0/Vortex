import React, { useState, useEffect, useRef } from 'react';
import { UserStats, Collection } from '../types';
import { ChevronRight, Moon, Sun, Edit, Save, Image as ImageIcon, Upload, Folder, Plus, X, Camera, Volume2, CheckCircle, HardDrive } from 'lucide-react';
import { getStreakRank } from '../services/storyService';
import EmojiPicker from '../components/EmojiPicker';
import { StorageLocation } from '../services/dataService';

interface ProfileViewProps {
  stats: UserStats;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  onUpdateUserName: (newName: string) => void;
  onUpdateAvatarUrl: (newAvatarUrl?: string) => void;
  onUpdateCoverPhotoUrl: (newCoverUrl?: string) => void;
  collections: Collection[];
  onCreateCollection: (name: string, icon: string) => string;
  onViewCollection: (collectionId: string) => void;
  selectedVoiceName: string | null;
  onUpdateVoice: (voiceName: string) => void;
  onViewStatsDetail: (type: 'all' | 'mastered') => void;
  storageLocation: StorageLocation;
}

const ranks = [
  { name: 'Bronze', threshold: 3, gem: '🥉' },
  { name: 'Silver', threshold: 7, gem: '⚪️' },
  { name: 'Gold', threshold: 14, gem: '🔶' },
  { name: 'Diamond', threshold: 30, gem: '💠' },
  { name: 'Mythic', threshold: 60, gem: '💎' },
];

const StreakProgressBar: React.FC<{ streak: number }> = ({ streak }) => {
  return (
    <div className="w-full">
      <div className="flex justify-between items-center text-xs font-bold text-slate-400 mb-2 px-1">
        {ranks.map(rank => <span key={rank.name}>{rank.gem}</span>)}
      </div>
      <div className="h-2.5 bg-slate-700/50 rounded-full w-full relative">
        <div className="h-full bg-gradient-to-r from-cyan-400 to-indigo-500 rounded-full transition-all duration-500" style={{ width: `${(streak / 60) * 100}%` }} />
      </div>
      <div className="flex justify-between items-center text-xs font-bold text-slate-400 mt-2 px-1">
        {ranks.map(rank => <span key={rank.name}>{rank.threshold}d</span>)}
      </div>
    </div>
  );
};


const ProfileView: React.FC<ProfileViewProps> = (props) => {
  const { 
    stats, theme, toggleTheme, onUpdateUserName, onUpdateAvatarUrl, 
    onUpdateCoverPhotoUrl, collections, onCreateCollection, onViewCollection,
    selectedVoiceName, onUpdateVoice, onViewStatsDetail, storageLocation
  } = props;
  
  const streakRank = getStreakRank(stats.streak);
  
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [tempUserName, setTempUserName] = useState(stats.userName);
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);
  const [tempAvatarUrlInput, setTempAvatarUrlInput] = useState(stats.avatarUrl || '');
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(stats.avatarUrl || null);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  const [isEditingCover, setIsEditingCover] = useState(false);
  const [tempCoverUrlInput, setTempCoverUrlInput] = useState(stats.coverPhotoUrl || '');
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(stats.coverPhotoUrl || null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionIcon, setNewCollectionIcon] = useState('');
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [collectionPage, setCollectionPage] = useState(1);
  const COLLECTIONS_PER_PAGE = 4;
  const totalCollectionPages = Math.ceil(collections.length / COLLECTIONS_PER_PAGE);
  const paginatedCollections = collections.slice((collectionPage - 1) * COLLECTIONS_PER_PAGE, collectionPage * COLLECTIONS_PER_PAGE);
  
  useEffect(() => {
    const loadAndSetVoices = () => {
      const allVoices = window.speechSynthesis.getVoices();
      if (allVoices.length > 0) {
        setAvailableVoices(allVoices.filter(v => v.lang.startsWith('en-')));
      }
    };
    loadAndSetVoices();
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = loadAndSetVoices;
    }
    return () => { if (speechSynthesis.onvoiceschanged !== undefined) { speechSynthesis.onvoiceschanged = null; } };
  }, []); 

  useEffect(() => { setTempUserName(stats.userName); }, [stats.userName]);
  useEffect(() => { setTempAvatarUrlInput(stats.avatarUrl || ''); setAvatarPreviewUrl(stats.avatarUrl || null); }, [stats.avatarUrl]);
  useEffect(() => { setTempCoverUrlInput(stats.coverPhotoUrl || ''); setCoverPreviewUrl(stats.coverPhotoUrl || null); }, [stats.coverPhotoUrl]);
  
  const handleSaveUserName = () => { if (tempUserName.trim() && tempUserName !== stats.userName) { onUpdateUserName(tempUserName.trim()); } setIsEditingProfile(false); };
  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => setAvatarPreviewUrl(reader.result as string); reader.readAsDataURL(file); } };
  const handleAvatarUrlInputChange = (e: React.ChangeEvent<HTMLInputElement>) => { setTempAvatarUrlInput(e.target.value); setAvatarPreviewUrl(e.target.value.trim()); };
  const handleSaveAvatar = () => { onUpdateAvatarUrl(avatarPreviewUrl || undefined); setIsEditingAvatar(false); };
  const handleCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => setCoverPreviewUrl(reader.result as string); reader.readAsDataURL(file); } };
  const handleCoverUrlInputChange = (e: React.ChangeEvent<HTMLInputElement>) => { setTempCoverUrlInput(e.target.value); setCoverPreviewUrl(e.target.value.trim()); };
  const handleSaveCover = () => { onUpdateCoverPhotoUrl(coverPreviewUrl || undefined); setIsEditingCover(false); };
  const handleCreateCollection = () => { if(newCollectionName.trim() && newCollectionIcon.trim()){ onCreateCollection(newCollectionName.trim(), newCollectionIcon); setNewCollectionName(''); setNewCollectionIcon(''); setIsCollectionModalOpen(false); } };
  const previewVoice = (voice: SpeechSynthesisVoice) => { window.speechSynthesis.cancel(); const utterance = new SpeechSynthesisUtterance("This is the selected voice."); utterance.voice = voice; window.speechSynthesis.speak(utterance); };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="bg-slate-900 rounded-[2.5rem] border border-slate-800 shadow-2xl shadow-indigo-500/10 relative overflow-hidden">
        <div className="relative group">
          <img src={stats.coverPhotoUrl || '/avt.jpg'} alt="Cover" className="w-full h-48 object-cover opacity-70" onError={(e) => { e.currentTarget.src = '/avt.jpg'; }}/>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent"></div>
          <button onClick={() => setIsEditingCover(true)} className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-black/40 text-white rounded-lg text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"><Camera className="w-4 h-4" /> Change Cover</button>
        </div>
        <div className="px-10 pb-10 -mt-24 relative">
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-6 group">
              <div className={`absolute -inset-2 rounded-full bg-gradient-to-tr ${streakRank.color} opacity-20 blur-lg`} />
              <img src={stats.avatarUrl || '/avt.gif'} alt="User Avatar" className="w-28 h-28 rounded-full border-4 border-slate-900 shadow-2xl relative z-10 object-cover" onError={(e) => { e.currentTarget.src = '/avt.gif'; }}/>
              <div className={`absolute -bottom-1 -right-1 w-10 h-10 rounded-full bg-gradient-to-r ${streakRank.color} border-4 border-slate-900 shadow-xl flex items-center justify-center text-xl z-20`}>{streakRank.gem}</div>
              <button onClick={() => setIsEditingAvatar(true)} className="absolute inset-0 rounded-full flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity z-30"><ImageIcon className="w-8 h-8" /></button>
            </div>
            {isEditingProfile ? (<div className="flex flex-col items-center gap-2 mb-4 w-full max-w-sm px-4"><input type="text" value={tempUserName} onChange={(e) => setTempUserName(e.target.value)} className="text-3xl font-bold text-center bg-slate-800 text-white border border-slate-700 rounded-xl px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"/><div className="flex gap-2 mt-2"><button onClick={handleSaveUserName} className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold"><Save className="w-4 h-4 mr-2" /> Save</button><button onClick={() => setIsEditingProfile(false)} className="px-4 py-2 bg-slate-700 rounded-xl font-bold">Cancel</button></div></div>) : (<h2 className="
  text-xl 
  sm:text-3xl 
  font-bold 
  tracking-tight 
  flex 
  flex-wrap 
  items-center 
  justify-center 
  gap-2 
  text-center
">
  {stats.userName}

  <button 
    onClick={() => setIsEditingProfile(true)} 
    className="p-1 text-slate-400 hover:text-indigo-500"
  >
    <Edit className="w-5 h-5" />
  </button>
</h2>
)}
            <p className={`text-sm font-bold bg-gradient-to-r ${streakRank.color} bg-clip-text text-transparent uppercase tracking-widest mt-2`}>{streakRank.title}</p>
            <div className="w-full border-t border-slate-800 mt-10 pt-8 space-y-6">
              <div className="grid grid-cols-3 w-full p-4 rounded-2xl border-2 border-dashed border-slate-700">
                <div className="text-center flex flex-col justify-center"><p className="text-2xl font-black">{stats.streak}</p><p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Streak</p></div>
                <button onClick={() => onViewStatsDetail('all')} className="text-center hover:bg-slate-800/50 rounded-lg transition-colors py-2 flex flex-col justify-center"><p className="text-2xl font-black">{stats.totalWords}</p><p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Words</p></button>
                <button onClick={() => onViewStatsDetail('mastered')} className="text-center hover:bg-slate-800/50 rounded-lg transition-colors py-2 flex flex-col justify-center"><p className="text-2xl font-black">{stats.masteredCount}</p><p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Mastered</p></button>
              </div>
              <StreakProgressBar streak={stats.streak} />
            </div>
          </div>
        </div>
      </div>

       <div className="bg-slate-900 rounded-[2.5rem] p-8 border border-slate-800 shadow-lg">
        <div className="flex justify-between items-center mb-6"><h3 className="font-bold text-lg flex items-center gap-2 text-white"><Folder className="w-5 h-5 text-indigo-400" /> My Collections</h3><button onClick={() => setIsCollectionModalOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg text-xs font-bold hover:bg-indigo-500/20 transition-colors"><Plus className="w-4 h-4" /> New</button></div>
        <div className="grid grid-cols-2 gap-4">{paginatedCollections.map(c => (<button key={c.id} onClick={() => onViewCollection(c.id)} className="bg-slate-800/50 p-4 rounded-2xl border border-slate-800 text-center hover:bg-slate-800 hover:border-indigo-500/50 transition-all transform hover:scale-105 active:scale-100"><span className="text-3xl">{c.icon}</span><p className="font-bold text-sm mt-2 truncate">{c.name}</p><p className="text-xs text-slate-400">{c.wordIds.length} words</p></button>))}{collections.length === 0 && (<div className="col-span-full text-center text-sm text-slate-400 py-8"><p>Create your first collection to organize words!</p></div>)}</div>
        {totalCollectionPages > 1 && (<div className="flex items-center justify-center gap-2 text-sm mt-6"><button disabled={collectionPage === 1} onClick={() => setCollectionPage(p => p - 1)} className="px-3 py-1 bg-slate-800/50 border border-slate-700/50 rounded-lg disabled:opacity-40 hover:bg-slate-800">Prev</button><span className="font-bold text-slate-500">Page {collectionPage} of {totalCollectionPages}</span><button disabled={collectionPage === totalCollectionPages} onClick={() => setCollectionPage(p => p + 1)} className="px-3 py-1 bg-slate-800/50 border border-slate-700/50 rounded-lg disabled:opacity-40 hover:bg-slate-800">Next</button></div>)}
      </div>

       <div className="bg-slate-900 rounded-[2rem] border border-slate-800 overflow-hidden shadow-sm divide-y divide-slate-800">
        <div className="w-full flex items-center justify-between p-5"><div className="flex items-center"><div className="w-12 h-12 bg-sky-500/10 rounded-2xl flex items-center justify-center text-sky-400 mr-5"><HardDrive className="w-6 h-6" /></div><div className="text-left"><p className="font-bold text-sm">Data Storage</p><p className="text-xs text-slate-400">Data is stored on this device.</p></div></div></div>
        <button onClick={toggleTheme} className="w-full flex items-center justify-between p-5 hover:bg-slate-800"><div className="flex items-center"><div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 mr-5">{theme === 'dark' ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}</div><div className="text-left"><p className="font-bold text-sm">Theme Mode</p><p className="text-xs text-slate-400">Switch to {theme === 'dark' ? 'Light' : 'Dark'}</p></div></div><ChevronRight className="w-5 h-5 text-slate-500" /></button>
        <button onClick={() => setIsVoiceModalOpen(true)} className="w-full flex items-center justify-between p-5 hover:bg-slate-800"><div className="flex items-center"><div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 mr-5"><Volume2 className="w-6 h-6" /></div><div className="text-left"><p className="font-bold text-sm">Voice Selection</p><p className="text-xs text-slate-400">Change text-to-speech voice</p></div></div><ChevronRight className="w-5 h-5 text-slate-500" /></button>
      </div>

      {isVoiceModalOpen && (<div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"><div className="bg-slate-900 p-6 rounded-3xl shadow-xl border border-slate-800 max-w-md w-full flex flex-col max-h-[80vh]"><div className="flex justify-between items-center mb-4"><h3 className="text-xl font-bold">Select a Voice</h3><button onClick={() => setIsVoiceModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button></div><div className="flex-1 overflow-y-auto custom-scrollbar -mr-3 pr-3"><div className="space-y-2">{availableVoices.map(voice => (<div key={voice.name} onClick={() => onUpdateVoice(voice.name)} className={`flex items-center p-3 rounded-xl cursor-pointer transition-colors ${selectedVoiceName === voice.name ? 'bg-indigo-500/10' : 'hover:bg-slate-800'}`}>{selectedVoiceName === voice.name ? <CheckCircle className="w-5 h-5 text-indigo-400 mr-3"/> : <div className="w-5 h-5 mr-3"/>}<div className="flex-1"><p className="font-bold text-sm">{voice.name}</p><p className="text-xs text-slate-400">{voice.lang}</p></div><button onClick={(e) => { e.stopPropagation(); previewVoice(voice); }} className="p-2 text-slate-500 hover:text-indigo-400"><Volume2 className="w-5 h-5"/></button></div>))}{availableVoices.length === 0 && <p className="text-center text-sm text-slate-400 py-8">No English voices found on this device.</p>}</div></div></div></div>)}
      {isEditingAvatar && ( <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"> <div className="bg-slate-900 p-8 rounded-3xl shadow-xl border border-slate-800 text-center max-w-md w-full"> <h3 className="text-2xl font-bold mb-6">Change Avatar</h3> <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-indigo-500/50 mx-auto mb-6 flex items-center justify-center bg-slate-800"> {avatarPreviewUrl ? <img src={avatarPreviewUrl} className="w-full h-full object-cover" alt="Avatar Preview" /> : <ImageIcon className="w-16 h-16 text-slate-600" />} </div> <div className="space-y-4 mb-6"> <input type="text" value={tempAvatarUrlInput} onChange={handleAvatarUrlInputChange} placeholder="Paste image URL..." className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl" /> <label className="w-full flex items-center justify-center px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl cursor-pointer gap-2"> <Upload className="w-5 h-5" /> Upload Image <input ref={avatarFileInputRef} type="file" accept="image/*" onChange={handleAvatarFileChange} className="hidden" /> </label> </div> <div className="flex gap-4"> <button onClick={() => setIsEditingAvatar(false)} className="flex-1 py-3 bg-slate-700 rounded-xl font-bold">Cancel</button> <button onClick={handleSaveAvatar} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold">Save</button> </div> </div> </div> )}
      {isEditingCover && ( <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"> <div className="bg-slate-900 p-8 rounded-3xl shadow-xl border border-slate-800 text-center max-w-md w-full"> <h3 className="text-2xl font-bold mb-6">Change Cover Photo</h3> <div className="w-full h-40 rounded-xl overflow-hidden border-4 border-indigo-500/50 mx-auto mb-6 flex items-center justify-center bg-slate-800"> {coverPreviewUrl ? <img src={coverPreviewUrl} className="w-full h-full object-cover" alt="Cover Preview" /> : <ImageIcon className="w-16 h-16 text-slate-600" />} </div> <div className="space-y-4 mb-6"> <input type="text" value={tempCoverUrlInput} onChange={handleCoverUrlInputChange} placeholder="Paste image URL..." className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl" /> <label className="w-full flex items-center justify-center px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl cursor-pointer gap-2"> <Upload className="w-5 h-5" /> Upload Image <input ref={coverFileInputRef} type="file" accept="image/*" onChange={handleCoverFileChange} className="hidden" /> </label> </div> <div className="flex gap-4"> <button onClick={() => setIsEditingCover(false)} className="flex-1 py-3 bg-slate-700 rounded-xl font-bold">Cancel</button> <button onClick={handleSaveCover} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold">Save</button> </div> </div> </div> )}
      {isCollectionModalOpen && ( <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"> <div className="bg-slate-900 p-6 rounded-2xl shadow-xl max-w-sm w-full animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"> <div className="flex justify-between items-center mb-4 flex-shrink-0"> <h3 className="font-bold text-lg">New Collection</h3> <button onClick={() => setIsCollectionModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button> </div> <div className="flex-1 overflow-y-auto custom-scrollbar -mr-3 pr-3"> <div className="space-y-4"> <div> <label className="text-xs font-bold text-slate-500">Name</label> <input type="text" value={newCollectionName} onChange={(e) => setNewCollectionName(e.target.value)} placeholder="e.g., French Verbs" className="w-full mt-1 px-3 py-2 bg-slate-800 rounded-lg focus:ring-2 focus:ring-indigo-500" /> </div> <div> <label className="text-xs font-bold text-slate-500">Icon (Emoji)</label> <div className="flex items-center gap-2 mt-1"> <div className="w-12 h-12 text-3xl bg-slate-800 rounded-lg flex items-center justify-center flex-shrink-0">{newCollectionIcon || '...'}</div> <input type="text" value={newCollectionIcon} onChange={(e) => setNewCollectionIcon(e.target.value)} placeholder="Select one below" readOnly className="flex-1 px-3 py-2 bg-slate-800 rounded-lg cursor-default" /> </div> </div> <EmojiPicker onEmojiSelect={(emoji) => setNewCollectionIcon(emoji)} /> </div> </div> <div className="flex gap-4 mt-6 flex-shrink-0"> <button onClick={() => setIsCollectionModalOpen(false)} className="flex-1 py-3 bg-slate-700 rounded-lg font-bold text-sm">Cancel</button> <button onClick={handleCreateCollection} className="flex-1 py-3 bg-indigo-600 text-white rounded-lg font-bold text-sm">Create</button> </div> </div> </div> )}
    </div>
  );
};

export default ProfileView;
