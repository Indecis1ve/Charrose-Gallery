import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Photo, Album } from './types';
import { PlusIcon, XMarkIcon, RoseIcon, ChevronLeftIcon, ChevronRightIcon, TrashIcon, FolderPlusIcon, SparklesIcon, PencilIcon } from './components/Icons';
import { analyzeImage } from './services/geminiService';
import { AlbumSidebar } from './components/AlbumSidebar';
import { ClassificationWizard } from './components/ClassificationWizard';
import { preferenceUtils } from './utils/preferenceUtils';

// --- Utilities ---

// Resize image to max dimension of 1200px and compress to JPEG to save LocalStorage space
const compressImage = (base64Str: string, maxWidth = 1200, quality = 0.7): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxWidth) {
          width *= maxWidth / height;
          height = maxWidth;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
  });
};

// --- Components ---

const PhotoCard: React.FC<{ photo: Photo; onClick: () => void }> = ({ photo, onClick }) => {
  const [loaded, setLoaded] = useState(false);

  return (
    <div 
      onClick={onClick}
      className="group relative mb-6 break-inside-avoid cursor-pointer overflow-hidden rounded-sm bg-stone-800 shadow-lg transition-all duration-700 hover:-translate-y-1 hover:shadow-2xl"
    >
      <div className={`transition-opacity duration-700 ${loaded ? 'opacity-100' : 'opacity-0'}`}>
        <img
          src={photo.url}
          alt={photo.title}
          onLoad={() => setLoaded(true)}
          className="w-full h-auto object-cover transform transition-transform duration-1000 group-hover:scale-105"
        />
      </div>
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100 flex flex-col justify-end p-6">
        <h3 className="font-serif text-xl font-medium text-stone-100 translate-y-4 transition-transform duration-500 group-hover:translate-y-0">
          {photo.title}
        </h3>
        <p className="mt-2 text-sm text-stone-300 line-clamp-2 translate-y-4 transition-transform duration-500 delay-75 group-hover:translate-y-0 font-light">
          {photo.description}
        </p>
        <div className="mt-3 flex flex-wrap gap-2 translate-y-4 transition-transform duration-500 delay-100 group-hover:translate-y-0">
          {photo.tags.slice(0, 3).map((tag, idx) => (
            <span key={idx} className="text-[10px] uppercase tracking-wider text-stone-400 border border-stone-700/50 px-2 py-0.5 rounded-full">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

const Lightbox = ({ 
  photo, 
  onClose, 
  onNext, 
  onPrev,
  onDelete
}: { 
  photo: Photo; 
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  onDelete: (id: string) => void;
}) => {
  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowRight') onNext();
    if (e.key === 'ArrowLeft') onPrev();
  }, [onClose, onNext, onPrev]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this photo from your gallery?")) {
      onDelete(photo.id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/98 backdrop-blur-sm transition-opacity duration-500">
      
      {/* Top Controls */}
      <div className="absolute top-6 right-6 z-50 flex items-center gap-4">
        <button 
          onClick={handleDeleteClick}
          className="p-2 text-stone-500 hover:text-red-400 transition-colors rounded-full hover:bg-stone-900"
          title="Delete Photo"
        >
          <TrashIcon className="w-5 h-5" />
        </button>
        <button 
          onClick={onClose}
          className="p-2 text-stone-500 hover:text-stone-200 transition-colors rounded-full hover:bg-stone-900"
        >
          <XMarkIcon className="w-8 h-8" />
        </button>
      </div>

      {/* Navigation - Left */}
      <button 
        onClick={(e) => { e.stopPropagation(); onPrev(); }}
        className="absolute left-4 top-1/2 -translate-y-1/2 p-4 text-stone-500 hover:text-stone-200 hover:bg-stone-900/50 rounded-full transition-all hidden md:block"
      >
        <ChevronLeftIcon className="w-8 h-8" />
      </button>

      {/* Navigation - Right */}
      <button 
        onClick={(e) => { e.stopPropagation(); onNext(); }}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-4 text-stone-500 hover:text-stone-200 hover:bg-stone-900/50 rounded-full transition-all hidden md:block"
      >
        <ChevronRightIcon className="w-8 h-8" />
      </button>

      <div className="relative w-full h-full max-w-7xl max-h-screen p-4 md:p-12 flex flex-col md:flex-row gap-8 items-center justify-center">
        {/* Image Container */}
        <div className="relative flex-1 flex items-center justify-center w-full h-full">
          <img 
            src={photo.url} 
            alt={photo.title}
            className="max-w-full max-h-[85vh] object-contain shadow-2xl rounded-sm"
          />
        </div>

        {/* Info Panel */}
        <div className="w-full md:w-80 lg:w-96 flex-shrink-0 bg-stone-900/40 p-8 rounded-lg backdrop-blur-md border border-stone-800/30 self-end md:self-center mb-8 md:mb-0">
          <h2 className="font-serif text-3xl text-stone-100 leading-tight mb-4 border-b border-stone-800 pb-4">
            {photo.title}
          </h2>
          <p className="text-stone-300 text-sm leading-relaxed mb-6 font-light">
            {photo.description}
          </p>
          <div className="flex flex-wrap gap-2 mb-6">
            {photo.tags.map(tag => (
              <span key={tag} className="text-xs font-medium uppercase tracking-wider text-stone-500 border border-stone-800 px-2 py-1 rounded">
                {tag}
              </span>
            ))}
          </div>
          <div className="text-xs text-stone-600 font-mono text-right uppercase tracking-widest">
            {photo.date}
          </div>
        </div>
      </div>
    </div>
  );
};

const CreateAlbumModal = ({
  onClose,
  onSave
}: {
  onClose: () => void;
  onSave: (name: string) => void;
}) => {
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(name);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-stone-900 border border-stone-800 rounded-lg shadow-2xl w-full max-w-sm overflow-hidden flex flex-col">
        <div className="p-5 border-b border-stone-800 flex justify-between items-center bg-stone-900">
          <h3 className="font-serif text-xl text-stone-200">New Album</h3>
          <button onClick={onClose} className="text-stone-500 hover:text-stone-200 transition-colors">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <label className="block text-xs uppercase tracking-widest text-stone-500 mb-2">Album Name</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Summer Stories"
              className="w-full bg-stone-800 border border-stone-700 rounded-md px-4 py-3 text-stone-200 placeholder-stone-600 focus:outline-none focus:border-stone-500 focus:ring-1 focus:ring-stone-500 transition-all font-serif"
              autoFocus
              required
            />
          </div>
          <button 
            type="submit"
            disabled={!name.trim()}
            className="w-full py-3 bg-stone-200 hover:bg-white text-stone-900 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed tracking-wide"
          >
            Create Album
          </button>
        </form>
      </div>
    </div>
  );
};

const EditAlbumModal = ({
  album,
  onClose,
  onSave
}: {
  album: Album;
  onClose: () => void;
  onSave: (name: string) => void;
}) => {
  const [name, setName] = useState(album.name);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(name);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-stone-900 border border-stone-800 rounded-lg shadow-2xl w-full max-w-sm overflow-hidden flex flex-col">
        <div className="p-5 border-b border-stone-800 flex justify-between items-center bg-stone-900">
          <h3 className="font-serif text-xl text-stone-200">Edit Album</h3>
          <button onClick={onClose} className="text-stone-500 hover:text-stone-200 transition-colors">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <label className="block text-xs uppercase tracking-widest text-stone-500 mb-2">Album Name</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Album Name"
              className="w-full bg-stone-800 border border-stone-700 rounded-md px-4 py-3 text-stone-200 placeholder-stone-600 focus:outline-none focus:border-stone-500 focus:ring-1 focus:ring-stone-500 transition-all font-serif"
              autoFocus
              required
            />
          </div>
          <button 
            type="submit"
            disabled={!name.trim()}
            className="w-full py-3 bg-stone-200 hover:bg-white text-stone-900 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed tracking-wide"
          >
            Update Album
          </button>
        </form>
      </div>
    </div>
  );
};

const DeleteAlbumModal = ({
  album,
  onClose,
  onConfirm
}: {
  album: Album;
  onClose: () => void;
  onConfirm: () => void;
}) => {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-stone-900 border border-stone-800 rounded-lg shadow-2xl w-full max-w-sm overflow-hidden flex flex-col">
        <div className="p-5 border-b border-stone-800 flex justify-between items-center bg-stone-900">
          <h3 className="font-serif text-xl text-stone-200">Delete Album</h3>
          <button onClick={onClose} className="text-stone-500 hover:text-stone-200 transition-colors">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          <p className="text-stone-300 text-sm mb-6 leading-relaxed font-light">
            Are you sure you want to delete <span className="font-medium text-white">"{album.name}"</span>? 
            <br/><br/>
            Photos in this album will <span className="text-stone-100 font-medium">not</span> be deleted. They will be moved to "All Moments".
          </p>
          <div className="flex gap-3">
             <button 
                onClick={onClose}
                className="flex-1 py-3 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-md font-medium transition-colors tracking-wide text-xs uppercase"
              >
                Cancel
              </button>
              <button 
                onClick={onConfirm}
                className="flex-1 py-3 bg-red-900/40 hover:bg-red-900/60 text-red-100 border border-red-900/50 rounded-md font-medium transition-colors tracking-wide text-xs uppercase"
              >
                Delete Album
              </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const UploadModal = ({
  file,
  albums,
  currentAlbumId,
  onClose,
  onSave
}: {
  file: File;
  albums: Album[];
  currentAlbumId: string;
  onClose: () => void;
  onSave: (title: string, description: string, albumId: string, tags: string[], imageData: string) => void;
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [selectedAlbumId, setSelectedAlbumId] = useState(currentAlbumId === 'all' ? "" : currentAlbumId);
  const [preview, setPreview] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [compressedImage, setCompressedImage] = useState<string>("");
  const [preferenceSuggestion, setPreferenceSuggestion] = useState<{ targetAlbumName: string; reason: string } | null>(null);

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      setIsAnalyzing(true);
      try {
        // Create a temporary object URL for immediate preview
        const objectUrl = URL.createObjectURL(file);
        if (isMounted) setPreview(objectUrl);

        // Read and compress
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = async () => {
             const originalBase64 = reader.result as string;
             const compressed = await compressImage(originalBase64);
             
             if (!isMounted) return;
             
             setCompressedImage(compressed);
             setPreview(compressed); // Switch to compressed preview

             // Analyze with Gemini
             const parts = compressed.split(',');
             const mimeType = parts[0].split(':')[1].split(';')[0];
             const base64Data = parts[1];

             try {
                const aiResult = await analyzeImage(base64Data, mimeType);
                if (isMounted) {
                    setTitle(aiResult.title);
                    setDescription(aiResult.description);
                    setTags(aiResult.tags);

                    // Auto-curation recommendation matching
                    const prefs = preferenceUtils.getPreferences();
                    const match = preferenceUtils.matchPhoto({
                      title: aiResult.title,
                      description: aiResult.description,
                      tags: aiResult.tags,
                      qualityFlags: aiResult.qualityFlags || []
                    }, prefs);

                    if (match) {
                      setPreferenceSuggestion({
                        targetAlbumName: match.targetAlbumName,
                        reason: match.reason
                      });

                      // Pre-select album if exists
                      const matchedAlbum = albums.find(a => a.name.toLowerCase() === match.targetAlbumName.toLowerCase());
                      if (matchedAlbum) {
                        setSelectedAlbumId(matchedAlbum.id);
                      } else {
                        // Queue creation of new album on fly
                        setSelectedAlbumId(`new-album:${match.targetAlbumName}`);
                      }
                    }
                }
             } catch (err) {
                 console.error("AI Error", err);
             } finally {
                 if (isMounted) setIsAnalyzing(false);
             }
        }
      } catch (e) {
          console.error(e);
          if (isMounted) setIsAnalyzing(false);
      }
    };

    init();
    return () => { isMounted = false; };
  }, [file, albums]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !compressedImage) return;
    onSave(title, description, selectedAlbumId, tags, compressedImage);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-stone-900 border border-stone-800 rounded-lg shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-5 border-b border-stone-800 flex justify-between items-center bg-stone-900">
          <h3 className="font-serif text-xl text-stone-200">Add to Gallery</h3>
          <button onClick={onClose} className="text-stone-500 hover:text-stone-200 transition-colors">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto custom-scrollbar">
          {/* Preview */}
          <div className="w-full h-56 bg-stone-950 rounded-sm mb-6 overflow-hidden flex items-center justify-center border border-stone-800 relative">
            {preview && (
              <img src={preview} alt="Preview" className="h-full w-full object-contain" />
            )}
            {isAnalyzing && (
               <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[2px]">
                   <div className="flex flex-col items-center gap-2">
                       <SparklesIcon className="w-6 h-6 text-stone-200 animate-pulse" />
                       <span className="text-xs text-stone-200 font-medium tracking-wider">ANALYZING...</span>
                   </div>
               </div>
            )}
          </div>

          {/* User preference auto-curation recommendation banner */}
          {preferenceSuggestion && (
            <div className="mb-5 p-3.5 bg-stone-950 border border-stone-850 rounded-md flex flex-col gap-1.5 animation-fade-in">
              <div className="flex items-center gap-1.5 text-xs text-stone-200">
                <SparklesIcon className="w-4 h-4 text-stone-300 animate-pulse" />
                <span className="font-serif font-semibold tracking-wide">AI Auto-Curation Suggestion</span>
              </div>
              <p className="text-[11px] text-stone-400 font-light leading-relaxed">
                Matches your preference targeting <strong className="text-stone-300">"{preferenceSuggestion.targetAlbumName}"</strong> because of trigger keyword/flag <span className="italic">"{preferenceSuggestion.reason.split('"')[1] || preferenceSuggestion.reason}"</span>.
              </p>
              
              {albums.some(a => a.name.toLowerCase() === preferenceSuggestion.targetAlbumName.toLowerCase()) ? (
                <div className="text-[10px] text-stone-500 font-mono">
                  ✓ Target album exists and has been pre-selected automatically.
                </div>
              ) : (
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-stone-500 font-light">
                    * Album "{preferenceSuggestion.targetAlbumName}" is missing.
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedAlbumId(`new-album:${preferenceSuggestion.targetAlbumName}`)}
                    className={`px-2.5 py-1 text-[9px] uppercase font-semibold rounded border transition-colors ${
                      selectedAlbumId === `new-album:${preferenceSuggestion.targetAlbumName}`
                        ? "bg-stone-200 text-stone-900 border-stone-200"
                        : "bg-transparent text-stone-300 border-stone-850 hover:border-stone-700"
                    }`}
                  >
                    {selectedAlbumId === `new-album:${preferenceSuggestion.targetAlbumName}` ? "Queued for creation" : "Create album automatically"}
                  </button>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs uppercase tracking-widest text-stone-500">Title</label>
                  {isAnalyzing && (
                      <div className="flex items-center gap-1 text-xs text-stone-400 animate-pulse">
                          <SparklesIcon className="w-3 h-3" />
                          <span>Gemini is thinking...</span>
                      </div>
                  )}
              </div>
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={isAnalyzing ? "Waiting for Gemini..." : "Name your memory..."}
                className="w-full bg-stone-800 border border-stone-700 rounded-md px-4 py-2.5 text-stone-200 placeholder-stone-600 focus:outline-none focus:border-stone-500 focus:ring-1 focus:ring-stone-500 transition-all font-serif"
                autoFocus
                required
              />
            </div>
            
            {/* Album Selection */}
            <div>
              <label className="block text-xs uppercase tracking-widest text-stone-500 mb-2">Album</label>
              <select
                value={selectedAlbumId}
                onChange={(e) => setSelectedAlbumId(e.target.value)}
                className="w-full bg-stone-800 border border-stone-700 rounded-md px-4 py-2.5 text-stone-200 focus:outline-none focus:border-stone-500 focus:ring-1 focus:ring-stone-500 transition-all appearance-none cursor-pointer"
              >
                <option value="">Uncategorized (All)</option>
                {selectedAlbumId && selectedAlbumId.startsWith('new-album:') && (
                  <option value={selectedAlbumId}>[Will Create Album] {selectedAlbumId.split('new-album:')[1]}</option>
                )}
                {albums.map(album => (
                  <option key={album.id} value={album.id}>{album.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-stone-500 mb-2">Description (Optional)</label>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={isAnalyzing ? "Generating description..." : "What's the story behind this photo?"}
                className="w-full bg-stone-800 border border-stone-700 rounded-md px-4 py-2.5 text-stone-200 placeholder-stone-600 focus:outline-none focus:border-stone-500 focus:ring-1 focus:ring-stone-500 transition-all h-24 resize-none font-light"
              />
            </div>
            
            <div className="pt-2 text-xs text-stone-600 text-right font-mono">
              {new Date().toLocaleDateString()}
            </div>

            <button 
              type="submit"
              disabled={!title.trim() || !compressedImage}
              className="w-full py-3 bg-stone-200 hover:bg-white text-stone-900 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2 tracking-wide"
            >
              Save Photo
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [photos, setPhotos] = useState<Photo[]>(() => {
    try {
      const saved = localStorage.getItem('charrose_gallery_photos');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to load photos from local storage", e);
      return [];
    }
  });

  const [albums, setAlbums] = useState<Album[]>(() => {
    try {
      const saved = localStorage.getItem('charrose_gallery_albums');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to load albums", e);
      return [];
    }
  });

  const [activeAlbumId, setActiveAlbumId] = useState<string>('all');
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [tempFile, setTempFile] = useState<File | null>(null); 
  const [isCreatingAlbum, setIsCreatingAlbum] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);
  const [deletingAlbum, setDeletingAlbum] = useState<Album | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isClassificationOpen, setIsClassificationOpen] = useState(false);

  // Persistence effects
  useEffect(() => {
    localStorage.setItem('charrose_gallery_photos', JSON.stringify(photos));
  }, [photos]);

  useEffect(() => {
    localStorage.setItem('charrose_gallery_albums', JSON.stringify(albums));
  }, [albums]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setTempFile(file); 
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCreateAlbum = (name: string) => {
    const newAlbum: Album = {
      id: Date.now().toString(),
      name,
      description: "",
      reason: "",
      photoIds: [],
      tags: [],
      createdBy: "user",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setAlbums(prev => [...prev, newAlbum]);
    setIsCreatingAlbum(false);
    setActiveAlbumId(newAlbum.id); // Switch to new album
  };

  const handleConfirmCreatedAlbums = (newAlbums: Album[]) => {
    setAlbums(prev => {
      const merged = [...prev];
      newAlbums.forEach(na => {
        if (!merged.some(ma => ma.id === na.id)) {
          merged.push(na);
        }
      });
      return merged;
    });
    if (newAlbums.length > 0) {
      setActiveAlbumId(newAlbums[0].id);
    }
    setIsClassificationOpen(false);
  };

  const handleRenameAlbum = (newName: string) => {
    if (!editingAlbum) return;
    setAlbums(prev => prev.map(a => a.id === editingAlbum.id ? { ...a, name: newName } : a));
    setEditingAlbum(null);
  };

  const handleRequestDeleteAlbum = (albumId: string) => {
    const album = albums.find(a => a.id === albumId);
    if (album) {
      setDeletingAlbum(album);
    }
  };

  const handleConfirmDeleteAlbum = () => {
    if (!deletingAlbum) return;
    const albumId = deletingAlbum.id;
    
    // 1. Unassign photos from this album
    setPhotos(prev => prev.map(p => p.albumId === albumId ? { ...p, albumId: undefined } : p));
    
    // 2. Remove album
    setAlbums(prev => prev.filter(a => a.id !== albumId));
    
    // 3. Reset view to all
    setActiveAlbumId('all');
    setDeletingAlbum(null);
  };

  const handleSavePhoto = (title: string, description: string, albumId: string, tags: string[], imageData: string) => {
    let finalAlbumId: string | undefined = albumId || undefined;
    const newPhotoId = Date.now().toString();

    if (albumId && albumId.startsWith('new-album:')) {
      const albumName = albumId.split('new-album:')[1];
      const newAlbumId = `ai-album-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      
      const newAlbum: Album = {
        id: newAlbumId,
        name: albumName,
        description: `Custom album created dynamically via preference sorting rules for ${albumName}.`,
        reason: "Automatically generated, triggered during photo upload matches with your AI preference rules.",
        photoIds: [newPhotoId],
        tags: [albumName.toLowerCase()],
        createdBy: "user",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      setAlbums(prev => [...prev, newAlbum]);
      finalAlbumId = newAlbumId;
    } else if (finalAlbumId) {
      const targetId = finalAlbumId;
      setAlbums(prev => prev.map(a => {
        if (a.id === targetId) {
          const currentPhotoIds = a.photoIds || [];
          if (!currentPhotoIds.includes(newPhotoId)) {
            return { ...a, photoIds: [...currentPhotoIds, newPhotoId] };
          }
        }
        return a;
      }));
    }

    const newPhoto: Photo = {
      id: newPhotoId,
      url: imageData,
      title: title,
      description: description,
      tags: tags,
      date: new Date().toISOString().split('T')[0],
      albumId: finalAlbumId
    };

    setPhotos(prev => [newPhoto, ...prev]);
    setTempFile(null);
  };

  const handleNext = () => {
    if (selectedPhotoIndex === null) return;
    setSelectedPhotoIndex((prev) => (prev! + 1) % filteredPhotos.length);
  };

  const handlePrev = () => {
    if (selectedPhotoIndex === null) return;
    setSelectedPhotoIndex((prev) => (prev! - 1 + filteredPhotos.length) % filteredPhotos.length);
  };

  const handleDelete = (id: string) => {
    setPhotos(prev => prev.filter(p => p.id !== id));
    setSelectedPhotoIndex(null);
  };

  // Filter photos based on active album
  const filteredPhotos = activeAlbumId === 'all' 
    ? photos 
    : activeAlbumId === 'unclassified'
      ? photos.filter(p => !p.albumId && !albums.some(a => a.photoIds?.includes(p.id)))
      : photos.filter(p => p.albumId === activeAlbumId || albums.find(a => a.id === activeAlbumId)?.photoIds?.includes(p.id));

  return (
    <div className="min-h-screen bg-stone-900 text-stone-100 flex flex-col font-sans">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-stone-900/90 backdrop-blur-md border-b border-stone-800 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-stone-100 text-stone-900 rounded-sm">
               <RoseIcon className="w-5 h-5" />
             </div>
             <h1 className="font-serif text-2xl tracking-wide font-medium text-stone-100">Charrose</h1>
          </div>
          
          <div className="flex items-center gap-4">
             <button 
              onClick={() => setIsClassificationOpen(true)}
              disabled={photos.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-transparent hover:bg-stone-800 text-stone-400 hover:text-stone-200 rounded-full transition-all duration-300 border border-stone-800 hover:border-stone-600 disabled:opacity-40 disabled:cursor-not-allowed"
              title="AI Organizer Curation"
            >
              <SparklesIcon className="w-5 h-5 text-stone-300" />
              <span className="text-sm font-medium hidden sm:inline">AI Organizer</span>
            </button>
             <button 
              onClick={() => setIsCreatingAlbum(true)}
              className="flex items-center gap-2 px-4 py-2 bg-transparent hover:bg-stone-800 text-stone-400 hover:text-stone-200 rounded-full transition-all duration-300 border border-stone-800 hover:border-stone-600"
              title="Create New Album"
            >
              <FolderPlusIcon className="w-5 h-5" />
              <span className="text-sm font-medium hidden sm:inline">New Album</span>
            </button>
            <button 
              onClick={handleUploadClick}
              className="group flex items-center gap-2 px-5 py-2 bg-stone-100 hover:bg-white text-stone-900 rounded-full transition-all duration-300 shadow-lg shadow-black/20 hover:shadow-stone-900/40 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PlusIcon className="w-5 h-5 transition-transform group-hover:rotate-90" />
              <span className="font-medium text-sm tracking-wide">Add Photo</span>
            </button>
          </div>
          <input 
            type="file" 
            ref={fileInputRef}
            className="hidden" 
            accept="image/*"
            onChange={handleFileChange}
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow pt-32 px-4 pb-20">
        <div className="max-w-7xl mx-auto">
          {/* Header Intro */}
          <div className="mb-12 text-center max-w-2xl mx-auto space-y-4">
            <h2 className="font-serif text-4xl md:text-5xl text-stone-200 leading-tight tracking-tight">
              Moments
            </h2>
            <p className="text-stone-500 font-light text-lg">
              A curated collection of memories.
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Sidebar Folder Directory */}
            <AlbumSidebar 
              albums={albums}
              photos={photos}
              activeAlbumId={activeAlbumId === "all" ? null : activeAlbumId}
              onSelectAlbum={(id) => setActiveAlbumId(id === null ? "all" : id)}
              onRequestDeleteAlbum={handleRequestDeleteAlbum}
            />

            {/* Gallery View panel */}
            <div className="flex-1 w-full">
              {/* Optional Local Album Metadata Modifiers */}
              {activeAlbumId !== "all" && activeAlbumId !== "unclassified" && (
                <div className="mb-6 flex items-center gap-4 opacity-80 hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => setEditingAlbum(albums.find(a => a.id === activeAlbumId) || null)}
                    className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-stone-500 hover:text-stone-300 transition-colors"
                  >
                    <PencilIcon className="w-4 h-4" />
                    Edit Name
                  </button>
                  <div className="w-px h-3 bg-stone-700"></div>
                  <button 
                    onClick={() => handleRequestDeleteAlbum(activeAlbumId)}
                    className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-stone-500 hover:text-red-400 transition-colors"
                  >
                    <TrashIcon className="w-4 h-4" />
                    Delete Album
                  </button>
                </div>
              )}

              {/* Grid Layout (Masonry-like using columns) */}
              <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
                {filteredPhotos.map((photo, index) => (
                  <PhotoCard 
                    key={photo.id} 
                    photo={photo} 
                    onClick={() => setSelectedPhotoIndex(index)} 
                  />
                ))}
              </div>

              {filteredPhotos.length === 0 && (
                <div className="flex flex-col items-center justify-center py-24 border border-dashed border-stone-800 rounded-lg bg-stone-900/30">
                  <div className="p-4 bg-stone-800 rounded-full mb-4">
                    <RoseIcon className="w-8 h-8 text-stone-600" />
                  </div>
                  <h3 className="text-xl font-serif text-stone-300 mb-2">
                    {activeAlbumId === "all" ? "Your Gallery is Empty" : "Empty Album"}
                  </h3>
                  <p className="text-stone-500 mb-6 max-w-sm text-center font-light">
                    {activeAlbumId === "all" 
                      ? "Upload your first photo to begin your collection." 
                      : "Add a photo to this album to get started."}
                  </p>
                  <button 
                    onClick={handleUploadClick} 
                    className="text-stone-400 underline underline-offset-4 hover:text-stone-200 transition-colors"
                  >
                    Upload a memory
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-stone-700 text-xs tracking-widest uppercase border-t border-stone-800/50">
        <p>© {new Date().getFullYear()} Charrose Gallery</p>
      </footer>

      {/* Upload Modal */}
      {tempFile && (
        <UploadModal 
          file={tempFile} 
          albums={albums}
          currentAlbumId={activeAlbumId}
          onClose={() => setTempFile(null)} 
          onSave={handleSavePhoto} 
        />
      )}

      {/* Create Album Modal */}
      {isCreatingAlbum && (
        <CreateAlbumModal 
          onClose={() => setIsCreatingAlbum(false)}
          onSave={handleCreateAlbum}
        />
      )}

      {/* AI Curation Wizard Overlay */}
      {isClassificationOpen && (
        <ClassificationWizard
          photos={photos}
          albums={albums}
          onClose={() => setIsClassificationOpen(false)}
          onConfirmCreated={handleConfirmCreatedAlbums}
        />
      )}

      {/* Edit Album Modal */}
      {editingAlbum && (
        <EditAlbumModal 
          album={editingAlbum}
          onClose={() => setEditingAlbum(null)}
          onSave={handleRenameAlbum}
        />
      )}

      {/* Delete Album Modal */}
      {deletingAlbum && (
        <DeleteAlbumModal 
          album={deletingAlbum}
          onClose={() => setDeletingAlbum(null)}
          onConfirm={handleConfirmDeleteAlbum}
        />
      )}

      {/* Lightbox */}
      {selectedPhotoIndex !== null && filteredPhotos[selectedPhotoIndex] && (
        <Lightbox 
          photo={filteredPhotos[selectedPhotoIndex]} 
          onClose={() => setSelectedPhotoIndex(null)}
          onNext={handleNext}
          onPrev={handlePrev}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}