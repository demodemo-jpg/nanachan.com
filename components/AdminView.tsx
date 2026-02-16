
import React, { useState, useMemo, useEffect } from 'react';
import { VideoEntry, VideoCategory, ViewEntry } from '../types';

interface AdminViewProps {
  videos: VideoEntry[];
  categories: VideoCategory[];
  initialMode?: 'videos' | 'students' | 'activity';
  facebookUrl?: string;
  isAdmin?: boolean;
}

const AdminView: React.FC<AdminViewProps> = ({ 
  videos, 
  categories, 
  initialMode = 'students',
  isAdmin 
}) => {
  const [viewMode, setViewMode] = useState<'videos' | 'students' | 'activity'>(
    isAdmin ? initialMode : 'videos'
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    setViewMode(isAdmin ? initialMode : 'videos');
  }, [initialMode, isAdmin]);

  const sortedVideos = [...videos].sort((a, b) => b.timestamp - a.timestamp);

  const activityLog = useMemo(() => {
    if (!isAdmin) return [];
    const logs: { userName: string, contentTitle: string, viewedAt: number, contentType: string, categoryName: string }[] = [];
    videos.forEach(v => {
      v.viewLog.forEach(log => {
        logs.push({
          userName: log.viewerName,
          contentTitle: v.title,
          viewedAt: log.viewedAt,
          contentType: v.type,
          categoryName: v.categoryName
        });
      });
    });
    return logs.sort((a, b) => b.viewedAt - a.viewedAt);
  }, [videos, isAdmin]);

  const studentStats = useMemo(() => {
    if (!isAdmin) return [];
    const stats: Record<string, { 
      totalViews: number; 
      lastActive: number; 
      categoriesWatched: Set<string>;
      watchedVideos: { id: string, title: string, date: number, category: string }[]
    }> = {};

    videos.forEach(v => {
      v.viewLog.forEach(log => {
        if (!stats[log.viewerName]) {
          stats[log.viewerName] = { 
            totalViews: 0, 
            lastActive: 0, 
            categoriesWatched: new Set(),
            watchedVideos: []
          };
        }
        stats[log.viewerName].totalViews += 1;
        stats[log.viewerName].lastActive = Math.max(stats[log.viewerName].lastActive, log.viewedAt);
        stats[log.viewerName].categoriesWatched.add(v.categoryName);
        
        if (!stats[log.viewerName].watchedVideos.find(wv => wv.id === v.id)) {
          stats[log.viewerName].watchedVideos.push({
            id: v.id,
            title: v.title,
            date: log.viewedAt,
            category: v.categoryName
          });
        }
      });
    });

    return Object.entries(stats).sort((a, b) => b[1].lastActive - a[1].lastActive);
  }, [videos, isAdmin]);

  const getViewerStats = (viewLog: ViewEntry[]) => {
    if (!isAdmin) return [];
    const stats: Record<string, { count: number; lastView: number }> = {};
    viewLog.forEach(log => {
      if (!stats[log.viewerName]) {
        stats[log.viewerName] = { count: 0, lastView: 0 };
      }
      stats[log.viewerName].count += 1;
      stats[log.viewerName].lastView = Math.max(stats[log.viewerName].lastView, log.viewedAt);
    });
    return Object.entries(stats).sort((a, b) => b[1].lastView - a[1].lastView);
  };

  return (
    <div className="animate-fade-in py-4 space-y-6">
      <div className="flex justify-between items-end mb-2">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-1">
            {viewMode === 'students' ? '受講者一覧' : 
             viewMode === 'videos' ? (isAdmin ? 'コンテンツ管理' : '講義アーカイブ') : 
             '最新の活動'}
          </h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            {viewMode === 'students' ? 'Student Progress Tracking' : 
             viewMode === 'videos' ? (isAdmin ? 'Content Monitoring' : 'Lesson Archives') : 
             'Real-time Activity Log'}
          </p>
        </div>
      </div>

      {isAdmin && (
        <div className="flex bg-slate-100 p-1 rounded-2xl overflow-x-auto gap-1">
          <button 
            onClick={() => setViewMode('students')}
            className={`flex-1 min-w-[70px] py-2 text-[8px] font-black uppercase rounded-xl transition-all duration-300 ${viewMode === 'students' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}
          >
            受講者
          </button>
          <button 
            onClick={() => setViewMode('activity')}
            className={`flex-1 min-w-[70px] py-2 text-[8px] font-black uppercase rounded-xl transition-all duration-300 ${viewMode === 'activity' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}
          >
            活動履歴
          </button>
          <button 
            onClick={() => setViewMode('videos')}
            className={`flex-1 min-w-[70px] py-2 text-[8px] font-black uppercase rounded-xl transition-all duration-300 ${viewMode === 'videos' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}
          >
            コンテンツ
          </button>
        </div>
      )}

      <div className="space-y-4">
        {isAdmin && viewMode === 'activity' ? (
          <div className="space-y-3">
            {activityLog.length === 0 ? (
              <div className="bg-white rounded-[2rem] p-12 text-center border border-slate-100 shadow-sm">
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">まだ活動記録がありません</p>
              </div>
            ) : (
              activityLog.map((log, i) => (
                <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-50 flex items-center gap-4 animate-slide-up" style={{ animationDelay: `${i * 0.05}s` }}>
                  <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-black text-[10px] uppercase">
                    {log.userName.substring(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-0.5">
                      <span className="text-[10px] font-black text-slate-800">{log.userName}</span>
                      <span className="text-[8px] text-slate-400 font-bold">{new Date(log.viewedAt).toLocaleString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 line-clamp-1">
                      <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${log.contentType === 'pdf' ? 'bg-red-400' : 'bg-blue-400'}`}></span>
                      「{log.contentTitle}」を視聴しました
                    </p>
                    <p className="text-[8px] text-indigo-400 font-bold uppercase tracking-tighter mt-0.5">{log.categoryName}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : isAdmin && viewMode === 'students' ? (
          studentStats.length === 0 ? (
            <div className="bg-white rounded-[2.5rem] p-12 text-center border border-slate-100 shadow-sm">
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">まだ受講者がいません</p>
            </div>
          ) : (
            studentStats.map(([name, stat]) => {
              const isExpanded = expandedId === name;
              return (
                <div key={name} className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 space-y-4 transition-all duration-300">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 font-black text-sm uppercase">
                        {name.substring(0, 2)}
                      </div>
                      <div>
                        <h3 className="font-black text-slate-800 text-sm leading-none mb-1">{name}</h3>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                          最終アクティブ: {new Date(stat.lastActive).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-black text-indigo-600 leading-none">{stat.totalViews}</div>
                      <div className="text-[8px] text-slate-400 font-bold uppercase">視聴数</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                      <span>学習中のコース ({stat.categoriesWatched.size})</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {Array.from(stat.categoriesWatched).map(catName => (
                        <span key={catName} className="bg-slate-50 border border-slate-100 text-slate-500 text-[9px] px-2.5 py-1 rounded-full font-bold">
                          {catName}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button 
                    onClick={() => setExpandedId(isExpanded ? null : name)}
                    className="w-full flex items-center justify-between text-[10px] font-black uppercase text-indigo-500 pt-3 border-t border-slate-50"
                  >
                    <span>詳細な視聴履歴を見る</span>
                    <svg className={`w-3 h-3 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {isExpanded && (
                    <div className="animate-slide-up bg-slate-50 rounded-2xl p-4 space-y-2 max-h-48 overflow-y-auto">
                      {stat.watchedVideos.sort((a, b) => b.date - a.date).map((wv, i) => (
                        <div key={i} className="flex flex-col border-b border-white last:border-0 pb-2 mb-2 last:mb-0">
                          <div className="flex justify-between mb-0.5">
                            <span className="text-[8px] font-black text-indigo-400 uppercase">{wv.category}</span>
                            <span className="text-[8px] text-slate-300 font-bold">{new Date(wv.date).toLocaleDateString()}</span>
                          </div>
                          <span className="text-[10px] font-bold text-slate-700 line-clamp-1">{wv.title}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )
        ) : (
          sortedVideos.map((v) => {
            const isExpanded = expandedId === v.id;
            const viewerStats = getViewerStats(v.viewLog);
            return (
              <div key={v.id} className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 space-y-4 overflow-hidden transition-all duration-300">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <span className="text-[8px] bg-indigo-50 text-indigo-500 px-2 py-0.5 rounded font-black uppercase mb-1 inline-block">
                      {v.categoryName}
                    </span>
                    <h3 className="font-bold text-slate-800 text-sm line-clamp-1 leading-tight">{v.title}</h3>
                    <p className="text-[10px] text-slate-400 line-clamp-1 italic">{v.summary}</p>
                  </div>
                  {isAdmin && (
                    <span className={`text-[9px] px-2 py-1 rounded-full font-black uppercase whitespace-nowrap ml-2 ${v.viewLog.length > 0 ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'}`}>
                      {v.viewLog.length > 0 ? `${v.viewLog.length} VIEWS` : 'NO VIEWS'}
                    </span>
                  )}
                </div>
                {isAdmin && v.viewLog.length > 0 && (
                  <button 
                    onClick={() => setExpandedId(isExpanded ? null : v.id)}
                    className="w-full flex items-center justify-between text-[10px] font-black uppercase text-indigo-500 pt-3 border-t border-slate-50"
                  >
                    <span>視聴者別の内訳 ({viewerStats.length} 名)</span>
                    <svg className={`w-3 h-3 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                )}
                {isAdmin && isExpanded && (
                  <div className="animate-slide-up bg-slate-50 rounded-2xl p-4 space-y-3">
                    {viewerStats.map(([name, s], i) => (
                      <div key={i} className="flex justify-between items-center text-[10px] border-b border-white last:border-0 pb-1.5 last:pb-0">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 bg-white rounded-md flex items-center justify-center text-[8px] font-black text-indigo-600 border border-indigo-50">
                            {name.substring(0, 1)}
                          </div>
                          <span className="font-black text-slate-700">{name}</span>
                        </div>
                        <span className="font-bold text-indigo-600 bg-white px-2 py-0.5 rounded-full border border-indigo-50 shadow-sm">
                          {s.count}回
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AdminView;
