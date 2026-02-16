
import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

interface LoginProps {
  onLogin: (role: 'user' | 'admin', name: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuthAction = async (actionRole: 'user' | 'admin') => {
    setError('');
    setLoading(true);

    if (!email.trim() || !password.trim() || (isSignup && !name.trim())) {
      setError('全ての項目を入力してください');
      setLoading(false);
      return;
    }

    try {
      if (isSignup) {
        // 管理者登録はシステム上制限（ここでは簡易的に）
        if (actionRole === 'admin' && email !== 'admin@example.com') {
          throw new Error('管理者登録は許可されていません');
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
        
        // Firestoreにユーザー情報を登録
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          displayName: name,
          email: email,
          role: actionRole,
          createdAt: Date.now()
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || '認証に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-white flex flex-col items-center justify-center p-6 z-[100] overflow-y-auto">
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-50" />
      <div className="absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-50" />

      <div className="w-full max-w-sm space-y-8 animate-slide-up relative z-10">
        <div className="text-center space-y-3">
          <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white font-black text-3xl mx-auto shadow-2xl shadow-indigo-200 mb-4 transform rotate-3">
            AM
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">AI master Basic</h1>
          <p className="text-slate-400 text-sm font-medium">
            {isSignup ? '新しくアカウントを作成しましょう' : 'Firebase Cloudに同期中'}
          </p>
        </div>

        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.05)] space-y-6">
          <div className="flex bg-slate-50 p-1 rounded-2xl mb-2">
            <button 
              onClick={() => setIsSignup(false)}
              className={`flex-1 py-2 text-[10px] font-black uppercase rounded-xl transition-all ${!isSignup ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}
            >
              Login
            </button>
            <button 
              onClick={() => setIsSignup(true)}
              className={`flex-1 py-2 text-[10px] font-black uppercase rounded-xl transition-all ${isSignup ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}
            >
              Sign Up
            </button>
          </div>

          <div className="space-y-4">
            {isSignup && (
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Display Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="お名前"
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-slate-800 outline-none focus:ring-4 focus:ring-indigo-50 transition-all font-bold text-sm"
                />
              </div>
            )}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Email</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-slate-800 outline-none focus:ring-4 focus:ring-indigo-50 transition-all font-bold text-sm"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-slate-800 outline-none focus:ring-4 focus:ring-indigo-50 transition-all font-bold text-sm"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl py-3 px-4">
              <p className="text-red-500 text-[10px] font-black uppercase tracking-wider">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 pt-2">
            <button 
              disabled={loading}
              onClick={() => handleAuthAction(isSignup ? 'user' : 'user')}
              className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-xl active:scale-95 disabled:bg-slate-300 transition-all text-sm uppercase"
            >
              {loading ? 'Processing...' : (isSignup ? 'Create Account' : 'Login')}
            </button>
            
            {!isSignup && (
              <p className="text-center text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                登録済みのメールアドレスでログインしてください
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
