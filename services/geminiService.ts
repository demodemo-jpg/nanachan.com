
import { GoogleGenAI, Type } from "@google/genai";
import { AIAnalysisResult } from "../types";

/**
 * Analyzes a video or PDF entry for categorization and summary.
 */
export async function analyzeVideoEntry(
  categoryName: string,
  userNotes: string,
  fileData?: { data: string; mimeType: string }
): Promise<AIAnalysisResult> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-3-flash-preview';
  
  const prompt = `
    カテゴリー「${categoryName}」にアップロードされたコンテンツを分析してください。
    
    ユーザーのメモ: ${userNotes}
    
    ファイルが提供されている場合は、その内容（動画のフレームまたはPDFのテキスト/画像）を深く理解し、
    具体的なアドバイスを行ってください。
    
    以下の形式のJSONで回答してください:
    - feedback: 内容の要約と、学習・整理のアドバイス（日本語）
    - score: コンテンツの重要度や整理の質を0-100で評価
    - newTagsSuggested: 特徴づける3つのキーワード（タグ）
  `;

  const parts: any[] = [{ text: prompt }];
  
  if (fileData) {
    parts.push({
      inlineData: {
        mimeType: fileData.mimeType,
        data: fileData.data.split(',')[1] || fileData.data, // Strip prefix if exists
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

    const text = response.text;
    if (!text) throw new Error("Empty response from AI");
    return JSON.parse(text.trim()) as AIAnalysisResult;
  } catch (error) {
    console.error("Gemini analysis failed:", error);
    return {
      feedback: "AIによる自動解析に失敗しました。ファイルが大きすぎるか、形式が対応していない可能性があります。",
      score: 50,
      newTagsSuggested: ["解析エラー", "要確認"]
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
    動画・ドキュメントカテゴリー「${categoryName}」を管理するための分類構造を作成してください。
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
    あなたは学習コーチです。「${categoryName}」において、受講者に次に取り組むべき内容を提案してください。

    既読/既視聴リスト:
    ${watchedVideos.map(v => `- ${v.title}: ${v.summary}`).join('\n')}

    未読/未視聴リスト:
    ${unwatchedVideos.map(v => `ID: ${v.id}, タイトル: ${v.title}, 内容: ${v.summary}`).join('\n')}

    もっとも学習効果が高いと思われるものを1つ選び、その理由を100文字以内で受講者に語りかけるように作成してください。
    
    JSON形式で返却してください:
    - recommendedId: 選んだアイテムのID
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
      reason: "次のステップに進んで、知識を深めていきましょう。"
    };
  }
}
