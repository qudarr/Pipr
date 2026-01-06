'use client';

import { useState, useMemo } from 'react';
import {
  format,
  parseISO,
  subDays,
  startOfDay,
  eachDayOfInterval
} from 'date-fns';
import { HistoryIcon, CalendarIcon, SettingsIcon } from '@/components/ui/icons';
import { useFeeds } from '@/lib/hooks';

// Sparkles icon for AI insights
function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 22l-.394-1.433a2.25 2.25 0 0 0-1.423-1.423L13.25 19l1.433-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.433.394 1.433a2.25 2.25 0 0 0 1.423 1.423l1.433.394-1.433.394a2.25 2.25 0 0 0-1.423 1.423Z"
      />
    </svg>
  );
}

// Chart icon for nav
function ChartIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
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
  );
}

type TimeRange = '7d' | '14d' | '30d';

type InsightsData = {
  insights: string;
  timeRange: string;
  generatedAt: string;
};

export default function StatsPage() {
  const { feeds, loading } = useFeeds();
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [insightsError, setInsightsError] = useState<string | null>(null);

  const days = timeRange === '7d' ? 7 : timeRange === '14d' ? 14 : 30;

  const chartData = useMemo(() => {
    const today = startOfDay(new Date());
    const startDate = subDays(today, days - 1);

    const dateRange = eachDayOfInterval({ start: startDate, end: today });

    return dateRange.map((date) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayFeeds = feeds.filter((f) => {
        const feedDate = format(parseISO(f.occurredAt), 'yyyy-MM-dd');
        return feedDate === dateStr;
      });

      const bottleFeeds = dayFeeds.filter((f) => f.feedType === 'Bottle');
      const breastFeeds = dayFeeds.filter((f) => f.feedType === 'Breast');

      const totalMl = bottleFeeds.reduce(
        (sum, f) => sum + (f.amountMl || 0),
        0
      );
      const totalBreastMin = breastFeeds.reduce((sum, f) => {
        const secs = (f.firstDurationSec || 0) + (f.secondDurationSec || 0);
        return sum + Math.round(secs / 60);
      }, 0);

      return {
        date,
        dateStr,
        label: format(date, 'EEE'),
        shortDate: format(date, 'M/d'),
        bottleCount: bottleFeeds.length,
        breastCount: breastFeeds.length,
        totalMl,
        totalBreastMin,
        totalFeeds: dayFeeds.length
      };
    });
  }, [feeds, days]);

  const maxMl = Math.max(...chartData.map((d) => d.totalMl), 100);
  const maxFeeds = Math.max(...chartData.map((d) => d.totalFeeds), 1);

  const totals = useMemo(() => {
    const totalBottles = chartData.reduce((sum, d) => sum + d.bottleCount, 0);
    const totalBreasts = chartData.reduce((sum, d) => sum + d.breastCount, 0);
    const totalMl = chartData.reduce((sum, d) => sum + d.totalMl, 0);
    const totalBreastMin = chartData.reduce(
      (sum, d) => sum + d.totalBreastMin,
      0
    );
    const avgBottlesPerDay = totalBottles / days;
    const avgMlPerDay = totalMl / days;

    return {
      totalBottles,
      totalBreasts,
      totalMl,
      totalBreastMin,
      avgBottlesPerDay,
      avgMlPerDay
    };
  }, [chartData, days]);

  // Function to generate AI insights
  const generateInsights = async () => {
    setLoadingInsights(true);
    setInsightsError(null);

    try {
      const response = await fetch('/api/stats/insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ timeRange })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate insights');
      }

      const data = await response.json();
      setInsights(data);
    } catch (error: any) {
      console.error('Error generating insights:', error);
      setInsightsError(
        error.message || 'Failed to generate insights. Please try again.'
      );
    } finally {
      setLoadingInsights(false);
    }
  };

  return (
    <div className="min-h-screen baby-gradient-light dark:bg-gradient-to-br dark:from-slate-900 dark:via-purple-950 dark:to-blue-950">
      <div className="max-w-md mx-auto px-5 pb-24 pt-8">
        <header className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-sky-500/30 to-teal-500/30">
            <ChartIcon className="w-7 h-7 text-teal-500" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-600 dark:text-slate-400 font-semibold">
              Analytics
            </p>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Statistics
            </h1>
          </div>
        </header>

        {/* Time range selector */}
        <div className="flex gap-2 mb-6">
          {(['7d', '14d', '30d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
                timeRange === range
                  ? 'bg-gradient-to-r from-sky-500 to-teal-500 text-white shadow-lg'
                  : 'bg-white/60 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700'
              }`}
            >
              {range === '7d'
                ? '7 Days'
                : range === '14d'
                  ? '2 Weeks'
                  : '30 Days'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-teal-500 border-t-transparent"></div>
          </div>
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="card p-4 shadow-lg">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Total Bottles
                </p>
                <p className="text-2xl font-bold text-teal-500">
                  {totals.totalBottles}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-500">
                  {totals.avgBottlesPerDay.toFixed(1)}/day avg
                </p>
              </div>
              <div className="card p-4 shadow-lg">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Total Volume
                </p>
                <p className="text-2xl font-bold text-sky-500">
                  {totals.totalMl} ml
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-500">
                  {Math.round(totals.avgMlPerDay)} ml/day avg
                </p>
              </div>
              <div className="card p-4 shadow-lg">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Breastfeeds
                </p>
                <p className="text-2xl font-bold text-pink-500">
                  {totals.totalBreasts}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-500">
                  {(totals.totalBreasts / days).toFixed(1)}/day avg
                </p>
              </div>
              <div className="card p-4 shadow-lg">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Nursing Time
                </p>
                <p className="text-2xl font-bold text-rose-500">
                  {totals.totalBreastMin}m
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-500">
                  {Math.round(totals.totalBreastMin / days)}m/day avg
                </p>
              </div>
            </div>

            {/* AI Insights Section */}
            <div className="card p-5 shadow-lg mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <SparklesIcon className="w-5 h-5 text-purple-500" />
                  AI Insights
                </h2>
                <button
                  onClick={generateInsights}
                  disabled={loadingInsights}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:from-purple-600 hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
                >
                  {loadingInsights ? 'Generating...' : 'Generate Insights'}
                </button>
              </div>

              {insights && (
                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {insights.insights}
                    </p>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-500 mt-3 italic">
                    Generated on{' '}
                    {new Date(insights.generatedAt).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              )}

              {insightsError && (
                <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {insightsError}
                  </p>
                </div>
              )}

              {!insights && !insightsError && !loadingInsights && (
                <div className="text-center py-8">
                  <SparklesIcon className="w-12 h-12 text-purple-300 dark:text-purple-700 mx-auto mb-3" />
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Get AI-powered insights about your baby's feeding patterns
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                    Click "Generate Insights" to analyze the current time range
                  </p>
                </div>
              )}

              {loadingInsights && (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-purple-500 border-t-transparent mb-3"></div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Analyzing your feeding data...
                  </p>
                </div>
              )}
            </div>

            {/* Volume Chart */}
            <div className="card p-5 shadow-lg mb-4">
              <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">
                📊 Bottle Volume (ml)
              </h2>
              <div className="flex items-end gap-1 h-40">
                {chartData.map((day, i) => {
                  const height = maxMl > 0 ? (day.totalMl / maxMl) * 100 : 0;
                  return (
                    <div
                      key={day.dateStr}
                      className="flex-1 flex flex-col items-center gap-1"
                    >
                      <span className="text-xs font-semibold text-teal-500">
                        {day.totalMl > 0 ? day.totalMl : ''}
                      </span>
                      <div
                        className="w-full bg-gradient-to-t from-sky-500 to-teal-400 rounded-t-lg transition-all duration-300"
                        style={{ height: `${Math.max(height, 4)}%` }}
                        title={`${day.shortDate}: ${day.totalMl} ml`}
                      />
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        {days <= 14
                          ? day.label
                          : i % 5 === 0
                            ? day.shortDate
                            : ''}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Feeds Count Chart */}
            <div className="card p-5 shadow-lg mb-4">
              <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">
                🍼 Daily Feed Count
              </h2>
              <div className="flex items-end gap-1 h-32">
                {chartData.map((day, i) => {
                  const bottleHeight =
                    maxFeeds > 0 ? (day.bottleCount / maxFeeds) * 100 : 0;
                  const breastHeight =
                    maxFeeds > 0 ? (day.breastCount / maxFeeds) * 100 : 0;
                  return (
                    <div
                      key={day.dateStr}
                      className="flex-1 flex flex-col items-center gap-1"
                    >
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                        {day.totalFeeds > 0 ? day.totalFeeds : ''}
                      </span>
                      <div
                        className="w-full flex flex-col gap-0.5"
                        style={{ height: '80%' }}
                      >
                        <div
                          className="w-full bg-gradient-to-t from-pink-500 to-rose-400 rounded-t transition-all duration-300"
                          style={{
                            height: `${breastHeight}%`,
                            minHeight: day.breastCount > 0 ? '4px' : '0'
                          }}
                          title={`${day.shortDate}: ${day.breastCount} breastfeeds`}
                        />
                        <div
                          className="w-full bg-gradient-to-t from-sky-500 to-teal-400 rounded-t transition-all duration-300"
                          style={{
                            height: `${bottleHeight}%`,
                            minHeight: day.bottleCount > 0 ? '4px' : '0'
                          }}
                          title={`${day.shortDate}: ${day.bottleCount} bottles`}
                        />
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        {days <= 14
                          ? day.label
                          : i % 5 === 0
                            ? day.shortDate
                            : ''}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-center gap-4 mt-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-gradient-to-r from-sky-500 to-teal-400"></div>
                  <span className="text-xs text-slate-600 dark:text-slate-400">
                    Bottles
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-gradient-to-r from-pink-500 to-rose-400"></div>
                  <span className="text-xs text-slate-600 dark:text-slate-400">
                    Breastfeeds
                  </span>
                </div>
              </div>
            </div>

            {/* Daily breakdown */}
            <div className="card p-5 shadow-lg">
              <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
                📅 Daily Breakdown
              </h2>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {[...chartData].reverse().map((day) => (
                  <div
                    key={day.dateStr}
                    className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-700 last:border-0"
                  >
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        {day.label} {day.shortDate}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {day.bottleCount} bottles • {day.breastCount}{' '}
                        breastfeeds
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-teal-500">
                        {day.totalMl} ml
                      </p>
                      {day.totalBreastMin > 0 && (
                        <p className="text-xs text-pink-500">
                          {day.totalBreastMin}m nursing
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
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
              <span className="p-2 rounded-2xl bg-gradient-to-br from-sky-500/30 to-teal-500/30 text-teal-500">
                <ChartIcon className="w-5 h-5" />
              </span>
              <span className="font-semibold text-teal-500">Stats</span>
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
    </div>
  );
}
