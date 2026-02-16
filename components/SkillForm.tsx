
import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
// Fix: Use VideoCategory instead of non-existent Skill type
import { VideoCategory } from '../types';
// Fix: Use generateCategoryStructure instead of non-existent generateSkillRoadmap
import { generateCategoryStructure } from '../services/geminiService';

interface SkillFormProps {
  // Fix: Use VideoCategory
  onSubmit: (skill: VideoCategory) => void;
}

const SkillForm: React.FC<SkillFormProps> = ({ onSubmit }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !description) return;

    setLoading(true);
    try {
      // Fix: Use generateCategoryStructure
      const tagData = await generateCategoryStructure(name, description);
      const newSkill: VideoCategory = {
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
      onSubmit(newSkill);
    } catch (error) {
      console.error("Structure generation failed:", error);
      // Fallback
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
    <div className="max-w-2xl mx-auto bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">新しいカテゴリーを登録</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">名前</label>
          <input 
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例: プログラミング講義、趣味の工作" 
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">説明 / 内容</label>
          <textarea 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="どのような種類の動画を保存するか教えてください" 
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl h-32 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none resize-none"
            required
          />
        </div>

        <button 
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 disabled:bg-indigo-300 transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              AIが分類を生成中...
            </>
          ) : 'カテゴリーを作成'}
        </button>
      </form>
    </div>
  );
};

export default SkillForm;
