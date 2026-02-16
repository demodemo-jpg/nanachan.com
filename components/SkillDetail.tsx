
import React, { useState, useRef } from 'react';
// Fix: Use VideoCategory, VideoEntry, VideoTag instead of non-existent types
import { VideoCategory, VideoEntry, VideoTag } from '../types';
// Fix: Use analyzeVideoEntry instead of non-existent analyzePracticeSession
import { analyzeVideoEntry } from '../services/geminiService';
import { v4 as uuidv4 } from 'uuid';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface SkillDetailProps {
  // Fix: Update type to VideoCategory
  skill: VideoCategory;
  // Fix: Update type to VideoEntry[]
  sessions: VideoEntry[];
  onBack: () => void;
  // Fix: Update type to VideoEntry
  onAddSession: (session: VideoEntry) => void;
  onDelete: () => void;
  onVideoPlay?: (sessionId: string) => void;
  isAdmin?: boolean;
}

const SkillDetail: React.FC<SkillDetailProps> = ({ skill, sessions, onBack, onAddSession, onDelete, onVideoPlay, isAdmin }) => {
  // Added title state to fix missing property error in VideoEntry
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
      // Set default title from file name if not already set
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleAnalyze = async () => {
    // Added title check to fix missing property error in VideoEntry
    if (!title || (!notes && !videoFile)) return;

    setAnalyzing(true);
    try {
      // Fix: Use analyzeVideoEntry
      const result = await analyzeVideoEntry(skill.name, notes);
      
      // Fix: Added missing 'title' property and 'type' property required by VideoEntry
      const newSession: VideoEntry = {
        id: uuidv4(),
        categoryId: skill.id, // Fix: use categoryId
        categoryName: skill.name, // Fix: use categoryName
        title: title, // Added missing title property
        timestamp: Date.now(),
        summary: result.feedback, // Fix: feedback maps to summary
        score: result.score,
        tags: result.newTagsSuggested, // Fix: newTagsSuggested maps to tags
        videoUrl: videoPreview || undefined,
        type: 'video',
        viewLog: [], // Initialize empty view log
      };

      onAddSession(newSession);
      setTitle(''); // Clear title state
      setNotes('');
      setVideoFile(null);
      setVideoPreview(null);
    } catch (error) {
      console.error("Analysis failed:", error);
    } finally {
      setAnalyzing(false);
    }
  };

  const chartData = sessions
    .sort((a, b) => a.timestamp - b.timestamp)
    .map(s => ({
      date: new Date(s.timestamp).toLocaleDateString(),
      score: s.score
    }));

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <button onClick={onBack} className="text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          戻る
        </button>
        {!isAdmin && (
          <button onClick={onDelete} className="text-red-400 hover:text-red-600 text-sm">
            カテゴリーを削除
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
            <h1 className="text-2xl font-bold text-slate-800 mb-1">{skill.name}</h1>
            <p className="text-slate-500 text-sm mb-6">{skill.description}</p>
            
            <div className="mb-6">
              <div className="flex justify-between items-end mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">進捗</span>
                <span className="text-3xl font-black text-indigo-600">{skill.progress}%</span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${skill.progress}%` }} />
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-700">タグ</h3>
              {skill.tags.map((m: VideoTag) => (
                <div key={m.id} className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${m.completed ? 'bg-indigo-500 border-indigo-500' : 'border-slate-200'}`}>
                    {m.completed && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                  </div>
                  <span className={`text-sm ${m.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{m.label}</span>
                </div>
              ))}
            </div>
          </div>

          {chartData.length > 0 && (
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 h-64">
              <h3 className="text-sm font-bold text-slate-700 mb-4">推移</h3>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" hide />
                    <YAxis domain={[0, 100]} hide />
                    <Tooltip />
                    <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: '#6366f1' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-6">
          {!isAdmin && (
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
              <h3 className="text-lg font-bold text-slate-800 mb-4">動画を新規追加</h3>
              <div className="space-y-4">
                {/* Added title input field to resolve missing title error */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">タイトル</label>
                  <input 
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="例: 第1回 練習セッション"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold"
                  />
                </div>
                <textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="動画に関するメモを入力してください..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl h-24 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none resize-none"
                />
                
                <div className="flex gap-4 items-center">
                  <input 
                    type="file" 
                    accept="video/*" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    className="hidden" 
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-600 py-3 rounded-xl border border-dashed border-slate-300 transition-all flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    {videoFile ? videoFile.name : '動画を選択'}
                  </button>
                  <button 
                    onClick={handleAnalyze}
                    disabled={analyzing || !title || (!notes && !videoFile)}
                    className="px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-md disabled:bg-indigo-300 transition-all"
                  >
                    {analyzing ? '解析中...' : 'AI解析'}
                  </button>
                </div>

                {videoPreview && (
                  <div className="mt-4 rounded-xl overflow-hidden bg-slate-100 relative pt-[56.25%]">
                    <video src={videoPreview} className="absolute inset-0 w-full h-full object-cover" controls />
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-800">履歴</h3>
            {sessions.length === 0 ? (
              <p className="text-slate-400 italic py-4">まだ記録がありません。</p>
            ) : (
              sessions.sort((a, b) => b.timestamp - a.timestamp).map(session => (
                <div key={session.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex gap-4">
                  <div className="flex-shrink-0 w-16 h-16 bg-indigo-50 rounded-xl flex flex-col items-center justify-center text-indigo-600">
                    <span className="text-[10px] font-bold uppercase tracking-tighter">Score</span>
                    <span className="text-2xl font-black">{session.score}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-slate-400">{new Date(session.timestamp).toLocaleString('ja-JP')}</span>
                      {session.viewLog.length > 0 && (
                        <span className="text-[10px] bg-green-50 text-green-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
                          既読
                        </span>
                      )}
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-700 border border-slate-100 italic">
                      " {session.summary} "
                    </div>
                    {session.videoUrl && (
                      <div className="mt-3 w-48 aspect-video rounded-xl overflow-hidden bg-slate-200">
                        <video 
                          src={session.videoUrl} 
                          className="w-full h-full object-cover" 
                          controls 
                          onPlay={() => onVideoPlay?.(session.id)}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkillDetail;
