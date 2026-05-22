import { Photo, AlbumSuggestion } from "../types";
import { preferenceUtils, matchesKeyword } from "./preferenceUtils";

export const CATEGORY_RULES: Record<string, string[]> = {
  Travel: ["travel", "trip", "beach", "sea", "mountain", "city", "landmark", "hotel", "train", "airport", "vacation"],
  Food: ["food", "dinner", "lunch", "coffee", "cake", "restaurant", "baking", "cooking", "meal"],
  Pets: ["cat", "dog", "pet", "animal", "puppy", "kitten"],
  People: ["portrait", "people", "family", "friends", "child", "person", "man", "woman"],
  Landscape: ["sunset", "sky", "forest", "flower", "lake", "river", "mountain", "landscape", "nature", "tree", "garden"],
  Screenshots: ["screenshot", "document", "interface", "text", "app", "web", "diagram"],
  NeedsReview: ["blurry", "dark", "low-light", "unknown"]
};

/**
 * Categorize a list of photos using user preferences followed by predefined category rules.
 * If no keywords match, the photo is assigned to "Other".
 */
export function classifyByLocalRules(photos: Photo[]): AlbumSuggestion[] {
  const prefs = preferenceUtils.getPreferences();
  const groups: Record<string, string[]> = {};
  
  // Initialize standard categories
  Object.keys(CATEGORY_RULES).forEach(category => {
    groups[category] = [];
  });
  groups["Other"] = [];

  photos.forEach(photo => {
    let matched = false;

    // 1. Try matching with User Preferences first
    const match = preferenceUtils.matchPhoto(photo, prefs);
    if (match) {
      const albumName = match.targetAlbumName;
      if (!groups[albumName]) {
        groups[albumName] = [];
      }
      groups[albumName].push(photo.id);
      matched = true;
    }

    // 2. Fall back to Predefined Categories
    if (!matched) {
      const title = photo.title || "";
      const description = photo.description || "";
      const tags = photo.tags || [];

      for (const [category, keywords] of Object.entries(CATEGORY_RULES)) {
        const hasKeyword = keywords.some(kw => 
          matchesKeyword(title, kw) || 
          matchesKeyword(description, kw) || 
          tags.some(t => matchesKeyword(t, kw))
        );
        if (hasKeyword) {
          groups[category].push(photo.id);
          matched = true;
          break; // Match first matching rule category
        }
      }
    }

    if (!matched) {
      groups["Other"].push(photo.id);
    }
  });

  const suggestions: AlbumSuggestion[] = [];

  Object.entries(groups).forEach(([category, photoIds]) => {
    if (photoIds.length === 0) return;

    let desc = `A collection of your ${category.toLowerCase()} memories sorted automatically.`;
    let reason = `Photos matched local rules for ${category}.`;

    // See if any photo in this group matched a user preference
    const matchedPref = prefs.find(p => p.targetAlbumName === category);
    if (matchedPref) {
      desc = `Custom curated moments matching your preference for ${category}.`;
      reason = `Matches user preference mapping of "${matchedPref.triggerKeyword}" to "${category}".`;
    } else if (category === "Other") {
      desc = "Misc moments and captures.";
      reason = "Did not match other rule-based classifications.";
    } else if (category === "NeedsReview") {
      desc = "Moments that may be dark, blurry or of lower visual clarity.";
      reason = "Flagged by local characteristics analysis.";
    }

    suggestions.push({
      albumId: `rule-${category.toLowerCase().replace(/\s+/g, '-')}-${Math.random().toString(36).substr(2, 9)}`,
      name: category,
      description: desc,
      reason: reason,
      photoIds: photoIds,
      tags: [category.toLowerCase()],
      confidence: 0.6
    });
  });

  return suggestions;
}
