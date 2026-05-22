import { Album } from "../types";

const LOCAL_STORAGE_KEY = "charrose_gallery_albums";

/**
 * albumService provides the interaction logic for logical photo albums.
 * It simulates background persistence (storing beautifully indented JSON/text string to localStorage)
 * and offers clean wrappers that align with the requested backend models.
 */

export const albumService = {
  /**
   * Reads all logical albums from localStorage (simulating charrose_albums.json)
   */
  getAll: (): Album[] => {
    try {
      const data = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!data) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([], null, 2));
        return [];
      }
      return JSON.parse(data) as Album[];
    } catch (e) {
      console.error("⚠️ Local albums JSON file corrupted! Backing up and auto-recreating a clean one.");
      try {
        // Back up corrupted state
        const stale = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (stale) {
          localStorage.setItem(`${LOCAL_STORAGE_KEY}.bak`, stale);
        }
      } catch (err) {
        console.error("Backup failed", err);
      }
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([], null, 2));
      return [];
    }
  },

  /**
   * Batches multiple suggested albums into confirmed user logical albums
   */
  createMany: (newAlbums: Album[]): Album[] => {
    try {
      const albums = albumService.getAll();
      const updated = [...albums, ...newAlbums];
      albumService.save(updated);
      return updated;
    } catch (e) {
      console.error("Failed to create many albums:", e);
      return [];
    }
  },

  /**
   * Updates an album's metadata or image associations
   */
  update: (albumId: string, updates: Partial<Album>): Album[] => {
    try {
      const albums = albumService.getAll();
      const updated = albums.map(album => {
        if (album.id === albumId) {
          return {
            ...album,
            ...updates,
            updatedAt: new Date().toISOString()
          };
        }
        return album;
      });
      albumService.save(updated);
      return updated;
    } catch (e) {
      console.error("Failed to update album:", e);
      return [];
    }
  },

  /**
   * Deletes a logical album without removing any physical photos from the library
   */
  delete: (albumId: string): Album[] => {
    try {
      const albums = albumService.getAll();
      const updated = albums.filter(album => album.id !== albumId);
      albumService.save(updated);
      return updated;
    } catch (e) {
      console.error("Failed to delete album:", e);
      return [];
    }
  },

  /**
   * Save full logical album dataset (used as fallback/direct update)
   */
  save: (albums: Album[]): void => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(albums, null, 2));
    } catch (e) {
      console.error("Failed saving logical albums, storage full?", e);
    }
  }
};
