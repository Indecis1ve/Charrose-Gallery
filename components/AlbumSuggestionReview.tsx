import React, { useState } from "react";
import { AlbumSuggestion, Photo } from "../types";
import { XMarkIcon, TrashIcon, PencilIcon, SparklesIcon } from "./Icons";

interface AlbumSuggestionReviewProps {
  suggestions: AlbumSuggestion[];
  photos: Photo[];
  onUpdateSuggestions: (updated: AlbumSuggestion[]) => void;
}

export const AlbumSuggestionReview: React.FC<AlbumSuggestionReviewProps> = ({
  suggestions,
  photos,
  onUpdateSuggestions,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");

  const handleStartEdit = (suggestion: AlbumSuggestion) => {
    setEditingId(suggestion.albumId);
    setEditName(suggestion.name);
    setEditDesc(suggestion.description);
  };

  const handleSaveEdit = (albumId: string) => {
    const updated = suggestions.map((s) => {
      if (s.albumId === albumId) {
        return {
          ...s,
          name: editName,
          description: editDesc,
        };
      }
      return s;
    });
    onUpdateSuggestions(updated);
    setEditingId(null);
  };

  const handleDeleteSuggestion = (albumId: string) => {
    const updated = suggestions.filter((s) => s.albumId !== albumId);
    onUpdateSuggestions(updated);
  };

  const handleRemovePhotoFromSuggestion = (albumId: string, photoId: string) => {
    const updated = suggestions
      .map((s) => {
        if (s.albumId === albumId) {
          return {
            ...s,
            photoIds: s.photoIds.filter((pid) => pid !== photoId),
          };
        }
        return s;
      })
      .filter((s) => s.photoIds.length > 0); // Keep only suggestions with at least 1 photo
    onUpdateSuggestions(updated);
  };

  const getPhotoUrl = (photoId: string): string => {
    return photos.find((p) => p.id === photoId)?.url || "";
  };

  return (
    <div className="space-y-6 max-h-[55vh] overflow-y-auto px-1 pr-3 custom-scrollbar">
      {suggestions.map((s) => {
        const isEditing = editingId === s.albumId;
        const mappedUrls = s.photoIds
          .map((id) => ({ id, url: getPhotoUrl(id) }))
          .filter((item) => !!item.url);

        return (
          <div
            key={s.albumId}
            id={`suggested-album-${s.albumId}`}
            className="p-6 rounded-md bg-stone-900 border border-stone-800 transition-all shadow-md flex flex-col gap-4 relative group hover:border-stone-700"
          >
            {/* Action buttons (top corner) */}
            <div className="absolute top-4 right-4 flex items-center gap-2">
              {!isEditing && (
                <button
                  type="button"
                  onClick={() => handleStartEdit(s)}
                  className="p-1.5 text-stone-500 hover:text-stone-300 transition-colors hover:bg-stone-800 rounded"
                  title="Edit suggestion Details"
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => handleDeleteSuggestion(s.albumId)}
                className="p-1.5 text-stone-500 hover:text-red-400 transition-colors hover:bg-stone-800 rounded"
                title="Discard entire suggested Album"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Album details header */}
            <div className="space-y-1 pr-16">
              {isEditing ? (
                <div className="space-y-3 pt-1">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-stone-800 border border-stone-700 rounded px-3 py-1.5 text-stone-100 font-serif focus:outline-none focus:border-stone-500 text-lg"
                    placeholder="Album Name"
                  />
                  <textarea
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    className="w-full bg-stone-800 border border-stone-700 rounded px-3 py-1.5 text-xs text-stone-300 focus:outline-none focus:border-stone-500 h-16 resize-none"
                    placeholder="Short description"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="px-3 py-1 text-xs border border-stone-800 text-stone-400 hover:border-stone-600 rounded transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveEdit(s.albumId)}
                      className="px-3 py-1 text-xs bg-stone-200 text-stone-900 hover:bg-white rounded font-medium transition-colors"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h4 className="font-serif text-xl font-medium text-stone-200">
                      {s.name}
                    </h4>
                    <span className="text-[10px] text-stone-500 font-mono uppercase bg-stone-950 px-2 py-0.5 rounded border border-stone-800">
                      {s.photoIds.length} Photos
                    </span>
                    {s.confidence < 0.6 && (
                      <span className="text-[9px] text-amber-500 font-sans tracking-wide bg-amber-950/20 px-2 py-0.5 rounded border border-amber-900/30 flex items-center gap-1">
                        💡 Suggest Verification
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-stone-400 font-light mt-1">
                    {s.description || "No description provided."}
                  </p>
                </>
              )}
            </div>

            {/* Tags and Gemini explanation reasoning */}
            {!isEditing && (
              <div className="space-y-2 text-xs py-2 border-t border-b border-stone-950/40">
                <div className="flex flex-wrap gap-1.5 items-center">
                  <span className="text-stone-500 uppercase tracking-wider text-[10px] mr-1">
                    AI Tags:
                  </span>
                  {s.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[9px] text-stone-400 bg-stone-950 px-1.5 py-0.5 rounded"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
                <div className="text-stone-400 bg-stone-950/30 p-2.5 rounded border border-stone-800/50 flex gap-2 items-start text-xs font-light italic leading-relaxed">
                  <span className="p-0.5 rounded bg-stone-800 text-stone-400 flex-shrink-0">
                    <SparklesIcon className="w-3.5 h-3.5" />
                  </span>
                  <span>{s.reason || "Suggested using automatic metadata matches."}</span>
                </div>
              </div>
            )}

            {/* Photo thumbnails list */}
            <div className="space-y-2">
              <span className="text-[10px] uppercase text-stone-500 tracking-wider">
                Photo Selection (Hover and click × to detach)
              </span>
              <div className="flex flex-wrap gap-3 overflow-x-auto py-1">
                {mappedUrls.map((item) => (
                  <div
                    key={item.id}
                    className="relative w-16 h-16 rounded overflow-hidden bg-stone-950 border border-stone-800 flex-shrink-0 group/img"
                  >
                    <img
                      src={item.url}
                      alt="Thumbnail"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemovePhotoFromSuggestion(s.albumId, item.id)}
                      className="absolute top-1 right-1 p-0.5 rounded bg-black/70 hover:bg-black/90 text-stone-400 hover:text-white transition-all opacity-0 group-hover/img:opacity-100 shadow"
                      title="Remove from album"
                    >
                      <XMarkIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
