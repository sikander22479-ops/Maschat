const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// public फोल्डर को सीधे सेट करें
app.use(express.static(path.join(__dirname, 'public')));

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
  console.log(`Server running on port ${PORT}`);
});
