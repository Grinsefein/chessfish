import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function summarizeGame(history: string[], reviewData: any) {
  if (!process.env.GEMINI_API_KEY) return "Game analysis complete.";
  
  const prompt = `
    Analysis showing:
    - Moves: ${history.join(", ")}
    - Accuracy: ${reviewData.accuracy}%
    - Blunders: ${reviewData.blunders}
    - Mistakes: ${reviewData.mistakes}
    - Brilliant Moves: ${reviewData.brilliant}

    Please provide a professional chess engine style summary of this game including:
    1. Identify the opening name if possible.
    2. One specific strategic strength displayed.
    3. One specific tactical weakness to work on.
    4. A concise, encouraging overall summary.
    
    Keep the total response under 4 sentences.
  `;
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text || "Impressive performance! Focus on keeping your minor pieces active in the endgame.";
  } catch (e) {
    console.error("Gemini summary failed", e);
    return "Impressive performance! Focus on keeping your minor pieces active in the endgame.";
  }
}
