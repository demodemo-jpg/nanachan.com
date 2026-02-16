
import React, { useState, useEffect } from 'react';

interface LoginProps {
  onLogin: (role: 'user' | 'admin', name: string) => void;
}

interface RegisteredUser {
  name: string;
  password: string;
  role: 'user' | 'admin';
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // デモ用の初期ユーザーを読み込むか、空の配列をセット
  const getRegisteredUsers = (): RegisteredUser[] => {
    const saved = localStorage.getItem('aimaster_registered_users');
    if (saved) return JSON.parse(saved);
    // デフォルトの管理者とユーザー
    return [
      { name: 'admin', password: 'admin', role: 'admin' },
      { name: 'user', password: 'user', role: 'user' }
    ];
  };

  const saveUser = (user: RegisteredUser) => {
    const users = getRegisteredUsers();
    users.push(user);
    localStorage.setItem('aimaster_registered_users', JSON.stringify(users));
  };

  const handleAuthAction = (actionRole: 'user' | 'admin') => {
    setError('');
    setSuccess('');

    if (!name.trim() || !password.trim()) {
      setError('全ての項目を入力してください');
      return;
    }

    const users = getRegisteredUsers();

    if (isSignup) {
      // 新規登録ロジック
      // 管理者としての登録は許可しない
      if (actionRole === 'admin') {
        setError('管理者登録は許可されていません');
        return;
      }

      const exists = users.find(u => u.name === name);
      if (exists) {
        setError('このユーザー名は既に使用されています');
        return;
      }
      
      const newUser: RegisteredUser = { name, password, role: 'user' };
      saveUser(newUser);
      setSuccess('登録が完了しました！ログインしてください。');
      setIsSignup(false);
      setPassword(''); // パスワードだけクリア
    } else {
      // ログインロジック
      const user = users.find(u => u.name === name && u.password === password);
      if (user) {
        onLogin(user.role, user.name);
      } else {
        setError('名前またはパスワードが正しくありません');
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-white flex flex-col items-center justify-center p-6 z-[100] overflow-y-auto">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-50" />
      <div className="absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-50" />

      <div className="w-full max-w-sm space-y-8 animate-slide-up relative z-10">
        <div className="text-center space-y-3">
          <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white font-black text-3xl mx-auto shadow-2xl shadow-indigo-200 mb-4 transform rotate-3 transition-transform hover:rotate-0 duration-500">
            AM
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">AI master Basic</h1>
          <p className="text-slate-400 text-sm font-medium">
            {isSignup ? '新しくアカウントを作成しましょう' : 'スキル習得の進捗を管理しましょう'}
          </p>
        </div>

        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.05)] space-y-6">
          <div className="flex bg-slate-50 p-1 rounded-2xl mb-2">
            <button 
              onClick={() => { setIsSignup(false); setError(''); }}
              className={`flex-1 py-2 text-[10px] font-black uppercase rounded-xl transition-all ${!isSignup ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}
            >
              Login
            </button>
            <button 
              onClick={() => { setIsSignup(true); setError(''); }}
              className={`flex-1 py-2 text-[10px] font-black uppercase rounded-xl transition-all ${isSignup ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}
            >
              Sign Up
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-1">User Name</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError('');
                }}
                placeholder="ユーザー名を入力"
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-slate-800 placeholder:text-slate-300 outline-none focus:ring-4 focus:ring-indigo-50 transition-all font-bold text-sm"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-1">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-slate-800 placeholder:text-slate-300 outline-none focus:ring-4 focus:ring-indigo-50 transition-all font-bold text-sm"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl py-3 px-4 flex items-center gap-3 animate-shake">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
              <p className="text-red-500 text-[10px] font-black uppercase tracking-wider">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-100 rounded-xl py-3 px-4 flex items-center gap-3 animate-pulse">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
              <p className="text-green-600 text-[10px] font-black uppercase tracking-wider">{success}</p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 pt-2">
            <button 
              onClick={() => handleAuthAction(isSignup ? 'user' : 'user')}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-100 active:scale-[0.98] transition-all text-sm uppercase tracking-widest"
            >
              {isSignup ? 'Create Account' : 'Login as User'}
            </button>
            
            {!isSignup && (
              <button 
                onClick={() => handleAuthAction('admin')}
                className="w-full bg-slate-50 hover:bg-slate-100 text-slate-400 font-bold py-3 rounded-2xl border border-slate-100 active:scale-[0.98] transition-all text-[10px] uppercase tracking-[0.2em]"
              >
                Admin Access
              </button>
            )}
          </div>
        </div>

        <div className="text-center space-y-1 opacity-60">
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
            {isSignup ? '登録するとダッシュボードが利用可能になります' : 'Demo Credentials: user / user'}
          </p>
        </div>
      </div>
      
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.2s ease-in-out 0s 2;
        }
      `}</style>
    </div>
  );
};

export default Login;
