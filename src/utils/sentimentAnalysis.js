import Sentiment from 'sentiment';
import { format, parseISO, isValid } from 'date-fns';

// Initialize the sentiment analyzer
const sentiment = new Sentiment();

// Enhanced lexicon with domain-specific terms
const customLexicon = {
  // Tech terms
  'bug': -2,
  'crash': -3,
  'feature': 2,
  'innovative': 3,
  'intuitive': 2,
  'laggy': -2,
  'seamless': 3,
  'slow': -1,
  'user-friendly': 3,
  
  // Product sentiment
  'amazing': 4,
  'awesome': 4,
  'disappointing': -3,
  'excellent': 4,
  'fantastic': 4,
  'horrible': -4,
  'incredible': 4,
  'mediocre': -2,
  'outstanding': 5,
  'terrible': -4,
  
  // Emoji text representations
  ':)': 2,
  ':(': -2,
  ':D': 3,
  ':/': -1,
  ':P': 1
};

// More granular sentiment categories
function getSentimentCategory(score) {
  if (score >= 4) return 'very positive';
  if (score >= 1) return 'positive';
  if (score > -1 && score < 1) return 'neutral';
  if (score <= -4) return 'very negative';
  return 'negative';
}

// Extract key phrases using a simplified approach (no TF-IDF)
function extractKeyPhrases(posts, count = 5) {
  // Tokenize all texts
  const allWords = {};
  const stopWords = new Set([
    'a', 'an', 'the', 'and', 'but', 'or', 'for', 'nor', 'on', 'at', 'to', 'by', 
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 
    'do', 'does', 'did', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'this', 
    'that', 'these', 'those', 'of', 'in', 'with', 'about', 'from'
  ]);
  
  // Process each post
  posts.forEach(post => {
    // Simple tokenization by splitting on non-word characters
    const tokens = post.text.toLowerCase()
      .split(/\W+/)
      .filter(word => 
        word.length > 2 && 
        !stopWords.has(word) && 
        !/^\d+$/.test(word)
      );
    
    // Count word frequencies
    tokens.forEach(word => {
      allWords[word] = (allWords[word] || 0) + 1;
    });
  });
  
  // Sort by frequency and return top phrases
  return Object.entries(allWords)
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([term]) => term);
}

// Analyze sentiment with enhanced approach
function analyzeTextWithEnhancedSentiment(text) {
  // Analyze sentiment with custom lexicon
  const result = sentiment.analyze(text, { extras: customLexicon });
  
  // Get more granular sentiment category
  const category = getSentimentCategory(result.score);
  
  // Extract words that contributed to sentiment
  return {
    score: result.score,
    comparative: result.comparative,
    category,
    words: {
      positive: result.positive,
      negative: result.negative
    }
  };
}

export function analyzeSentiment(posts) {
  // Process posts with enhanced sentiment analysis
  const analyzedPosts = posts.map(post => {
    const sentimentResult = analyzeTextWithEnhancedSentiment(post.text);
    
    return {
      ...post,
      sentiment: sentimentResult
    };
  });
  
  // Sort posts by date
  analyzedPosts.sort((a, b) => new Date(a.date) - new Date(b.date));
  
  // Extract key topics/phrases across all posts
  const keyPhrases = extractKeyPhrases(analyzedPosts);
  
  // Generate time series data with more granular categories
  const timeSeriesData = generateTimeSeriesData(analyzedPosts);
  
  // Generate enhanced distribution data
  const distributionData = {
    labels: ['Positive', 'Neutral', 'Negative'],
    datasets: [
      {
        data: [
          analyzedPosts.filter(post => post.sentiment.category === 'positive').length,
          analyzedPosts.filter(post => post.sentiment.category === 'neutral').length,
          analyzedPosts.filter(post => post.sentiment.category === 'negative').length
        ],
        backgroundColor: ['#4ade80', '#94a3b8', '#f87171'],
        borderColor: ['#22c55e', '#64748b', '#ef4444'],
        borderWidth: 1
      }
    ]
  };
  
  // Get top posts by engagement and sentiment intensity
  const topPosts = [...analyzedPosts]
    .sort((a, b) => {
      const aScore = (a.likes + a.shares) * Math.abs(a.sentiment.score);
      const bScore = (b.likes + b.shares) * Math.abs(b.sentiment.score);
      return bScore - aScore; // Fixed sorting order
    })
    .slice(0, 5);
  
  return {
    analyzedPosts,
    timeSeriesData,
    distributionData,
    topPosts,
    keyPhrases
  };
}

function generateTimeSeriesData(posts) {
  // Group posts by day with simplified sentiment categories
  const postsByDay = {};
  
  posts.forEach(post => {
    const date = new Date(post.date);
    const dateStr = format(date, 'yyyy-MM-dd');
    
    if (!postsByDay[dateStr]) {
      postsByDay[dateStr] = {
        'positive': 0,
        'neutral': 0,
        'negative': 0,
        total: 0
      };
    }
    
    postsByDay[dateStr][post.sentiment.category]++;
    postsByDay[dateStr].total++;
  });
  
  // Convert to arrays for Chart.js
  const dates = Object.keys(postsByDay).sort();
  
  const positiveData = dates.map(date => ({
    x: date,
    y: postsByDay[date]['positive']
  }));
  
  const neutralData = dates.map(date => ({
    x: date,
    y: postsByDay[date]['neutral']
  }));
  
  const negativeData = dates.map(date => ({
    x: date,
    y: postsByDay[date]['negative']
  }));
  
  return {
    labels: dates,
    datasets: [
      {
        label: 'Positive',
        data: positiveData,
        borderColor: '#4ade80',
        backgroundColor: 'rgba(74, 222, 128, 0.2)',
        tension: 0.3,
        fill: true
      },
      {
        label: 'Neutral',
        data: neutralData,
        borderColor: '#94a3b8',
        backgroundColor: 'rgba(148, 163, 184, 0.2)',
        tension: 0.3,
        fill: true
      },
      {
        label: 'Negative',
        data: negativeData,
        borderColor: '#f87171',
        backgroundColor: 'rgba(248, 113, 113, 0.2)',
        tension: 0.3,
        fill: true
      }
    ]
  };
} 