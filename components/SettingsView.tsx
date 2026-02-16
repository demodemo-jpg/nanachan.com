
import React, { useState, useEffect } from 'react';

interface SettingsViewProps {
  userName: string;
  isAdmin: boolean;
  facebookUrl: string;
  onUpdateFacebookUrl: (url: string) => void;
  onUpdateName: (newName: string) => void;
  onLogout: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ 
  userName, 
  isAdmin, 
  facebookUrl, 
  onUpdateFacebookUrl, 
  onUpdateName,
  onLogout 
}) => {
  const [tempFbUrl, setTempFbUrl] = useState(facebookUrl);
  const [editName, setEditName] = useState(userName);
  const [isNameChanged, setIsNameChanged] = useState(false);

  useEffect(() => {
    setEditName(userName);
    setIsNameChanged(false);
  }, [userName]);

  const handleSaveSettings = () => {
    onUpdateFacebookUrl(tempFbUrl);
    alert('システム設定を保存しました');
  };

  const handleSaveName = () => {
    if (!editName.trim()) {
      alert('有効な名前を入力してください');
      return;
    }
    onUpdateName(editName);
    alert('プロフィール名を更新しました');
    setIsNameChanged(false);
  };

  return (
    <div className="animate-fade-in py-4 space-y-6">
      <div className="flex justify-between items-end mb-2">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-1">設定</h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">User & System Settings</p>
        </div>
      </div>

      {/* Profile and Name Change Section */}
      <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center text-white font-black text-xl uppercase shadow-lg shadow-indigo-100">
            {userName.substring(0, 2)}
          </div>
          <div className="flex-1">
            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Signed in as</p>
            <h2 className="text-lg font-black text-slate-800 leading-tight">{userName}</h2>
            <div className="mt-1 flex items-center gap-2">
              <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${isAdmin ? 'bg-amber-100 text-amber-700' : 'bg-indigo-50 text-indigo-600'}`}>
                {isAdmin ? 'Administrator' : 'General User'}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-slate-50">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">表示名の変更</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={editName}
                onChange={(e) => {
                  setEditName(e.target.value);
                  setIsNameChanged(e.target.value !== userName);
                }}
                placeholder="新しい名前を入力"
                className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-slate-800 placeholder:text-slate-300 outline-none focus:ring-4 focus:ring-indigo-50 transition-all font-bold text-xs"
              />
              <button 
                onClick={handleSaveName}
                disabled={!isNameChanged}
                className={`px-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${isNameChanged ? 'bg-indigo-600 text-white shadow-md active:scale-95' : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}
              >
                更新
              </button>
            </div>
          </div>
        </div>
        
        <div className="pt-2">
          <button 
            onClick={onLogout}
            className="w-full bg-slate-50 text-slate-500 font-black py-3 rounded-2xl hover:bg-red-50 hover:text-red-500 transition-all text-[10px] uppercase tracking-widest border border-slate-100"
          >
            ログアウト
          </button>
        </div>
      </div>

      {/* Admin Specific Section */}
      {isAdmin && (
        <div className="space-y-4">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">System Configuration</h3>
          <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Facebook リンクURL</label>
                <input 
                  type="text" 
                  value={tempFbUrl}
                  onChange={(e) => setTempFbUrl(e.target.value)}
                  placeholder="https://facebook.com/your-page"
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-slate-800 placeholder:text-slate-300 outline-none focus:ring-4 focus:ring-indigo-50 transition-all font-bold text-xs"
                />
                <p className="mt-2 text-[8px] text-slate-400 font-medium px-1">フッターやナビゲーションのSNSリンク先になります。</p>
              </div>
            </div>
            <button 
              onClick={handleSaveSettings}
              className="w-full bg-slate-800 text-white font-black py-3 rounded-2xl shadow-lg active:scale-[0.98] transition-all text-[10px] uppercase tracking-widest"
            >
              システム設定を保存
            </button>
          </div>
        </div>
      )}

      {/* About Section */}
      <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100">
        <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest mb-4">About Platform</h4>
        <div className="space-y-3">
          <div className="flex justify-between text-[10px] font-bold">
            <span className="text-slate-400">Version</span>
            <span className="text-slate-800">1.2.5 (Stable)</span>
          </div>
          <div className="flex justify-between text-[10px] font-bold">
            <span className="text-slate-400">Data Persistence</span>
            <span className="text-green-500">Enabled (Local)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
