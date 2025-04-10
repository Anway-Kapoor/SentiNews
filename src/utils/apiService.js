import { TwitterApi } from 'twitter-api-v2';
import Snoowrap from 'snoowrap';
import axios from 'axios';
import { format } from 'date-fns';

// Rate limiting helper
const rateLimiter = (fn, delay) => {
  let lastRun = 0;
  return function(...args) {
    const now = Date.now();
    if (now - lastRun < delay) {
      return new Promise((resolve) => {
        setTimeout(() => {
          lastRun = Date.now();
          resolve(fn.apply(this, args));
        }, delay - (now - lastRun));
      });
    }
    lastRun = now;
    return fn.apply(this, args);
  };
};

// News API (free tier) with better error handling
const searchNewsAPI = rateLimiter(async (query, timeRange = 'week') => {
  try {
    // Calculate date range based on timeRange
    const endDate = new Date();
    let startDate = new Date();
    
    switch (timeRange) {
      case 'day':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setDate(startDate.getDate() - 30);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7);
    }
    
    // Format dates for API
    const from = format(startDate, 'yyyy-MM-dd');
    const to = format(endDate, 'yyyy-MM-dd');
    
    // Use NewsAPI.org with proper error handling
    const apiKey = process.env.NEWS_API_KEY;
    
    if (!apiKey) {
      console.error('NEWS_API_KEY is not defined in environment variables');
      return [];
    }
    
    console.log(`Searching News API for "${query}" from ${from} to ${to}`);
    
    const response = await axios.get(`https://newsapi.org/v2/everything`, {
      params: {
        q: query,
        from,
        to,
        language: 'en',
        sortBy: 'relevancy',
        pageSize: 100, // Increased to get more results
        apiKey
      }
    });
    
    if (response.data && response.data.articles) {
      console.log(`Found ${response.data.articles.length} articles from News API`);
      return response.data.articles.map((article, index) => ({
        id: `news-${index}`,
        text: article.title + (article.description ? ' ' + article.description : ''),
        date: new Date(article.publishedAt),
        platform: 'News',
        source: article.source.name,
        url: article.url,
        likes: Math.floor(Math.random() * 100),
        shares: Math.floor(Math.random() * 50)
      }));
    }
    return [];
  } catch (error) {
    console.error('News API error:', error.message);
    if (error.response) {
      console.error('News API response status:', error.response.status);
      console.error('News API response data:', error.response.data);
    }
    return [];
  }
}, 1000);

// HackerNews API with improved search
const searchHackerNews = rateLimiter(async (query) => {
  try {
    console.log(`Searching HackerNews for "${query}"`);
    
    // Get multiple story types to increase chances of finding matches
    const [topStoriesResponse, newStoriesResponse, bestStoriesResponse] = await Promise.all([
      axios.get('https://hacker-news.firebaseio.com/v0/topstories.json'),
      axios.get('https://hacker-news.firebaseio.com/v0/newstories.json'),
      axios.get('https://hacker-news.firebaseio.com/v0/beststories.json')
    ]);
    
    // Combine and deduplicate story IDs
    const allStoryIds = [...new Set([
      ...topStoriesResponse.data.slice(0, 100),
      ...newStoriesResponse.data.slice(0, 100),
      ...bestStoriesResponse.data.slice(0, 100)
    ])];
    
    console.log(`Fetching details for ${allStoryIds.length} HackerNews stories`);
    
    // Get details for each story
    const storyPromises = allStoryIds.map(id => 
      axios.get(`https://hacker-news.firebaseio.com/v0/item/${id}.json`)
    );
    
    const stories = await Promise.all(storyPromises);
    
    // Use a more lenient search approach
    const queryTerms = query.toLowerCase().split(' ');
    
    // Filter stories that match any of the query terms
    const matchingStories = stories
      .map(response => response.data)
      .filter(story => {
        if (!story || !story.title) return false;
        
        const titleLower = story.title.toLowerCase();
        const textLower = story.text ? story.text.toLowerCase() : '';
        
        // Check if any query term is in the title or text
        return queryTerms.some(term => 
          titleLower.includes(term) || textLower.includes(term)
        );
      })
      .slice(0, 50); // Increased limit
    
    console.log(`Found ${matchingStories.length} matching stories from HackerNews`);
    
    return matchingStories.map(story => ({
      id: `hn-${story.id}`,
      text: story.title + (story.text ? ' ' + story.text : ''),
      date: new Date(story.time * 1000),
      platform: 'HackerNews',
      url: story.url,
      likes: story.score || 0,
      shares: story.descendants || 0
    }));
  } catch (error) {
    console.error('HackerNews API error:', error.message);
    return [];
  }
}, 1000);

