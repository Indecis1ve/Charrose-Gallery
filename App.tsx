import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Photo } from './types';
import { PlusIcon, XMarkIcon, RoseIcon, ChevronLeftIcon, ChevronRightIcon, TrashIcon, SparklesIcon } from './components/Icons';
import { analyzeImage } from './services/geminiService';

// --- Node.js Integration (Local File Storage) ---

// 1. 获取 Node.js 的 require 方法
// 使用 try-catch 防止在非 Electron 环境下报错（虽然这里主要是 Electron）
let fs: any, path: any, Buffer: any, nodeProcess: any, PHOTO_DIR: string;

try {
  const requireNode = (window as any).require;
  fs = requireNode('fs');
  path = requireNode('path');
  Buffer = requireNode('buffer').Buffer;
  nodeProcess = requireNode('process');
  
  // 2. 设定图片存储文件夹
  PHOTO_DIR = path.join(nodeProcess.cwd(), 'charrose_photos');

  // 初始化时确保文件夹存在
  if (!fs.existsSync(PHOTO_DIR)) {
    fs.mkdirSync(PHOTO_DIR, { recursive: true });
    console.log("Created photo directory:", PHOTO_DIR);
  }
} catch (e) {
  console.error("Node integration failed. Are you running in Electron?", e);
}

