
import React, { useState, useMemo, useEffect } from 'react';
import { Collection, Word, WordStatus } from '../types';
import { ArrowLeft, Edit, Trash2, X, Tag, FolderMinus, FolderPlus, CheckSquare, Volume2, Eye, MoreVertical, PlusCircle, ImageIcon, Play, BookOpen, Star, Plus } from 'lucide-react';
import EmojiPicker from '../components/EmojiPicker';

interface CollectionViewProps {
  collection: Collection;
  allWords: Word[];
  collections: Collection[];
  onBack: () => void;
  onWordsUpdate: (updatedWords: Word[]) => void;
  onRemoveWordsFromCollection: (collectionId: string, wordIds: string[]) => void;
  onAddWordsToCollection: (collectionId: string, wordIds: string[]) => void;
  onDeleteCollection: (collectionId: string) => void;
  onUpdateCollection: (collectionId: string, name: string, icon: string) => void;
  onStartFlashcards: (collectionId: string) => void;
  onAddNewWord: (wordData: Omit<Word, 'id' | 'createdAt' | 'status' | 'nextReviewAt'>, collectionId: string) => boolean;
  selectedVoiceName: string | null;
}

const statusColors: { [key in WordStatus]: string } = {
  [WordStatus.NEW]: 'bg-blue-500',
  [WordStatus.LEARNING]: 'bg-orange-500',
  [WordStatus.MASTERED]: 'bg-emerald-500',
};

