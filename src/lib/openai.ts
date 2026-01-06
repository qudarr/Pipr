import { AzureOpenAI } from '@azure/openai';

/**
 * Azure OpenAI client for generating statistical insights
 * This is only available when Azure OpenAI credentials are configured
 */
export function getAzureOpenAIClient() {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;

  if (!endpoint || !apiKey || !deploymentName) {
    return null;
  }

  return {
    client: new AzureOpenAI({
      endpoint,
      apiKey
    }),
    deploymentName
  };
}

/**
 * Check if Azure OpenAI is configured and available
 */
export function isAzureOpenAIAvailable(): boolean {
  return !!(
    process.env.AZURE_OPENAI_ENDPOINT &&
    process.env.AZURE_OPENAI_API_KEY &&
    process.env.AZURE_OPENAI_DEPLOYMENT_NAME
  );
}

export type FeedSummary = {
  totalBottles: number;
  totalBreasts: number;
  totalMl: number;
  totalBreastMin: number;
  avgBottlesPerDay: number;
  avgMlPerDay: number;
  avgBreastsPerDay: number;
  avgBreastMinPerDay: number;
  days: number;
  dailyData: Array<{
    date: string;
    bottleCount: number;
    breastCount: number;
    totalMl: number;
    totalBreastMin: number;
  }>;
};

/**
 * Generate statistical insights from feed data using Azure OpenAI
 */
export async function generateFeedInsights(
  feedSummary: FeedSummary
): Promise<string> {
  const openAI = getAzureOpenAIClient();
  if (!openAI) {
    throw new Error('Azure OpenAI is not configured');
  }

  const { client, deploymentName } = openAI;

  // Create a prompt with the feed data
  const prompt = `You are a helpful assistant providing insights for new parents tracking their newborn's feeding patterns.

Analyze the following feeding data from the past ${feedSummary.days} days:

Summary Statistics:
- Total bottle feeds: ${feedSummary.totalBottles} (avg ${feedSummary.avgBottlesPerDay.toFixed(1)}/day)
- Total breastfeeds: ${feedSummary.totalBreasts} (avg ${feedSummary.avgBreastsPerDay.toFixed(1)}/day)
- Total formula/milk volume: ${feedSummary.totalMl} ml (avg ${feedSummary.avgMlPerDay.toFixed(0)} ml/day)
- Total nursing time: ${feedSummary.totalBreastMin} minutes (avg ${feedSummary.avgBreastMinPerDay.toFixed(0)} min/day)

Daily Breakdown (most recent 7 days):
${feedSummary.dailyData.slice(0, 7).map((day) => `- ${day.date}: ${day.bottleCount} bottles (${day.totalMl} ml), ${day.breastCount} breastfeeds (${day.totalBreastMin} min)`).join('\n')}

Please provide:
1. A brief observation about the feeding patterns and trends
2. Any notable changes or consistency in feeding habits
3. Helpful tips or gentle suggestions (if applicable)

Keep your response concise (3-4 paragraphs max), supportive, and focused on practical insights. Use a warm, encouraging tone. Do not provide medical advice.`;

  try {
    const result = await client.getChatCompletions(deploymentName, [
      {
        role: 'system',
        content:
          'You are a supportive assistant helping parents understand their newborn feeding patterns. Provide insights that are encouraging and practical, not medical advice.'
      },
      {
        role: 'user',
        content: prompt
      }
    ]);

    const insight = result.choices[0]?.message?.content;
    if (!insight) {
      throw new Error('No insights generated');
    }

    return insight;
  } catch (error: any) {
    console.error('Error generating insights:', error);
    throw new Error(
      `Failed to generate insights: ${error.message || 'Unknown error'}`
    );
  }
}
