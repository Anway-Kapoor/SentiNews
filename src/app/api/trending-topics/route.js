import { NextResponse } from 'next/server';

export async function GET() {
  // In a real application, you would fetch trending topics from a database or external API
  // For now, we'll return some default topics
  const trendingTopics = [
    'chess',
    'technology',
    'AI',
    'sports',
    'politics',
    'entertainment'
  ];
  
  return NextResponse.json({ topics: trendingTopics });
}