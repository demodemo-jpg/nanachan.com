
import React, { useMemo } from 'react';
import { VideoCategory, VideoEntry } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Label } from 'recharts';

interface DashboardProps {
  categories: VideoCategory[];
  videos: VideoEntry[];
  currentUserName: string;
  onSelectCategory: (id: string) => void;
  onAddPrompt: () => void;
  isAdmin?: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  categories, 
  videos, 
  currentUserName,
  onSelectCategory, 
  onAddPrompt, 
  isAdmin 
}) => {
  const stats = useMemo(() => {
    const totalVideos = videos.length;
    const watchedVideos = videos.filter(v => 
      v.viewLog.some(log => log.viewerName === currentUserName)
    ).length;
    
    const progressPercent = totalVideos > 0 ? Math.round((watchedVideos / totalVideos) * 100) : 0;
    
    const data = [
      { name: 'Watched', value: watchedVideos, color: '#6366f1' },
      { name: 'Remaining', value: Math.max(0, totalVideos - watchedVideos), color: '#f1f5f9' },
    ];

    if (totalVideos === 0) {
      data[1].value = 1;
    }

    return { totalVideos, watchedVideos, progressPercent, data };
  }, [videos, currentUserName]);

  return (
    <div className="animate-fade-in py-4 space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-1">学習状況</h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Your Learning Progress</p>
        </div>
        {isAdmin && (
          <button 
            onClick={onAddPrompt}
            className="text-[10px] bg-indigo-600 text-white px-3 py-1.5 rounded-full font-black uppercase tracking-tighter shadow-lg shadow-indigo-100 active:scale-95 transition-transform"
          >
            + New Category
          </button>
        )}
      </div>

      <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 flex items-center gap-6">
        <div className="w-32 h-32 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={stats.data}
                cx="50%"
                cy="50%"
                innerRadius={35}
                outerRadius={50}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {stats.data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} cornerRadius={10} />
                ))}
                <Label 
                  value={`${stats.progressPercent}%`} 
                  position="center" 
                  className="font-black fill-slate-800 text-lg"
                />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Overall Completion</p>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black text-slate-800">{stats.watchedVideos}</span>
            <span className="text-sm font-bold text-slate-400">/ {stats.totalVideos}</span>
          </div>
          <p className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-full inline-block">
            {stats.watchedVideos === stats.totalVideos && stats.totalVideos > 0 ? '全コース修了！' : '動画を視聴して進捗を更新'}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Courses</h3>
        <div className="grid grid-cols-2 gap-4">
          {categories.map(cat => {
            const catVideos = videos.filter(v => v.categoryId === cat.id);
            const catWatched = catVideos.filter(v => v.viewLog.some(l => l.viewerName === currentUserName)).length;
            const catProgress = catVideos.length > 0 ? Math.round((catWatched / catVideos.length) * 100) : 0;

            return (
              <div 
                key={cat.id}
                className="group relative"
              >
                <div 
                  onClick={() => onSelectCategory(cat.id)}
                  className="bg-white rounded-[2rem] p-5 shadow-sm border border-slate-100 active:scale-95 transition-all cursor-pointer overflow-hidden flex flex-col items-start h-full"
                >
                  <div className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 font-bold text-xl shadow-inner group-hover:bg-indigo-50 transition-colors">
                    {cat.icon || '📂'}
                  </div>
                  <h3 className="text-xs font-black text-slate-800 line-clamp-2 leading-tight mb-1 min-h-[2.5rem]">
                    {cat.name}
                  </h3>
                  <div className="flex justify-between items-center w-full mt-2">
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">{catVideos.length} Items</p>
                    <span className="text-[9px] text-indigo-500 font-black">{catProgress}%</span>
                  </div>
                  
                  <div className="mt-3 w-full bg-slate-50 h-1 rounded-full overflow-hidden">
                    <div 
                      className="bg-indigo-500 h-full rounded-full transition-all duration-1000"
                      style={{ width: `${catProgress}%` }}
                    />
                  </div>
                </div>
                
                {isAdmin && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectCategory(cat.id);
                      // Adding a timeout or localstorage flag could trigger opening the upload form in CategoryDetail
                      setTimeout(() => {
                        const form = document.getElementById('add-content-section');
                        form?.scrollIntoView({ behavior: 'smooth' });
                      }, 100);
                    }}
                    className="absolute top-2 right-2 w-7 h-7 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all active:scale-90"
                    title="コンテンツを追加"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {categories.length === 0 && (
        <div className="py-20 text-center">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">No Courses Available</p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
