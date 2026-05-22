import React, { useState, useEffect } from "react";
import { UserPreference } from "../types";
import { preferenceUtils } from "../utils/preferenceUtils";
import { TrashIcon, PlusIcon, SparklesIcon } from "./Icons";

interface PreferenceManagerProps {
  onPreferencesChanged?: (updated: UserPreference[]) => void;
}

export const PreferenceManager: React.FC<PreferenceManagerProps> = ({
  onPreferencesChanged,
}) => {
  const [preferences, setPreferences] = useState<UserPreference[]>([]);
  const [newKeyword, setNewKeyword] = useState("");
  const [newTargetAlbum, setNewTargetAlbum] = useState("");
  const [newMatchType, setNewMatchType] = useState<"tag_or_title" | "quality_flag">("tag_or_title");
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    const prefs = preferenceUtils.getPreferences();
    setPreferences(prefs);
  }, []);

  const handleAddPreference = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyword.trim() || !newTargetAlbum.trim()) return;

    const newPref: UserPreference = {
      id: `pref-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      triggerKeyword: newKeyword.trim().toLowerCase(),
      targetAlbumName: newTargetAlbum.trim(),
      matchType: newMatchType,
      createdAt: new Date().toISOString(),
    };

    const updated = [...preferences, newPref];
    setPreferences(updated);
    preferenceUtils.savePreferences(updated);
    if (onPreferencesChanged) onPreferencesChanged(updated);

    // Reset fields
    setNewKeyword("");
    setNewTargetAlbum("");
    setIsAdding(false);
  };

  const handleDeletePreference = (id: string) => {
    const updated = preferences.filter((p) => p.id !== id);
    setPreferences(updated);
    preferenceUtils.savePreferences(updated);
    if (onPreferencesChanged) onPreferencesChanged(updated);
  };

  return (
    <div id="preference-manager" className="bg-stone-900 border border-stone-800 rounded-md p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SparklesIcon className="w-4 h-4 text-stone-400" />
          <h4 className="font-serif text-base font-medium text-stone-200">
            Curation Rules & Preferences (整理偏好规则)
          </h4>
        </div>
        <button
          type="button"
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-1.5 px-3 py-1 bg-stone-800 hover:bg-stone-750 text-stone-200 border border-stone-700/60 rounded text-xs uppercase tracking-wide transition-colors"
        >
          <PlusIcon className="w-3.5 h-3.5" />
          {isAdding ? "Cancel" : "Add Custom Preference"}
        </button>
      </div>

      <p className="text-xs text-stone-500 font-light leading-relaxed">
        Define custom keyword or quality triggers to categorize images into corresponding logical folders. These rules apply instantly when running <strong>AI Organization</strong> and provide <strong>Auto-Grouping Suggestions</strong> during new photo uploads.
      </p>

      {/* Adding Mode Form */}
      {isAdding && (
        <form onSubmit={handleAddPreference} className="p-4 bg-stone-950/40 rounded border border-stone-800 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] uppercase text-stone-500 tracking-wider mb-1">
                Trigger Keyword (触发关键词)
              </label>
              <input
                type="text"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                placeholder="e.g. landscape, dog, food"
                className="w-full bg-stone-900 border border-stone-800 rounded px-2.5 py-1.5 text-stone-200 text-xs placeholder-stone-600 focus:outline-none focus:ring-1 focus:ring-stone-500"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase text-stone-500 tracking-wider mb-1">
                Target Category Name (目标相册)
              </label>
              <input
                type="text"
                value={newTargetAlbum}
                onChange={(e) => setNewTargetAlbum(e.target.value)}
                placeholder="e.g. Nature, Pets, Review"
                className="w-full bg-stone-900 border border-stone-800 rounded px-2.5 py-1.5 text-stone-200 text-xs placeholder-stone-600 focus:outline-none focus:ring-1 focus:ring-stone-500"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase text-stone-500 tracking-wider mb-1">
                Trigger Matching Type (触发类型)
              </label>
              <select
                value={newMatchType}
                onChange={(e) => setNewMatchType(e.target.value as any)}
                className="w-full bg-stone-900 border border-stone-800 rounded px-2.5 py-1.5 text-stone-200 text-xs focus:outline-none cursor-pointer"
              >
                <option value="tag_or_title">AI Text tags & Title</option>
                <option value="quality_flag">Quality Flag (dark, blurry, low-light)</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="px-4 py-1.5 bg-stone-200 hover:bg-white text-stone-900 font-medium rounded text-xs transition-colors"
            >
              Save Custom Preference Rule
            </button>
          </div>
        </form>
      )}

      {/* Preferences display list */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1 select-none custom-scrollbar">
        {preferences.map((pref) => (
          <div
            key={pref.id}
            className="flex items-center justify-between p-2.5 rounded bg-stone-950 border border-stone-900"
          >
            <div className="flex flex-col min-w-0 pr-2">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-serif font-semibold text-stone-200 truncate">
                  {pref.triggerKeyword}
                </span>
                <span className="text-[9px] text-stone-500 bg-stone-900 px-1 rounded uppercase tracking-wide">
                  {pref.matchType === "quality_flag" ? "Quality" : "Theme"}
                </span>
              </div>
              <span className="text-[10px] text-stone-400 font-light mt-0.5 truncate">
                Mapped to album: <strong className="text-stone-300 font-medium">"{pref.targetAlbumName}"</strong>
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleDeletePreference(pref.id)}
              className="p-1 text-stone-600 hover:text-red-400 rounded transition-colors"
              title="Delete curation rule"
            >
              <TrashIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        {preferences.length === 0 && (
          <div className="col-span-2 text-center py-4 text-xs text-stone-600 font-light italic">
            No preference rules specified. Create one above to refine organization defaults.
          </div>
        )}
      </div>
    </div>
  );
};