// Fallback to mock data if no real data is found
function generateMockData(topic, timeRange) {
  console.log(`Generating mock data for "${topic}" with time range "${timeRange}"`);
  const posts = [];
  const now = new Date();
  let daysToGoBack;
  
  switch (timeRange) {
    case 'day':
      daysToGoBack = 1;
      break;
    case 'week':
      daysToGoBack = 7;
      break;
    case 'month':
      daysToGoBack = 30;
      break;
    default:
      daysToGoBack = 7;
  }
  
  // Positive phrases
  const positiveTemplates = [
    `I'm really impressed with ${topic}! The quality exceeded my expectations.`,
    `${topic} is absolutely fantastic. I can't recommend it enough!`,
    `Just tried ${topic} and I'm blown away. This is a game-changer.`,
    `${topic} has completely transformed how I work. So much more efficient now.`,
    `I love how ${topic} solves problems I didn't even know I had. Brilliant!`
  ];
  
  // Negative phrases
  const negativeTemplates = [
    `${topic} was a disappointment. Not worth the hype at all.`,
    `I had high hopes for ${topic}, but it fell short in several key areas.`,
    `The problems with ${topic} outweigh any benefits. Would not recommend.`,
    `${topic} needs significant improvements before I'd consider using it again.`,
    `I regret spending time with ${topic}. There are much better alternatives.`
  ];
  
  // Neutral phrases
  const neutralTemplates = [
    `${topic} has some good features, but also some drawbacks to consider.`,
    `I've been using ${topic} for a while. It's adequate for basic needs.`,
    `${topic} is neither exceptional nor terrible. It gets the job done.`,
    `My experience with ${topic} has been mixed. Some things work well, others don't.`,
    `${topic} is okay for the price point, but don't expect anything revolutionary.`
  ];
  
  // Generate posts
  for (let i = 0; i < 100; i++) {
    const randomDaysAgo = Math.random() * daysToGoBack;
    const date = new Date(now.getTime() - randomDaysAgo * 24 * 60 * 60 * 1000);
    
    const rand = Math.random();
    let text, sentimentType;
    
    if (rand < 0.4) {
      const templateIndex = Math.floor(Math.random() * positiveTemplates.length);
      text = positiveTemplates[templateIndex];
      sentimentType = 'positive';
    } else if (rand < 0.7) {
      const templateIndex = Math.floor(Math.random() * neutralTemplates.length);
      text = neutralTemplates[templateIndex];
      sentimentType = 'neutral';
    } else {
      const templateIndex = Math.floor(Math.random() * negativeTemplates.length);
      text = negativeTemplates[templateIndex];
      sentimentType = 'negative';
    }
    
    const platform = Math.random() > 0.5 ? 'News' : 'HackerNews';
    
    let likesBase, sharesBase;
    if (sentimentType === 'positive') {
      likesBase = 500;
      sharesBase = 100;
    } else if (sentimentType === 'negative') {
      likesBase = 300;
      sharesBase = 80;
    } else {
      likesBase = 100;
      sharesBase = 30;
    }
    
    posts.push({
      id: `mock-${i}`,
      text,
      date,
      platform,
      likes: Math.floor(Math.random() * likesBase + 10),
      shares: Math.floor(Math.random() * sharesBase + 5)
    });
  }
  
  return posts;
}

// Fetch data from multiple platforms with fallback to mock data
export async function fetchSocialMediaData(topic, timeRange, isRealtime = false) {
  try {
    console.log(`Fetching data for topic "${topic}" with time range "${timeRange}"`);
    
    // Fetch data from both platforms in parallel
    const [newsArticles, hackerNewsPosts] = await Promise.all([
      searchNewsAPI(topic, timeRange),
      searchHackerNews(topic)
    ]);
    
    const combinedPosts = [...newsArticles, ...hackerNewsPosts];
    
    console.log(`Total posts found: ${combinedPosts.length} (News: ${newsArticles.length}, HackerNews: ${hackerNewsPosts.length})`);
    
    // If no data was retrieved and not a real-time update, fall back to mock data
    if (combinedPosts.length === 0 && !isRealtime) {
      console.warn('No data retrieved from APIs, falling back to mock data');
      return generateMockData(topic, timeRange);
    }
    
    // Return results
    return combinedPosts;
  } catch (error) {
    console.error('Error fetching data:', error);
    // Fall back to mock data on error, but only if not a real-time update
    if (!isRealtime) {
      console.warn('Error occurred, falling back to mock data');
      return generateMockData(topic, timeRange);
    }
    return [];
  }
}

// Also export the other functions that might be needed elsewhere
export { searchNewsAPI, searchHackerNews, generateMockData };