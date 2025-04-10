import { NextResponse } from 'next/server';
import { fetchSocialMediaData } from '../../../utils/apiService';
import { startMonitoringTopic } from '../../../utils/dataFetchService';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const topic = searchParams.get('topic');
  const timeRange = searchParams.get('timeRange') || 'week';
  
  if (!topic) {
    return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
  }
  
  try {
    console.log(`API route: Fetching data for topic "${topic}" with time range "${timeRange}"`);
    
    // Fetch data from APIs with fallback to mock data
    const data = await fetchSocialMediaData(topic, timeRange);
    
    // Start monitoring this topic for real-time updates
    startMonitoringTopic(topic);
    
    console.log(`API route: Returning ${data.length} posts`);
    
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error in social media API route:', error);
    return NextResponse.json({ error: 'Failed to fetch data', details: error.message }, { status: 500 });
  }
}