// --- Utilities ---

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
    if (window.confirm("Are you sure you want to delete this photo?")) {
      onDelete(photo.id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/98 backdrop-blur-sm transition-opacity duration-500">
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

      <button 
        onClick={(e) => { e.stopPropagation(); onPrev(); }}
        className="absolute left-4 top-1/2 -translate-y-1/2 p-4 text-stone-500 hover:text-stone-200 hover:bg-stone-900/50 rounded-full transition-all hidden md:block"
      >
        <ChevronLeftIcon className="w-8 h-8" />
      </button>

      <button 
        onClick={(e) => { e.stopPropagation(); onNext(); }}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-4 text-stone-500 hover:text-stone-200 hover:bg-stone-900/50 rounded-full transition-all hidden md:block"
      >
        <ChevronRightIcon className="w-8 h-8" />
      </button>

      <div className="relative w-full h-full max-w-7xl max-h-screen p-4 md:p-12 flex flex-col md:flex-row gap-8 items-center justify-center">
        <div className="relative flex-1 flex items-center justify-center w-full h-full">
          <img 
            src={photo.url} 
            alt={photo.title}
            className="max-w-full max-h-[85vh] object-contain shadow-2xl rounded-sm"
          />
        </div>

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

// Simplified Upload Modal - No Album Selection
const UploadModal = ({
  file,
  onClose,
  onSave
}: {
  file: File;
  onClose: () => void;
  onSave: (title: string, description: string, tags: string[], imageData: string) => void;
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [preview, setPreview] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [compressedImage, setCompressedImage] = useState<string>("");

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      setIsAnalyzing(true);
      try {
        const objectUrl = URL.createObjectURL(file);
        if (isMounted) setPreview(objectUrl);

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = async () => {
             const originalBase64 = reader.result as string;
             const compressed = await compressImage(originalBase64);
             
             if (!isMounted) return;
             
             setCompressedImage(compressed);
             setPreview(compressed); 

             const parts = compressed.split(',');
             const mimeType = parts[0].split(':')[1].split(';')[0];
             const base64Data = parts[1];

             try {
                const aiResult = await analyzeImage(base64Data, mimeType);
                if (isMounted) {
                    setTitle(aiResult.title);
                    setDescription(aiResult.description);
                    setTags(aiResult.tags);
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
  }, [file]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !compressedImage) return;
    onSave(title, description, tags, compressedImage);
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
      if (!saved) return [];

      const parsedPhotos = JSON.parse(saved) as Photo[];

      // 【核心修复】自动过滤掉那些硬盘上不存在的“幽灵”照片
      if (fs) { // 确保 fs 模块已加载
        const validPhotos = parsedPhotos.filter(p => {
          // 如果是本地文件路径 (file:// 开头)
          if (p.url.startsWith('file://')) {
            try {
              // 去掉 file:// 前缀，还原为真实路径
              const cleanPath = p.url.replace('file://', '');
              // 检查文件是否存在
              const exists = fs.existsSync(cleanPath);
              if (!exists) {
                console.warn("Found missing photo, removing from cache:", cleanPath);
              }
              return exists;
            } catch (err) {
              return false; // 路径有问题，过滤掉
            }
          }
          // 如果是旧版本的 Base64 图片，或者网络图片，保留它
          return true;
        });
        
        // 如果发现有无效照片被过滤了，顺便更新一下 localStorage，彻底清除它们
        if (validPhotos.length !== parsedPhotos.length) {
          setTimeout(() => {
             localStorage.setItem('charrose_gallery_photos', JSON.stringify(validPhotos));
          }, 1000);
        }
        
        return validPhotos;
      }
      
      return parsedPhotos;
    } catch (e) {
      console.error("Failed to load photos from local storage", e);
      return [];
    }
  });

  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [tempFile, setTempFile] = useState<File | null>(null); 
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem('charrose_gallery_photos', JSON.stringify(photos));
  }, [photos]);

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

  // --- 保存照片逻辑 (不再需要 albumId) ---
  const handleSavePhoto = (title: string, description: string, tags: string[], imageData: string) => {
    const timestamp = Date.now().toString();
    const filename = `${timestamp}.jpg`;
    
    // 默认路径
    let filePath = filename;
    
    // 如果 Node 环境可用，保存到磁盘
    if (fs && PHOTO_DIR) {
      filePath = path.join(PHOTO_DIR, filename);
      try {
          const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
          const buffer = Buffer.from(base64Data, 'base64');
          fs.writeFileSync(filePath, buffer);
          console.log("Photo saved successfully to:", filePath);
          
          // 更新 filePath 为 file:// 协议路径
          filePath = `file://${filePath.replace(/\\/g, '/')}`;
      } catch (err) {
          console.error("Failed to save file:", err);
          alert("保存图片到硬盘失败，请检查目录权限。");
          return;
      }
    } else {
       // 如果没有 Node 环境（比如在浏览器预览），回退到存 Base64
       filePath = imageData; 
    }

    const newPhoto: Photo = {
      id: timestamp,
      url: filePath,
      title: title,
      description: description,
      tags: tags,
      date: new Date().toISOString().split('T')[0]
      // albumId 字段已移除
    };

    setPhotos(prev => [newPhoto, ...prev]);
    setTempFile(null);
  };

  const handleNext = () => {
    if (selectedPhotoIndex === null) return;
    setSelectedPhotoIndex((prev) => (prev! + 1) % photos.length);
  };

  const handlePrev = () => {
    if (selectedPhotoIndex === null) return;
    setSelectedPhotoIndex((prev) => (prev! - 1 + photos.length) % photos.length);
  };

  // --- 删除照片逻辑 ---
  const handleDelete = (id: string) => {
    const photoToDelete = photos.find(p => p.id === id);
    
    // 如果是本地文件，尝试从硬盘删除
    if (photoToDelete && photoToDelete.url.startsWith('file://') && fs) {
        try {
            const cleanPath = photoToDelete.url.replace('file://', '');
            if (fs.existsSync(cleanPath)) {
                fs.unlinkSync(cleanPath);
                console.log("File deleted from disk:", cleanPath);
            }
        } catch (e) {
            console.error("Error deleting file from disk:", e);
        }
    }

    setPhotos(prev => prev.filter(p => p.id !== id));
    setSelectedPhotoIndex(null);
  };

  return (
    <div className="min-h-screen bg-stone-900 text-stone-100 flex flex-col font-sans">
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

      <main className="flex-grow pt-32 px-4 pb-20">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12 text-center max-w-2xl mx-auto space-y-4">
            <h2 className="font-serif text-4xl md:text-5xl text-stone-200 leading-tight tracking-tight">
              Moments
            </h2>
            <p className="text-stone-500 font-light text-lg">
              A curated collection of memories.
            </p>
          </div>

          <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
            {photos.map((photo, index) => (
              <PhotoCard 
                key={photo.id} 
                photo={photo} 
                onClick={() => setSelectedPhotoIndex(index)} 
              />
            ))}
          </div>

          {photos.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 border border-dashed border-stone-800 rounded-lg bg-stone-900/30">
              <div className="p-4 bg-stone-800 rounded-full mb-4">
                <RoseIcon className="w-8 h-8 text-stone-600" />
              </div>
              <h3 className="text-xl font-serif text-stone-300 mb-2">
                Your Gallery is Empty
              </h3>
              <p className="text-stone-500 mb-6 max-w-sm text-center font-light">
                Upload your first photo to begin your collection.
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
      </main>

      <footer className="py-8 text-center text-stone-700 text-xs tracking-widest uppercase border-t border-stone-800/50">
        <p>© {new Date().getFullYear()} Charrose Gallery</p>
      </footer>

      {tempFile && (
        <UploadModal 
          file={tempFile} 
          onClose={() => setTempFile(null)} 
          onSave={handleSavePhoto} 
        />
      )}

      {selectedPhotoIndex !== null && photos[selectedPhotoIndex] && (
        <Lightbox 
          photo={photos[selectedPhotoIndex]} 
          onClose={() => setSelectedPhotoIndex(null)}
          onNext={handleNext}
          onPrev={handlePrev}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}