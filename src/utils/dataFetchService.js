import { fetchSocialMediaData } from './apiService';
import { emitSentimentUpdate } from './socketServer';

// Keep track of active topics
const activeTopics = new Set();

// Start monitoring a topic
export function startMonitoringTopic(topic) {
  if (activeTopics.has(topic)) return;
  
  activeTopics.add(topic);
  console.log(`Started monitoring topic: ${topic}`);
  
  // Immediately fetch data
  fetchAndEmitUpdate(topic);
}

// Stop monitoring a topic
export function stopMonitoringTopic(topic) {
  activeTopics.delete(topic);
  console.log(`Stopped monitoring topic: ${topic}`);
}

// Fetch new data and emit updates
async function fetchAndEmitUpdate(topic) {
  try {
    console.log(`Fetching real-time updates for topic: ${topic}`);
    const data = await fetchSocialMediaData(topic, 'day', true); // Added 'true' for real-time flag
    
    if (data && data.length > 0) {
      console.log(`Emitting update for ${topic} with ${data.length} posts`);
      emitSentimentUpdate(topic, data);
    } else {
      console.log(`No new data found for topic: ${topic}`);
    }
  } catch (error) {
    console.error(`Error fetching data for topic ${topic}:`, error);
  }
}

// Get all active topics
export function getActiveTopics() {
  return Array.from(activeTopics);
}

// Set up periodic fetching for all active topics
setInterval(() => {
  if (activeTopics.size > 0) {
    console.log(`Checking updates for ${activeTopics.size} active topics`);
    activeTopics.forEach(topic => {
      fetchAndEmitUpdate(topic);
    });
  }
}, 60000); // Fetch new data every minute