
import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Music as MusicIcon, Trash2, GripVertical, 
  Play, Pause, SkipBack, SkipForward, 
  Volume2, Upload, Headphones, Link as LinkIcon, AlertCircle, Loader2, ChevronDown, ChevronUp, Disc3
} from 'lucide-react';
import { saveTrack, getAllTracks, deleteTrack, updateTracksOrder } from '../services/audioDb';
import { LocalTrack } from '../types';

interface MusicPlayerProps {
  onClose: () => void;
}

const getSpotifyEmbedUrl = (url: string): string | null => {
  const match = url.match(/spotify\.com\/track\/(\w+)/);
  if (match && match[1]) {
    return `https://open.spotify.com/embed/track/${match[1]}`;
  }
  return null;
};


const MusicPlayer: React.FC<MusicPlayerProps> = ({ onClose }) => {
  const [tracks, setTracks] = useState<LocalTrack[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(Number(localStorage.getItem('vortex_volume') || 0.7));
  const [isLoading, setIsLoading] = useState(false);
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [showAddUrl, setShowAddUrl] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null); 
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  useEffect(() => {
    loadLibrary();
  }, []);

  const loadLibrary = async () => {
    const savedTracks = await getAllTracks();
    setTracks(savedTracks);
    if (savedTracks.length > 0 && currentTrackIndex === null) {
      setCurrentTrackIndex(0);
    }
  };

  useEffect(() => {
    setAudioError(null);
    if (currentTrackIndex !== null && tracks[currentTrackIndex]) {
      const track = tracks[currentTrackIndex];
      let url = '';
      let isBlob = false;
      
      if (track.blob) {
        url = URL.createObjectURL(track.blob);
        isBlob = true;
      } else if (track.url) {
        url = track.url;
      }
      
      if (url && !getSpotifyEmbedUrl(url)) {
        setAudioUrl(url);
        return () => { if (isBlob) URL.revokeObjectURL(url); };
      }
    }
    setAudioUrl(null);
  }, [currentTrackIndex, tracks]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const handleCanPlay = () => {
    if (isPlaying && audioRef.current) {
      audioRef.current.play().catch((err) => {
        setAudioError("Autoplay failed. Please interact with the player.");
        setIsPlaying(false);
      });
    }
  };

  const togglePlay = () => {
    if (!audioRef.current || !currentTrack) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().then(() => setAudioError(null)).catch(() => {
        setAudioError("Could not play this source.");
        setIsPlaying(false);
      });
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current && !isNaN(audioRef.current.duration)) {
      setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100 || 0);
    }
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (audioRef.current && !isNaN(audioRef.current.duration)) {
      audioRef.current.currentTime = (parseFloat(e.target.value) / 100) * audioRef.current.duration;
    }
  };
  
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsLoading(true);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('audio/')) {
        await saveTrack({ id: Math.random().toString(36).substr(2, 9), title: file.name.replace(/\.[^/.]+$/, ""), artist: 'Local Import', duration: 0, blob: file, addedAt: Date.now(), order: tracks.length });
      }
    }
    await loadLibrary();
    setIsLoading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
  
  const handleAddUrl = async () => {
    if (!urlInput.trim()) return;
    
    let title = 'Web Stream';
    let artist = 'Remote Source';

    if (urlInput.includes('spotify.com')) {
      title = 'Spotify Track';
      artist = 'Spotify';
    } else if (!urlInput.startsWith('http://') && !urlInput.startsWith('https://')) {
       setAudioError("Please enter a valid URL.");
       return;
    } else {
        title = urlInput.split('/').pop() || 'Remote Stream';
    }


    setIsLoading(true);
    await saveTrack({ id: Math.random().toString(36).substr(2, 9), title, artist, duration: 0, url: urlInput.trim(), addedAt: Date.now(), order: tracks.length });
    await loadLibrary();
    setUrlInput('');
    setShowAddUrl(false);
    setIsLoading(false);
  };

  const removeTrack = async (e: React.MouseEvent, id: string, index: number) => {
    e.stopPropagation();
    await deleteTrack(id);
    const updated = tracks.filter(t => t.id !== id).map((t, i) => ({ ...t, order: i }));
    setTracks(updated);
    await updateTracksOrder(updated);
    
    if (currentTrackIndex === index) {
      setCurrentTrackIndex(updated.length > 0 ? 0 : null);
    } else if (currentTrackIndex !== null && currentTrackIndex > index) {
      setCurrentTrackIndex(currentTrackIndex - 1);
    }
  };

  const onDragStart = (index: number) => setDraggedItemIndex(index);
  const onDragOver = (e: React.DragEvent) => e.preventDefault();
  const onDrop = async (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedItemIndex === null || draggedItemIndex === index) return;
    let newTracks = [...tracks];
    const [draggedItem] = newTracks.splice(draggedItemIndex, 1);
    newTracks.splice(index, 0, draggedItem);
    const reordered = newTracks.map((t, i) => ({...t, order: i}));
    setTracks(reordered);
    await updateTracksOrder(reordered);
    if (currentTrackIndex === draggedItemIndex) {
      setCurrentTrackIndex(index);
    } else if (currentTrackIndex !== null && draggedItemIndex < currentTrackIndex && index >= currentTrackIndex) {
      setCurrentTrackIndex(currentTrackIndex - 1);
    } else if (currentTrackIndex !== null && draggedItemIndex > currentTrackIndex && index <= currentTrackIndex) {
      setCurrentTrackIndex(currentTrackIndex + 1);
    }
    setDraggedItemIndex(null);
  };

  const currentTrack = currentTrackIndex !== null ? tracks[currentTrackIndex] : null;
  const isSpotify = currentTrack?.url && getSpotifyEmbedUrl(currentTrack.url);


  const CompactPlayer = () => (
    <div className="flex items-center p-3 animate-in fade-in duration-300">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 flex-shrink-0 ${isPlaying ? 'bg-emerald-500/20' : 'bg-slate-800'}`}>
        <MusicIcon className={`w-5 h-5 ${isPlaying ? 'text-emerald-400' : 'text-slate-500'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-xs truncate text-white">{currentTrack ? currentTrack.title : 'Vortex Music'}</p>
        <p className="text-[10px] text-slate-500 truncate">{currentTrack ? currentTrack.artist : 'Select a track'}</p>
      </div>
      <div className="flex items-center">
        {!isSpotify && <button onClick={togglePlay} disabled={!currentTrack} className="p-2 text-slate-300 hover:text-white disabled:opacity-30">
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
        </button>}
        <button onClick={() => setIsExpanded(true)} className="p-2 text-slate-400 hover:text-white">
          <ChevronUp className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  const ExpandedPlayer = () => (
    <div className="w-full max-w-sm flex flex-col animate-in fade-in duration-300">
      <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/10">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-slate-900 mr-3">
            <Headphones className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-xs uppercase tracking-widest">Study Playlist</h3>
        </div>
        <div>
          <button onClick={() => setIsExpanded(false)} className="p-2 text-slate-500 hover:text-white rounded-full">
            <ChevronDown className="w-5 h-5" />
          </button>
          <button onClick={onClose} className="p-2 text-slate-500 hover:text-white rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
        
      { isSpotify ? (
         <div className="p-6 flex flex-col items-center bg-gradient-to-b from-slate-800/50 to-slate-900/50">
            <iframe
                style={{ borderRadius: '12px' }}
                src={getSpotifyEmbedUrl(currentTrack.url!)!}
                width="100%"
                height="152"
                frameBorder="0"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
            ></iframe>
         </div>
      ) : (
        <div className="p-6 flex flex-col items-center bg-gradient-to-b from-slate-800/50 to-slate-900/50">
            <div className={`w-20 h-20 rounded-2xl bg-slate-800 shadow-2xl flex items-center justify-center mb-6 border border-white/10 relative group transition-all duration-500 ${isPlaying ? 'scale-110 shadow-emerald-500/10' : ''}`}>
              {audioError ? <AlertCircle className="w-10 h-10 text-rose-500 animate-pulse" /> : <MusicIcon className={`w-8 h-8 ${isPlaying ? 'text-emerald-500 animate-pulse' : 'text-slate-600'}`} />}
            </div>
            <div className="text-center w-full px-4 mb-4">
              <h4 className="font-bold text-base truncate">{currentTrack ? currentTrack.title : 'No track selected'}</h4>
              <p className="text-[9px] text-slate-500 uppercase tracking-widest mt-1">Study Atmosphere</p>
            </div>
            <div className="w-full space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-slate-500 font-mono w-8">{audioRef.current ? formatTime(audioRef.current.currentTime) : '0:00'}</span>
                <input type="range" min="0" max="100" value={progress} onChange={handleProgressChange} className="flex-1 accent-emerald-500 h-1 bg-slate-700 rounded-full cursor-pointer" />
                <span className="text-[10px] text-slate-500 font-mono w-8">{audioRef.current && !isNaN(audioRef.current.duration) ? formatTime(audioRef.current.duration) : '0:00'}</span>
              </div>
              <div className="flex items-center justify-center gap-6">
                <button disabled={tracks.length <= 1 || currentTrackIndex === 0} onClick={() => setCurrentTrackIndex(prev => prev! - 1)} className="p-2 text-slate-400 hover:text-white disabled:opacity-20"><SkipBack className="w-6 h-6" /></button>
                <button onClick={togglePlay} disabled={!currentTrack} className="w-12 h-12 bg-white text-slate-900 rounded-full flex items-center justify-center hover:scale-110 active:scale-95 shadow-xl disabled:opacity-50 transition-all">{isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />}</button>
                <button disabled={tracks.length <= 1 || currentTrackIndex === tracks.length - 1} onClick={() => setCurrentTrackIndex(prev => prev! + 1)} className="p-2 text-slate-400 hover:text-white disabled:opacity-20"><SkipForward className="w-6 h-6" /></button>
              </div>
            </div>
            {audioError && <p className="mt-4 text-[10px] text-rose-400 font-medium text-center bg-rose-500/10 p-2 rounded-lg border border-rose-500/20 w-full">{audioError}</p>}
        </div>
      )}
      
      <div className="px-6 py-4 border-y border-white/10">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-1">
            <Volume2 className="w-4 h-4 text-slate-500" />
            <input type="range" min="0" max="1" step="0.01" value={volume} onChange={(e) => { const v = parseFloat(e.target.value); setVolume(v); localStorage.setItem('vortex_volume', v.toString()); if(audioRef.current) audioRef.current.volume = v; }} className="flex-1 accent-slate-400 h-1 bg-slate-800 rounded-full cursor-pointer"/>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowAddUrl(!showAddUrl)} className={`p-2 rounded-lg transition-colors ${showAddUrl ? 'bg-emerald-500/20 text-emerald-500' : 'bg-slate-800 text-slate-400 hover:text-white'}`}><LinkIcon className="w-4 h-4"/></button>
            <button onClick={() => fileInputRef.current?.click()} className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"><Upload className="w-4 h-4"/></button>
          </div>
        </div>
        {showAddUrl && (
          <div className="mt-4 flex gap-2 animate-in slide-in-from-top-2">
            <input type="text" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} placeholder="Paste direct audio or Spotify URL..." className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-[11px] focus:outline-none focus:ring-1 focus:ring-emerald-500" onKeyDown={(e) => e.key === 'Enter' && handleAddUrl()} />
            <button onClick={handleAddUrl} disabled={isLoading} className="bg-emerald-600 px-4 py-2 rounded-lg text-[11px] font-bold hover:bg-emerald-500 disabled:opacity-50">{isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add'}</button>
          </div>
        )}
        <input ref={fileInputRef} type="file" accept="audio/*" multiple className="hidden" onChange={handleFileUpload} />
      </div>

      <div className="max-h-40 overflow-y-auto p-2 bg-black/20 custom-scrollbar">
        {tracks.map((track, index) => {
           const isTrackSpotify = track.url && getSpotifyEmbedUrl(track.url);
           return (
            <div key={track.id} draggable onDragStart={() => onDragStart(index)} onDragOver={onDragOver} onDrop={(e) => onDrop(e, index)} className={`group flex items-center p-2 rounded-xl border transition-all mb-1 ${currentTrackIndex === index ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-transparent border-transparent hover:bg-slate-800'}`}>
                <GripVertical className="w-4 h-4 text-slate-600 mr-2 cursor-grab" />
                <button onClick={() => setCurrentTrackIndex(index)} className="flex-1 flex items-center min-w-0 text-left">
                  <div className={`w-6 h-6 rounded flex items-center justify-center mr-3 ${currentTrackIndex === index ? 'bg-emerald-500 text-slate-900' : 'bg-slate-800 text-slate-500'}`}>
                    {isTrackSpotify ? <Disc3 className="w-3 h-3 text-[#1DB954]" /> : <MusicIcon className="w-3 h-3" />}
                  </div>
                  <div className="flex-1 truncate"><p className={`text-[11px] font-bold truncate ${currentTrackIndex === index ? 'text-emerald-400' : 'text-slate-300'}`}>{track.title}</p></div>
                </button>
                <button onClick={(e) => removeTrack(e, track.id, index)} className="p-2 text-slate-600 hover:text-rose-500 opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4" /></button>
            </div>
           );
        })}
        {tracks.length === 0 && <p className="text-center py-6 text-[10px] text-slate-600 font-bold uppercase tracking-widest border border-dashed border-slate-800 rounded-2xl mx-2">Add Spotify or audio links to start</p>}
      </div>
    </div>
  );

  return (
    <div className={`fixed bottom-24 md:bottom-6 right-3 md:right-6 z-[100] bg-slate-900/80 backdrop-blur-xl shadow-2xl rounded-2xl border border-white/10 text-white transition-all duration-300 ease-in-out transform-gpu ${isExpanded ? 'w-full max-w-sm' : 'w-64'}`}>
      {!isSpotify && audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onCanPlay={handleCanPlay}
          onError={() => setAudioError("Error loading audio.")}
          onEnded={() => currentTrackIndex !== null && currentTrackIndex < tracks.length - 1 ? setCurrentTrackIndex(currentTrackIndex + 1) : setIsPlaying(false)}
        />
      )}
      {isExpanded ? <ExpandedPlayer /> : <CompactPlayer />}
    </div>
  );
};

const formatTime = (seconds: number) => {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export default MusicPlayer;