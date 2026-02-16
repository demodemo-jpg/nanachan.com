
import { GoogleGenAI, Type } from "@google/genai";
import { AIAnalysisResult } from "../types";

/**
 * Analyzes a video entry for categorization and summary.
 */
export async function analyzeVideoEntry(
  categoryName: string,
  userNotes: string,
  base64VideoFrame?: string
): Promise<AIAnalysisResult> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-3-flash-preview';
  
  const prompt = `
    動画カテゴリー「${categoryName}」にアップロードされた動画を分析してください。
    
    ユーザーのメモ: ${userNotes}
    
    以下の形式のJSONで回答してください:
    - feedback: 動画の内容の要約と、内容に基づいた分類アドバイス（日本語）
    - score: コンテンツの重要度や整理の質を0-100で評価
    - newTagsSuggested: この動画を特徴づける3つのキーワード（タグ）
  `;

  const parts: any[] = [{ text: prompt }];
  if (base64VideoFrame) {
    parts.push({
      inlineData: {
        mimeType: 'image/jpeg',
        data: base64VideoFrame,
      },
    });
  }

  try {
    const response = await ai.models.generateContent({
      model,
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            feedback: { type: Type.STRING },
            score: { type: Type.NUMBER },
            newTagsSuggested: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["feedback", "score", "newTagsSuggested"]
        }
      }
    });

    return JSON.parse(response.text.trim()) as AIAnalysisResult;
  } catch (error) {
    console.error("Gemini analysis failed:", error);
    return {
      feedback: "AIによる自動解析に失敗しました。ネットワーク状況を確認してください。",
      score: 50,
      newTagsSuggested: ["エラー", "未分類"]
    };
  }
}

/**
 * Generates categories and potential tags.
 */
export async function generateCategoryStructure(categoryName: string, description: string) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-3-flash-preview';
  const prompt = `
    動画カテゴリー「${categoryName}」を管理するための分類構造を作成してください。
    内容: ${description}
    
    このカテゴリーに含まれるべき5つのサブカテゴリ（タグ）をJSON形式のリストで返してください。
    各項目は "label" というキーを持つオブジェクトです。
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              label: { type: Type.STRING }
            },
            required: ["label"]
          }
        }
      }
    });

    return JSON.parse(response.text.trim());
  } catch (error) {
    console.error("Structure generation failed:", error);
    return [{ label: "基本" }, { label: "応用" }];
  }
}

/**
 * Gets the next recommended video recommendation from Gemini.
 */
export async function getRecommendedVideo(
  categoryName: string,
  allVideos: any[],
  watchedIds: string[]
) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-3-flash-preview';
  
  const watchedVideos = allVideos.filter(v => watchedIds.includes(v.id));
  const unwatchedVideos = allVideos.filter(v => !watchedIds.includes(v.id));

  if (unwatchedVideos.length === 0) return null;

  const prompt = `
    あなたは学習コーチです。「${categoryName}」コースにおいて、受講者に次に見るべき動画を提案してください。

    既視聴動画リスト:
    ${watchedVideos.map(v => `- ${v.title}: ${v.summary}`).join('\n')}

    未視聴（候補）リスト:
    ${unwatchedVideos.map(v => `ID: ${v.id}, タイトル: ${v.title}, 内容: ${v.summary}`).join('\n')}

    もっとも学習効果が高いと思われる動画を1つ選び、その理由を100文字以内で受講者に語りかけるように作成してください。
    
    JSON形式で返却してください:
    - recommendedId: 選んだ動画のID
    - reason: 推薦理由（日本語）
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommendedId: { type: Type.STRING },
            reason: { type: Type.STRING }
          },
          required: ["recommendedId", "reason"]
        }
      }
    });
    return JSON.parse(response.text.trim());
  } catch (e) {
    console.error("Recommendation engine error:", e);
    return {
      recommendedId: unwatchedVideos[0].id,
      reason: "まずは次の動画から順に進めていきましょう。"
    };
  }
}
