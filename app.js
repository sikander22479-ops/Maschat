const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 5000;

app.use(express.json());

// Database Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected Successfully!'))
  .catch((err) => console.log('Database Connection Error: ', err));

// Inline User Schema and Model (एक ही फाइल में डेटाबेस स्कीमा)
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  password: { type: String, required: true }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

// Basic Route
app.get('/', (req, res) => {
  res.send('Maschat Backend is Running with Socket.io!');
});

// 1. User Registration API
app.post('/api/register', async (req, res) => {
  try {
    const { name, phone, password } = req.body;
    
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({ message: 'This mobile number is already registered!' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, phone, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: 'Account created successfully!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. User Login API
app.post('/api/login', async (req, res) => {
  try {
    const { phone, password } = req.body;

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ message: 'User not found! Please register first.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid password!' });
    }

    res.status(200).json({ message: 'Login successful!', userId: user._id, name: user.name });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Search User by Phone Number API
app.get('/api/search/:phone', async (req, res) => {
  try {
    const phoneToFind = req.params.phone;
    const user = await User.findOne({ phone: phoneToFind }).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found on Maschat.' });
    }

    res.status(200).json({ 
      message: 'User found!', 
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone
      } 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Socket.io Real-time Connection
io.on('connection', (socket) => {
  console.log('A user connected: ', socket.id);

  socket.on('sendMessage', (data) => {
    io.emit('receiveMessage', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected: ', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});