import { Server } from 'socket.io';
import { analyzeSentiment } from './sentimentAnalysis';

let io;
// Track active topics
const activeTopics = new Set();

export function initSocketServer(server) {
  if (io) return io;
  
  io = new Server(server, {
    path: '/socket.io',
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    },
    transports: ['polling', 'websocket']
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    socket.on('subscribe-topic', (topic) => {
      console.log(`Client ${socket.id} subscribed to topic: ${topic}`);
      socket.join(topic);
    });
    
    socket.on('unsubscribe-topic', (topic) => {
      console.log(`Client ${socket.id} unsubscribed from topic: ${topic}`);
      socket.leave(topic);
    });
    
    socket.on('get-active-topics', () => {
      console.log(`Client ${socket.id} requested active topics`);
      socket.emit('active-topics', Array.from(activeTopics));
    });
    
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
  
  return io;
}

export function emitSentimentUpdate(topic, newPosts) {
  if (!io) return;
  
  // Add to active topics
  activeTopics.add(topic);
  
  // Process the new posts with sentiment analysis
  const processedData = analyzeSentiment(newPosts);
  
  // Emit to all clients subscribed to this topic
  io.to(topic).emit('sentiment-update', {
    topic,
    data: processedData
  });
}