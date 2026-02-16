
import React from 'react';
import { AppTab } from '../App';

interface BottomNavProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  isAdmin: boolean;
  facebookUrl: string;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange, isAdmin, facebookUrl }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-200 z-50 safe-area-bottom shadow-[0_-10px_40px_rgba(0,0,0,0.03)]">
      <div className={`max-w-md mx-auto h-16 flex items-center justify-around px-2`}>
        {/* Home Tab */}
        <button 
          onClick={() => onTabChange('dashboard')}
          className={`flex flex-col items-center gap-1 transition-all duration-300 ${activeTab === 'dashboard' ? 'text-indigo-600 scale-110' : 'text-slate-400'}`}
        >
          <svg className="w-5 h-5" fill={activeTab === 'dashboard' ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span className="text-[8px] font-black uppercase tracking-tighter">Home</span>
        </button>

        {/* Admin: Student List Tab */}
        {isAdmin && (
          <button 
            onClick={() => onTabChange('students')}
            className={`flex flex-col items-center gap-1 transition-all duration-300 ${activeTab === 'students' ? 'text-indigo-600 scale-110' : 'text-slate-400'}`}
          >
            <svg className="w-5 h-5" fill={activeTab === 'students' ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span className="text-[8px] font-black uppercase tracking-tighter">受講者</span>
          </button>
        )}

        {/* Add Category Tab (Floating-like for Admin) */}
        {isAdmin && (
          <button 
            onClick={() => onTabChange('add')}
            className={`flex flex-col items-center gap-1 transition-all -mt-4`}
          >
            <div className={`p-2.5 rounded-full shadow-lg transition-all duration-300 ${activeTab === 'add' ? 'bg-indigo-600 text-white scale-110 shadow-indigo-200' : 'bg-slate-800 text-white shadow-slate-200'}`}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span className="text-[8px] font-black uppercase tracking-tighter text-slate-400 mt-1">作成</span>
          </button>
        )}

        {/* Analytics / Progress Tab */}
        <button 
          onClick={() => onTabChange('admin')}
          className={`flex flex-col items-center gap-1 transition-all duration-300 ${activeTab === 'admin' ? 'text-indigo-600 scale-110' : 'text-slate-400'}`}
        >
          <svg className="w-5 h-5" fill={activeTab === 'admin' ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span className="text-[8px] font-black uppercase tracking-tighter">{isAdmin ? 'ログ' : '進捗'}</span>
        </button>

        {/* Unified Settings Tab */}
        <button 
          onClick={() => onTabChange('settings')}
          className={`flex flex-col items-center gap-1 transition-all duration-300 ${activeTab === 'settings' ? 'text-indigo-600 scale-110' : 'text-slate-400'}`}
        >
          <svg className="w-5 h-5" fill={activeTab === 'settings' ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-[8px] font-black uppercase tracking-tighter">設定</span>
        </button>
      </div>
    </nav>
  );
};

export default BottomNav;