const WordRow: React.FC<{
  word: Word;
  isSelected: boolean;
  isSelectMode: boolean;
  onToggleSelection: (wordId: string) => void;
  onPreview: (word: Word) => void;
  onEdit: (word: Word) => void;
}> = ({ word, isSelected, isSelectMode, onToggleSelection, onPreview, onEdit }) => {
  return (
    <div 
      onClick={() => isSelectMode && onToggleSelection(word.id)}
      className={`flex items-center p-4 group ${isSelectMode ? 'cursor-pointer' : ''} ${isSelected ? 'bg-indigo-50 dark:bg-indigo-500/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
    >
      {isSelectMode && (
         <input type="checkbox" checked={isSelected} readOnly className="w-5 h-5 rounded-md text-indigo-600 bg-slate-100 border-slate-300 focus:ring-indigo-500 mr-4" />
      )}
      <div className={`w-2 h-2 rounded-full mr-4 flex-shrink-0 ${statusColors[word.status]}`} title={word.status} />
      <div className="flex-1 min-w-0">
        <p className="font-bold truncate text-slate-800 dark:text-slate-200">{word.term}</p>
        <p className="text-xs text-slate-500 truncate">{word.definition}</p>
      </div>
      <div className={`flex items-center gap-2 ml-4 transition-opacity ${isSelectMode ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'}`}>
        <button onClick={(e) => { e.stopPropagation(); onPreview(word); }} className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg"><Eye className="w-4 h-4" /></button>
        <button onClick={(e) => { e.stopPropagation(); onEdit(word); }} className="p-2 text-slate-400 hover:text-emerald-600 rounded-lg"><Edit className="w-4 h-4" /></button>
      </div>
    </div>
  );
};

const CollectionView: React.FC<CollectionViewProps> = (props) => {
  const { collection, allWords, collections, onBack, onWordsUpdate, onRemoveWordsFromCollection, onAddWordsToCollection, onDeleteCollection, onUpdateCollection, onStartFlashcards, onAddNewWord, selectedVoiceName } = props;

  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [isAddChoiceModalOpen, setIsAddChoiceModalOpen] = useState(false);
  const [isAddWordModalOpen, setIsAddWordModalOpen] = useState(false);
  const [isAddExistingModalOpen, setIsAddExistingModalOpen] = useState(false);
  const [tempName, setTempName] = useState(collection.name);
  const [tempIcon, setTempIcon] = useState(collection.icon);
  const [tagInput, setTagInput] = useState('');
  const [newTerm, setNewTerm] = useState('');
  const [newDefinition, setNewDefinition] = useState('');
  const [newIpa, setNewIpa] = useState('');
  const [selectedWordsToAdd, setSelectedWordsToAdd] = useState<string[]>([]);
  const [addExistingSearch, setAddExistingSearch] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [previewWord, setPreviewWord] = useState<Word | null>(null);
  const [isPreviewFlipped, setIsPreviewFlipped] = useState(false);
  const [activeVoice, setActiveVoice] = useState<SpeechSynthesisVoice | null>(null);

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

  const collectionWords = useMemo(() => {
    const wordMap = new Map(allWords.map(word => [word.id, word]));
    return collection.wordIds.map(id => wordMap.get(id)).filter((w): w is Word => w !== undefined)
      .sort((a, b) => a.term.localeCompare(b.term));
  }, [collection, allWords]);
  
  const learningCount = useMemo(() => collectionWords.filter(w => w.status === WordStatus.NEW || w.status === WordStatus.LEARNING).length, [collectionWords]);
  const masteredCount = useMemo(() => collectionWords.filter(w => w.status === WordStatus.MASTERED).length, [collectionWords]);
  const totalCount = collectionWords.length;
  const masteredPercent = totalCount > 0 ? (masteredCount / totalCount) * 100 : 0;
  
  const WORDS_PER_PAGE = 10;
  const totalPages = Math.ceil(collectionWords.length / WORDS_PER_PAGE);
  const paginatedWords = collectionWords.slice((currentPage - 1) * WORDS_PER_PAGE, currentPage * WORDS_PER_PAGE);

  const availableWords = useMemo(() => {
    const currentWordIds = new Set(collection.wordIds);
    return allWords
      .filter(word => !currentWordIds.has(word.id))
      .filter(word => 
        word.term.toLowerCase().includes(addExistingSearch.toLowerCase()) || 
        word.definition.toLowerCase().includes(addExistingSearch.toLowerCase())
      )
      .sort((a,b) => a.term.localeCompare(b.term));
  }, [allWords, collection.wordIds, addExistingSearch]);
  
  const handleUpdate = () => {
    if (tempName.trim() && tempIcon.trim()) {
      onUpdateCollection(collection.id, tempName.trim(), tempIcon.trim());
      setIsEditModalOpen(false);
    }
  };
  
  const handleAddNewWordSubmit = () => {
    if (!newTerm.trim() || !newDefinition.trim()) return;
    const success = onAddNewWord({
      term: newTerm,
      definition: newDefinition,
      example: '',
      ipa: newIpa,
      tags: [collection.name],
    }, collection.id);

    if (success) {
      setNewTerm('');
      setNewDefinition('');
      setNewIpa('');
      setIsAddWordModalOpen(false);
    } else {
      alert(`The word "${newTerm}" already exists in your library.`);
    }
  };

  const handleToggleSelection = (wordId: string) => {
    setSelectedWords(prev => prev.includes(wordId) ? prev.filter(id => id !== wordId) : [...prev, wordId]);
  };
  
  const handleApplyTags = () => {
    const newTags = tagInput.split(',').map(t => t.trim()).filter(Boolean);
    if (newTags.length === 0 || selectedWords.length === 0) return;

    const updatedWords = allWords.map(w => {
      if (selectedWords.includes(w.id)) {
        return {...w, tags: Array.from(new Set([...w.tags, ...newTags]))};
      }
      return w;
    });
    onWordsUpdate(updatedWords);
    
    setIsTagModalOpen(false);
    setTagInput('');
    setSelectedWords([]);
    setIsSelectMode(false);
  };

  const handleRemoveSelectedWords = () => {
    if (selectedWords.length === 0) return;
    onRemoveWordsFromCollection(collection.id, selectedWords);
    setSelectedWords([]);
    setIsSelectMode(false);
  };
  
  const handleMoveToCollection = (targetCollectionId: string) => {
    if (selectedWords.length === 0) return;
    onAddWordsToCollection(targetCollectionId, selectedWords);
    onRemoveWordsFromCollection(collection.id, selectedWords);
    setIsMoveModalOpen(false);
    setSelectedWords([]);
    setIsSelectMode(false);
  };

  const handleToggleWordToAdd = (wordId: string) => {
    setSelectedWordsToAdd(prev => 
      prev.includes(wordId) 
        ? prev.filter(id => id !== wordId)
        : [...prev, wordId]
    );
  };
  
  const handleAddSelectedFromLibrary = () => {
    if (selectedWordsToAdd.length === 0) return;
    onAddWordsToCollection(collection.id, selectedWordsToAdd);
    setIsAddExistingModalOpen(false);
    setSelectedWordsToAdd([]);
    setAddExistingSearch('');
  };

  return (
    <div className="animate-in fade-in duration-500 pb-20">
      <header className="flex items-start justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-3 text-slate-500 hover:text-indigo-600 dark:hover:text-white transition-colors rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-4">
            <span className="text-4xl">{collection.icon}</span>
            <div>
              <h2 className="text-3xl font-bold">{collection.name}</h2>
              <p className="text-slate-500">{collectionWords.length} words in this collection</p>
            </div>
          </div>
        </div>
        <div className="relative">
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-3 rounded-xl border bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800">
            <MoreVertical className="w-5 h-5"/>
          </button>
          {isMenuOpen && (
            <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg p-2 z-20">
              <button onClick={() => { setIsEditModalOpen(true); setIsMenuOpen(false); }} className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center"><Edit className="w-4 h-4 mr-2"/>Edit Collection</button>
              <button onClick={() => { setIsSelectMode(!isSelectMode); setSelectedWords([]); setIsMenuOpen(false); }} className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center"><CheckSquare className="w-4 h-4 mr-2"/>{isSelectMode ? "Cancel Select" : "Select Words"}</button>
              <div className="h-px bg-slate-200 dark:bg-slate-800 my-1"></div>
              <button onClick={() => { setIsDeleteModalOpen(true); setIsMenuOpen(false); }} className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center"><Trash2 className="w-4 h-4 mr-2"/>Delete Collection</button>
            </div>
          )}
        </div>
      </header>

      <section className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm mb-8">
        <div className="grid grid-cols-3 divide-x divide-slate-200 dark:divide-slate-800 text-center mb-4">
          <div><p className="text-2xl font-bold">{totalCount}</p><p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total</p></div>
          <div><p className="text-2xl font-bold">{learningCount}</p><p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Learning</p></div>
          <div><p className="text-2xl font-bold">{masteredCount}</p><p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Mastered</p></div>
        </div>
        <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500" style={{ width: `${masteredPercent}%`}}></div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <button onClick={() => onStartFlashcards(collection.id)} disabled={totalCount === 0} className="flex items-center justify-center gap-3 p-6 bg-emerald-500 text-white font-bold rounded-2xl hover:bg-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
          <Play className="w-6 h-6"/><span>Study Flashcards</span>
        </button>
        <button onClick={() => setIsAddChoiceModalOpen(true)} className="flex items-center justify-center gap-3 p-6 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all">
          <Plus className="w-6 h-6"/><span>Add Words</span>
        </button>
      </section>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        {paginatedWords.length > 0 ? (
          <>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedWords.map(word => 
                <WordRow 
                  key={word.id} 
                  word={word} 
                  isSelected={selectedWords.includes(word.id)}
                  isSelectMode={isSelectMode}
                  onToggleSelection={handleToggleSelection}
                  onPreview={(word) => { setPreviewWord(word); setIsPreviewFlipped(false); }}
                  onEdit={(word) => { /* Add logic to open edit modal */ }}
                />
              )}
            </div>
            {totalPages > 1 && (
              <div className="p-4 flex items-center justify-center gap-2 text-sm border-t border-slate-100 dark:border-slate-800">
                <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-3 py-1 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-lg disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800">Prev</button>
                <span className="font-bold text-slate-500">Page {currentPage} of {totalPages}</span>
                <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="px-3 py-1 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-lg disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800">Next</button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20">
            <p className="text-slate-500 font-bold">This collection is empty.</p>
            <p className="text-sm text-slate-400 mt-2">Use the "Add Words" button to get started.</p>
          </div>
        )}
      </div>

      {selectedWords.length > 0 && (
        <div className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white p-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-in slide-in-from-bottom-4 duration-300 border border-slate-700">
          <span className="font-bold text-sm px-2">{selectedWords.length} selected</span>
          <button onClick={() => setIsTagModalOpen(true)} className="px-4 py-2 bg-indigo-600 rounded-lg text-sm font-bold flex items-center gap-2"><Tag className="w-4 h-4" />Tag</button>
          <button onClick={handleRemoveSelectedWords} className="px-4 py-2 bg-rose-600 rounded-lg text-sm font-bold flex items-center gap-2"><FolderMinus className="w-4 h-4" />Remove</button>
          <button onClick={() => setIsMoveModalOpen(true)} className="px-4 py-2 bg-slate-600 rounded-lg text-sm font-bold flex items-center gap-2"><FolderPlus className="w-4 h-4" />Move</button>
        </div>
      )}

      {isAddChoiceModalOpen && ( <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"> <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-xl max-w-sm w-full animate-in zoom-in-95 duration-200"> <div className="flex justify-between items-center mb-6"> <h3 className="font-bold text-lg">Add Words</h3> <button onClick={() => setIsAddChoiceModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button> </div> <div className="space-y-4"> <button onClick={() => { setIsAddChoiceModalOpen(false); setIsAddWordModalOpen(true); }} className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left border border-slate-200 dark:border-slate-800"> <PlusCircle className="w-8 h-8 text-indigo-500" /> <div><p className="font-bold">Create New Word</p><p className="text-xs text-slate-400">Add a single new word to this collection.</p></div> </button> <button onClick={() => { setIsAddChoiceModalOpen(false); setIsAddExistingModalOpen(true); }} className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left border border-slate-200 dark:border-slate-800"> <BookOpen className="w-8 h-8 text-emerald-500" /> <div><p className="font-bold">Add from Library</p><p className="text-xs text-slate-400">Select existing words from your main library.</p></div> </button> </div> </div> </div> )}
      {isEditModalOpen && ( <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"> <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-xl max-w-sm w-full animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"> <h3 className="font-bold text-lg mb-4 flex-shrink-0">Edit Collection</h3> <div className="flex-1 overflow-y-auto custom-scrollbar -mr-3 pr-3"> <div className="space-y-4"> <div><label className="text-xs font-bold text-slate-500">Name</label><input type="text" value={tempName} onChange={(e) => setTempName(e.target.value)} className="w-full mt-1 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg"/></div> <div><label className="text-xs font-bold text-slate-500">Icon (Emoji)</label><div className="flex items-center gap-2 mt-1"><div className="w-12 h-12 text-3xl bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center flex-shrink-0">{tempIcon || '...'}</div><input type="text" value={tempIcon} readOnly className="flex-1 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg"/></div></div> <div className="pt-2"><EmojiPicker onEmojiSelect={(emoji) => setTempIcon(emoji)} /></div> </div> </div> <div className="flex gap-4 mt-6 flex-shrink-0"> <button onClick={() => setIsEditModalOpen(false)} className="flex-1 py-3 bg-slate-200 dark:bg-slate-700 rounded-lg font-bold text-sm">Cancel</button> <button onClick={handleUpdate} className="flex-1 py-3 bg-indigo-600 text-white rounded-lg font-bold text-sm">Save</button> </div> </div> </div>)}
      {isDeleteModalOpen && (<div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"> <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-xl max-w-sm w-full animate-in zoom-in-95 duration-200"> <h3 className="font-bold text-lg mb-2">Delete Collection?</h3> <p className="text-sm text-slate-500 mb-6">Are you sure? This will not delete the words, only the collection itself.</p> <div className="flex gap-4"> <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 py-3 bg-slate-200 dark:bg-slate-700 rounded-lg font-bold text-sm">Cancel</button> <button onClick={() => onDeleteCollection(collection.id)} className="flex-1 py-3 bg-rose-600 text-white rounded-lg font-bold text-sm">Delete</button> </div> </div> </div>)}
      {isAddWordModalOpen && ( <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"> <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-xl max-w-sm w-full animate-in zoom-in-95 duration-200"> <h3 className="font-bold text-lg mb-4">New Word for "{collection.name}"</h3> <div className="space-y-4"> <div><label className="text-xs font-bold text-slate-500">Word</label><input type="text" autoFocus value={newTerm} onChange={(e) => setNewTerm(e.target.value)} className="w-full mt-1 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg"/></div> <div><label className="text-xs font-bold text-slate-500">Definition</label><input type="text" value={newDefinition} onChange={(e) => setNewDefinition(e.target.value)} className="w-full mt-1 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg"/></div><div><label className="text-xs font-bold text-slate-500">IPA (Optional)</label><input type="text" value={newIpa} onChange={(e) => setNewIpa(e.target.value)} className="w-full mt-1 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg font-mono"/></div> </div> <div className="flex gap-4 mt-6"> <button onClick={() => setIsAddWordModalOpen(false)} className="flex-1 py-3 bg-slate-200 dark:bg-slate-700 rounded-lg font-bold text-sm">Cancel</button> <button onClick={handleAddNewWordSubmit} className="flex-1 py-3 bg-indigo-600 text-white rounded-lg font-bold text-sm">Add Word</button> </div> </div> </div>)}
      {isTagModalOpen && ( <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"> <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-xl max-w-sm w-full animate-in zoom-in-95 duration-200"> <h3 className="font-bold text-lg mb-2">Apply Tags</h3> <p className="text-xs text-slate-500 mb-4">Add tags to {selectedWords.length} words. Separate with commas.</p> <input type="text" autoFocus value={tagInput} onChange={(e) => setTagInput(e.target.value)} className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm" onKeyDown={(e) => e.key === 'Enter' && handleApplyTags()} /> <div className="flex gap-4 mt-6"> <button onClick={() => setIsTagModalOpen(false)} className="flex-1 py-3 bg-slate-200 dark:bg-slate-700 rounded-lg font-bold text-sm">Cancel</button> <button onClick={handleApplyTags} className="flex-1 py-3 bg-indigo-600 text-white rounded-lg font-bold text-sm">Apply</button> </div> </div> </div>)}
      {isMoveModalOpen && ( <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"> <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-xl max-w-sm w-full animate-in zoom-in-95 duration-200"> <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-lg">Move to...</h3><button onClick={() => setIsMoveModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button></div> <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">{collections.filter(c => c.id !== collection.id).map(c => (<button key={c.id} onClick={() => handleMoveToCollection(c.id)} className="w-full flex items-center gap-4 p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-left"><span className="text-2xl">{c.icon}</span><div><p className="font-bold">{c.name}</p><p className="text-xs text-slate-400">{c.wordIds.length} words</p></div></button>))}</div> </div> </div>)}
       {isAddExistingModalOpen && (<div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"> <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-xl max-w-lg w-full flex flex-col h-[80vh] animate-in zoom-in-95 duration-200"> <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-lg">Add from Library</h3><button onClick={() => setIsAddExistingModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button></div> <input type="text" value={addExistingSearch} onChange={(e) => setAddExistingSearch(e.target.value)} placeholder="Search your library..." className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg mb-4"/> <div className="flex-1 overflow-y-auto custom-scrollbar -mr-3 pr-3 space-y-2">{availableWords.map(word => (<div key={word.id} onClick={() => handleToggleWordToAdd(word.id)} className={`flex items-center gap-4 p-3 rounded-lg cursor-pointer ${selectedWordsToAdd.includes(word.id) ? 'bg-indigo-50 dark:bg-indigo-500/10' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}><input type="checkbox" checked={selectedWordsToAdd.includes(word.id)} readOnly className="w-5 h-5 rounded text-indigo-600 pointer-events-none"/><div><p className="font-bold">{word.term}</p><p className="text-xs text-slate-500 line-clamp-1">{word.definition}</p></div></div>))}{availableWords.length === 0 && <p className="text-center text-sm text-slate-400 py-8">No other words available.</p>}</div> <div className="flex gap-4 mt-6"><button onClick={() => setIsAddExistingModalOpen(false)} className="flex-1 py-3 bg-slate-200 dark:bg-slate-700 rounded-lg font-bold text-sm">Cancel</button><button onClick={handleAddSelectedFromLibrary} disabled={selectedWordsToAdd.length === 0} className="flex-1 py-3 bg-indigo-600 text-white rounded-lg font-bold text-sm disabled:opacity-50">Add {selectedWordsToAdd.length > 0 ? `(${selectedWordsToAdd.length})` : ''} Words</button></div> </div> </div>)}
      {previewWord && ( <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"> <div className="relative w-full max-w-sm"> <button onClick={() => setPreviewWord(null)} className="absolute -top-12 right-0 p-2 text-white/50"> <X className="w-8 h-8" /> </button> <div onClick={() => setIsPreviewFlipped(!isPreviewFlipped)} className="card-flip w-full h-[400px] cursor-pointer"> <div className={`card-inner h-full ${isPreviewFlipped ? 'is-flipped' : ''}`}>
        <div className="card-front bg-white dark:bg-slate-900 rounded-[2rem] p-8 flex flex-col items-center justify-between shadow-2xl border border-slate-200 dark:border-slate-800">
            <div></div>
            <div className="text-center">
                {previewWord.imageUrl && (
                <div className="w-full max-w-[200px] aspect-video mx-auto mb-4 rounded-lg overflow-hidden shadow-md bg-slate-100 dark:bg-slate-800">
                    <img src={previewWord.imageUrl} alt={previewWord.term} className="w-full h-full object-cover" />
                </div>
                )}
                <h2 className={`font-bold text-indigo-600 dark:text-indigo-400 text-center ${previewWord.imageUrl ? 'text-3xl' : 'text-4xl'}`}>{previewWord.term}</h2>
                {previewWord.ipa && (<p className="text-lg text-slate-500 dark:text-slate-400 font-mono mt-2">/{previewWord.ipa}/</p>)}
            </div>
            <p className="text-slate-400 text-xs animate-pulse">Tap to reveal</p>
        </div>
        <div className="card-back bg-white dark:bg-slate-900 rounded-[2rem] p-6 flex flex-col shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="w-full mb-4 flex-shrink-0 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center overflow-hidden">
                {previewWord.imageUrl ? (
                <img src={previewWord.imageUrl} alt={previewWord.term} className="w-full h-auto max-h-[150px] object-contain" />
                ) : (
                <div className="w-full h-32 flex items-center justify-center">
                    <ImageIcon className="w-12 h-12 text-slate-400" />
                </div>
                )}
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar text-center">
                <div className="pr-2">
                <p className="text-xl font-bold mb-4">{previewWord.definition}</p>
                {previewWord.example && (
                    <div className="w-full border-t border-slate-100 dark:border-slate-800 my-3 pt-3">
                    <p className="text-base text-slate-500 dark:text-slate-400 italic">"{previewWord.example}"</p>
                    </div>
                )}
                </div>
            </div>
            <div className="flex flex-wrap gap-2 justify-center pt-4 flex-shrink-0">
                {previewWord.tags.map(tag => (
                <span key={tag} className="text-[10px] px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold">{tag}</span>
                ))}
            </div>
        </div>
      </div> </div> </div> </div> )}
    </div>
  );
};

export default CollectionView;
