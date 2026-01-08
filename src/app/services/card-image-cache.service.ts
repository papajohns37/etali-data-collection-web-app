import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, of, throwError } from 'rxjs';
import { switchMap, map, catchError, tap } from 'rxjs/operators';

/**
 * Represents a cached card image entry in IndexedDB
 */
interface CachedImage {
  cardName: string;
  imageBlob: Blob;
  url: string;
  cachedAt: Date;
  size: number;
}

/**
 * Statistics about the current cache state
 */
export interface CacheStats {
  count: number;
  totalSize: number;
  oldestEntry: Date | null;
  newestEntry: Date | null;
}

/**
 * Service for caching Magic: The Gathering card images in IndexedDB.
 * Provides persistent, offline-capable image storage with automatic cleanup.
 * 
 * Features:
 * - Stores images as Blobs in IndexedDB
 * - 90-day TTL for cached images
 * - 50MB storage limit with automatic cleanup
 * - Transparent fallback to network on cache miss
 */
@Injectable({
  providedIn: 'root'
})
export class CardImageCacheService {
  private http = inject(HttpClient);
  
  private readonly DB_NAME = 'mtg-card-images';
  private readonly STORE_NAME = 'images';
  private readonly DB_VERSION = 1;
  private readonly MAX_AGE_DAYS = 90;
  private readonly MAX_SIZE_BYTES = 50 * 1024 * 1024; // 50MB
  
  private db: IDBDatabase | null = null;
  private dbInitPromise: Promise<IDBDatabase>;

  constructor() {
    this.dbInitPromise = this.initDB();
  }

  /**
   * Initialize IndexedDB database and create object store if needed
   */
  private async initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          const store = db.createObjectStore(this.STORE_NAME, { 
            keyPath: 'cardName' 
          });
          
