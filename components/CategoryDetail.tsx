
import React, { useState, useRef, useEffect } from 'react';
import { VideoCategory, VideoEntry } from '../types';
import { analyzeVideoEntry, getRecommendedVideo } from '../services/geminiService';
import { v4 as uuidv4 } from 'uuid';
import { storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface CategoryDetailProps {
  category: VideoCategory;
  videos: VideoEntry[];
  onBack: () => void;
  onAddVideo: (video: VideoEntry) => void;
  onDelete: () => void;
  onVideoPlay?: (videoId: string) => void;
  isAdmin?: boolean;
  currentUserName: string;
}

const CategoryDetail: React.FC<CategoryDetailProps> = ({ 
  category, 
  videos, 
  onBack, 
  onAddVideo, 
  onDelete, 
  onVideoPlay, 
  isAdmin,
  currentUserName 
}) => {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<'video' | 'pdf'>('video');
  const [recommendation, setRecommendation] = useState<{ recommendedId: string, reason: string } | null>(null);
  const [loadingRec, setLoadingRec] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (videos.length > 0 && !isAdmin) {
      const watchedIds = videos.filter(v => v.viewLog.some(l => l.viewerName === currentUserName)).map(v => v.id);
      if (watchedIds.length < videos.length) {
        setLoadingRec(true);
        getRecommendedVideo(category.name, videos, watchedIds).then(res => {
          setRecommendation(res);
          setLoadingRec(false);
        });
      }
    }
  }, [videos.length, category.name, currentUserName, isAdmin]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      setFileType(isPdf ? 'pdf' : 'video');
      if (!title) setTitle(file.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleAnalyze = async () => {
    if (!title) {
      alert("タイトルを入力してください。");
      return;
    }
    
    setAnalyzing(true);
    try {
      let fileUrl = '';
      let base64ForAI = '';

      if (selectedFile) {
        const fileRef = ref(storage, `content/${uuidv4()}_${selectedFile.name}`);
        console.log("Cloud Upload Start...");
        
        try {
          const uploadResult = await uploadBytes(fileRef, selectedFile);
          fileUrl = await getDownloadURL(uploadResult.ref);
        } catch (storageError: any) {
          throw new Error(`Cloud Storage Error: ${storageError.message}`);
        }

        const reader = new FileReader();
        base64ForAI = await new Promise((resolve) => {
          reader.onload = () => resolve((reader.result as string).split(',')[1]);
          reader.readAsDataURL(selectedFile);
        });
      }

      console.log("AI Analysis Start...");
      const result = await analyzeVideoEntry(
        category.name, 
        notes, 
        base64ForAI ? { data: base64ForAI, mimeType: selectedFile!.type } : undefined
      );
      
      const newEntry: VideoEntry = {
        id: uuidv4(),
        categoryId: category.id,
        categoryName: category.name,
        title: title,
        timestamp: Date.now(),
        summary: result.feedback,
        score: result.score,
        tags: result.newTagsSuggested,
        videoUrl: fileUrl || undefined,
        type: fileType,
        viewLog: [],
      };
      
      onAddVideo(newEntry);
      setTitle('');
      setNotes('');
      setSelectedFile(null);
      alert("クラウドへの保存とAI解析が完了しました！");
    } catch (error: any) {
      console.error(error);
      alert("エラーが発生しました: " + error.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const sortedVideos = [...videos].sort((a, b) => b.timestamp - a.timestamp);
  const watchedCount = videos.filter(v => v.viewLog.some(l => l.viewerName === currentUserName)).length;
  const progressPercent = videos.length > 0 ? Math.round((watchedCount / videos.length) * 100) : 0;

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex justify-between items-center">
        <button onClick={onBack} className="text-slate-400 font-bold text-[10px] flex items-center gap-1 uppercase tracking-widest hover:text-indigo-600 transition-colors">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        {isAdmin && (
          <button onClick={onDelete} className="text-red-400 text-[10px] font-black uppercase tracking-widest hover:text-red-600">Delete Course</button>
        )}
      </div>

      <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-indigo-200">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-black tracking-tighter leading-none mb-2">{category.name}</h1>
            <p className="text-indigo-100 text-[11px] opacity-90 font-medium max-w-[200px] leading-relaxed">{category.description}</p>
          </div>
          <div className="bg-white/20 backdrop-blur-xl px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider">
            {videos.length} Archive
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
            <span>Overall Progress</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
            <div className="bg-white h-full transition-all duration-1000 ease-out" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
      </div>

      {!isAdmin && recommendation && (
        <div className="bg-amber-50 border border-amber-100 rounded-3xl p-5 shadow-sm animate-slide-up">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-6 h-6 bg-amber-200 rounded-full flex items-center justify-center text-[10px]">💡</span>
            <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Next Suggestion</span>
          </div>
          <p className="text-amber-900 text-xs font-bold leading-relaxed mb-3">"{recommendation.reason}"</p>
          <button 
             onClick={() => {
               const el = document.getElementById(recommendation.recommendedId);
               el?.scrollIntoView({ behavior: 'smooth' });
               el?.classList.add('ring-4', 'ring-indigo-500/20');
               setTimeout(() => el?.classList.remove('ring-4', 'ring-indigo-500/20'), 3000);
             }}
             className="text-[9px] font-black text-amber-700 border-b-2 border-amber-200 pb-0.5"
          >
            Go to content
          </button>
        </div>
      )}

      {isAdmin && (
        <div id="add-content-section" className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 space-y-5 animate-slide-up">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-tighter">New Cloud Content</h3>
            <span className="text-[8px] bg-slate-100 text-slate-400 px-2 py-0.5 rounded-full font-black">AI ENABLED</span>
          </div>
          <div className="space-y-3">
            <input 
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="タイトル"
              className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:ring-4 focus:ring-indigo-50 transition-all"
            />
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="メモ (Geminiが読み取ります)"
              className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl h-24 text-xs font-medium outline-none focus:ring-4 focus:ring-indigo-50 transition-all resize-none"
            />
          </div>

          <input type="file" accept="video/mp4,application/pdf" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
          <div className="flex gap-3">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className={`flex-1 flex flex-col items-center justify-center py-4 rounded-2xl border-2 border-dashed transition-all ${selectedFile ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100'}`}
            >
              <span className="text-[10px] font-black uppercase tracking-widest">{selectedFile ? 'File Selected' : 'Select MP4/PDF'}</span>
              <span className="text-[8px] font-bold opacity-60 mt-1">{selectedFile ? selectedFile.name : 'Max 50MB suggested'}</span>
            </button>
            <button 
              onClick={handleAnalyze}
              disabled={analyzing || !title}
              className="px-8 bg-indigo-600 text-white font-black py-4 rounded-2xl text-[10px] uppercase disabled:bg-indigo-300 shadow-xl shadow-indigo-100 active:scale-95 transition-all flex items-center gap-2"
            >
              {analyzing ? (
                <>
                  <svg className="animate-spin h-3 w-3 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Syncing
                </>
              ) : 'Upload'}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-5">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Archive List</h3>
        {sortedVideos.length === 0 ? (
          <div className="bg-white rounded-[2.5rem] p-16 text-center border border-dashed border-slate-200">
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">No Content in Cloud</p>
          </div>
        ) : (
          sortedVideos.map(v => {
            const isWatched = v.viewLog.some(l => l.viewerName === currentUserName);
            return (
              <div id={v.id} key={v.id} className={`bg-white rounded-[2rem] p-6 shadow-sm border transition-all duration-500 animate-slide-up ${isWatched ? 'border-slate-50 opacity-70' : 'border-slate-100 scale-100 shadow-indigo-50/50'}`}>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-2">
                    <span className={`text-[8px] font-black uppercase px-2.5 py-1 rounded-full ${v.type === 'pdf' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
                      {v.type}
                    </span>
                    {isWatched && <span className="text-[8px] bg-green-50 text-green-500 px-2.5 py-1 rounded-full font-black uppercase">Watched</span>}
                  </div>
                  <span className="text-[9px] text-slate-300 font-black">{new Date(v.timestamp).toLocaleDateString()}</span>
                </div>
                <h3 className="text-base font-black text-slate-900 leading-tight mb-2">{v.title}</h3>
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100/50 mb-4">
                  <p className="text-[11px] text-slate-500 font-medium italic leading-relaxed">"{v.summary}"</p>
                </div>
                {v.videoUrl && (
                  <div className="rounded-2xl overflow-hidden bg-slate-100 border border-slate-50 shadow-inner">
                    {v.type === 'pdf' ? (
                      <a href={v.videoUrl} target="_blank" rel="noreferrer" onClick={() => onVideoPlay?.(v.id)} className="block p-8 text-center bg-white text-slate-800 font-black text-[10px] uppercase hover:bg-slate-50 transition-all border-2 border-slate-50">
                        View PDF Document
                      </a>
                    ) : (
                      <video src={v.videoUrl} className="w-full aspect-video object-cover" controls onPlay={() => onVideoPlay?.(v.id)} />
                    )}
                  </div>
                )}
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {v.tags.map(tag => (
                    <span key={tag} className="text-[8px] font-bold text-indigo-400 bg-indigo-50/50 px-2 py-0.5 rounded-full">#{tag}</span>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default CategoryDetail;
