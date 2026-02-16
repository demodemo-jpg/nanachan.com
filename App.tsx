
import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { Course } from './types';
import { VideoCategory, VideoEntry } from './types';
import Dashboard from './components/Dashboard';
import CategoryForm from './components/CategoryForm';
import CategoryDetail from './components/CategoryDetail';
import AdminView from './components/AdminView';
import BottomNav from './components/BottomNav';
import Login from './components/Login';
import SettingsView from './components/SettingsView';
import { v4 as uuidv4 } from 'uuid';

function App() {
  // データを保存する「箱」を用意 (最初は空っぽ)
  const [courses, setCourses] = useState<Course[]>([]);

  // 画面が開かれたら、Firebaseからデータを取りに行く
  useEffect(() => {
    const getData = async () => {
      try {
        // "courses" という名前のコレクションからデータを取得
        const querySnapshot = await getDocs(collection(db, "courses"));
        
        // データを使いやすい形に整える
        const data = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Course[];

        // 箱に入れる
        setCourses(data);
      } catch (error) {
        console.error("エラー:", error);
      }
    };
    
    getData(); // 実行！
  }, []);

  return (
    // Dashboard にデータを渡す
    <Dashboard courses={courses} />
  );
}

export default App;
const INITIAL_COURSES = [
  { id: 'seed-cat-1', name: 'コース全体イメージ', icon: '🗺️', desc: 'プログラムの全体像を把握します' },
  { id: 'seed-cat-2', name: 'Basic最重要ポイント', icon: '⭐', desc: '基礎の核となる重要事項の解説' },
  { id: 'seed-cat-3', name: '振り返りアーカイブ', icon: '🎥', desc: '過去のセッションを復習しましょう' },
  { id: 'seed-cat-4', name: 'geminiの使い方', icon: '✨', desc: 'Googleの高性能AIをマスターする' },
  { id: 'seed-cat-5', name: 'ChatGPTの使い方', icon: '💬', desc: '対話型AIの高度な活用術' },
  { id: 'seed-cat-6', name: 'Claudeの使い方', icon: '🧠', desc: '論理的で自然なAIとの対話' },
  { id: 'seed-cat-7', name: 'notebookLMの使い方', icon: '📚', desc: '自分専用のAI知識ベースを構築' },
  { id: 'seed-cat-8', name: '宿題の作り方', icon: '📝', desc: '効果的なアウトプットと課題作成' },
];

const SAMPLE_VIDEOS: VideoEntry[] = [
  {
    id: 'sample-v1',
    categoryId: 'seed-cat-4',
    categoryName: 'geminiの使い方',
    title: 'Gemini 1.5 Proの基本設定',
    timestamp: Date.now() - 86400000 * 2,
    type: 'video',
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    summary: 'Geminiの初期設定から、基本的なプロンプトの送り方を解説しています。',
    score: 95,
    tags: ['基本', '設定', 'Google'],
    viewLog: [
      { viewerName: '田中太郎', viewedAt: Date.now() - 172800000 },
      { viewerName: '佐藤花子', viewedAt: Date.now() - 150000000 }
    ]
  }
];

