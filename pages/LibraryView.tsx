
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Word, WordStatus, Collection } from '../types';
import { Search, Volume2, XCircle, Eye, X, Layers, CheckSquare, Tag, FolderPlus, MoreVertical, Edit, ImageIcon, Save, Upload, PlusCircle, Heart } from 'lucide-react';
import EmojiPicker from '../components/EmojiPicker';

interface LibraryViewProps {
  words: Word[];
  onWordsUpdate: (updatedWords: Word[]) => void;
  collections: Collection[];
  onAddWordsToCollection: (collectionId: string, wordIds: string[]) => void;
  onCreateCollection: (name: string, icon: string) => string;
  selectedVoiceName: string | null;
}

const statusColors: { [key in WordStatus]: string } = {
  [WordStatus.NEW]: 'bg-blue-500',
  [WordStatus.LEARNING]: 'bg-orange-500',
  [WordStatus.MASTERED]: 'bg-emerald-500',
};

const WORDS_PER_PAGE = 20;

const pastelColors = [
    { bg: 'bg-rose-100 dark:bg-rose-500/10', text: 'text-rose-600 dark:text-rose-400' },
    { bg: 'bg-teal-100 dark:bg-teal-500/10', text: 'text-teal-600 dark:text-teal-400' },
    { bg: 'bg-sky-100 dark:bg-sky-500/10', text: 'text-sky-600 dark:text-sky-400' },
    { bg: 'bg-amber-100 dark:bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400' },
    { bg: 'bg-violet-100 dark:bg-violet-500/10', text: 'text-violet-600 dark:text-violet-400' },
    { bg: 'bg-lime-100 dark:bg-lime-500/10', text: 'text-lime-600 dark:text-lime-400' },
    { bg: 'bg-fuchsia-100 dark:bg-fuchsia-500/10', text: 'text-fuchsia-600 dark:text-fuchsia-400' },
];

const getTagColor = (tag: string) => {
    let hash = 0;
    for (let i = 0; i < tag.length; i++) {
        hash = tag.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash % pastelColors.length);
    return pastelColors[index];
};


