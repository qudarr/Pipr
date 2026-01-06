'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';
import {
  BabyIcon,
  BottleIcon,
  CalendarIcon,
  HistoryIcon,
  MoonIcon,
  SettingsIcon,
  SunIcon,
  HeartIcon,
  CloseIcon
} from '../ui/icons';
import { useTheme } from '@/providers/theme-provider';
import {
  useTodayFeeds,
  useBabies,
  formatTime,
  formatDuration,
  FeedEvent
} from '@/lib/hooks';
import BreastfeedTimer from '@/components/breastfeed-timer';
import BottleForm from '@/components/bottle-form';
import FeedEditModal from '@/components/feed-edit-modal';

type ModalType = 'breast' | 'bottle' | null;

export default function Dashboard() {
  const todayLabel = format(new Date(), 'EEEE, MMM d');
  const { setTheme, resolved } = useTheme();
  const toggleTheme = () => setTheme(resolved === 'dark' ? 'light' : 'dark');

  const { feeds, loading, refresh } = useTodayFeeds();
  const { babies } = useBabies();
  const [modal, setModal] = useState<ModalType>(null);
  const [editingFeed, setEditingFeed] = useState<FeedEvent | null>(null);

  // Calculate totals
  const bottleFeeds = feeds.filter((f) => f.feedType === 'Bottle');
  const breastFeeds = feeds.filter((f) => f.feedType === 'Breast');
  const totalMl = bottleFeeds.reduce((sum, f) => sum + (f.amountMl || 0), 0);
  const totalBreastMin = Math.round(
    breastFeeds.reduce((sum, f) => sum + (f.totalDurationSec || 0), 0) / 60
  );

  // Recent feeds (last 5)
  const recentFeeds = [...feeds]
    .sort(
      (a, b) =>
        new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
    )
    .slice(0, 5);

  const handleComplete = () => {
    setModal(null);
    refresh();
  };

  const handleEditComplete = () => {
    setEditingFeed(null);
    refresh();
  };

  const getBabyName = (babyId: string) => {
    const baby = babies.find((b) => b.id === babyId);
    return baby?.name || 'Baby';
  };

  return (
    <div className="min-h-screen baby-gradient-light dark:bg-gradient-to-br dark:from-slate-900 dark:via-purple-950 dark:to-blue-950">
      <div className="max-w-md mx-auto px-5 pb-24 pt-8">
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl baby-gradient shadow-lg">
              <BabyIcon className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-600 dark:text-slate-400 font-semibold">
                Today
              </p>
              <p className="font-bold text-xl text-slate-900 dark:text-white">
                {todayLabel}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-2xl bg-baby-yellow/30 dark:bg-baby-yellow/20 text-baby-yellow hover:bg-baby-yellow/40 dark:hover:bg-baby-yellow/30 transition-all"
              aria-label="Toggle theme"
            >
              {resolved === 'dark' ? (
                <SunIcon className="w-6 h-6" />
              ) : (
                <MoonIcon className="w-6 h-6" />
              )}
            </button>
          </div>
        </header>

        {/* Baby info */}
        {babies.length > 0 && (
          <div className="mb-4 flex items-center gap-2">
            {babies.map((baby) => (
              <span
                key={baby.id}
                className="px-3 py-1 rounded-full bg-baby-pink/20 dark:bg-baby-pink/10 text-baby-pink text-sm font-semibold"
              >
                {baby.name}
              </span>
            ))}
          </div>
        )}

        {/* Quick add buttons */}
        <section className="mb-6">
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setModal('breast')}
              className="card p-5 baby-gradient shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 text-left"
            >
              <div className="flex items-center gap-3">
                <span className="p-2.5 rounded-2xl bg-white/20">
                  <HeartIcon className="w-6 h-6 text-white" />
                </span>
                <div>
                  <span className="font-bold text-white block">Breastfeed</span>
                  <span className="text-white/80 text-sm">Start timer</span>
                </div>
              </div>
            </button>

            <button
              onClick={() => setModal('bottle')}
              className="card p-5 bg-gradient-to-br from-sky-500 to-teal-500 shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 text-left"
            >
              <div className="flex items-center gap-3">
                <span className="p-2.5 rounded-2xl bg-white/20">
                  <BottleIcon className="w-6 h-6 text-white" />
                </span>
                <div>
                  <span className="font-bold text-white block">Bottle</span>
                  <span className="text-white/80 text-sm">Quick add</span>
                </div>
              </div>
            </button>
          </div>
        </section>

        {/* Today's totals */}
        <section className="card p-5 shadow-lg mb-6">
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-3">
            Today's Summary
          </p>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="inline-flex p-2 rounded-2xl bg-baby-pink/20 dark:bg-baby-pink/10 mb-2">
                <p className="text-3xl font-bold text-baby-pink">
                  {feeds.length}
                </p>
              </div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Feeds
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex p-2 rounded-2xl bg-baby-blue/20 dark:bg-baby-blue/10 mb-2">
                <p className="text-2xl font-bold text-baby-blue">
                  {totalMl}
                  <span className="text-lg">ml</span>
                </p>
              </div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Bottles
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex p-2 rounded-2xl bg-baby-lavender/20 dark:bg-baby-lavender/10 mb-2">
                <p className="text-2xl font-bold text-baby-lavender">
                  {totalBreastMin}
                  <span className="text-lg">m</span>
                </p>
              </div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Nursing
              </p>
            </div>
          </div>
        </section>

        {/* Recent feeds */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Recent Feeds
            </h3>
            <a
              href="/history"
              className="text-sm font-semibold text-baby-pink hover:text-baby-pink/80 transition-colors"
            >
              View all
            </a>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-baby-pink border-t-transparent"></div>
            </div>
          ) : recentFeeds.length === 0 ? (
            <div className="card p-8 text-center shadow-lg">
              <div className="text-4xl mb-3">🍼</div>
              <p className="text-slate-600 dark:text-slate-400 font-semibold">
                No feeds recorded today
              </p>
              <p className="text-slate-500 dark:text-slate-500 text-sm mt-1">
                Tap the buttons above to log a feed!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentFeeds.map((feed) => (
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
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      {formatTime(feed.occurredAt)}
                      {babies.length > 1 && ` • ${getBabyName(feed.babyId)}`}
                    </p>
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
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Bottom navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-900/90 backdrop-blur-lg border-t border-slate-300 dark:border-slate-700 shadow-2xl">
          <div className="max-w-md mx-auto flex justify-around py-3">
            <a
              href="/"
              className="flex flex-col items-center gap-1.5 text-sm group"
            >
              <span className="p-2 rounded-2xl bg-baby-pink/30 dark:bg-baby-pink/20 text-baby-pink">
                <CalendarIcon className="w-5 h-5" />
              </span>
              <span className="font-semibold text-baby-pink">Today</span>
            </a>
            <a
              href="/history"
              className="flex flex-col items-center gap-1.5 text-sm group"
            >
              <span className="p-2 rounded-2xl bg-baby-blue/20 dark:bg-baby-blue/10 text-baby-blue group-hover:bg-baby-blue/30 transition-all">
                <HistoryIcon className="w-5 h-5" />
              </span>
              <span className="font-semibold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                History
              </span>
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

      {/* Modal for breastfeed timer */}
      {modal === 'breast' && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <div className="flex justify-end mb-2">
              <button
                onClick={() => setModal(null)}
                className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30"
              >
                <CloseIcon className="w-6 h-6" />
              </button>
            </div>
            <BreastfeedTimer onComplete={handleComplete} />
          </div>
        </div>
      )}

      {/* Modal for bottle form */}
      {modal === 'bottle' && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <div className="flex justify-end mb-2">
              <button
                onClick={() => setModal(null)}
                className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30"
              >
                <CloseIcon className="w-6 h-6" />
              </button>
            </div>
            <BottleForm onComplete={handleComplete} />
          </div>
        </div>
      )}

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
