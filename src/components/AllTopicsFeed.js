'use client';

import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { FiRefreshCw } from 'react-icons/fi';
import TopPosts from './TopPosts';
import { analyzeSentiment } from '../utils/sentimentAnalysis';

export default function AllTopicsFeed() {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTopics, setActiveTopics] = useState([]);

  // Initialize socket connection
  useEffect(() => {
    // Create socket with explicit path and transports
    const socketInstance = io({
      path: '/socket.io',
      transports: ['polling', 'websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });
    
    socketInstance.on('connect', () => {
      console.log('All topics feed connected to WebSocket server');
      setConnected(true);
      
      // Request active topics list
      socketInstance.emit('get-active-topics');
    });
    
    socketInstance.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
    });
    
    socketInstance.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
      setConnected(false);
    });
    
    socketInstance.on('active-topics', (topics) => {
      console.log('Received active topics:', topics);
      setActiveTopics(topics);
      
      // Subscribe to all active topics
      topics.forEach(topic => {
        socketInstance.emit('subscribe-topic', topic);
      });
    });
    
    socketInstance.on('sentiment-update', (data) => {
      console.log('Received sentiment update for all topics feed:', data.topic);
      // Update posts with new data
      setPosts(prevPosts => {
        // Combine existing posts with new ones, avoiding duplicates
        const existingIds = new Set(prevPosts.map(post => post.id));
        const newPosts = data.data.analyzedPosts.filter(post => !existingIds.has(post.id));
        
        // Add topic information to each post
        const postsWithTopic = newPosts.map(post => ({
          ...post,
          topicSource: data.topic
        }));
        
        return [...postsWithTopic, ...prevPosts]
          .slice(0, 30) // Keep only the 30 most recent posts
          .sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort by date
      });
    });
    
    setSocket(socketInstance);
    
    // Initial data fetch
    fetchInitialData();
    
    // Cleanup on unmount
    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, []);
  
  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // Fetch trending topics first
      const trendingResponse = await fetch('/api/trending-topics');
      const trendingData = await trendingResponse.json();
      
      if (trendingData.topics && trendingData.topics.length > 0) {
        // Use the first 3 trending topics
        const topicsToFetch = trendingData.topics.slice(0, 3);
        
        // Fetch data for each topic
        const allPosts = [];
        for (const topic of topicsToFetch) {
          const response = await fetch(`/api/social-media?topic=${encodeURIComponent(topic)}&timeRange=day`);
          const data = await response.json();
          
          if (data.data && data.data.length > 0) {
            // Process the data with sentiment analysis
            const processedData = analyzeSentiment(data.data);
            
            // Add topic information to each post
            const postsWithTopic = processedData.analyzedPosts.map(post => ({
              ...post,
              topicSource: topic
            }));
            
            allPosts.push(...postsWithTopic);
          }
        }
        
        // Sort by date and limit to 30 posts
        const sortedPosts = allPosts
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 30);
          
        setPosts(sortedPosts);
      }
    } catch (error) {
      console.error('Error fetching initial data for all topics:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Real-time Trending Feed</h2>
        <div className="flex items-center">
          <div className={`w-3 h-3 rounded-full mr-2 ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm text-gray-300">{connected ? 'Live' : 'Disconnected'}</span>
        </div>
      </div>
      
      {activeTopics.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {activeTopics.map(topic => (
            <span key={topic} className="px-3 py-1 bg-blue-900/30 text-blue-400 rounded-full text-sm">
              #{topic}
            </span>
          ))}
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <FiRefreshCw className="animate-spin text-blue-500" size={24} />
        </div>
      ) : posts.length > 0 ? (
        <div>
          <TopPosts 
            posts={posts} 
            showTopicSource={true} 
          />
        </div>
      ) : (
        <div className="text-center text-gray-400 py-8">
          No real-time data available yet. Updates will appear here as they arrive.
        </div>
      )}
    </div>
  );
}