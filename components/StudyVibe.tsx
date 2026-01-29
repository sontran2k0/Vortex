
import React, { useState, useEffect } from 'react';
import { Youtube, Music, Send } from 'lucide-react';

const parseYouTubeId = (url: string): string | null => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

const StudyVibe: React.FC = () => {
  const [inputUrl, setInputUrl] = useState('');
  const [videoId, setVideoId] = useState<string | null>(null);

  useEffect(() => {
    const savedUrl = localStorage.getItem('vortex_study_vibe_url');
    if (savedUrl) {
      const id = parseYouTubeId(savedUrl);
      if (id) {
        setVideoId(id);
        return;
      }
    }
    // Default lofi video
    setVideoId('R1r9nLYcqBU?si=8JM79zNMV18Fp_jF');
  }, []);

  const handleSetVibe = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const id = parseYouTubeId(inputUrl);
    if (id) {
      setVideoId(id);
      localStorage.setItem('vortex_study_vibe_url', inputUrl);
      setInputUrl('');
    } else {
      alert('Invalid YouTube URL. Please use a valid video link.');
    }
  };

  return (
    <div className="bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-800 shadow-2xl shadow-indigo-500/10">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center text-red-400">
            <Youtube className="w-6 h-6" />
        </div>
        <div>
            <h3 className="text-xl font-bold">Study Vibe</h3>
            <p className="text-sm text-slate-400">Set the mood with some background music.</p>
        </div>
      </div>
      
      <div className="aspect-video w-full bg-slate-800 rounded-2xl overflow-hidden mb-6 border border-slate-700">
        {videoId ? (
          <iframe
            width="100%"
            height="100%"
            src={`https://www.youtube.com/embed/${videoId}?autoplay=0&controls=1&modestbranding=1&rel=0`}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
                <Music className="w-12 h-12 mb-2" />
                <p className="text-sm font-medium">YouTube player will appear here</p>
            </div>
        )}
      </div>

      <form onSubmit={handleSetVibe} className="flex gap-2">
        <input 
          type="text"
          value={inputUrl}
          onChange={(e) => setInputUrl(e.target.value)}
          placeholder="Paste a YouTube URL to change the vibe..."
          className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
        />
        <button type="submit" className="px-5 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

export default StudyVibe;
