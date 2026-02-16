
import React from 'react';

interface NavbarProps {
  activeTab: 'dashboard' | 'add' | 'admin';
  onTabChange: (tab: 'dashboard' | 'add' | 'admin') => void;
  onHome: () => void;
  isAdminMode: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ activeTab, onTabChange, onHome, isAdminMode }) => {
  return (
    <nav className="fixed top-0 left-0 right-0 bg-white border-b border-slate-200 z-50">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <div 
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => { onHome(); onTabChange('dashboard'); }}
        >
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
            A
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-800">AI master Basic</span>
        </div>
        
        <div className="flex gap-4 items-center">
          <button 
            onClick={() => { onHome(); onTabChange('dashboard'); }}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeTab === 'dashboard' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            ダッシュボード
          </button>
          
          {!isAdminMode ? (
            <button 
              onClick={() => onTabChange('add')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeTab === 'add' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              スキルを追加
            </button>
          ) : (
            <button 
              onClick={() => onTabChange('admin')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeTab === 'admin' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              管理者画面
            </button>
          )}

          <div className="h-6 w-px bg-slate-200 mx-2" />
          
          <button 
            onClick={() => {
              const newMode = !isAdminMode;
              // Simple simulation of role switching
