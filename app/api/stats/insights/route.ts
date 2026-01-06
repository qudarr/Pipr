import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthContext } from '@/lib/context';
import {
  generateFeedInsights,
  isAzureOpenAIAvailable,
  type FeedSummary
} from '@/lib/openai';
import {
  format,
  subDays,
  startOfDay,
  eachDayOfInterval
} from 'date-fns';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const InsightsRequestSchema = z.object({
  timeRange: z.enum(['7d', '14d', '30d']).optional().default('7d')
});

export async function POST(req: Request) {
  try {
    // Check if Azure OpenAI is configured
    if (!isAzureOpenAIAvailable()) {
      return NextResponse.json(
        {
          error: 'azure_openai_not_configured',
          message:
            'Azure OpenAI is not configured. Please add AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_KEY, and AZURE_OPENAI_DEPLOYMENT_NAME to your environment variables.'
        },
        { status: 503 }
      );
    }

    const ctx = await getAuthContext();
    if (!ctx.membership) {
      return NextResponse.json({ error: 'no_family' }, { status: 400 });
    }

    const json = await req.json().catch(() => ({}));
    const parsed = InsightsRequestSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'invalid_body', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { timeRange } = parsed.data;
    const days = timeRange === '7d' ? 7 : timeRange === '14d' ? 14 : 30;

    // Fetch feeds for the specified time range
    const feeds = await prisma.feedEvent.findMany({
      where: {
        familySpaceId: ctx.membership.familySpaceId,
        occurredAt: {
          gte: subDays(new Date(), days)
        }
      },
      orderBy: { occurredAt: 'desc' }
    });

    // Calculate statistics similar to the stats page
    const today = startOfDay(new Date());
    const startDate = subDays(today, days - 1);
    const dateRange = eachDayOfInterval({ start: startDate, end: today });

    const dailyData = dateRange.map((date) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayFeeds = feeds.filter((f) => {
        const feedDate = format(f.occurredAt, 'yyyy-MM-dd');
        return feedDate === dateStr;
      });

      const bottleFeeds = dayFeeds.filter((f) => f.type === 'bottle');
      const breastFeeds = dayFeeds.filter((f) => f.type === 'breast');

      const totalMl = bottleFeeds.reduce(
        (sum, f) => sum + (f.bottleAmountMl || 0),
        0
      );
      const totalBreastMin = breastFeeds.reduce((sum, f) => {
        const secs = (f.firstDurationSec || 0) + (f.secondDurationSec || 0);
        return sum + Math.round(secs / 60);
      }, 0);

      return {
        date: format(date, 'EEE M/d'),
        bottleCount: bottleFeeds.length,
        breastCount: breastFeeds.length,
        totalMl,
        totalBreastMin
      };
    });

    const totalBottles = dailyData.reduce((sum, d) => sum + d.bottleCount, 0);
    const totalBreasts = dailyData.reduce((sum, d) => sum + d.breastCount, 0);
    const totalMl = dailyData.reduce((sum, d) => sum + d.totalMl, 0);
    const totalBreastMin = dailyData.reduce(
      (sum, d) => sum + d.totalBreastMin,
      0
    );

    const feedSummary: FeedSummary = {
      totalBottles,
      totalBreasts,
      totalMl,
      totalBreastMin,
      avgBottlesPerDay: totalBottles / days,
      avgMlPerDay: totalMl / days,
      avgBreastsPerDay: totalBreasts / days,
      avgBreastMinPerDay: totalBreastMin / days,
      days,
      dailyData
    };

    // Generate insights using Azure OpenAI
    const insights = await generateFeedInsights(feedSummary);

    return NextResponse.json({
      insights,
      timeRange,
      generatedAt: new Date().toISOString()
    });
  } catch (err: any) {
    if (err?.message === 'UNAUTHENTICATED') {
      return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
    }
    console.error('Error generating insights:', err);
    return NextResponse.json(
      {
        error: 'server_error',
        message: err.message || 'Failed to generate insights'
      },
      { status: 500 }
    );
  }
}
