/**
 * Offline-first data cache using IndexedDB for persistent storage
 * Falls back to localStorage if IndexedDB is not available
 * Provides fast local access and background sync capabilities
 */

const DB_NAME = 'pipr-cache';
const DB_VERSION = 1;
const LS_PREFIX = 'pipr_';

// Store names
const STORES = {
  FEEDS: 'feeds',
  BABIES: 'babies',
  USER: 'user',
  SYNC_QUEUE: 'sync-queue'
};

type SyncOperation = {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: 'feed' | 'baby';
  data: any;
  timestamp: number;
  retries: number;
};

// Check if IndexedDB is available
const hasIndexedDB = typeof window !== 'undefined' && 'indexedDB' in window;

class CacheDB {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;
  private useLocalStorage = false;

  async init(): Promise<void> {
    if (typeof window === 'undefined') return;
    
    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    // Try IndexedDB first
    if (hasIndexedDB) {
      this.initPromise = new Promise((resolve) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
          console.warn('[Cache] IndexedDB failed, falling back to localStorage');
          this.useLocalStorage = true;
          resolve();
        };
        
        request.onsuccess = () => {
          this.db = request.result;
          resolve();
        };

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;

          // Feeds store
          if (!db.objectStoreNames.contains(STORES.FEEDS)) {
            const feedStore = db.createObjectStore(STORES.FEEDS, { keyPath: 'id' });
            feedStore.createIndex('babyId', 'babyId', { unique: false });
            feedStore.createIndex('occurredAt', 'occurredAt', { unique: false });
            feedStore.createIndex('familySpaceId', 'familySpaceId', { unique: false });
          }

          // Babies store
          if (!db.objectStoreNames.contains(STORES.BABIES)) {
            db.createObjectStore(STORES.BABIES, { keyPath: 'id' });
          }

          // User store
          if (!db.objectStoreNames.contains(STORES.USER)) {
            db.createObjectStore(STORES.USER, { keyPath: 'id' });
          }

          // Sync queue store
          if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
            const syncStore = db.createObjectStore(STORES.SYNC_QUEUE, { keyPath: 'id' });
            syncStore.createIndex('timestamp', 'timestamp', { unique: false });
          }
        };
      });
    } else {
      // Use localStorage
      this.useLocalStorage = true;
      this.initPromise = Promise.resolve();
    }

    return this.initPromise;
  }

  // LocalStorage helpers
  private getLSKey(storeName: string, key?: string): string {
    return key ? `${LS_PREFIX}${storeName}_${key}` : `${LS_PREFIX}${storeName}`;
  }

  private getLSStore(storeName: string): any[] {
    try {
      const data = localStorage.getItem(this.getLSKey(storeName));
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private setLSStore(storeName: string, data: any[]): void {
    try {
      localStorage.setItem(this.getLSKey(storeName), JSON.stringify(data));
    } catch (e) {
      console.error('[Cache] localStorage write failed:', e);
    }
  }

  // Generic get/put operations
  async get<T>(storeName: string, key: string): Promise<T | null> {
    await this.init();
    
    if (this.useLocalStorage) {
      const items = this.getLSStore(storeName);
      return items.find((item: any) => item.id === key) || null;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async getAll<T>(storeName: string): Promise<T[]> {
    await this.init();
    
    if (this.useLocalStorage) {
      return this.getLSStore(storeName);
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async put(storeName: string, value: any): Promise<void> {
    await this.init();
    
    if (this.useLocalStorage) {
      const items = this.getLSStore(storeName);
      const index = items.findIndex((item: any) => item.id === value.id);
      if (index >= 0) {
        items[index] = value;
      } else {
        items.push(value);
      }
      this.setLSStore(storeName, items);
      return;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(value);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async delete(storeName: string, key: string): Promise<void> {
    await this.init();
    
    if (this.useLocalStorage) {
      const items = this.getLSStore(storeName);
      const filtered = items.filter((item: any) => item.id !== key);
      this.setLSStore(storeName, filtered);
      return;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clear(storeName: string): Promise<void> {
    await this.init();
    
    if (this.useLocalStorage) {
      this.setLSStore(storeName, []);
      return;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Sync queue operations
  async addToSyncQueue(operation: Omit<SyncOperation, 'id' | 'timestamp' | 'retries'>): Promise<string> {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const syncOp: SyncOperation = {
      id,
      ...operation,
      timestamp: Date.now(),
      retries: 0
    };
    await this.put(STORES.SYNC_QUEUE, syncOp);
    return id;
  }

  async getSyncQueue(): Promise<SyncOperation[]> {
    return this.getAll<SyncOperation>(STORES.SYNC_QUEUE);
  }

  async removeSyncOperation(id: string): Promise<void> {
    await this.delete(STORES.SYNC_QUEUE, id);
  }

  async updateSyncOperation(operation: SyncOperation): Promise<void> {
    await this.put(STORES.SYNC_QUEUE, operation);
  }
}

// Singleton instance
export const cacheDB = new CacheDB();

// Cache API with business logic
export const cache = {
  // Feeds
  async getFeeds(): Promise<any[]> {
    return cacheDB.getAll(STORES.FEEDS);
  },

  async getFeedsByDateRange(start: Date, end: Date): Promise<any[]> {
    const allFeeds = await cacheDB.getAll(STORES.FEEDS);
    return allFeeds.filter((feed: any) => {
      const occurredAt = new Date(feed.occurredAt);
      return occurredAt >= start && occurredAt <= end;
    });
  },

  async saveFeed(feed: any): Promise<void> {
    await cacheDB.put(STORES.FEEDS, feed);
  },

  async saveFeeds(feeds: any[]): Promise<void> {
    for (const feed of feeds) {
      await cacheDB.put(STORES.FEEDS, feed);
    }
  },

  async deleteFeed(id: string): Promise<void> {
    await cacheDB.delete(STORES.FEEDS, id);
  },

  // Babies
  async getBabies(): Promise<any[]> {
    return cacheDB.getAll(STORES.BABIES);
  },

  async saveBaby(baby: any): Promise<void> {
    await cacheDB.put(STORES.BABIES, baby);
  },

  async saveBabies(babies: any[]): Promise<void> {
    for (const baby of babies) {
      await cacheDB.put(STORES.BABIES, baby);
    }
  },

  // User
  async getUser(): Promise<any | null> {
    const users = await cacheDB.getAll(STORES.USER);
    return users[0] || null;
  },

  async saveUser(user: any): Promise<void> {
    await cacheDB.clear(STORES.USER);
    await cacheDB.put(STORES.USER, user);
  },

  // Sync queue
  async queueOperation(operation: Omit<SyncOperation, 'id' | 'timestamp' | 'retries'>): Promise<string> {
    return cacheDB.addToSyncQueue(operation);
  },

  async getSyncQueue(): Promise<SyncOperation[]> {
    return cacheDB.getSyncQueue();
  },

  async removeSyncOperation(id: string): Promise<void> {
    await cacheDB.removeSyncOperation(id);
  },

  async updateSyncOperation(operation: SyncOperation): Promise<void> {
    await cacheDB.updateSyncOperation(operation);
  },

  // Clear all caches
  async clearAll(): Promise<void> {
    await cacheDB.clear(STORES.FEEDS);
    await cacheDB.clear(STORES.BABIES);
    await cacheDB.clear(STORES.USER);
  }
};
