
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
  const [filePreview, setFilePreview] = useState<string | null>(null);
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
      setFilePreview(URL.createObjectURL(file));
      if (!title) setTitle(file.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleAnalyze = async () => {
    if (!title || (!notes && !selectedFile)) return;
    setAnalyzing(true);
    try {
      let fileUrl = '';
      let base64ForAI = '';

      if (selectedFile) {
        // 1. Firebase Storageにアップロード
        const fileRef = ref(storage, `content/${uuidv4()}_${selectedFile.name}`);
        const uploadResult = await uploadBytes(fileRef, selectedFile);
        fileUrl = await getDownloadURL(uploadResult.ref);

        // 2. AI解析用にBase64変換（一時的）
        const reader = new FileReader();
        base64ForAI = await new Promise((resolve) => {
          reader.onload = () => resolve((reader.result as string).split(',')[1]);
          reader.readAsDataURL(selectedFile);
        });
      }

      // 3. Gemini解析
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
      setFilePreview(null);
    } catch (error) {
      console.error("Analysis/Upload failed:", error);
      alert("アップロードまたは解析中にエラーが発生しました。");
    } finally {
      setAnalyzing(false);
    }
  };

  const recommendedVideo = videos.find(v => v.id === recommendation?.recommendedId);

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex justify-between items-center">
        <button onClick={onBack} className="text-slate-400 font-bold text-[10px] flex items-center gap-1 uppercase tracking-widest">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        {isAdmin && (
          <button onClick={onDelete} className="text-red-400 text-[10px] font-black uppercase tracking-widest">Delete Course</button>
        )}
      </div>

      <div className="bg-indigo-600 rounded-3xl p-6 text-white shadow-xl shadow-indigo-100">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight leading-none mb-1">{category.name}</h1>
            <p className="text-indigo-100 text-[10px] opacity-80 font-medium">{category.description}</p>
          </div>
          <div className="bg-white/20 backdrop-blur-md px-2 py-0.5 rounded text-[9px] font-black uppercase">
            {videos.length} Items
          </div>
        </div>
        <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
          <div className="bg-white h-full transition-all duration-1000" style={{ width: `${category.progress}%` }} />
        </div>
      </div>

      {isAdmin && (
        <div id="add-content-section" className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 space-y-4">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-tighter">クラウドへ追加</h3>
          <div className="space-y-3">
            <input 
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="タイトル"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none"
            />
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="メモ (Geminiが読み取ります)"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl h-20 text-xs outline-none"
            />
          </div>

          <input type="file" accept="video/mp4,application/pdf" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
          <div className="flex gap-2">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 bg-slate-50 text-slate-500 py-3 rounded-2xl border border-dashed border-slate-200 text-[10px] font-black uppercase"
            >
              {selectedFile ? selectedFile.name : 'Select File'}
            </button>
            <button 
              onClick={handleAnalyze}
              disabled={analyzing || !title}
              className="px-6 bg-indigo-600 text-white font-black py-3 rounded-2xl text-[10px] uppercase disabled:bg-indigo-300"
            >
              {analyzing ? 'Cloud Sync...' : 'Upload'}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {videos.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center border border-dashed border-slate-200">
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">No Content in Cloud</p>
          </div>
        ) : (
          videos.sort((a, b) => b.timestamp - a.timestamp).map(v => (
            <div key={v.id} className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 space-y-3">
              <div className="flex justify-between items-start">
                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${v.type === 'pdf' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
                  {v.type}
                </span>
                <span className="text-[9px] text-slate-400 font-black">{new Date(v.timestamp).toLocaleDateString()}</span>
              </div>
              <h3 className="text-sm font-black text-slate-900 leading-tight">{v.title}</h3>
              <p className="text-[11px] text-slate-500 font-medium italic">"{v.summary}"</p>
              {v.videoUrl && (
                <div className="rounded-2xl overflow-hidden bg-slate-100 mt-2">
                  {v.type === 'pdf' ? (
                    <a href={v.videoUrl} target="_blank" rel="noreferrer" onClick={() => onVideoPlay?.(v.id)} className="block p-6 text-center bg-red-50 text-red-600 font-black text-[10px] uppercase">
                      Open Document
                    </a>
                  ) : (
                    <video src={v.videoUrl} className="w-full aspect-video object-cover" controls onPlay={() => onVideoPlay?.(v.id)} />
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CategoryDetail;
