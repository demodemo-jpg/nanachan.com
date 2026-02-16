
import React, { useState, useEffect } from 'react';
import { VideoCategory, VideoEntry } from './types';
import Dashboard from './components/Dashboard';
import CategoryForm from './components/CategoryForm';
import CategoryDetail from './components/CategoryDetail';
import AdminView from './components/AdminView';
import BottomNav from './components/BottomNav';
import Login from './components/Login';
import SettingsView from './components/SettingsView';
// Import auth helpers from local firebase.ts to ensure consistent module resolution
import { auth, db, onAuthStateChanged } from './firebase';
import { collection, onSnapshot, query, doc, getDoc, setDoc, updateDoc, deleteDoc, arrayUnion, where, getDocs, writeBatch } from 'firebase/firestore';

export type AppTab = 'dashboard' | 'add' | 'students' | 'admin' | 'settings';

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [categories, setCategories] = useState<VideoCategory[]>([]);
  const [videos, setVideos] = useState<VideoEntry[]>([]);
  const [facebookUrl, setFacebookUrl] = useState('https://www.facebook.com');
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // onAuthStateChanged is now correctly resolved from local module re-export
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // シンプルなルール: admin@example.com または role='admin' ドキュメントがあれば管理者
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        const isExplicitAdmin = userDoc.exists() && userDoc.data().role === 'admin';
        const isEmailAdmin = currentUser.email === 'admin@example.com';
        setIsAdminMode(isExplicitAdmin || isEmailAdmin);
      } else {
        setUser(null);
        setIsAdminMode(false);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const unsubCats = onSnapshot(query(collection(db, 'categories')), (snapshot) => {
      setCategories(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as VideoCategory)));
    });

    const unsubVideos = onSnapshot(query(collection(db, 'videos')), (snapshot) => {
      setVideos(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as VideoEntry)));
    });

    return () => {
      unsubCats();
      unsubVideos();
    };
  }, [user]);

  const handleUpdateName = async (newName: string) => {
    if (!user) return;
    await updateDoc(doc(db, 'users', user.uid), { displayName: newName });
  };

  const addCategory = async (newCat: VideoCategory) => {
    if (!isAdminMode) return;
    await setDoc(doc(db, 'categories', newCat.id), newCat);
    setActiveTab('dashboard');
  };

  const addVideo = async (video: VideoEntry) => {
    if (!isAdminMode) return;
    await setDoc(doc(db, 'videos', video.id), video);
  };

  const deleteCategory = async (catId: string) => {
    if (!isAdminMode || !window.confirm("このカテゴリーと全てのコンテンツを削除しますか？")) return;
    
    const batch = writeBatch(db);
    batch.delete(doc(db, 'categories', catId));
    
    // 関連するビデオも削除
    const relatedVideos = videos.filter(v => v.categoryId === catId);
    relatedVideos.forEach(v => {
      batch.delete(doc(db, 'videos', v.id));
    });
    
    await batch.commit();
    setSelectedCategoryId(null);
  };

  const trackVideoView = async (videoId: string) => {
    if (!user) return;
    const videoRef = doc(db, 'videos', videoId);
    await updateDoc(videoRef, {
      viewLog: arrayUnion({ viewerName: user.displayName || user.email, viewedAt: Date.now() })
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={() => {}} />;
  }

  const selectedCategory = categories.find(c => c.id === selectedCategoryId);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="fixed top-0 left-0 right-0 h-14 bg-white/80 backdrop-blur-md z-40 px-4 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => { setSelectedCategoryId(null); setActiveTab('dashboard'); }}>
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-black text-[10px] tracking-tighter">AM</div>
          <div className="flex flex-col">
            <span className="font-extrabold text-xs text-slate-800 leading-none">AI master Basic</span>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">{user.displayName || user.email}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isAdminMode && (
             <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-black uppercase">Admin</span>
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
            onDelete={() => deleteCategory(selectedCategory.id)}
            onVideoPlay={trackVideoView}
            isAdmin={isAdminMode}
            currentUserName={user.displayName || user.email}
          />
        ) : activeTab === 'settings' ? (
          <SettingsView 
            userName={user.displayName || user.email}
            isAdmin={isAdminMode}
            facebookUrl={facebookUrl}
            onUpdateFacebookUrl={setFacebookUrl}
            onUpdateName={handleUpdateName}
            onLogout={() => auth.signOut()}
          />
        ) : (activeTab === 'students' || activeTab === 'admin') ? (
          <AdminView 
            videos={videos} 
            categories={categories} 
            initialMode={activeTab === 'students' ? 'students' : 'activity'} 
            isAdmin={isAdminMode}
          />
        ) : activeTab === 'dashboard' ? (
          <Dashboard 
            categories={categories} 
            videos={videos}
            currentUserName={user.displayName || user.email}
            onSelectCategory={setSelectedCategoryId} 
            onAddPrompt={() => isAdminMode ? setActiveTab('add') : null}
            isAdmin={isAdminMode}
          />
        ) : isAdminMode && activeTab === 'add' ? (
          <CategoryForm onSubmit={addCategory} />
        ) : (
          <Dashboard categories={categories} videos={videos} currentUserName={user.displayName || user.email} onSelectCategory={setSelectedCategoryId} onAddPrompt={() => {}} isAdmin={false} />
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
