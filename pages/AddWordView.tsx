
import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, Loader2, Save, X, Layers, 
  Volume2, FileText, Trash2, CheckCircle2, 
  Plus, AlertCircle, Table as TableIcon, Image as ImageIcon, Link as LinkIcon, Upload, Tag, Folder, PlusCircle
} from 'lucide-react';
import { getWordDetails } from '../services/geminiService';
import { Word, Collection } from '../types';
import EmojiPicker from '../components/EmojiPicker';

interface AddWordViewProps {
  onAdd: (word: Omit<Word, 'id' | 'createdAt' | 'status' | 'nextReviewAt'>, collectionId?: string) => boolean;
  collections: Collection[];
  onCreateCollection: (name: string, icon: string) => string;
  setActiveTab: (tab: string) => void;
  selectedVoiceName: string | null;
}

interface BulkRow {
  id: string;
  term: string;
  definition: string;
  example: string;
  ipa?: string;
  error?: string;
}

const AddWordView: React.FC<AddWordViewProps> = ({ onAdd, collections, onCreateCollection, setActiveTab, selectedVoiceName }) => {
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [term, setTerm] = useState('');
  const [definition, setDefinition] = useState('');
  const [example, setExample] = useState('');
  const [ipa, setIpa] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState('none');
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState<string>('');
  const [uploadedImageFile, setUploadedImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [bulkInput, setBulkInput] = useState('');
  const [bulkRows, setBulkRows] = useState<BulkRow[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [bulkTags, setBulkTags] = useState('');
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionIcon, setNewCollectionIcon] = useState('');
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


  const playSound = (text: string) => {
    if (!text || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    if (activeVoice) {
        utterance.voice = activeVoice;
    }
    window.speechSynthesis.speak(utterance);
  };

  const handleAiHelp = async () => {
    if (!term) return;
    setIsAiLoading(true);
    const details = await getWordDetails(term);
    if (details) {
      setDefinition(details.definition);
      setExample(details.example);
      setTags(details.tags);
      setTagInput(details.tags.join(', '));
      if (details.ipa) {
        setIpa(details.ipa);
      }
    }
    setIsAiLoading(false);
  };

  const resetForm = () => {
    setTerm('');
    setDefinition('');
    setExample('');
    setIpa('');
    setTags([]);
    setTagInput('');
    setImageUrlInput('');
    setUploadedImageFile(null);
    setImagePreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setBulkInput('');
    setBulkRows([]);
    setShowPreview(false);
    setBulkTags('');
    setSelectedCollection('none');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const img = new Image();
  img.src = URL.createObjectURL(file);

  img.onload = () => {
    const maxSize = 512; // kích thước vuông chuẩn mobile
    const canvas = document.createElement('canvas');
    canvas.width = maxSize;
    canvas.height = maxSize;

    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0, maxSize, maxSize);

    canvas.toBlob((blob) => {
      if (!blob) return;

      // tạo file mới nhẹ hơn
      const optimizedFile = new File([blob], file.name.replace(/\.\w+$/, '.webp'), {
        type: 'image/webp'
      });

      setUploadedImageFile(optimizedFile);

      const previewUrl = URL.createObjectURL(blob);
      setImagePreviewUrl(previewUrl);

      setImageUrlInput('');
    }, 'image/webp', 0.7);
  };
};
useEffect(() => {
 return () => {
  if(imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
 };
}, [imagePreviewUrl]);


  const handleImageUrlInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setImageUrlInput(url);
    setImagePreviewUrl(url);
    setUploadedImageFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const clearImage = () => {
    setImageUrlInput('');
    setUploadedImageFile(null);
    setImagePreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCollectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (e.target.value === 'create_new') {
      setIsCollectionModalOpen(true);
    } else {
      setSelectedCollection(e.target.value);
    }
  };
  
  const handleCreateCollection = () => {
    if (newCollectionName.trim() && newCollectionIcon.trim()) {
      const newId = onCreateCollection(newCollectionName, newCollectionIcon);
      setNewCollectionName('');
      setNewCollectionIcon('');
      setIsCollectionModalOpen(false);
      setSelectedCollection(newId);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!term || !definition) return;
    
    const finalImageUrl = uploadedImageFile ? imagePreviewUrl : imageUrlInput;
    const finalTags = tagInput.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);

    const success = onAdd({ 
      term, 
      definition, 
      example, 
      ipa,
      tags: finalTags,
      imageUrl: finalImageUrl || undefined
    }, selectedCollection);
    
    if (success) {
      resetForm();
      setActiveTab('library');
    } else {
      alert(`The word "${term}" already exists in your library.`);
    }
  };

  const detectAndParse = () => {
    if (!bulkInput.trim()) return;

    const lines = bulkInput.trim().split('\n');
    const parsedRows: BulkRow[] = lines.map(line => {
      let parts: string[] = [];
      if (line.includes('\t')) parts = line.split('\t');
      else if (line.includes(',')) parts = line.split(',');
      else parts = [line];

      return {
        id: Math.random().toString(36).substr(2, 9),
        term: (parts[0] || '').trim(),
        definition: (parts[1] || '').trim(),
        example: (parts[2] || '').trim(),
        ipa: (parts[3] || '').trim(),
      };
    }).filter(row => row.term.length > 0);

    setBulkRows(parsedRows);
    setShowPreview(true);
  };

  const handleBulkImport = () => {
    const parsedBulkTags = bulkTags.split(',').map(t => t.trim()).filter(Boolean);
    let addedCount = 0;
    let skippedCount = 0;
    
    bulkRows.forEach(row => {
      if (row.term && row.definition) {
        const finalTags = Array.from(new Set(['Bulk Import', ...parsedBulkTags]));
        const success = onAdd({ term: row.term, definition: row.definition, example: row.example, ipa: row.ipa, tags: finalTags }, selectedCollection);
        if (success) {
          addedCount++;
        } else {
          skippedCount++;
        }
      }
    });

    alert(`Import complete!\n\nAdded: ${addedCount} words\nSkipped (duplicates): ${skippedCount} words`);
    resetForm();
    setIsBulkMode(false);
    setActiveTab('library');
  };

  const updateBulkRow = (id: string, field: keyof Omit<BulkRow, 'id' | 'error'>, value: string) => {
    setBulkRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const removeBulkRow = (id: string) => {
    setBulkRows(prev => prev.filter(r => r.id !== id));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Forge Your Knowledge</h2>
        <p className="text-slate-500">Add words manually or import a whole collection instantly.</p>
        
        <div className="flex items-center justify-center gap-2 mt-4">
          <button onClick={() => setIsBulkMode(false)} className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${!isBulkMode ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>Single Entry</button>
          <button onClick={() => setIsBulkMode(true)} className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${isBulkMode ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>Bulk Import</button>
        </div>
      </div>

      {!isBulkMode ? (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 max-w-2xl mx-auto">
           <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Word or Phrase</label>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">

<input
  required
  autoFocus
  type="text"
  value={term}
  onChange={(e) => setTerm(e.target.value)}
  className="
    flex-1
    px-3 py-2 sm:px-4 sm:py-3
    text-base sm:text-lg
    bg-slate-100 dark:bg-slate-800
    border border-slate-200 dark:border-slate-700
    rounded-xl
    focus:ring-2 focus:ring-indigo-500
    transition-all
    font-medium
  "
  placeholder="e.g. Ephemeral"
/>
<button
  type="button"
  onClick={() => playSound(term)}
  disabled={!term}
  className="
    p-2 sm:p-3
    bg-slate-100 dark:bg-slate-800
    text-slate-400 hover:text-indigo-600
    rounded-xl
    border border-slate-200 dark:border-slate-700
    disabled:opacity-30
  "
>
  <Volume2 className="w-5 h-5 sm:w-6 sm:h-6" />
</button>
<button
  type="button"
  onClick={handleAiHelp}
  disabled={!term || isAiLoading}
  className="
    flex items-center justify-center
    px-3 py-2 sm:px-4 sm:py-3
    text-sm sm:text-base
    bg-indigo-50 dark:bg-indigo-500/10
    text-indigo-600 dark:text-indigo-400
    rounded-xl
    hover:bg-indigo-100 dark:hover:bg-indigo-500/20
    disabled:opacity-50
    font-semibold
  "
>
  {isAiLoading
    ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
    : <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
  }
</button>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Definition</label>
            <textarea required value={definition} onChange={(e) => setDefinition(e.target.value)} className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all min-h-[100px]" placeholder="What does it mean?" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">IPA Transcription (Optional)</label>
            <input type="text" value={ipa} onChange={(e) => setIpa(e.target.value)} className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all font-mono" placeholder="e.g. /ɪɡˈzæmpəl/" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Example Sentence</label>
            <textarea value={example} onChange={(e) => setExample(e.target.value)} className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all italic text-slate-600 dark:text-slate-400" placeholder="How is it used in context?"/>
          </div>
          
           <div className="space-y-2">
             <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2"><Folder className="w-4 h-4" /> Add to Collection (Optional)</label>
             <select value={selectedCollection} onChange={handleCollectionChange} className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all text-sm">
               <option value="none">None</option>
               {collections.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
               <option value="create_new" className="font-bold text-indigo-600">-- Create New Collection --</option>
             </select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2"><Tag className="w-4 h-4" /> Tags (Optional)</label>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="e.g. science, priority, chapter-1"
              className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
            />
            <p className="text-xs text-slate-400">Separate multiple tags with a comma.</p>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2"><ImageIcon className="w-4 h-4" /> Flashcard Image (Optional)</label>
           <div className="flex gap-2 mb-2">
  <input
    type="text"
    value={imageUrlInput}
    onChange={handleImageUrlInputChange}
    placeholder="Image URL"
    className="
      flex-1 px-3 py-2
      text-sm
      bg-slate-100 dark:bg-slate-800
      border border-slate-200 dark:border-slate-700
      rounded-lg
      focus:ring-2 focus:ring-indigo-500
      transition-all
    "
  />

  <label
    className="
      px-3 py-2
      bg-slate-100 dark:bg-slate-800
      border border-slate-200 dark:border-slate-700
      rounded-lg
      text-slate-500 hover:text-indigo-600
      cursor-pointer
      flex items-center justify-center
      shrink-0
    "
    title="Upload"
  >
    <Upload className="w-5 h-5" />
    <input
      ref={fileInputRef}
      type="file"
      accept="image/*"
      onChange={handleImageUpload}
      className="hidden"
    />
  </label>
</div>

            {(imagePreviewUrl || uploadedImageFile) && (
              <div className="relative w-full h-40 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-700">
                <img src={imagePreviewUrl || (uploadedImageFile ? URL.createObjectURL(uploadedImageFile) : '')} alt="Preview" className="object-contain max-h-full w-full" />
                <button type="button" onClick={clearImage} className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors" title="Remove image"><X className="w-4 h-4" /></button>
              </div>
            )}
          </div>
          <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all flex items-center justify-center shadow-lg shadow-indigo-500/20"><Save className="w-5 h-5 mr-2" /> Save Word</button>
        </form>
      ) : (
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          {!showPreview ? (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex items-center gap-4 p-4 bg-indigo-50 dark:bg-indigo-500/5 rounded-2xl border border-indigo-100 dark:border-indigo-500/10"><FileText className="w-8 h-8 text-indigo-500" /><div><h4 className="font-bold text-sm">Smart Delimiter Detection</h4><p className="text-xs text-slate-500 dark:text-slate-400">Paste columns from Excel/Sheets or a comma-separated list. We'll handle the parsing.</p></div></div>
              <textarea value={bulkInput} onChange={(e) => setBulkInput(e.target.value)} className="w-full h-80 px-6 py-4 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all font-mono text-sm leading-relaxed placeholder:italic" placeholder={`Paste your data here...\n\napple [TAB] a fruit [TAB] I eat apples [TAB] /ˈæp.əl/\nbanana [COMMA] yellow fruit [COMMA] sweet taste [COMMA] /bəˈnɑː.nə/`} />
              <div className="flex gap-4"><button onClick={detectAndParse} disabled={!bulkInput.trim()} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center disabled:opacity-50"><Layers className="w-5 h-5 mr-2" /> Analyze & Preview</button></div>
            </div>
          ) : (
            <div className="animate-in fade-in duration-300 space-y-6">
              <div className="flex items-center justify-between"><div className="flex items-center gap-2"><TableIcon className="w-5 h-5 text-indigo-500" /><h3 className="font-bold text-lg">Review Import ({bulkRows.length} words)</h3></div><button onClick={() => setShowPreview(false)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"><X className="w-5 h-5" /></button></div>
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl"><table className="w-full text-sm text-left"><thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase text-[10px] font-bold tracking-widest"><tr><th className="px-6 py-4 w-1/4">Word</th><th className="px-6 py-4 w-1/3">Meaning</th><th className="px-6 py-4">Example</th><th className="px-6 py-4">IPA</th><th className="px-4 py-4 w-12"></th></tr></thead><tbody className="divide-y divide-slate-200 dark:divide-slate-800">{bulkRows.map((row) => (<tr key={row.id} className="group hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"><td className="px-4 py-2"><input type="text" value={row.term} onChange={(e) => updateBulkRow(row.id, 'term', e.target.value)} className={`w-full bg-transparent border-none focus:ring-1 focus:ring-indigo-500 rounded px-2 py-1 font-bold ${!row.term ? 'bg-rose-500/10' : ''}`} /></td><td className="px-4 py-2"><input type="text" value={row.definition} onChange={(e) => updateBulkRow(row.id, 'definition', e.target.value)} className={`w-full bg-transparent border-none focus:ring-1 focus:ring-indigo-500 rounded px-2 py-1 ${!row.definition ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : ''}`} placeholder="Add definition..." /></td><td className="px-4 py-2"><input type="text" value={row.example} onChange={(e) => updateBulkRow(row.id, 'example', e.target.value)} className="w-full bg-transparent border-none focus:ring-1 focus:ring-indigo-500 rounded px-2 py-1 italic text-slate-500" placeholder="Add example..." /></td><td className="px-4 py-2"><input type="text" value={row.ipa} onChange={(e) => updateBulkRow(row.id, 'ipa', e.target.value)} className="w-full bg-transparent border-none focus:ring-1 focus:ring-indigo-500 rounded px-2 py-1 font-mono text-slate-500" placeholder="Add IPA..." /></td><td className="px-4 py-2"><button onClick={() => removeBulkRow(row.id)} className="p-2 text-slate-400 hover:text-rose-500 transition-colors"><Trash2 className="w-4 h-4" /></button></td></tr>))}</tbody></table></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                 <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2"><Folder className="w-4 h-4" /> Add to Collection</label>
                    <select value={selectedCollection} onChange={handleCollectionChange} className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all text-sm">
                        <option value="none">None</option>
                        {collections.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                        <option value="create_new" className="font-bold text-indigo-600">-- Create New Collection --</option>
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2"><Tag className="w-4 h-4" /> Common Tags (optional)</label>
                    <input type="text" value={bulkTags} onChange={(e) => setBulkTags(e.target.value)} placeholder="e.g. biology, chapter-5" className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all text-sm" />
                </div>
              </div>
              {bulkRows.some(r => !r.definition) && (<div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-500/10 rounded-xl border border-amber-100 dark:border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-medium"><AlertCircle className="w-4 h-4" /> Some words are missing definitions. They can still be imported, but won't be as effective for study.</div>)}
              <div className="flex gap-4"><button onClick={() => setShowPreview(false)} className="px-8 py-4 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-bold hover:bg-slate-300 dark:hover:bg-slate-700 transition-all">Back to Editor</button><button onClick={handleBulkImport} className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all flex items-center justify-center shadow-lg shadow-emerald-500/20"><CheckCircle2 className="w-5 h-5 mr-2" /> Import All Words</button></div>
            </div>
          )}
        </div>
      )}
      {isCollectionModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
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
              <button onClick={() => setIsCollectionModalOpen(false)} className="flex-1 py-3 bg-slate-200 dark:bg-slate-700 rounded-lg font-bold text-sm">Cancel</button>
              <button onClick={handleCreateCollection} className="flex-1 py-3 bg-indigo-600 text-white rounded-lg font-bold text-sm">Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddWordView;