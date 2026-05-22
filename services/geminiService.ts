import { GoogleGenAI, Type } from "@google/genai";
import { AiAnalysisResult } from "../types";

// Check if API Key is available and warn the user if not
if (!process.env.API_KEY) {
  console.error("⚠️ CHARROSE CONFIG ERROR: API_KEY is missing. Please ensure you have created a '.env' file in the root directory with 'VITE_API_KEY=your_key_here'.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Analyzes an image using Gemini to generate an elegant title, description, and tags.
 * @param base64Image The base64 string of the image (without the data prefix).
 * @param mimeType The mime type of the image.
 */
export const analyzeImage = async (base64Image: string, mimeType: string): Promise<AiAnalysisResult> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Image,
            },
          },
          {
            text: `Analyze this image for a high-end electronic photo album. 
            1. Generate a short, poetic, and elegant title (maximum 6 words).
            2. Write a warm, nostalgic, or artistic description (maximum 2 sentences).
            3. Generate 3-5 relevant keywords/tags.
            4. Assess photographic quality deficiencies. Return any matched quality flags in a list: "blurry" (out of focus, motion blur), "dark" (extremely underexposed or black), "low-light" (high noise), "screenshot", "duplicate-like" if applicable.
            Return the result in JSON format.`
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            tags: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            qualityFlags: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["title", "description", "tags", "qualityFlags"],
        }
      }
    });

    const text = response.text;
    if (!text) {
        throw new Error("No response from AI");
    }
    
    return JSON.parse(text) as AiAnalysisResult;

  } catch (error) {
    console.error("Error analyzing image with Gemini:", error);
    // Fallback if AI fails
    return {
      title: "Untitled Moment",
      description: "A captured memory waiting to be told.",
      tags: ["memory", "photo"],
      qualityFlags: [],
    };
  }
};