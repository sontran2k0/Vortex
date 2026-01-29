
import React from 'react';
import { HardDrive, Cloud } from 'lucide-react';

const StorageSelectionModal: React.FC = () => {
  const handleSelect = (location: 'local' | 'firebase') => {
    localStorage.setItem('vortex_storage_location', location);
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
      <div className="max-w-4xl w-full text-center p-8">
        <h1 className="text-4xl font-bold text-white mb-4">Welcome to Vortex Cards</h1>
        <p className="text-slate-400 text-lg mb-12 max-w-2xl mx-auto">
          Before you begin your learning journey, please choose where you'd like to store your data.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <button
            onClick={() => handleSelect('local')}
            className="bg-slate-800/50 border-2 border-slate-700 rounded-3xl p-8 text-left hover:border-indigo-500 hover:bg-slate-800 transition-all transform hover:scale-105"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-indigo-500/10 text-indigo-400 rounded-2xl flex items-center justify-center">
                <HardDrive className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-white">On This Device</h2>
            </div>
            <p className="text-slate-400 mb-2">
              Your data is stored securely and privately on your current device's local storage.
            </p>
            <ul className="text-sm space-y-2 text-slate-300">
              <li className="flex items-start"><span className="text-emerald-400 mr-2 mt-1">✔</span> Works completely offline.</li>
              <li className="flex items-start"><span className="text-emerald-400 mr-2 mt-1">✔</span> Maximum privacy, no cloud involved.</li>
              <li className="flex items-start"><span className="text-amber-400 mr-2 mt-1">✖</span> Data is not synced across devices.</li>
            </ul>
          </button>
          <button
            onClick={() => handleSelect('firebase')}
            className="bg-slate-800/50 border-2 border-slate-700 rounded-3xl p-8 text-left hover:border-emerald-500 hover:bg-slate-800 transition-all transform hover:scale-105"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center">
                <Cloud className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-white">In The Cloud</h2>
            </div>
            <p className="text-slate-400 mb-2">
              Your data is stored in Firebase Cloud, allowing for future synchronization features.
            </p>
            <ul className="text-sm space-y-2 text-slate-300">
              <li className="flex items-start"><span className="text-emerald-400 mr-2 mt-1">✔</span> Backup and sync potential.</li>
              <li className="flex items-start"><span className="text-emerald-400 mr-2 mt-1">✔</span> Access your data from anywhere (future feature).</li>
              <li className="flex items-start"><span className="text-amber-400 mr-2 mt-1">✖</span> Requires an internet connection for syncing.</li>
            </ul>
          </button>
        </div>
      </div>
    </div>
  );
};

export default StorageSelectionModal;
