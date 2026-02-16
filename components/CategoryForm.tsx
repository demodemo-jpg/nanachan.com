
import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { VideoCategory } from '../types';
import { generateCategoryStructure } from '../services/geminiService';

interface CategoryFormProps {
  onSubmit: (cat: VideoCategory) => void;
}

const CategoryForm: React.FC<CategoryFormProps> = ({ onSubmit }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !description) return;

    setLoading(true);
    try {
      const tagData = await generateCategoryStructure(name, description);
      const newCat: VideoCategory = {
        id: uuidv4(),
        name,
        description,
        icon: '📁',
        videoCount: 0,
        progress: 0,
        tags: tagData.map((t: any) => ({
          id: uuidv4(),
          label: t.label,
          completed: false
        })),
        createdAt: Date.now(),
      };
      onSubmit(newCat);
    } catch (error) {
      console.error("Structure generation failed:", error);
      onSubmit({
        id: uuidv4(),
        name,
        description,
        icon: '📁',
        videoCount: 0,
        progress: 0,
        tags: [{ id: uuidv4(), label: '全般', completed: false }],
        createdAt: Date.now(),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 animate-slide-up">
      <h2 className="text-xl font-bold text-slate-800 mb-6">新しいカテゴリー</h2>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">カテゴリー名</label>
          <input 
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例: プログラミング講義、趣味の工作" 
            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-sm"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">説明 / 内容</label>
          <textarea 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="どのような種類の動画を保存するか教えてください" 
            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl h-24 focus:ring-2 focus:ring-indigo-500 transition-all outline-none resize-none text-sm"
            required
          />
        </div>

        <button 
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-100 disabled:bg-indigo-300 transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : 'カテゴリーを作成'}
        </button>
      </form>
    </div>
  );
};

export default CategoryForm;
