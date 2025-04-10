'use client';

import { useState, useEffect } from 'react';
import { FiSearch, FiRefreshCw } from 'react-icons/fi';
import SentimentChart from './SentimentChart';
import SentimentDistribution from './SentimentDistribution';
import TopPosts from './TopPosts';
import { analyzeSentiment } from '../utils/sentimentAnalysis';
import KeyPhrases from './KeyPhrases';
import RealtimeNewsFeed from './RealtimeNewsFeed';

export default function Dashboard({ showOnlySearchBar = false }) {
  const [topic, setTopic] = useState('');
  const [searchedTopic, setSearchedTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [timeRange, setTimeRange] = useState('week');
  const [error, setError] = useState(null);
  const [sourcesChecked, setSourcesChecked] = useState(0);

  const handleSearch = async () => {
    if (!topic.trim()) return;
    
    setLoading(true);
    setSearchedTopic(topic);
    setError(null);
    setSourcesChecked(0);
    
    try {
      // Fetch data from our API route
      const response = await fetch(`/api/social-media?topic=${encodeURIComponent(topic)}&timeRange=${timeRange}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch data');
      }
      
      const responseData = await response.json();
      
      if (!responseData.data || responseData.data.length === 0) {
        setError('No data found for this topic. Try a different search term or time range.');
        setData(null);
      } else {
        // Process the data with sentiment analysis
        const processedData = analyzeSentiment(responseData.data);
        setData(processedData);
        setSourcesChecked(responseData.sourcesChecked || 0);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    if (searchedTopic) {
      handleSearch();
    }
  };

  useEffect(() => {
    if (searchedTopic) {
      handleSearch();
    }
  }, [timeRange]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8 text-center">Social Media Sentiment Analysis</h1>
      
      <div className="mb-8">
        <div className="flex gap-2">
          <div className="relative flex-grow">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Enter a topic to analyze..."
              className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
            />
            <button
              onClick={handleSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              disabled={loading}
            >
              <FiSearch size={20} />
            </button>
          </div>
          <button
            onClick={handleRefresh}
            className="p-3 rounded-lg bg-gray-800 border border-gray-700 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
            disabled={loading || !searchedTopic}
          >
            <FiRefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>
      
      {searchedTopic && (
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">
              Results for &quot;{searchedTopic}&quot;
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => setTimeRange('day')}
                className={`px-4 py-2 rounded-lg ${
                  timeRange === 'day'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                Day
              </button>
              <button
                onClick={() => setTimeRange('week')}
                className={`px-4 py-2 rounded-lg ${
                  timeRange === 'week'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setTimeRange('month')}
                className={`px-4 py-2 rounded-lg ${
                  timeRange === 'month'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                Month
              </button>
            </div>
          </div>
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="text-center text-red-400 py-12 bg-red-900/20 rounded-xl border border-red-800">
          <p>{error}</p>
        </div>
      ) : data ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
            <h3 className="text-xl font-semibold mb-4">Sentiment Over Time</h3>
            <SentimentChart data={data.timeSeriesData} />
          </div>
          
          <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
            <h3 className="text-xl font-semibold mb-4">Sentiment Distribution</h3>
            <SentimentDistribution data={data.distributionData} />
          </div>
          
          <div className="lg:col-span-2 bg-gray-800 rounded-xl p-6 shadow-lg mb-8">
            <h3 className="text-xl font-semibold mb-4">Key Topics</h3>
            <KeyPhrases phrases={data.keyPhrases} />
          </div>
          
          <div className="lg:col-span-2">
            <RealtimeNewsFeed initialTopic={searchedTopic || 'chess'} />
          </div>
          
          <div className="lg:col-span-2 bg-gray-800 rounded-xl p-6 shadow-lg">
            <h3 className="text-xl font-semibold mb-4">Top Posts</h3>
            <TopPosts posts={data.topPosts} />
          </div>
          
     
          <div className="lg:col-span-2 bg-gray-800 rounded-xl p-6 shadow-lg">
            <h3 className="text-xl font-semibold mb-4">Data Source</h3>
            <div className="flex flex-col items-center gap-4">
              <div className="text-gray-300 mb-2">
                Analyzed approximately {sourcesChecked.toLocaleString()} sources
              </div>
              <div className="flex gap-4 justify-center flex-wrap">
                {data.analyzedPosts.some(post => post.platform === 'News') && (
                  <div className="px-4 py-2 bg-blue-900/30 rounded-lg border border-blue-800 text-blue-300">
                    News: {data.analyzedPosts.filter(post => post.platform === 'News').length} articles
                  </div>
                )}
                {data.analyzedPosts.some(post => post.platform === 'HackerNews') && (
                  <div className="px-4 py-2 bg-orange-900/30 rounded-lg border border-orange-800 text-orange-300">
                    HackerNews: {data.analyzedPosts.filter(post => post.platform === 'HackerNews').length} posts
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : searchedTopic ? (
        <div className="text-center text-gray-400 py-12">
          No data available. Try a different topic or time range.
        </div>
      ) : (
        <div className="text-center text-gray-400 py-12">
          Enter a topic to see sentiment analysis results.
        </div>
      )}
    </div>
  );
}