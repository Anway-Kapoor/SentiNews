'use client';

import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { FiRefreshCw } from 'react-icons/fi';
import TopPosts from './TopPosts';
import { analyzeSentiment } from '../utils/sentimentAnalysis';

export default function RealtimeNewsFeed({ initialTopic = 'chess' }) {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [topic, setTopic] = useState(initialTopic);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

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
      console.log('Connected to WebSocket server');
      setConnected(true);
      
      // Subscribe to initial topic
      socketInstance.emit('subscribe-topic', initialTopic);
    });
    
    socketInstance.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
    });
    
    socketInstance.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
      setConnected(false);
    });
    
    socketInstance.on('sentiment-update', (data) => {
      console.log('Received sentiment update:', data);
      if (data.topic === topic) {
        // Update posts with new data
        setPosts(prevPosts => {
          // Combine existing posts with new ones, avoiding duplicates
          const existingIds = new Set(prevPosts.map(post => post.id));
          const newPosts = data.data.analyzedPosts.filter(post => !existingIds.has(post.id));
          
          // Sort by date (newest first)
          const combinedPosts = [...newPosts, ...prevPosts]
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 20); // Keep only the 20 most recent posts
          
          // Update last update time if we received new posts
          if (newPosts.length > 0) {
            setLastUpdate(new Date());
          }
          
          return combinedPosts;
        });
      }
    });
    
    setSocket(socketInstance);
    
    // Initial data fetch
    fetchInitialData(initialTopic);
    
    // Cleanup on unmount
    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, [initialTopic]);
  
  // Handle topic change
  useEffect(() => {
    if (!socket || !connected) return;
    
    // Unsubscribe from old topic and subscribe to new one
    socket.emit('unsubscribe-topic', initialTopic);
    socket.emit('subscribe-topic', topic);
    
    // Fetch initial data for new topic
    fetchInitialData(topic);
  }, [topic, socket, connected]);
  
  const fetchInitialData = async (currentTopic) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/social-media?topic=${encodeURIComponent(currentTopic)}&timeRange=day`);
      const data = await response.json();
      
      if (data.data && data.data.length > 0) {
        // Process the data with sentiment analysis before displaying
        const processedData = analyzeSentiment(data.data);
        
        // Sort by date (newest first)
        const sortedPosts = processedData.analyzedPosts
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 20); // Show only the 20 most recent posts initially
        
        setPosts(sortedPosts);
        setLastUpdate(new Date());
      } else {
        setPosts([]);
      }
    } catch (error) {
      console.error('Error fetching initial data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Force refresh data
  const handleRefresh = () => {
    fetchInitialData(topic);
  };
  
  return (
    <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Real-time News Feed</h2>
        <div className="flex items-center gap-4">
          <button 
            onClick={handleRefresh}
            className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 focus:outline-none"
            title="Refresh feed"
          >
            <FiRefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-2 ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-300">{connected ? 'Live' : 'Disconnected'}</span>
          </div>
        </div>
      </div>
      
      {lastUpdate && (
        <div className="text-xs text-gray-400 mb-4">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <FiRefreshCw className="animate-spin text-blue-500" size={24} />
        </div>
      ) : posts.length > 0 ? (
        <div>
          <div className="mb-4 flex flex-wrap gap-2">
            {posts.some(post => post.platform === 'News') && (
              <span className="px-3 py-1 bg-blue-900/30 text-blue-400 rounded-full text-sm">
                News API
              </span>
            )}
            {posts.some(post => post.platform === 'HackerNews') && (
              <span className="px-3 py-1 bg-orange-900/30 text-orange-400 rounded-full text-sm">
                HackerNews
              </span>
            )}
          </div>
          <TopPosts posts={posts} />
        </div>
      ) : (
        <div className="text-center text-gray-400 py-8">
          No real-time data available yet. Updates will appear here as they arrive.
        </div>
      )}
    </div>
  );
}