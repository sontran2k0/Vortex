
import { GoogleGenAI, Type } from "@google/genai";

export async function getWordDetails(word: string) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Provide details for the vocabulary word: "${word}". Include a definition, an illustrative example sentence, a list of 3 relevant tags, and the IPA transcription.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            definition: { type: Type.STRING },
            example: { type: Type.STRING },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            ipa: { type: Type.STRING }
          },
          required: ["definition", "example", "tags"]
        }
      }
    });

    const text = response.text;
    if (text) {
      return JSON.parse(text);
    }
  } catch (error) {
    console.error("Gemini Error:", error);
    return null;
  }
}