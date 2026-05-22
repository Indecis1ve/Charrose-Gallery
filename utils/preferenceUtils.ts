import { UserPreference, Photo, PhotoAnalysis } from "../types";

const PREFS_STORAGE_KEY = "charrose_user_preferences";

const DEFAULT_PREFERENCES: UserPreference[] = [
  {
    id: "pref-1",
    triggerKeyword: "landscape",
    targetAlbumName: "Nature",
    matchType: "tag_or_title",
    createdAt: new Date().toISOString(),
  },
  {
    id: "pref-2",
    triggerKeyword: "sunset",
    targetAlbumName: "Nature",
    matchType: "tag_or_title",
    createdAt: new Date().toISOString(),
  },
  {
    id: "pref-3",
    triggerKeyword: "blurry",
    targetAlbumName: "Review",
    matchType: "quality_flag",
    createdAt: new Date().toISOString(),
  },
  {
    id: "pref-4",
    triggerKeyword: "dark",
    targetAlbumName: "Review",
    matchType: "quality_flag",
    createdAt: new Date().toISOString(),
  },
  {
    id: "pref-5",
    triggerKeyword: "low-light",
    targetAlbumName: "Review",
    matchType: "quality_flag",
    createdAt: new Date().toISOString(),
  },
  {
    id: "pref-6",
    triggerKeyword: "food",
    targetAlbumName: "Gourmet",
    matchType: "tag_or_title",
    createdAt: new Date().toISOString(),
  },
  {
    id: "pref-7",
    triggerKeyword: "cat",
    targetAlbumName: "Pets",
    matchType: "tag_or_title",
    createdAt: new Date().toISOString(),
  },
  {
    id: "pref-8",
    triggerKeyword: "dog",
    targetAlbumName: "Pets",
    matchType: "tag_or_title",
    createdAt: new Date().toISOString(),
  },
  {
    id: "pref-9",
    triggerKeyword: "pet",
    targetAlbumName: "Pets",
    matchType: "tag_or_title",
    createdAt: new Date().toISOString(),
  }
];

/**
 * Checks if a piece of text (e.g. title, description, or tag) matches a trigger keyword 
 * under word-boundary rules for Alphanumeric/English words to prevent false substring matches (e.g., 'petrol' or 'carpet' matching 'pet').
 */
export function matchesKeyword(text: string, kw: string): boolean {
  const textLower = (text || "").toLowerCase();
  const kwLower = (kw || "").toLowerCase();
  if (!textLower || !kwLower) return false;

  // Use word-boundary regex if the trigger keyword is alphanumeric
  if (/^[a-z0-9_-]+$/i.test(kwLower)) {
    const escaped = kwLower.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    return regex.test(textLower);
  }

  // Fallback for non-alphanumeric keywords (e.g. Chinese, emojis)
  return textLower.includes(kwLower);
}

export const preferenceUtils = {
  /**
   * Loads all user preferences from localStorage, initializing with defaults if empty
   */
  getPreferences: (): UserPreference[] => {
    try {
      const stored = localStorage.getItem(PREFS_STORAGE_KEY);
      if (!stored) {
        localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(DEFAULT_PREFERENCES, null, 2));
        return DEFAULT_PREFERENCES;
      }
      return JSON.parse(stored) as UserPreference[];
    } catch (e) {
      console.error("Failed to load user preferences:", e);
      return DEFAULT_PREFERENCES;
    }
  },

  /**
   * Saves user preferences
   */
  savePreferences: (prefs: UserPreference[]): void => {
    try {
      localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefs, null, 2));
    } catch (e) {
      console.error("Failed to save user preferences:", e);
    }
  },

  /**
   * Finds matching target album based on photo attributes and preferences list
   */
  matchPhoto: (
    photo: Partial<Photo> & { qualityFlags?: string[] },
    prefs: UserPreference[]
  ): { targetAlbumName: string; matchedKeyword: string; reason: string } | null => {
    const title = (photo.title || "").toLowerCase();
    const desc = (photo.description || "").toLowerCase();
    const tags = photo.tags || [];
    const qualityFlags = (photo.qualityFlags || []).map(f => f.toLowerCase());

    for (const pref of prefs) {
      const kw = pref.triggerKeyword.toLowerCase();

      // Type matcher
      if (pref.matchType === "quality_flag" || pref.matchType === "any") {
        const matchesQuality = qualityFlags.includes(kw) || matchesKeyword(title, kw) || matchesKeyword(desc, kw);
        if (matchesQuality) {
          return {
            targetAlbumName: pref.targetAlbumName,
            matchedKeyword: pref.triggerKeyword,
            reason: `Matched custom rule: Quality Flag "${pref.triggerKeyword}" maps to "${pref.targetAlbumName}"`
          };
        }
      }

      if (pref.matchType === "tag_or_title" || pref.matchType === "any") {
        const matchesTag = tags.some(t => matchesKeyword(t, kw));
        const matchesTitle = matchesKeyword(title, kw);
        const matchesDesc = matchesKeyword(desc, kw);

        if (matchesTag || matchesTitle || matchesDesc) {
          return {
            targetAlbumName: pref.targetAlbumName,
            matchedKeyword: pref.triggerKeyword,
            reason: `Matched preference: Keyword "${pref.triggerKeyword}" maps to "${pref.targetAlbumName}"`
          };
        }
      }
    }

    return null;
  }
};
