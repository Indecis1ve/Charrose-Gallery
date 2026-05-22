import React from "react";
import { Album, Photo } from "../types";
import { TrashIcon, RoseIcon, SparklesIcon } from "./Icons";

interface AlbumSidebarProps {
  albums: Album[];
  photos: Photo[];
  activeAlbumId: string | null;
  onSelectAlbum: (albumId: string | null) => void;
  onRequestDeleteAlbum: (albumId: string) => void;
}

export const AlbumSidebar: React.FC<AlbumSidebarProps> = ({
  albums,
  photos,
  activeAlbumId,
  onSelectAlbum,
  onRequestDeleteAlbum,
}) => {
  // Compute counts
  const getAllCount = () => photos.length;

  const getAlbumCount = (album: Album) => {
    const albumPhotoIds = new Set(album.photoIds || []);
    return photos.filter((p) => p.albumId === album.id || albumPhotoIds.has(p.id)).length;
  };

  const getUnclassifiedCount = () => {
    const classifiedIds = new Set(albums.flatMap((a) => a.photoIds || []));
    return photos.filter((p) => !p.albumId && !classifiedIds.has(p.id)).length;
  };

  return (
    <div 
      id="album-sidebar"
      className="w-full md:w-64 flex flex-col gap-6 p-6 rounded-md bg-stone-900 border border-stone-800/80 mb-6 md:mb-0 h-fit"
    >
      <div className="space-y-2">
        <h3 className="text-xs uppercase tracking-widest text-stone-500 font-medium">
          Library Folders
        </h3>
        <span className="h-px bg-stone-850 block w-full"></span>
      </div>

      <div className="flex flex-col gap-1">
        {/* All Memories */}
        <button
          onClick={() => onSelectAlbum(null)}
          className={`flex items-center justify-between w-full text-left px-4 py-3 rounded text-sm transition-all font-serif ${
            activeAlbumId === null
              ? "bg-stone-200 text-stone-900 font-medium"
              : "text-stone-400 hover:text-stone-200 hover:bg-stone-900"
          }`}
        >
          <div className="flex items-center gap-3">
            <RoseIcon className="w-4 h-4" />
            <span>All Moments</span>
          </div>
          <span className="text-xs opacity-75">{getAllCount()}</span>
        </button>

        {/* Unclassified/Remaining Memories */}
        <button
          onClick={() => onSelectAlbum("unclassified")}
          className={`flex items-center justify-between w-full text-left px-4 py-3 rounded text-sm transition-all font-serif ${
            activeAlbumId === "unclassified"
              ? "bg-stone-200 text-stone-900 font-medium"
              : "text-stone-400 hover:text-stone-200 hover:bg-stone-900"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 border border-dashed border-stone-500 rounded-sm flex items-center justify-center text-[10px] font-bold">
              ?
            </div>
            <span>Unclassified</span>
          </div>
          <span className="text-xs opacity-75">{getUnclassifiedCount()}</span>
        </button>
      </div>

      {/* Logical AI & Custom Albums */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs uppercase tracking-widest text-stone-500 font-medium">
            My Albums
          </h3>
          <span className="text-[10px] text-stone-500 font-mono bg-stone-950 px-1.5 py-0.5 rounded">
            {albums.length}
          </span>
        </div>
        <span className="h-px bg-stone-850 block w-full"></span>
      </div>

      <div className="flex flex-col gap-1.5 max-h-[35vh] overflow-y-auto pr-1 select-none custom-scrollbar">
        {albums.map((album) => {
          const isActive = activeAlbumId === album.id;
          const isAi = album.createdBy === "ai";
          const count = getAlbumCount(album);

          return (
            <div
              key={album.id}
              className={`group flex items-center justify-between w-full rounded transition-all ${
                isActive
                  ? "bg-stone-200 text-stone-900 font-medium"
                  : "text-stone-400 hover:text-stone-200 hover:bg-stone-900"
              }`}
            >
              <button
                onClick={() => onSelectAlbum(album.id)}
                className="flex-grow text-left px-4 py-3 text-sm flex items-center justify-between gap-2 overflow-hidden"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {isAi ? (
                    <span 
                      className={`flex-shrink-0 p-0.5 rounded ${
                        isActive ? "bg-stone-900/10 text-stone-900" : "bg-stone-950 text-stone-400"
                      }`}
                      title="AI Curated Album"
                    >
                      <SparklesIcon className="w-3.5 h-3.5" />
                    </span>
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-stone-500 flex-shrink-0"></span>
                  )}
                  <span className="truncate font-medium font-serif">{album.name}</span>
                </div>
                <span className="text-xs opacity-75 flex-shrink-0">{count}</span>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRequestDeleteAlbum(album.id);
                }}
                className={`py-3 pr-4 pl-2 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all ${
                  isActive ? "text-stone-700 hover:text-red-600" : "text-stone-500"
                }`}
                title="Delete album"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          );
        })}

        {albums.length === 0 && (
          <p className="text-xs text-stone-600 font-light text-center py-6 block italic">
            No albums created yet. Use AI Organizer to curate folders.
          </p>
        )}
      </div>
    </div>
  );
};
