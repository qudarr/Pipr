'use client';

import { useState, useEffect, useCallback } from 'react';
import { cache } from './cache';
import { syncManager } from './sync';

export type Baby = {
  id: string;
  name: string;
  birthdate?: string;
};

export type FeedEvent = {
  id: string;
  babyId: string;
  occurredAt: string;
  feedType: 'Bottle' | 'Breast';
  amountMl?: number;
  bottleType?: string;
  firstSide?: string;
  firstDurationSec?: number;
  secondDurationSec?: number;
  totalDurationSec?: number;
  autoSwitchUsed?: boolean;
  autoStopUsed?: boolean;
  notes?: string;
};

export type UserData = {
  user?: {
    id: string;
    email: string;
    displayName: string;
  };
  membership?: {
    familySpaceId: string;
    role: string;
  };
};

export function useUser() {
  const [data, setData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      try {
        // Try cache first
        const cached = await cache.getUser();
        if (cached) {
          setData(cached);
          setLoading(false);
        }

        // Then fetch from server
        const res = await fetch('/api/me');
        const serverData = await res.json();
        setData(serverData);
        await cache.saveUser(serverData);
      } catch (err) {
        console.error('Failed to load user:', err);
        setData(null);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  return { data, loading, hasFamily: !!data?.membership };
}

export function useBabies() {
  const [babies, setBabies] = useState<Baby[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      // Load from cache first
      const cached = await cache.getBabies();
      if (cached.length > 0) {
        setBabies(cached);
        setLoading(false);
      }

      // Then fetch from server in background
      const res = await fetch('/api/babies');
      const data = await res.json();
      const serverBabies = data.babies ?? [];
      setBabies(serverBabies);
      await cache.saveBabies(serverBabies);
    } catch (err) {
      console.error('Failed to load babies:', err);
      // Keep cached data on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { babies, loading, refresh };
}

export function useFeeds(options?: {
  start?: string;
  end?: string;
  babyId?: string;
}) {
  const [feeds, setFeeds] = useState<FeedEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      // Load from cache first for instant display
      let cachedFeeds: FeedEvent[];
      
      if (options?.start && options?.end) {
        cachedFeeds = await cache.getFeedsByDateRange(
          new Date(options.start),
          new Date(options.end)
        );
      } else {
        cachedFeeds = await cache.getFeeds();
      }

      // Apply filters
      let filtered = cachedFeeds;
      if (options?.babyId) {
        filtered = filtered.filter((f: any) => f.babyId === options.babyId);
      }

      if (filtered.length > 0) {
        setFeeds(filtered);
        setLoading(false);
      }

      // Fetch from server in background
      const params = new URLSearchParams();
      if (options?.start) params.set('start', options.start);
      if (options?.end) params.set('end', options.end);
      if (options?.babyId) params.set('babyId', options.babyId);

      const url = '/api/feeds' + (params.toString() ? `?${params}` : '');
      const res = await fetch(url);
      const data = await res.json();
      const serverFeeds = data.feeds ?? [];
      
      setFeeds(serverFeeds);
      await cache.saveFeeds(serverFeeds);
    } catch (err) {
      console.error('Failed to load feeds:', err);
      // Keep cached data on error
    } finally {
      setLoading(false);
    }
  }, [options?.start, options?.end, options?.babyId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { feeds, loading, refresh, mutate: refresh };
}

export function useTodayFeeds(babyId?: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return useFeeds({
    start: today.toISOString(),
    end: tomorrow.toISOString(),
    babyId
  });
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
}

// Hook to track online/offline status
export function useOnlineStatus() {
  const [status, setStatus] = useState<{
    isOnline: boolean;
    isSyncing: boolean;
  }>({
    isOnline: true,
    isSyncing: false
  });

  useEffect(() => {
    const unsubscribe = syncManager.subscribe((syncStatus) => {
      setStatus({
        isOnline: syncStatus.connection === 'online',
        isSyncing: syncStatus.sync === 'syncing'
      });
    });

    return unsubscribe;
  }, []);

  return status;
}

// Helper to create feed with optimistic update
export async function createFeed(feedData: any): Promise<void> {
  // Generate temporary ID for optimistic update
  const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const optimisticFeed = {
    id: tempId,
    ...feedData,
    occurredAt: feedData.occurredAt || new Date().toISOString()
  };

  // Save to cache immediately for instant UI update
  await cache.saveFeed(optimisticFeed);

  // Queue for background sync
  await cache.queueOperation({
    type: 'create',
    entity: 'feed',
    data: feedData
  });

  // Trigger sync if online
  if (syncManager.isOnline()) {
    syncManager.sync();
  }
}

// Helper to update feed with optimistic update
export async function updateFeed(id: string, updates: any): Promise<void> {
  // Update cache immediately
  const existingFeeds = await cache.getFeeds();
  const existingFeed = existingFeeds.find((f: any) => f.id === id);
  
  if (existingFeed) {
    const updatedFeed = { ...existingFeed, ...updates };
    await cache.saveFeed(updatedFeed);
  }

  // Queue for background sync
  await cache.queueOperation({
    type: 'update',
    entity: 'feed',
    data: { id, ...updates }
  });

  // Trigger sync if online
  if (syncManager.isOnline()) {
    syncManager.sync();
  }
}

// Helper to delete feed with optimistic update
export async function deleteFeed(id: string): Promise<void> {
  // Remove from cache immediately
  await cache.deleteFeed(id);

  // Queue for background sync
  await cache.queueOperation({
    type: 'delete',
    entity: 'feed',
    data: { id }
  });

  // Trigger sync if online
  if (syncManager.isOnline()) {
    syncManager.sync();
  }
}
