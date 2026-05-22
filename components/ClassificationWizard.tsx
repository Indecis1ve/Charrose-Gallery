import React, { useState } from "react";
import { Photo, Album, AlbumSuggestion, ClassificationTaskStatus, PhotoAnalysis, UserPreference } from "../types";
import { XMarkIcon, SparklesIcon, RoseIcon } from "./Icons";
import { AlbumSuggestionReview } from "./AlbumSuggestionReview";
import { analyzeSinglePhoto, generateAlbumSuggestions } from "../services/classificationService";
import { classifyByLocalRules } from "../utils/classificationRules";
import { PreferenceManager } from "./PreferenceManager";
import { preferenceUtils } from "../utils/preferenceUtils";

interface ClassificationWizardProps {
  photos: Photo[];
  albums: Album[];
  onClose: () => void;
  onConfirmCreated: (newAlbums: Album[]) => void;
}

export const ClassificationWizard: React.FC<ClassificationWizardProps> = ({
  photos,
  albums,
  onClose,
  onConfirmCreated,
}) => {
  const [scope, setScope] = useState<"all" | "unclassified">("all");
  const [userPrompt, setUserPrompt] = useState("");
  const [status, setStatus] = useState<ClassificationTaskStatus>("idle");
  const [totalPhotos, setTotalPhotos] = useState(0);
  const [analyzedCount, setAnalyzedCount] = useState(0);
  const [suggestions, setSuggestions] = useState<AlbumSuggestion[]>([]);
  const [errorText, setErrorText] = useState("");
  const [preferences, setPreferences] = useState<UserPreference[]>(() => preferenceUtils.getPreferences());

  const unclassifiedPhotosCount = (() => {
    const classifiedIds = new Set(albums.flatMap((a) => a.photoIds || []));
    return photos.filter((p) => !p.albumId && !classifiedIds.has(p.id)).length;
  })();

  const handleStartClassification = async () => {
    setErrorText("");

    // Identify photos to classify
    let targetPhotos: Photo[] = [];
    if (scope === "all") {
      targetPhotos = photos;
    } else {
      const classifiedIds = new Set(albums.flatMap((a) => a.photoIds || []));
      targetPhotos = photos.filter((p) => !p.albumId && !classifiedIds.has(p.id));
    }

    if (targetPhotos.length === 0) {
      setErrorText(scope === "all" ? "您的画廊中没有任何照片。" : "您的画廊中没有未分类的照片。");
      setStatus("error");
      return;
    }

    setStatus("preparing");
    setTotalPhotos(targetPhotos.length);
    setAnalyzedCount(0);

    try {
      setStatus("analyzing");
      const analyses: PhotoAnalysis[] = [];

      for (let i = 0; i < targetPhotos.length; i++) {
        setAnalyzedCount(i + 1);
        const photo = targetPhotos[i];
        const analysis = await analyzeSinglePhoto(photo);
        analyses.push(analysis);
      }

      setStatus("grouping");
      let grouped: AlbumSuggestion[] = [];
      try {
        const prefsText = preferences.map(p => 
          `- Prioritize grouping photos that have keyword/tag matching "${p.triggerKeyword}" or quality flags like "${p.triggerKeyword}" into the album name/category called "${p.targetAlbumName}".`
        ).join("\n");
        grouped = await generateAlbumSuggestions(analyses, userPrompt, prefsText);
      } catch (grpErr) {
        console.warn("AI Grouping failed, falling back to local heuristic rules categorization.", grpErr);
        grouped = classifyByLocalRules(targetPhotos);
      }

      setSuggestions(grouped);
      setStatus("reviewing");
    } catch (e: any) {
      console.error("Curation task error:", e);
      setErrorText(e.message || "AI 分类失败，请查看您的 API Key 是否配置正确。");
      setStatus("error");
    }
  };

  const handleConfirmSuggestions = () => {
    setStatus("applying");
    try {
      const now = new Date().toISOString();
      const newAlbums: Album[] = suggestions.map((suggestion) => ({
        id: suggestion.albumId || `ai-album-${Math.random().toString(36).substr(2, 9)}`,
        name: suggestion.name,
        description: suggestion.description,
        reason: suggestion.reason,
        photoIds: suggestion.photoIds,
        tags: suggestion.tags,
        createdBy: "ai",
        createdAt: now,
        updatedAt: now,
      }));

      onConfirmCreated(newAlbums);
      setStatus("done");
    } catch (e: any) {
      console.error(e);
      setErrorText("无法将相册应用到本地数据库。");
      setStatus("error");
    }
  };

  // Human friendly status mapping
  const getProgressLabel = () => {
    switch (status) {
      case "preparing":
        return "Preparing photos and metadata...";
      case "analyzing":
        return `Analyzing photo ${analyzedCount} of ${totalPhotos}...`;
      case "grouping":
        return "Generating logical album suggestions via Gemini...";
      case "applying":
        return "Saving albums to local JSON database...";
      default:
        return "Processing task...";
    }
  };

  const isIdle = status === "idle" || status === "error";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="bg-stone-950 border border-stone-850 rounded-lg shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-stone-850 flex justify-between items-center bg-stone-950">
          <div className="flex items-center gap-2">
            <SparklesIcon className="w-5 h-5 text-stone-200" />
            <h3 className="font-serif text-xl font-medium text-stone-100">AI Photo Organizer</h3>
          </div>
          <button onClick={onClose} className="text-stone-500 hover:text-stone-200 transition-colors">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-8 flex-1 overflow-y-auto no-scrollbar">
          {isIdle && (
            <div className="space-y-6">
              <div className="space-y-2">
                <p className="text-stone-300 text-sm font-light leading-relaxed">
                  Analyze your gallery to automatically curate poetic titles, detailed descriptions, and suggest logical tags/albums. Simply select a target range and input a custom organization directive.
                </p>
              </div>

              {/* Error block */}
              {errorText && (
                <div className="p-4 bg-red-950/20 border border-red-900/30 rounded text-xs text-red-200 font-light">
                  ⚠️ Error: {errorText}
                </div>
              )}

              {/* Classification Range Option */}
              <div className="space-y-3">
                <label className="block text-xs uppercase tracking-widest text-stone-500 font-medium">
                  Select Scope Range
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div
                    onClick={() => setScope("all")}
                    className={`p-4 rounded border transition-all cursor-pointer flex flex-col gap-1 ${
                      scope === "all"
                        ? "bg-stone-900 border-stone-200 shadow"
                        : "bg-stone-900/50 border-stone-800/60 hover:border-stone-700"
                    }`}
                  >
                    <span className="text-sm font-medium text-stone-200">All Photos</span>
                    <span className="text-xs text-stone-500 font-light">
                      Process all {photos.length} photos in the entire workspace
                    </span>
                  </div>

                  <div
                    onClick={() => setScope("unclassified")}
                    className={`p-4 rounded border transition-all cursor-pointer flex flex-col gap-1 ${
                      scope === "unclassified"
                        ? "bg-stone-900 border-stone-200 shadow"
                        : "bg-stone-900/50 border-stone-800/60 hover:border-stone-700"
                    }`}
                  >
                    <span className="text-sm font-medium text-stone-200">Unclassified Photos</span>
                    <span className="text-xs text-stone-500 font-light">
                      Process unclassified photos only ({unclassifiedPhotosCount} photos remaining)
                    </span>
                  </div>
                </div>
              </div>

              {/* User AI Preference Rules Management */}
              <PreferenceManager onPreferencesChanged={setPreferences} />

              {/* User NLP Goal Input box */}
              <div className="space-y-3">
                <label className="block text-xs uppercase tracking-widest text-stone-500 font-medium">
                  Custom Curation Directive (Natural Language Goal)
                </label>
                <input
                  type="text"
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                  placeholder="e.g. Group my photos into travel, food, pets, family and landscapes"
                  className="w-full bg-stone-900 border border-stone-800 roundedpx-4 py-3 text-stone-200 placeholder-stone-600 focus:outline-none focus:border-stone-500 transition-all font-light text-sm"
                />
              </div>

              {/* Start Trigger */}
              <div className="pt-4 border-t border-stone-900 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 bg-transparent text-stone-400 hover:text-stone-200 border border-transparent rounded transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={photos.length === 0}
                  onClick={handleStartClassification}
                  className="flex items-center gap-2 px-6 py-2.5 bg-stone-200 hover:bg-white text-stone-900 rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  <SparklesIcon className="w-5 h-5" />
                  Start AI Classification
                </button>
              </div>
            </div>
          )}

          {/* Curation Telemetry / Process */}
          {(status === "preparing" || status === "analyzing" || status === "grouping" || status === "applying") && (
            <div className="py-16 flex flex-col items-center justify-center space-y-6">
              <div className="p-6 bg-stone-900 border border-stone-800 rounded-full text-stone-200 animate-spin">
                <RoseIcon className="w-8 h-8" />
              </div>
              <div className="space-y-2 text-center max-w-sm">
                <h4 className="font-serif text-lg text-stone-200">{getProgressLabel()}</h4>
                <p className="text-xs text-stone-500 font-mono tracking-wide uppercase">
                  Please keep this panel open while processing
                </p>
              </div>
              
              {status === "analyzing" && (
                <div className="w-full max-w-sm bg-stone-900 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-stone-200 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${(analyzedCount / totalPhotos) * 100}%` }}
                  ></div>
                </div>
              )}
            </div>
          )}

          {/* Suggestions review state */}
          {status === "reviewing" && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h4 className="font-serif text-2xl text-stone-200">Confirm AI Classification Suggestions</h4>
                <p className="text-sm text-stone-500 font-light">
                  Logical album proposals curated on top of metadata and NLP objectives. Confirm to save.
                </p>
              </div>

              <AlbumSuggestionReview
                suggestions={suggestions}
                photos={photos}
                onUpdateSuggestions={setSuggestions}
              />

              {suggestions.length === 0 && (
                <p className="text-center py-8 text-stone-500 text-sm font-sans">
                  All suggestions deleted. No albums will be saved.
                </p>
              )}

              {/* Commit or Cancel bar */}
              <div className="pt-6 border-t border-stone-900 flex justify-end gap-3 bg-stone-950">
                <button
                  type="button"
                  onClick={() => setStatus("idle")}
                  className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-300 rounded text-sm transition-colors"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={suggestions.length === 0}
                  onClick={handleConfirmSuggestions}
                  className="px-6 py-2.5 bg-stone-200 hover:bg-white text-stone-900 font-semibold rounded text-sm transition-colors"
                >
                  Confirm & Create Albums
                </button>
              </div>
            </div>
          )}

          {/* Done State */}
          {status === "done" && (
            <div className="py-16 flex flex-col items-center justify-center space-y-6 text-center">
              <div className="p-4 bg-stone-900 border border-stone-800 rounded-full text-green-400">
                <SparklesIcon className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h4 className="font-serif text-3xl text-stone-200">Organization Completed!</h4>
                <p className="text-sm text-stone-400 font-light max-w-sm">
                  The curated categories have been successfully transformed into logic albums. Double-check them in the lateral folders drawer.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 bg-stone-200 hover:bg-white text-stone-900 font-medium rounded text-sm transition-colors"
              >
                Return to Gallery
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
