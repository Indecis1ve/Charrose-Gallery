import { GoogleGenAI, Type } from "@google/genai";
import { Photo, PhotoAnalysis, AlbumSuggestion } from "../types";
import { safeParseGeminiJson } from "../utils/safeJson";
import { classifyByLocalRules } from "../utils/classificationRules";

// Fetch key safely
const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;

// Check if available
const hasApiKey = !!apiKey;

const ai = hasApiKey 
  ? new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    })
  : null;

/**
 * Perform single photo curation if characteristics analysis details are missing.
 */
export async function analyzeSinglePhoto(photo: Photo): Promise<PhotoAnalysis> {
  // If we already have solid headers (title, is not named default, has tags), synthesize instantly to save cost!
  if (photo.title && photo.title !== "Untitled" && photo.tags && photo.tags.length > 0) {
    return {
      photoId: photo.id,
      title: photo.title,
      description: photo.description || "",
      tags: photo.tags,
      scene: photo.description || "",
      people: "unknown",
      locationType: "unknown",
      categoryCandidates: photo.tags,
      qualityFlags: [],
      confidence: 0.7
    };
  }

  // Otherwise, we query Gemini to run a fresh multi-attribute assessment!
  if (!ai) {
    throw new Error("API Key is missing, unable to run Gemini model.");
  }

  try {
    // Determine base64 parts
    const parts = photo.url.split(',');
    if (parts.length < 2) {
      throw new Error("Invalid image source URL / format.");
    }
    const mimeType = parts[0].split(':')[1].split(';')[0];
    const base64Data = parts[1];

    const prompt = `You are an AI photo curator for a private local desktop gallery app.

Analyze the image and return ONLY valid JSON. Do not include markdown, code fences, comments, or extra text.

Return this structure:
{
  "title": "an elegant title within 6 words",
  "description": "a warm, nostalgic or artistic description",
  "tags": ["3 to 5 short lowercase tags"],
  "scene": "a concise visual scene description",
  "people": "none | one | multiple | unknown",
  "locationType": "indoor | outdoor | unknown",
  "categoryCandidates": ["3 to 5 album/category candidates"],
  "qualityFlags": ["optional quality flags such as blurry, dark, duplicate-like, screenshot, low-light"],
  "confidence": 0.8
}

Rules:
- The title must be no more than 6 words.
- Tags must be short and useful for photo organization.
- Category candidates should be useful album names or themes.
- If unsure, use "unknown" rather than inventing details.
- Do not identify real people by name.
- Do not infer sensitive attributes.
- Return valid JSON only.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType,
              data: base64Data
            }
          },
          { text: prompt }
        ]
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
            scene: { type: Type.STRING },
            people: { type: Type.STRING },
            locationType: { type: Type.STRING },
            categoryCandidates: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            qualityFlags: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            confidence: { type: Type.NUMBER }
          },
          required: ["title", "description", "tags", "scene", "people", "locationType", "categoryCandidates", "qualityFlags", "confidence"]
        }
      }
    });

    const body = response.text;
    if (!body) throw new Error("Received empty response from Gemini curation endpoint.");

    const parsed = safeParseGeminiJson<Omit<PhotoAnalysis, "photoId">>(body);
    if (!parsed) throw new Error("Curation response couldn't be parsed into a matching schema.");

    return {
      photoId: photo.id,
      ...parsed
    };

  } catch (error) {
    console.warn("Failed single image analysis with Gemini. Falling back to simple default format.", error);
    return {
      photoId: photo.id,
      title: photo.title || "Captured Moment",
      description: photo.description || "",
      tags: photo.tags || ["memory"],
      scene: photo.description || "",
      people: "unknown",
      locationType: "unknown",
      categoryCandidates: photo.tags || ["gallery"],
      qualityFlags: [],
      confidence: 0.5
    };
  }
}

/**
 * Group photo analysis results on text-only level using custom prompt, omitting costly image re-upload.
 */
export async function generateAlbumSuggestions(
  analyses: PhotoAnalysis[],
  userPrompt = "Please group my photos into meaningful categories.",
  preferencesText = ""
): Promise<AlbumSuggestion[]> {
  if (!ai) {
    throw new Error("API Key is missing, unable to run Gemini grouping models.");
  }

  try {
    const prompt = `You are an AI photo organization agent for a private local desktop gallery app.

Your job is to group analyzed photos into meaningful logical albums.

The user goal is:
"${userPrompt}"

${preferencesText ? `CRITICAL USER PREFERENCES:
The user has selected these specific sorting preferences. You MUST prioritize applying them:
${preferencesText}
` : ""}

Here is the photo analysis data:
${JSON.stringify(analyses, null, 2)}

Return ONLY valid JSON. Do not include markdown, code fences, comments, or extra text.

Return this structure:
{
  "albums": [
    {
      "name": "album name",
      "description": "short album description",
      "reason": "why these photos belong together",
      "photoIds": ["photo_id_1", "photo_id_2"],
      "tags": ["tag1", "tag2", "tag3"],
      "confidence": 0.9
    }
  ]
}

Rules:
- Create 2 to 8 albums depending on the number and variety of photos.
- Every album must contain at least 1 photo.
- Prefer meaningful themes such as Travel, Family, Pets, Food, Landscape, City Walks, Daily Life, Screenshots, Low Quality Review, etc.
- A photo can appear in multiple albums only if it strongly fits multiple themes.
- If some photos are uncertain, create an album named "Needs Review".
- Use warm, elegant album names.
- Keep album names concise.
- Do not invent facts not supported by the photo analysis.
- If a photo matches any user preferences, arrange it into that matching album as instructed.
- Return valid JSON only.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            albums: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  description: { type: Type.STRING },
                  reason: { type: Type.STRING },
                  photoIds: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  },
                  tags: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  },
                  confidence: { type: Type.NUMBER }
                },
                required: ["name", "description", "reason", "photoIds", "tags", "confidence"]
              }
            }
          },
          required: ["albums"]
        }
      }
    });

    const body = response.text;
    if (!body) throw new Error("Received empty response from Gemini grouping controller.");

    const parsed = safeParseGeminiJson<{ albums: Omit<AlbumSuggestion, "albumId">[] }>(body);
    if (!parsed || !parsed.albums) {
      throw new Error("Grouping response couldn't be parsed into the suggested albums schema.");
    }

    return parsed.albums.map((album, idx) => ({
      albumId: `ai-album-${idx}-${Math.random().toString(36).substr(2, 9)}`,
      ...album
    }));

  } catch (error) {
    console.error("Failed grouping via AI, will trigger offline rule-based fallback.", error);
    throw error; // Let orchestrator trigger the backup categoriser cleanly
  }
}
