/**
 * Background sync manager for offline-first functionality
 * Handles syncing cached data with the server when online
 */

import { cache } from './cache';

type SyncStatus = 'idle' | 'syncing' | 'error';
type ConnectionStatus = 'online' | 'offline';

const MAX_RETRY_ATTEMPTS = 5;
const SYNC_INTERVAL_MS = 30000; // 30 seconds
const ERROR_RESET_DELAY_MS = 5000; // 5 seconds

class SyncManager {
  private syncStatus: SyncStatus = 'idle';
  private connectionStatus: ConnectionStatus = 'online';
  private syncInterval: NodeJS.Timeout | null = null;
  private listeners: Set<(_status: { sync: SyncStatus; connection: ConnectionStatus }) => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      // Listen to online/offline events
      window.addEventListener('online', () => this.handleOnline());
      window.addEventListener('offline', () => this.handleOffline());

      // Set initial connection status
      this.connectionStatus = navigator.onLine ? 'online' : 'offline';

      // Start periodic sync
      this.startPeriodicSync();
    }
  }

  private handleOnline() {
    console.log('[Sync] Connection restored');
    this.connectionStatus = 'online';
    this.notifyListeners();
    this.sync();
  }

  private handleOffline() {
    console.log('[Sync] Connection lost');
    this.connectionStatus = 'offline';
    this.notifyListeners();
  }

  private startPeriodicSync() {
    // Sync every 30 seconds when online
    this.syncInterval = setInterval(() => {
      if (this.connectionStatus === 'online') {
        this.sync();
      }
    }, SYNC_INTERVAL_MS);
  }

  private notifyListeners() {
    this.listeners.forEach(listener => {
      listener({
        sync: this.syncStatus,
        connection: this.connectionStatus
      });
    });
  }

  subscribe(listener: (_status: { sync: SyncStatus; connection: ConnectionStatus }) => void) {
    this.listeners.add(listener);
    // Immediately notify with current status
    listener({
      sync: this.syncStatus,
      connection: this.connectionStatus
    });

    return () => {
      this.listeners.delete(listener);
    };
  }

  async sync(): Promise<void> {
    if (this.syncStatus === 'syncing' || this.connectionStatus === 'offline') {
      return;
    }

    try {
      this.syncStatus = 'syncing';
      this.notifyListeners();

      console.log('[Sync] Starting sync...');

      // Process sync queue
      const queue = await cache.getSyncQueue();
      console.log(`[Sync] Processing ${queue.length} queued operations`);

      for (const operation of queue) {
        try {
          await this.processSyncOperation(operation);
          await cache.removeSyncOperation(operation.id);
        } catch (error) {
          console.error('[Sync] Failed to process operation:', error);
          
          // Update retry count
          operation.retries += 1;
          
          // Remove if too many retries
          if (operation.retries > MAX_RETRY_ATTEMPTS) {
            console.error('[Sync] Max retries reached, removing operation');
            await cache.removeSyncOperation(operation.id);
          } else {
            await cache.updateSyncOperation(operation);
          }
        }
      }

      // Fetch latest data from server to update cache
      await this.fetchAndCacheData();

      this.syncStatus = 'idle';
      this.notifyListeners();
      console.log('[Sync] Sync completed');
    } catch (error) {
      console.error('[Sync] Sync failed:', error);
      this.syncStatus = 'error';
      this.notifyListeners();

      // Reset to idle after a delay
      setTimeout(() => {
        this.syncStatus = 'idle';
        this.notifyListeners();
      }, ERROR_RESET_DELAY_MS);
    }
  }

  private async processSyncOperation(operation: any): Promise<void> {
    const { type, entity, data } = operation;

    if (entity === 'feed') {
      if (type === 'create') {
        const response = await fetch('/api/feeds', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });

        if (!response.ok) throw new Error('Failed to create feed');

        const result = await response.json();
        // Update cache with server response (which includes server-generated ID)
        if (result.feed) {
          await cache.saveFeed(result.feed);
          // Remove temporary ID if different
          if (data.id !== result.feed.id) {
            await cache.deleteFeed(data.id);
          }
        }
      } else if (type === 'update') {
        const response = await fetch(`/api/feeds/${data.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });

        if (!response.ok) throw new Error('Failed to update feed');

        const result = await response.json();
        if (result.feed) {
          await cache.saveFeed(result.feed);
        }
      } else if (type === 'delete') {
        const response = await fetch(`/api/feeds/${data.id}`, {
          method: 'DELETE'
        });

        if (!response.ok) throw new Error('Failed to delete feed');

        await cache.deleteFeed(data.id);
      }
    }
  }

  private async fetchAndCacheData(): Promise<void> {
    try {
      // Fetch feeds
      const feedsResponse = await fetch('/api/feeds');
      if (feedsResponse.ok) {
        const feedsData = await feedsResponse.json();
        if (feedsData.feeds) {
          await cache.saveFeeds(feedsData.feeds);
        }
      }

      // Fetch babies
      const babiesResponse = await fetch('/api/babies');
      if (babiesResponse.ok) {
        const babiesData = await babiesResponse.json();
        if (babiesData.babies) {
          await cache.saveBabies(babiesData.babies);
        }
      }

      // Fetch user
      const userResponse = await fetch('/api/me');
      if (userResponse.ok) {
        const userData = await userResponse.json();
        await cache.saveUser(userData);
      }
    } catch (error) {
      console.error('[Sync] Failed to fetch data:', error);
      // Don't throw - this is not critical
    }
  }

  getStatus() {
    return {
      sync: this.syncStatus,
      connection: this.connectionStatus
    };
  }

  isOnline() {
    return this.connectionStatus === 'online';
  }

  destroy() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
  }
}

// Singleton instance
export const syncManager = new SyncManager();
