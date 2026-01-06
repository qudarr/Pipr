'use client';

import { useState } from 'react';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import {
  BottleIcon,
  HistoryIcon,
  HeartIcon,
  CalendarIcon,
  SettingsIcon
} from '@/components/ui/icons';
import {
  useFeeds,
  useBabies,
  formatTime,
  formatDuration,
  FeedEvent
} from '@/lib/hooks';
import { FeedEditModal } from '@/components/feed-edit-modal';

type FeedTypeFilter = 'all' | 'Bottle' | 'Breast';

export default function HistoryPage() {
  const { feeds, loading, mutate } = useFeeds();
  const { babies } = useBabies();
  const [filter, setFilter] = useState<FeedTypeFilter>('all');
  const [editingFeed, setEditingFeed] = useState<FeedEvent | null>(null);

  const handleEditComplete = () => {
    setEditingFeed(null);
    mutate();
  };

  const filteredFeeds =
    filter === 'all' ? feeds : feeds.filter((f) => f.feedType === filter);

  // Group feeds by date
  const groupedFeeds = filteredFeeds.reduce(
    (groups, feed) => {
      const date = format(parseISO(feed.occurredAt), 'yyyy-MM-dd');
      if (!groups[date]) groups[date] = [];
      groups[date].push(feed);
      return groups;
    },
    {} as Record<string, typeof feeds>
  );

  const sortedDates = Object.keys(groupedFeeds).sort((a, b) =>
    b.localeCompare(a)
  );

  const getDateLabel = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'EEEE, MMM d');
  };

  const getBabyName = (babyId: string) => {
    const baby = babies.find((b) => b.id === babyId);
    return baby?.name || 'Baby';
  };

  return (
    <div className="min-h-screen baby-gradient-light dark:bg-gradient-to-br dark:from-slate-900 dark:via-purple-950 dark:to-blue-950">
      <div className="max-w-md mx-auto px-5 pb-24 pt-8">
        <header className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-2xl bg-baby-blue/30 dark:bg-baby-blue/20">
            <HistoryIcon className="w-7 h-7 text-baby-blue" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-600 dark:text-slate-400 font-semibold">
              All Feeds
            </p>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              History
            </h1>
          </div>
        </header>

        {/* Filter */}
        <div className="flex gap-2 mb-6">
          {(['all', 'Bottle', 'Breast'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
                filter === type
                  ? 'baby-gradient text-white shadow-lg'
                  : 'bg-white/60 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700'
              }`}
            >
              {type === 'all'
                ? 'All'
                : type === 'Bottle'
                  ? '🍼 Bottles'
                  : '🤱 Breast'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-baby-pink border-t-transparent"></div>
          </div>
        ) : filteredFeeds.length === 0 ? (
          <div className="card p-8 text-center shadow-lg">
            <div className="text-5xl mb-4">📝</div>
            <p className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              No feeds recorded
            </p>
            <p className="text-slate-600 dark:text-slate-400">
              {filter === 'all'
                ? 'Start tracking feeds from the dashboard!'
                : `No ${filter.toLowerCase()} feeds found.`}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedDates.map((dateStr) => (
              <section key={dateStr}>
                <h2 className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-3 uppercase tracking-wide">
                  {getDateLabel(dateStr)}
                </h2>
                <div className="space-y-3">
                  {groupedFeeds[dateStr]
                    .sort(
                      (a, b) =>
                        new Date(b.occurredAt).getTime() -
                        new Date(a.occurredAt).getTime()
                    )
                    .map((feed) => (
                      <button
                        key={feed.id}
                        onClick={() => setEditingFeed(feed)}
                        className={`card p-4 flex items-start gap-3 shadow-lg w-full text-left hover:shadow-xl transition-all hover:scale-[1.02] border-l-4 ${
                          feed.feedType === 'Bottle'
                            ? 'border-l-teal-500'
                            : 'border-l-pink-500'
                        }`}
                      >
                        <div
                          className={`p-2 rounded-2xl ${
                            feed.feedType === 'Bottle'
                              ? 'bg-gradient-to-br from-sky-500/20 to-teal-500/20'
                              : 'bg-gradient-to-br from-pink-500/20 to-rose-500/20'
                          }`}
                        >
                          {feed.feedType === 'Bottle' ? (
                            <BottleIcon className="w-5 h-5 text-teal-500" />
                          ) : (
                            <HeartIcon className="w-5 h-5 text-pink-500" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                              {formatTime(feed.occurredAt)}
                            </p>
                            {babies.length > 1 && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-baby-lavender/20 text-baby-lavender font-semibold">
                                {getBabyName(feed.babyId)}
                              </span>
                            )}
                          </div>
                          <p className="font-bold text-slate-900 dark:text-white">
                            {feed.feedType === 'Bottle'
                              ? 'Bottle Feed'
                              : 'Breastfeed'}
                          </p>
                          <p className="text-sm text-slate-700 dark:text-slate-300">
                            {feed.feedType === 'Bottle'
                              ? `${feed.amountMl} ml • ${feed.bottleType || 'Formula'}`
                              : `${feed.firstSide}: ${formatDuration(feed.firstDurationSec || 0)}${
                                  feed.secondDurationSec
                                    ? `, Other: ${formatDuration(feed.secondDurationSec)}`
                                    : ''
                                }`}
                          </p>
                          {feed.notes && (
                            <p className="text-xs text-slate-500 dark:text-slate-500 mt-1 italic">
                              {feed.notes}
                            </p>
                          )}
                        </div>
                      </button>
                    ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {/* Bottom navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-900/90 backdrop-blur-lg border-t border-slate-300 dark:border-slate-700 shadow-2xl">
          <div className="max-w-md mx-auto flex justify-around py-3">
            <a
              href="/"
              className="flex flex-col items-center gap-1.5 text-sm group"
            >
              <span className="p-2 rounded-2xl bg-baby-pink/20 dark:bg-baby-pink/10 text-baby-pink group-hover:bg-baby-pink/30 transition-all">
                <CalendarIcon className="w-5 h-5" />
              </span>
              <span className="font-semibold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                Today
              </span>
            </a>
            <a
              href="/history"
              className="flex flex-col items-center gap-1.5 text-sm group"
            >
              <span className="p-2 rounded-2xl bg-baby-blue/30 dark:bg-baby-blue/20 text-baby-blue">
                <HistoryIcon className="w-5 h-5" />
              </span>
              <span className="font-semibold text-baby-blue">History</span>
            </a>
            <a
              href="/stats"
              className="flex flex-col items-center gap-1.5 text-sm group"
            >
              <span className="p-2 rounded-2xl bg-teal-500/20 dark:bg-teal-500/10 text-teal-500 group-hover:bg-teal-500/30 transition-all">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"
                  />
                </svg>
              </span>
              <span className="font-semibold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                Stats
              </span>
            </a>
            <a
              href="/settings"
              className="flex flex-col items-center gap-1.5 text-sm group"
            >
              <span className="p-2 rounded-2xl bg-baby-lavender/20 dark:bg-baby-lavender/10 text-baby-lavender group-hover:bg-baby-lavender/30 transition-all">
                <SettingsIcon className="w-5 h-5" />
              </span>
              <span className="font-semibold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                Settings
              </span>
            </a>
          </div>
        </nav>
      </div>

      {/* Modal for editing feed */}
      {editingFeed && (
        <FeedEditModal
          feed={editingFeed}
          onClose={() => setEditingFeed(null)}
          onSave={handleEditComplete}
          onDelete={handleEditComplete}
        />
      )}
    </div>
  );
}