export type AppTab = 'dashboard' | 'add' | 'students' | 'admin' | 'settings';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [userName, setUserName] = useState('');
  const [categories, setCategories] = useState<VideoCategory[]>([]);
  const [videos, setVideos] = useState<VideoEntry[]>([]);
  const [facebookUrl, setFacebookUrl] = useState('https://www.facebook.com');
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  // Persistence: Load on mount
  useEffect(() => {
    const savedCats = localStorage.getItem('aimaster_categories');
    const savedVideos = localStorage.getItem('aimaster_videos');
    const auth = localStorage.getItem('aimaster_auth');
    const savedName = localStorage.getItem('aimaster_username');
    const savedFbUrl = localStorage.getItem('aimaster_fb_url');
    
    if (savedCats && JSON.parse(savedCats).length > 0) {
      setCategories(JSON.parse(savedCats));
    } else {
      const seeded = INITIAL_COURSES.map(course => ({
        id: course.id,
        name: course.name,
        description: course.desc,
        icon: course.icon,
        videoCount: 0,
        progress: 0,
        tags: [],
        createdAt: Date.now(),
      }));
      setCategories(seeded);
    }

    if (savedVideos && JSON.parse(savedVideos).length > 0) {
      setVideos(JSON.parse(savedVideos));
    } else {
      setVideos(SAMPLE_VIDEOS);
    }

    if (savedName) setUserName(savedName);
    if (savedFbUrl) setFacebookUrl(savedFbUrl);
    
    if (auth) {
      setIsAuthenticated(true);
      setIsAdminMode(auth === 'admin');
    }
  }, []);

  // Save changes to localStorage whenever state updates
  useEffect(() => {
    localStorage.setItem('aimaster_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('aimaster_videos', JSON.stringify(videos));
  }, [videos]);

  useEffect(() => {
    localStorage.setItem('aimaster_fb_url', facebookUrl);
  }, [facebookUrl]);

  const handleLogin = (role: 'user' | 'admin', name: string) => {
    setIsAuthenticated(true);
    setIsAdminMode(role === 'admin');
    const finalName = name || (role === 'admin' ? '管理者' : 'ゲストユーザー');
    setUserName(finalName);
    localStorage.setItem('aimaster_auth', role);
    localStorage.setItem('aimaster_username', finalName);
    setActiveTab(role === 'admin' ? 'students' : 'dashboard');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('aimaster_auth');
    localStorage.removeItem('aimaster_username');
  };

  const handleUpdateName = (newName: string) => {
    if (!newName.trim()) return;
    const oldName = userName;
    setUserName(newName);
    localStorage.setItem('aimaster_username', newName);
    
    // Update registered users list
    const savedUsers = localStorage.getItem('aimaster_registered_users');
    if (savedUsers) {
      const users = JSON.parse(savedUsers);
      const updatedUsers = users.map((u: any) => u.name === oldName ? { ...u, name: newName } : u);
      localStorage.setItem('aimaster_registered_users', JSON.stringify(updatedUsers));
    }

    // Optional: Update view logs to reflect the new name in history
    setVideos(prev => prev.map(v => ({
      ...v,
      viewLog: v.viewLog.map(log => log.viewerName === oldName ? { ...log, viewerName: newName } : log)
    })));
  };

  const addCategory = (newCat: VideoCategory) => {
    if (!isAdminMode) return;
    setCategories(prev => [newCat, ...prev]);
    setActiveTab('dashboard');
  };

  const addVideo = (video: VideoEntry) => {
    if (!isAdminMode) return;
    setVideos(prev => [video, ...prev]);
  };

  const trackVideoView = (videoId: string) => {
    setVideos(prev => prev.map(v => {
      if (v.id === videoId) {
        if (v.viewLog.some(log => log.viewerName === userName)) return v;
        return {
          ...v,
          viewLog: [...v.viewLog, { viewerName: userName, viewedAt: Date.now() }]
        };
      }
      return v;
    }));
  };

  const deleteCategory = (id: string) => {
    if (!isAdminMode) return;
    if (!confirm('このカテゴリーを削除してもよろしいですか？関連する動画もすべて削除されます。')) return;
    setCategories(prev => prev.filter(c => c.id !== id));
    setVideos(prev => prev.filter(v => v.categoryId !== id));
    if (selectedCategoryId === id) setSelectedCategoryId(null);
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  const selectedCategory = categories.find(c => c.id === selectedCategoryId);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="fixed top-0 left-0 right-0 h-14 bg-white/80 backdrop-blur-md z-40 px-4 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-2" onClick={() => { setSelectedCategoryId(null); setActiveTab('dashboard'); }}>
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-black text-[10px] tracking-tighter cursor-pointer">AM</div>
          <div className="flex flex-col cursor-pointer">
            <span className="font-extrabold text-xs text-slate-800 leading-none">AI master Basic</span>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">{userName}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isAdminMode && (
             <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-black">ADMIN</span>
          )}
          <button 
            onClick={() => { setSelectedCategoryId(null); setActiveTab('settings'); }}
            className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-full text-slate-400 hover:text-indigo-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 pt-14 pb-24">
        {selectedCategoryId && selectedCategory ? (
          <CategoryDetail 
            category={selectedCategory} 
            videos={videos.filter(v => v.categoryId === selectedCategoryId)}
            onBack={() => setSelectedCategoryId(null)}
            onAddVideo={addVideo}
            onDelete={() => deleteCategory(selectedCategoryId)}
            onVideoPlay={trackVideoView}
            isAdmin={isAdminMode}
            currentUserName={userName}
          />
        ) : activeTab === 'settings' ? (
          <SettingsView 
            userName={userName}
            isAdmin={isAdminMode}
            facebookUrl={facebookUrl}
            onUpdateFacebookUrl={setFacebookUrl}
            onUpdateName={handleUpdateName}
            onLogout={handleLogout}
          />
        ) : (activeTab === 'students' || activeTab === 'admin') ? (
          <AdminView 
            videos={videos} 
            categories={categories} 
            initialMode={
              activeTab === 'students' ? 'students' : 
              (isAdminMode ? 'activity' : 'videos')
            } 
            isAdmin={isAdminMode}
          />
        ) : activeTab === 'dashboard' ? (
          <Dashboard 
            categories={categories} 
            videos={videos}
            currentUserName={userName}
            onSelectCategory={setSelectedCategoryId} 
            onAddPrompt={() => isAdminMode ? setActiveTab('add') : null}
            isAdmin={isAdminMode}
          />
        ) : isAdminMode && activeTab === 'add' ? (
          <CategoryForm onSubmit={addCategory} />
        ) : (
          <Dashboard 
            categories={categories} 
            videos={videos}
            currentUserName={userName}
            onSelectCategory={setSelectedCategoryId} 
            onAddPrompt={() => {}}
            isAdmin={false}
          />
        )}
      </main>

      <BottomNav 
        activeTab={activeTab} 
        onTabChange={(tab) => { setSelectedCategoryId(null); setActiveTab(tab); }} 
        isAdmin={isAdminMode} 
        facebookUrl={facebookUrl}
      />
    </div>
  );
};

export default App;
