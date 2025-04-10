const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const path = require('path');
const fs = require('fs');

// Convert ESM module to CommonJS for server.js
const socketServerPath = path.join(__dirname, 'src', 'utils', 'socketServer.js');
const socketServerContent = fs.readFileSync(socketServerPath, 'utf8');

// Better conversion of ESM to CommonJS
const modifiedContent = `
const { Server } = require('socket.io');
const { analyzeSentiment } = require('./src/utils/sentimentAnalysis');

let io;
// Track active topics
const activeTopics = new Set();

function initSocketServer(server) {
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
      console.log(\`Client \${socket.id} subscribed to topic: \${topic}\`);
      socket.join(topic);
    });
    
    socket.on('unsubscribe-topic', (topic) => {
      console.log(\`Client \${socket.id} unsubscribed from topic: \${topic}\`);
      socket.leave(topic);
    });
    
    socket.on('get-active-topics', () => {
      console.log(\`Client \${socket.id} requested active topics\`);
      socket.emit('active-topics', Array.from(activeTopics));
    });
    
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
  
  return io;
}

function emitSentimentUpdate(topic, newPosts) {
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

module.exports = { initSocketServer, emitSentimentUpdate };
`;

// Write temporary file
const tempPath = path.join(__dirname, 'temp-socketServer.js');
fs.writeFileSync(tempPath, modifiedContent);

const { initSocketServer } = require(tempPath);

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  // Create HTTP server
  const server = createServer((req, res) => {
    // Check if it's a socket.io request
    if (req.url && req.url.startsWith('/socket.io')) {
      // Let socket.io handle it
      return;
    }
    
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });
  
  // Initialize socket server with explicit path
  const io = initSocketServer(server);
  
  server.listen(3000, (err) => {
    if (err) throw err;
    console.log('> Ready on http://localhost:3000');
    console.log('> Socket.IO server initialized at /socket.io');
  });
  
  // Clean up temp file on server close
  server.on('close', () => {
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }
  });
});