"use client";

import { useEffect, useState } from 'react';
import { BottleIcon, HistoryIcon } from '@/components/ui/icons';

export default function HistoryPage() {
  const [feeds, setFeeds] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/feeds')
      .then((res) => res.json())
      .then((data) => setFeeds(data.feeds ?? []))
      .catch(() => setFeeds([]));
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-5 pb-24 max-w-md mx-auto">
      <header className="flex items-center gap-3 mb-4">
        <span className="p-2 rounded-xl bg-slate-800 text-accent"><HistoryIcon className="w-5 h-5" /></span>
        <div>
          <p className="text-xs text-slate-400">Feeds</p>
          <h1 className="text-lg font-semibold">History</h1>
        </div>
      </header>

      <div className="space-y-3">
        {feeds.length === 0 && (
          <div className="card p-4 bg-slate-800/70 text-slate-200">No feeds logged yet.</div>
        )}
        {feeds.map((feed) => (
          <div key={feed.id} className="card p-4 bg-slate-800/70 text-slate-200 flex gap-3">
            <span className="p-2 rounded-xl bg-slate-900/60 text-accent">
              <BottleIcon className="w-5 h-5" />
            </span>
            <div>
              <p className="text-xs text-slate-400">{new Date(feed.occurredAt).toLocaleString()}</p>
              <p className="font-semibold capitalize">{feed.type} feed</p>
              {feed.type === 'bottle' ? (
                <p className="text-xs text-slate-400">{feed.bottleAmountMl ?? '—'} mL • {feed.bottleType ?? 'Bottle'}</p>
              ) : (
                <p className="text-xs text-slate-400">{feed.totalDurationSec ?? 0}s • First side {feed.firstSide}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