          // Create index on cachedAt for efficient cleanup queries
          store.createIndex('cachedAt', 'cachedAt', { unique: false });
        }
      };
    });
  }

  /**
   * Get a card image URL, fetching from cache or network
   * Returns a blob URL that can be used in img src attributes
   */
  getImage(cardName: string): Observable<string> {
    if (!cardName) {
      return throwError(() => new Error('Card name is required'));
    }

    return from(this.dbInitPromise).pipe(
      switchMap(() => from(this.getFromCache(cardName))),
      switchMap(cached => {
        // Return cached image if valid
        if (cached && !this.isExpired(cached)) {
          return of(URL.createObjectURL(cached.imageBlob));
        }
        
        // Fetch from network and cache
        return this.fetchAndCache(cardName);
      }),
      catchError(error => {
        console.error(`Error loading image for ${cardName}:`, error);
        // Return empty string on error to prevent broken images
        return of('');
      })
    );
  }

  /**
   * Preload multiple card images in the background
   * Useful for preloading the next hand while user evaluates current hand
   */
  preloadImages(cardNames: string[]): Observable<void> {
    if (!cardNames || cardNames.length === 0) {
      return of(void 0);
    }

    return from(this.dbInitPromise).pipe(
      switchMap(() => {
        const preloadPromises = cardNames.map(name => 
          this.getImage(name).toPromise().catch(() => {
            // Silently ignore preload errors
            console.warn(`Failed to preload image for ${name}`);
          })
        );
        return from(Promise.all(preloadPromises));
      }),
      map(() => void 0)
    );
  }

  /**
   * Get statistics about the current cache state
   */
  async getCacheStats(): Promise<CacheStats> {
    await this.dbInitPromise;
    
    const db = this.db;
    if (!db) {
      return { count: 0, totalSize: 0, oldestEntry: null, newestEntry: null };
    }

    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.STORE_NAME, 'readonly');
      const store = tx.objectStore(this.STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const entries: CachedImage[] = request.result;
        
        if (entries.length === 0) {
          resolve({ count: 0, totalSize: 0, oldestEntry: null, newestEntry: null });
          return;
        }

        const totalSize = entries.reduce((sum, entry) => sum + entry.size, 0);
        const dates = entries.map(e => new Date(e.cachedAt));
        const oldestEntry = new Date(Math.min(...dates.map(d => d.getTime())));
        const newestEntry = new Date(Math.max(...dates.map(d => d.getTime())));

        resolve({
          count: entries.length,
          totalSize,
          oldestEntry,
          newestEntry
        });
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clear all cached images
   */
  async clearCache(): Promise<void> {
    await this.dbInitPromise;
    
    const db = this.db;
    if (!db) return;

    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.STORE_NAME, 'readwrite');
      const store = tx.objectStore(this.STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => {
        console.log('Cache cleared successfully');
        resolve();
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get an image from the cache
   */
  private async getFromCache(cardName: string): Promise<CachedImage | null> {
    const db = this.db;
    if (!db) return null;

    return new Promise((resolve) => {
      const tx = db.transaction(this.STORE_NAME, 'readonly');
      const store = tx.objectStore(this.STORE_NAME);
      const request = store.get(cardName);

      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          // Convert cachedAt back to Date if it was stored as string
          result.cachedAt = new Date(result.cachedAt);
        }
        resolve(result || null);
      };
      
      request.onerror = () => {
        console.warn(`Failed to get ${cardName} from cache:`, request.error);
        resolve(null);
      };
    });
  }

  /**
   * Check if a cached image has expired
   */
  private isExpired(cached: CachedImage): boolean {
    const now = new Date();
    const age = now.getTime() - new Date(cached.cachedAt).getTime();
    const maxAge = this.MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
    return age > maxAge;
  }

  /**
   * Fetch an image from Scryfall and cache it
   */
  private fetchAndCache(cardName: string): Observable<string> {
    const url = this.buildScryfallUrl(cardName);
    
    return this.http.get(url, { responseType: 'blob' }).pipe(
      switchMap(blob => 
        from(this.saveToCache(cardName, blob, url)).pipe(
          map(() => URL.createObjectURL(blob))
        )
      ),
      tap(() => {
        // Trigger cleanup check after successful fetch
        this.checkAndCleanup().catch(err => 
          console.warn('Cache cleanup failed:', err)
        );
      })
    );
  }

  /**
   * Build Scryfall API URL for a card image
   */
  private buildScryfallUrl(cardName: string): string {
    const formattedName = cardName
      .replace(/ /g, '+')
      .replace(/'/g, '%27')
      .replace(/,/g, '%2C');
    
    // Use 'normal' size for better performance (smaller than 'large', larger than 'small')
    return `https://api.scryfall.com/cards/named?exact=${formattedName}&format=image&version=normal`;
  }

  /**
   * Save an image blob to the cache
   */
  private async saveToCache(cardName: string, blob: Blob, url: string): Promise<void> {
    const db = this.db;
    if (!db) return;

    const entry: CachedImage = {
      cardName,
      imageBlob: blob,
      url,
      cachedAt: new Date(),
      size: blob.size
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.STORE_NAME, 'readwrite');
      const store = tx.objectStore(this.STORE_NAME);
      const request = store.put(entry);

      request.onsuccess = () => resolve();
      request.onerror = () => {
        console.warn(`Failed to cache ${cardName}:`, request.error);
        // Don't reject - caching failure shouldn't break the app
        resolve();
      };
    });
  }

  /**
   * Check cache size and cleanup old entries if needed
   */
  private async checkAndCleanup(): Promise<void> {
    const stats = await this.getCacheStats();
    
    if (stats.totalSize > this.MAX_SIZE_BYTES) {
      await this.cleanupOldEntries();
    }
  }

  /**
   * Remove oldest entries until cache is under size limit
   */
  private async cleanupOldEntries(): Promise<void> {
    const db = this.db;
    if (!db) return;

    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.STORE_NAME, 'readwrite');
      const store = tx.objectStore(this.STORE_NAME);
      const index = store.index('cachedAt');
      
      // Get all entries sorted by cachedAt (oldest first)
      const request = index.openCursor();
      let currentSize = 0;
      const entriesToKeep: string[] = [];

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        
        if (cursor) {
          const entry: CachedImage = cursor.value;
          currentSize += entry.size;
          
          // Keep entries until we're under 80% of max size (leave some headroom)
          if (currentSize < this.MAX_SIZE_BYTES * 0.8) {
            entriesToKeep.push(entry.cardName);
          }
          
          cursor.continue();
        } else {
          // Finished iterating - now delete old entries
          const allRequest = store.getAllKeys();
          
          allRequest.onsuccess = () => {
            const allKeys = allRequest.result as string[];
            const keysToDelete = allKeys.filter(key => !entriesToKeep.includes(key));
            
            keysToDelete.forEach(key => store.delete(key));
            
            console.log(`Cleaned up ${keysToDelete.length} old cache entries`);
            resolve();
          };
          
          allRequest.onerror = () => reject(allRequest.error);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }
}
