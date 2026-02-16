
import React, { useState, useRef, useEffect } from 'react';
import { VideoCategory, VideoEntry } from '../types';
import { analyzeVideoEntry, getRecommendedVideo } from '../services/geminiService';
import { v4 as uuidv4 } from 'uuid';

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
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
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
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const isPdf = selectedFile.type === 'application/pdf' || selectedFile.name.toLowerCase().endsWith('.pdf');
      setFileType(isPdf ? 'pdf' : 'video');
      setPreviewUrl(URL.createObjectURL(selectedFile));
      // Auto-set title from file name if empty
      if (!title) {
        setTitle(selectedFile.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleAnalyze = async () => {
    if (!title || (!notes && !file)) return;
    setAnalyzing(true);
    try {
      const analysisInput = fileType === 'pdf' ? `[PDFファイル: ${file?.name}] ${notes}` : notes;
      const result = await analyzeVideoEntry(category.name, analysisInput);
      
      const newEntry: VideoEntry = {
        id: uuidv4(),
        categoryId: category.id,
        categoryName: category.name,
        title: title,
        timestamp: Date.now(),
        summary: result.feedback,
        score: result.score,
        tags: result.newTagsSuggested,
        videoUrl: previewUrl || undefined,
        type: fileType,
        viewLog: [],
      };
      
      onAddVideo(newEntry);
      setTitle('');
      setNotes('');
      setFile(null);
      setPreviewUrl(null);
    } catch (error) {
      console.error("Analysis failed:", error);
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

      {!isAdmin && (recommendation || loadingRec) && (
        <div className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 rounded-3xl p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">✨</span>
            <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Gemini 学習アドバイス</h3>
          </div>
          {loadingRec ? (
            <div className="animate-pulse space-y-2">
              <div className="h-3 bg-indigo-100 rounded w-3/4"></div>
              <div className="h-3 bg-indigo-100 rounded w-1/2"></div>
            </div>
          ) : recommendation && recommendedVideo ? (
            <div className="space-y-3">
              <p className="text-[11px] text-slate-600 leading-relaxed font-bold italic">
                "{recommendation.reason}"
              </p>
              <div 
                className="bg-white p-3 rounded-2xl border border-indigo-50 shadow-sm flex items-center justify-between cursor-pointer active:scale-[0.98] transition-transform"
                onClick={() => {
                   const el = document.getElementById(`video-${recommendation.recommendedId}`);
                   el?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
                    {recommendedVideo.type === 'pdf' ? (
                       <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                       </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-[8px] text-slate-400 font-black uppercase">次のおすすめ ({recommendedVideo.type.toUpperCase()})</p>
                    <p className="text-[10px] font-black text-slate-800 line-clamp-1">{recommendedVideo.title}</p>
                  </div>
                </div>
                <svg className="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {isAdmin && (
        <div id="add-content-section" className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-tighter">コンテンツを追加</h3>
            {file && (
               <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase ${fileType === 'pdf' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                 {fileType} selected
               </span>
            )}
          </div>
          
          <div className="space-y-3">
            <div>
              <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">Content Title</label>
              <input 
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例: 第1回 基礎講義"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-indigo-100 transition-all font-bold"
              />
            </div>
            
            <div>
              <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">Description / Notes (Optional)</label>
              <textarea 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="このコンテンツの内容・学習ポイント..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl h-20 text-xs outline-none resize-none focus:ring-2 focus:ring-indigo-100 transition-all font-medium"
              />
            </div>
          </div>

          <input type="file" accept="video/mp4,application/pdf" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
          <div className="flex gap-2">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 bg-slate-50 text-slate-500 py-3 rounded-2xl border border-dashed border-slate-200 text-[10px] font-black uppercase active:bg-slate-100 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              {file ? file.name : 'Select MP4/PDF'}
            </button>
            <button 
              onClick={handleAnalyze}
              disabled={analyzing || !title || (!notes && !file)}
              className="px-6 bg-indigo-600 text-white font-black py-3 rounded-2xl text-[10px] uppercase disabled:bg-indigo-300 transition-all shadow-md shadow-indigo-100"
            >
              {analyzing ? 'Analyzing...' : 'Upload'}
            </button>
          </div>
          {previewUrl && fileType === 'video' && (
            <video src={previewUrl} className="w-full rounded-2xl mt-2 aspect-video object-cover border border-slate-100" controls />
          )}
          {previewUrl && fileType === 'pdf' && (
            <div className="bg-slate-50 rounded-2xl p-6 flex flex-col items-center justify-center border border-slate-100">
               <svg className="w-12 h-12 text-red-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
               </svg>
               <span className="text-[10px] font-bold text-slate-500">{file?.name}</span>
            </div>
          )}
        </div>
      )}

      <div className="space-y-4">
        {videos.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center border border-dashed border-slate-200">
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">No Content</p>
          </div>
        ) : (
          videos.sort((a, b) => b.timestamp - a.timestamp).map(v => {
            const hasWatched = v.viewLog.some(log => log.viewerName === currentUserName);
            const isRecommended = recommendation?.recommendedId === v.id;
            return (
              <div 
                key={v.id} 
                id={`video-${v.id}`}
                className={`bg-white rounded-3xl p-5 shadow-sm border transition-all space-y-3 relative overflow-hidden group ${isRecommended ? 'border-indigo-400 ring-4 ring-indigo-50' : 'border-slate-100'}`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-slate-400 font-black">{new Date(v.timestamp).toLocaleDateString()}</span>
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${v.type === 'pdf' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
                      {v.type}
                    </span>
                    {isRecommended && <span className="text-[8px] bg-indigo-600 text-white px-2 py-0.5 rounded-full font-black uppercase">Next Pick</span>}
                  </div>
                  <div className="flex gap-1 items-center">
                    {hasWatched && (
                      <span className="bg-green-100 text-green-600 text-[8px] px-2 py-0.5 rounded-full font-black uppercase flex items-center gap-1">
                        <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Done
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="space-y-1">
                  <h3 className="text-sm font-black text-slate-900 leading-tight">{v.title}</h3>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-medium line-clamp-2">
                    {v.summary}
                  </p>
                </div>

                {v.videoUrl && (
                  <div className="relative rounded-2xl overflow-hidden bg-slate-100 mt-2">
                    {v.type === 'pdf' ? (
                      <div className="p-8 flex flex-col items-center justify-center border-2 border-slate-50 rounded-2xl bg-white">
                        <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center text-red-500 mb-3">
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <a 
                          href={v.videoUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          onClick={() => onVideoPlay?.(v.id)}
                          className="bg-indigo-600 text-white text-[10px] font-black uppercase px-6 py-2.5 rounded-xl shadow-lg shadow-indigo-100 active:scale-95 transition-all"
                        >
                          Open PDF Document
                        </a>
                      </div>
                    ) : (
                      <video 
                        src={v.videoUrl} 
                        className="w-full aspect-video object-cover" 
                        controls 
                        onPlay={() => onVideoPlay?.(v.id)}
                      />
                    )}
                  </div>
                )}

                <div className="flex flex-wrap gap-1 mt-1">
                  {v.tags.map((tag, i) => (
                    <span key={i} className="text-[8px] bg-slate-50 text-slate-400 px-1.5 py-0.5 rounded-full font-bold uppercase">
                      #{tag}
                    </span>
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
