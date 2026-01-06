'use client';

import { useState, useEffect, useCallback } from 'react';

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

export type NappyEvent = {
  id: string;
  babyId: string;
  occurredAt: string;
  type: 'wet' | 'dirty' | 'both';
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
    fetch('/api/me')
      .then((res) => res.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, hasFamily: !!data?.membership };
}

export function useBabies() {
  const [babies, setBabies] = useState<Baby[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setLoading(true);
    fetch('/api/babies')
      .then((res) => res.json())
      .then((data) => setBabies(data.babies ?? []))
      .catch(() => setBabies([]))
      .finally(() => setLoading(false));
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

  const refresh = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (options?.start) params.set('start', options.start);
    if (options?.end) params.set('end', options.end);
    if (options?.babyId) params.set('babyId', options.babyId);

    const url = '/api/feeds' + (params.toString() ? `?${params}` : '');
    fetch(url)
      .then((res) => res.json())
      .then((data) => setFeeds(data.feeds ?? []))
      .catch(() => setFeeds([]))
      .finally(() => setLoading(false));
  }, [options?.start, options?.end, options?.babyId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { feeds, loading, refresh };
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

export function useNappies(options?: {
  start?: string;
  end?: string;
  babyId?: string;
}) {
  const [nappies, setNappies] = useState<NappyEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (options?.start) params.set('start', options.start);
    if (options?.end) params.set('end', options.end);
    if (options?.babyId) params.set('babyId', options.babyId);

    const url = '/api/nappies' + (params.toString() ? `?${params}` : '');
    fetch(url)
      .then((res) => res.json())
      .then((data) => setNappies(data.nappies ?? []))
      .catch(() => setNappies([]))
      .finally(() => setLoading(false));
  }, [options?.start, options?.end, options?.babyId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { nappies, loading, refresh };
}

export function useTodayNappies(babyId?: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return useNappies({
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
