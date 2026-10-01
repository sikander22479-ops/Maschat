const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// public फोल्डर को एक्टिव करें
app.use(express.static(path.join(__dirname, 'public')));

// यह लाइन पक्का करेगी कि लिंक खोलते ही index.html पेज दिखे
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-room', (roomID, userId) => {
    socket.join(roomID);
    socket.to(roomID).emit('user-connected', userId);

    socket.on('disconnect', () => {
      socket.to(roomID).emit('user-disconnected', userId);
    });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Maschat Server running on port ${PORT}`);
});