const LibraryView: React.FC<LibraryViewProps> = ({ words, onWordsUpdate, collections, onAddWordsToCollection, onCreateCollection, selectedVoiceName }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [filterFavorites, setFilterFavorites] = useState(false);
  const [previewWord, setPreviewWord] = useState<Word | null>(null);
  const [isPreviewFlipped, setIsPreviewFlipped] = useState(false);
  const [showSearchInput, setShowSearchInput] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState({
    [WordStatus.NEW]: 1,
    [WordStatus.LEARNING]: 1,
    [WordStatus.MASTERED]: 1,
  });

  // States for bulk selection and actions
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
  const [tagInput, setTagInput] = useState('');
  
  // States for editing a single word
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingWord, setEditingWord] = useState<Word | null>(null);
  const [tempWordData, setTempWordData] = useState({ term: '', definition: '', example: '', ipa: '', tags: '', imageUrl: '', isFavorite: false });
  const editFileInputRef = useRef<HTMLInputElement>(null);
  
  // States for creating a collection
  const [isCreateCollectionModalOpen, setIsCreateCollectionModalOpen] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionIcon, setNewCollectionIcon] = useState('');
  const [activeVoice, setActiveVoice] = useState<SpeechSynthesisVoice | null>(null);


  useEffect(() => {
    if (!showSearchInput) setSearchTerm('');
  }, [showSearchInput]);
  
  useEffect(() => {
    if (editingWord) {
      setTempWordData({
        term: editingWord.term,
        definition: editingWord.definition,
        example: editingWord.example || '',
        ipa: editingWord.ipa || '',
        tags: editingWord.tags.join(', '),
        imageUrl: editingWord.imageUrl || '',
        isFavorite: editingWord.isFavorite || false,
      });
    }
  }, [editingWord]);

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


  const allTags = useMemo(() => {
    const tags = new Set<string>();
    words.forEach(w => w.tags.forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  }, [words]);

  const filteredWords = useMemo(() => words.filter(w => {
    const matchesSearch = 
      w.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.definition.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTag = selectedTag ? w.tags.includes(selectedTag) : true;
    const matchesFavorite = !filterFavorites || w.isFavorite;
    return matchesSearch && matchesTag && matchesFavorite;
  }).sort((a, b) => a.term.localeCompare(b.term)), [words, searchTerm, selectedTag, filterFavorites]);

  const allFilteredAreSelected = useMemo(() => {
    const filteredWordIds = filteredWords.map(word => word.id);
    if (filteredWordIds.length === 0) return false;
    return filteredWordIds.every(id => selectedWords.includes(id));
  }, [filteredWords, selectedWords]);

  const handleToggleSelectAllFiltered = () => {
    const filteredWordIds = filteredWords.map(word => word.id);
    const filteredWordIdsSet = new Set(filteredWordIds);

    if (allFilteredAreSelected) {
      setSelectedWords(prevSelected => prevSelected.filter(id => !filteredWordIdsSet.has(id)));
    } else {
      setSelectedWords(prevSelected => [...new Set([...prevSelected, ...filteredWordIds])]);
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
  
  const handleToggleSelection = (wordId: string) => {
    setSelectedWords(prev => 
      prev.includes(wordId) 
        ? prev.filter(id => id !== wordId)
        : [...prev, wordId]
    );
  };
  
  const handleToggleFavorite = (wordId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedWords = words.map(w =>
        w.id === wordId ? { ...w, isFavorite: !w.isFavorite } : w
    );
    onWordsUpdate(updatedWords);
  };
  
  const handleApplyTags = () => {
    if (!tagInput.trim() || selectedWords.length === 0) return;

    const newTags = tagInput.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
    if (newTags.length === 0) return;
    
    const updatedWords = words.map(word => {
      if (selectedWords.includes(word.id)) {
        const existingTags = new Set(word.tags.map(t => t.toLowerCase()));
        newTags.forEach(tag => existingTags.add(tag));
        return { ...word, tags: Array.from(existingTags) };
      }
      return word;
    });

    onWordsUpdate(updatedWords);
    
    setTagInput('');
    setIsTagModalOpen(false);
    setSelectedWords([]);
    setIsSelectMode(false);
  };

  const handleAddToCollection = (collectionId: string) => {
    onAddWordsToCollection(collectionId, selectedWords);
    setIsCollectionModalOpen(false);
    setSelectedWords([]);
    setIsSelectMode(false);
  };
  
  const handleOpenEditModal = (word: Word) => {
    setEditingWord(word);
    setIsEditModalOpen(true);
  };
  
  const handleSaveWord = () => {
    if (!editingWord || !tempWordData.term.trim() || !tempWordData.definition.trim()) return;
    
    const updatedWords = words.map(w => {
      if (w.id === editingWord.id) {
        return {
          ...w,
          term: tempWordData.term,
          definition: tempWordData.definition,
          example: tempWordData.example,
          ipa: tempWordData.ipa,
          tags: tempWordData.tags.split(',').map(t => t.trim()).filter(Boolean),
          imageUrl: tempWordData.imageUrl,
          isFavorite: tempWordData.isFavorite,
        };
      }
      return w;
    });
    
    onWordsUpdate(updatedWords);
    setIsEditModalOpen(false);
    setEditingWord(null);
  };
  
  const handleEditImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            setTempWordData(prev => ({ ...prev, imageUrl: reader.result as string }));
        };
        reader.readAsDataURL(file);
    }
  };
  
  const handleCreateCollectionSubmit = () => {
    if (newCollectionName.trim() && newCollectionIcon.trim()) {
      onCreateCollection(newCollectionName.trim(), newCollectionIcon);
      setNewCollectionName('');
      setNewCollectionIcon('');
      setIsCreateCollectionModalOpen(false);
      setIsCollectionModalOpen(true);
    }
  };


  const renderWordCard = (word: Word) => {
    const isSelected = selectedWords.includes(word.id);

    return (
      <div 
        key={word.id} 
        onClick={() => isSelectMode && handleToggleSelection(word.id)}
        className={`relative bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm group flex flex-col hover:z-30 ${isSelectMode ? 'cursor-pointer' : ''} ${isSelected ? 'ring-2 ring-indigo-500 border-indigo-500' : ''}`}
      >
        <div className="flex flex-col flex-grow">
            <div className={`absolute top-2 left-2 w-1.5 h-1.5 rounded-full ${statusColors[word.status]}`} title={`Status: ${word.status.charAt(0).toUpperCase() + word.status.slice(1).toLowerCase()}`} />
             <button onClick={(e) => handleToggleFavorite(word.id, e)} className={`absolute top-1 right-1 p-1 rounded-full z-10 ${isSelectMode ? 'hidden' : 'text-slate-300 dark:text-slate-600'}`}>
                <Heart className={`w-4 h-4 transition-all ${word.isFavorite ? 'fill-rose-500 text-rose-500' : 'group-hover:text-rose-400'}`} />
            </button>
            
            {isSelectMode && (
              <div className="absolute top-2 right-2 z-10 p-1 bg-white/50 dark:bg-black/50 rounded-full">
                <input type="checkbox" checked={isSelected} readOnly className="w-5 h-5 rounded-full text-indigo-600 bg-slate-100 border-slate-300 focus:ring-indigo-500" />
              </div>
            )}
            <div className="flex justify-between items-start mb-1">
              <h4 className="font-bold text-indigo-600 dark:text-indigo-400 truncate flex-1 pr-8">{word.term}</h4>
              <div className={`relative z-10 transition-opacity ${isSelectMode ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'}`}>
                <div className="relative group/menu">
                  <button className="p-1 text-slate-400 hover:text-indigo-600"><MoreVertical className="w-4 h-4" /></button>
                  <div className="absolute top-full right-0 mt-1 w-32 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg shadow-lg p-1 z-20 opacity-0 group-hover/menu:opacity-100 pointer-events-none group-hover/menu:pointer-events-auto transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); playSound(word.term); }} className="w-full text-left px-2 py-1.5 text-xs rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center"><Volume2 className="w-3 h-3 mr-2"/>Speak</button>
                    <button onClick={(e) => { e.stopPropagation(); setPreviewWord(word); setIsPreviewFlipped(false); }} className="w-full text-left px-2 py-1.5 text-xs rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center"><Eye className="w-3 h-3 mr-2"/>Preview</button>
                    <button onClick={(e) => { e.stopPropagation(); handleOpenEditModal(word); }} className="w-full text-left px-2 py-1.5 text-xs rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center"><Edit className="w-3 h-3 mr-2"/>Edit</button>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-tight flex-grow">{word.definition}</p>
            <div className="flex flex-wrap gap-1 mt-auto pt-2">
              {word.tags.slice(0, 3).map(tag => {
                const color = getTagColor(tag);
                return <span key={tag} className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${color.bg} ${color.text}`}>{tag}</span>
              })}
              {word.tags.length > 3 && <span className="text-[9px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">+{word.tags.length - 3}</span>}
            </div>
        </div>
      </div>
    );
  };

  const renderColumn = (status: WordStatus, label: string, colorClass: string) => {
    const columnWords = filteredWords.filter(w => w.status === status);
    const totalPages = Math.ceil(columnWords.length / WORDS_PER_PAGE);
    const page = currentPage[status];
    const paginatedWords = columnWords.slice((page - 1) * WORDS_PER_PAGE, page * WORDS_PER_PAGE);

    const handlePageChange = (newPage: number) => {
      if (newPage < 1 || newPage > totalPages) return;
      setCurrentPage(prev => ({ ...prev, [status]: newPage }));
    };

    return (
      <div className="flex flex-col space-y-4">
        <h3 className="font-bold flex items-center text-sm uppercase tracking-wider text-slate-500">
          <span className={`w-2 h-2 rounded-full mr-2 ${colorClass}`}></span>{label} ({columnWords.length})
        </h3>
        <div className="space-y-3">{paginatedWords.map(renderWordCard)}</div>
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 text-sm pt-4">
            <button disabled={page === 1} onClick={() => handlePageChange(page - 1)} className="px-3 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg disabled:opacity-40">Prev</button>
            <span className="font-bold text-slate-500">Page {page} of {totalPages}</span>
            <button disabled={page === totalPages} onClick={() => handlePageChange(page + 1)} className="px-3 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg disabled:opacity-40">Next</button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Word Library</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Local Knowledge Base</p>
        </div>
        <div className="flex items-center gap-2">
          {isSelectMode && (
            <button
              onClick={handleToggleSelectAllFiltered}
              disabled={filteredWords.length === 0}
              className="px-3 py-2 rounded-xl border bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800 text-xs font-bold whitespace-nowrap disabled:opacity-50 animate-in fade-in"
            >
              {allFilteredAreSelected ? `Deselect All (${filteredWords.length})` : `Select All (${filteredWords.length})`}
            </button>
          )}
          {showSearchInput && (
            <div className="relative animate-in slide-in-from-right-2">
              <input 
                autoFocus
                type="text" 
                placeholder="Search words..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-10 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 w-48 md:w-64"
              />
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-3 top-2.5 text-slate-400"><XCircle className="w-4 h-4" /></button>}
            </div>
          )}
          <button 
            onClick={() => setShowSearchInput(!showSearchInput)}
            className={`p-2 rounded-xl border transition-all ${showSearchInput ? 'bg-indigo-100 text-indigo-600 border-indigo-200 dark:border-indigo-800' : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800'}`}
          >
            <Search className="w-5 h-5" />
          </button>
          <button 
            onClick={() => {
              setIsSelectMode(!isSelectMode);
              setSelectedWords([]);
            }}
            className={`p-2 rounded-xl border transition-all ${isSelectMode ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800'}`}
            title={isSelectMode ? "Cancel Selection" : "Select Multiple"}
          >
            {isSelectMode ? <X className="w-5 h-5" /> : <CheckSquare className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-4 px-4 custom-scrollbar">
        <button onClick={() => { setSelectedTag(null); setFilterFavorites(false); }} className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap ${!selectedTag && !filterFavorites ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500'}`}>All</button>
        <button onClick={() => { setFilterFavorites(true); setSelectedTag(null); }} className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap flex items-center gap-1.5 ${filterFavorites ? 'bg-rose-500 text-white' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500'}`}><Heart className={`w-3 h-3 ${filterFavorites ? 'fill-white' : ''}`} /> Favorites</button>
        {allTags.map(tag => (
          <button key={tag} onClick={() => { setSelectedTag(tag); setFilterFavorites(false); }} className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap ${selectedTag === tag ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500'}`}>{tag}</button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {renderColumn(WordStatus.NEW, 'New', 'bg-blue-500')}
        {renderColumn(WordStatus.LEARNING, 'Learning', 'bg-orange-500')}
        {renderColumn(WordStatus.MASTERED, 'Mastered', 'bg-emerald-500')}
      </div>
      
      {isEditModalOpen && editingWord && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-xl max-w-lg w-full animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h3 className="font-bold text-lg">Edit Word</h3>
                    <button onClick={() => setIsEditModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar -mr-3 pr-3 space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500">Word</label>
                        <input type="text" value={tempWordData.term} onChange={(e) => setTempWordData({...tempWordData, term: e.target.value})} className="w-full mt-1 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg"/>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500">Definition</label>
                        <textarea value={tempWordData.definition} onChange={(e) => setTempWordData({...tempWordData, definition: e.target.value})} className="w-full mt-1 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg min-h-[80px]"/>
                    </div>
                     <div>
                        <label className="text-xs font-bold text-slate-500">IPA Transcription</label>
                        <input type="text" value={tempWordData.ipa} onChange={(e) => setTempWordData({...tempWordData, ipa: e.target.value})} className="w-full mt-1 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg font-mono"/>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500">Example</label>
                        <textarea value={tempWordData.example} onChange={(e) => setTempWordData({...tempWordData, example: e.target.value})} className="w-full mt-1 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg"/>
                    </div>
                     <div>
                        <label className="text-xs font-bold text-slate-500">Tags (comma-separated)</label>
                        <input type="text" value={tempWordData.tags} onChange={(e) => setTempWordData({...tempWordData, tags: e.target.value})} className="w-full mt-1 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg"/>
                    </div>
                     <div>
                        <label className="text-xs font-bold text-slate-500">Image URL</label>
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                value={tempWordData.imageUrl} 
                                onChange={(e) => setTempWordData({...tempWordData, imageUrl: e.target.value})} 
                                placeholder="Paste URL or upload"
                                className="w-full mt-1 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg flex-1"
                            />
                            <label className="p-3 mt-1 bg-slate-100 dark:bg-slate-800 border dark:border-slate-700 rounded-lg cursor-pointer flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700">
                                <Upload className="w-4 h-4 text-slate-500" />
                                <input ref={editFileInputRef} type="file" accept="image/*" onChange={handleEditImageUpload} className="hidden" />
                            </label>
                        </div>
                         {tempWordData.imageUrl && (
                            <div className="relative mt-2 w-full h-32 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center overflow-hidden border dark:border-slate-700">
                                <img src={tempWordData.imageUrl} alt="Preview" className="object-contain max-h-full w-full" />
                                <button 
                                    type="button" 
                                    onClick={() => setTempWordData(prev => ({ ...prev, imageUrl: '' }))} 
                                    className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full hover:bg-black/70"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-4">
                         <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer">
                            <input type="checkbox" checked={tempWordData.isFavorite} onChange={(e) => setTempWordData({...tempWordData, isFavorite: e.target.checked})} className="w-5 h-5 rounded text-rose-500 focus:ring-rose-500" />
                            Mark as Favorite
                        </label>
                    </div>
                </div>
                <div className="flex gap-4 mt-4 flex-shrink-0">
                    <button onClick={() => setIsEditModalOpen(false)} className="flex-1 py-3 bg-slate-200 dark:bg-slate-700 rounded-lg font-bold text-sm">Cancel</button>
                    <button onClick={handleSaveWord} className="flex-1 py-3 bg-indigo-600 text-white rounded-lg font-bold text-sm flex items-center justify-center"><Save className="w-4 h-4 mr-2"/>Save</button>
                </div>
            </div>
        </div>
      )}

      {selectedWords.length > 0 && (
        <div className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white p-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-in slide-in-from-bottom-4 duration-300 border border-slate-700">
          <span className="font-bold text-sm px-2">{selectedWords.length} selected</span>
          <button onClick={() => setIsTagModalOpen(true)} className="px-4 py-2 bg-indigo-600 rounded-lg text-sm font-bold flex items-center gap-2"><Tag className="w-4 h-4" />Tag</button>
          <button onClick={() => setIsCollectionModalOpen(true)} className="px-4 py-2 bg-slate-600 rounded-lg text-sm font-bold flex items-center gap-2"><FolderPlus className="w-4 h-4" />Add to Collection</button>
        </div>
      )}
      
      {isTagModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-xl max-w-sm w-full animate-in zoom-in-95 duration-200">
                <h3 className="font-bold text-lg mb-2">Apply Tags</h3>
                <p className="text-xs text-slate-500 mb-4">Add tags to the {selectedWords.length} selected words. Separate with commas.</p>
                <input type="text" autoFocus value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder="e.g. priority, chapter-1" className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm" onKeyDown={(e) => e.key === 'Enter' && handleApplyTags()} />
                <div className="flex gap-4 mt-6">
                    <button onClick={() => setIsTagModalOpen(false)} className="flex-1 py-3 bg-slate-200 dark:bg-slate-700 rounded-lg font-bold text-sm">Cancel</button>
                    <button onClick={handleApplyTags} className="flex-1 py-3 bg-indigo-600 text-white rounded-lg font-bold text-sm">Apply Tags</button>
                </div>
            </div>
        </div>
      )}
      
      {isCollectionModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-xl max-w-sm w-full animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg">Add to Collection</h3>
                    <button onClick={() => setIsCollectionModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                    {collections.map(c => (
                        <button key={c.id} onClick={() => handleAddToCollection(c.id)} className="w-full flex items-center gap-4 p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left">
                            <span className="text-2xl">{c.icon}</span>
                            <div>
                                <p className="font-bold">{c.name}</p>
                                <p className="text-xs text-slate-400">{c.wordIds.length} words</p>
                            </div>
                        </button>
                    ))}
                    {collections.length === 0 && <p className="text-center text-sm text-slate-400 py-4">No collections yet.</p>}
                </div>
                <button 
                  onClick={() => { setIsCollectionModalOpen(false); setIsCreateCollectionModalOpen(true); }}
                  className="w-full flex items-center justify-center gap-2 p-3 mt-4 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors text-left font-bold text-sm"
                >
                  <PlusCircle className="w-5 h-5" />
                  Create New Collection
                </button>
            </div>
        </div>
      )}

      {isCreateCollectionModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-xl max-w-sm w-full animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <h3 className="font-bold text-lg mb-4 flex-shrink-0">New Collection</h3>
            <div className="flex-1 overflow-y-auto custom-scrollbar -mr-3 pr-3">
              <div className="space-y-4">
                <div><label className="text-xs font-bold text-slate-500">Name</label><input type="text" value={newCollectionName} onChange={(e) => setNewCollectionName(e.target.value)} placeholder="e.g., French Verbs" className="w-full mt-1 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg"/></div>
                <div>
                  <label className="text-xs font-bold text-slate-500">Icon (Emoji)</label>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-12 h-12 text-3xl bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center flex-shrink-0">{newCollectionIcon || '...'}</div>
                    <input type="text" value={newCollectionIcon} onChange={(e) => setNewCollectionIcon(e.target.value)} placeholder="Select one below" readOnly className="flex-1 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg cursor-default"/>
                  </div>
                </div>
                <EmojiPicker onEmojiSelect={(emoji) => setNewCollectionIcon(emoji)} />
              </div>
            </div>
            <div className="flex gap-4 mt-6 flex-shrink-0">
              <button onClick={() => { setIsCreateCollectionModalOpen(false); setIsCollectionModalOpen(true); }} className="flex-1 py-3 bg-slate-200 dark:bg-slate-700 rounded-lg font-bold text-sm">Cancel</button>
              <button onClick={handleCreateCollectionSubmit} className="flex-1 py-3 bg-indigo-600 text-white rounded-lg font-bold text-sm">Create</button>
            </div>
          </div>
        </div>
      )}

      {previewWord && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="relative w-full max-w-sm">
                <button onClick={() => setPreviewWord(null)} className="absolute -top-12 right-0 p-2 text-white/50"><X className="w-8 h-8" /></button>
                <div onClick={() => setIsPreviewFlipped(!isPreviewFlipped)} className="card-flip w-full h-[400px] cursor-pointer">
                    <div className={`card-inner h-full ${isPreviewFlipped ? 'is-flipped' : ''}`}>
                        <div className="card-front bg-white dark:bg-slate-900 rounded-[2rem] p-8 flex flex-col items-center justify-between shadow-2xl border border-slate-200 dark:border-slate-800">
                           <div></div>
                           <div className="text-center">
                               {previewWord.imageUrl && (
                                <div className="w-full max-w-[200px] aspect-video mx-auto mb-4 rounded-lg overflow-hidden shadow-md bg-slate-100 dark:bg-slate-800">
                                    <img src={previewWord.imageUrl} alt={previewWord.term} className="w-full h-full object-cover" />
                                </div>
                               )}
                                <h2 className={`font-bold text-indigo-600 dark:text-indigo-400 text-center ${previewWord.imageUrl ? 'text-3xl' : 'text-4xl'}`}>{previewWord.term}</h2>
                                {previewWord.ipa && (
                                <p className="text-lg text-slate-500 dark:text-slate-400 font-mono mt-2">/{previewWord.ipa}/</p>
                                )}
                           </div>
                           <p className="text-slate-400 text-xs animate-pulse">Tap to reveal</p>
                        </div>
                        <div className="card-back bg-white dark:bg-slate-900 rounded-[2rem] p-6 flex flex-col shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
                           <div className="w-full h-full flex flex-col overflow-y-auto custom-scrollbar -mr-2 pr-2">
                                <div className="w-full mb-4 flex-shrink-0 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center overflow-hidden">
                                  {previewWord.imageUrl ? (
                                    <img src={previewWord.imageUrl} alt={previewWord.term} className="w-full h-auto max-h-[500px] object-contain" />
                                  ) : (
                                    <div className="w-full h-48 flex items-center justify-center">
                                      <ImageIcon className="w-12 h-12 text-slate-400" />
                                    </div>
                                  )}
                                </div>
                                <p className="text-lg font-bold text-center mb-4">{previewWord.definition}</p>
                                {previewWord.example && (
                                    <div className="w-full border-t border-slate-100 dark:border-slate-800 my-3 pt-3">
                                        <p className="text-sm text-slate-500 dark:text-slate-400 italic">"{previewWord.example}"</p>
                                    </div>
                                )}
                                <div className="flex flex-wrap gap-2 justify-center mt-auto pt-4 flex-shrink-0">
                                    {previewWord.tags.map(tag => {
                                      const color = getTagColor(tag);
                                      return <span key={tag} className={`text-[10px] px-2.5 py-1 rounded-full font-bold ${color.bg} ${color.text}`}>{tag}</span>
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default LibraryView;
