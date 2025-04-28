/* eslint-disable no-param-reassign */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const Message = require('./models/messageModel');
const Chat = require('./models/chatModel');
const app = require('./app');

dotenv.config({ path: './config.env' });

mongoose
  .connect(process.env.DATABASE_URI)
  .then(() => console.log('✅ MongoDB connected :)'))
  .catch(err => {
    console.log(`MongoDB connection Error ${err}`);
    process.exit(1);
  });

// Create HTTP server
const server = http.createServer(app);

// Initialize socket.io
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000', // or your frontend URL
    credentials: true,
  },
});

// ========================================================================================================

const onlineUsers = new Map();

// ========================================================================================================

io.on('connection', socket => {
  console.log('⚡ New user connected:', socket.id);

  socket.on('setup', userData => {
    socket.userId = userData._id;
    onlineUsers.set(userData._id.toString(), socket.id);

    setTimeout(() => {
      io.emit('online users', Array.from(onlineUsers.keys()));
    }, 350);
  });

  socket.on('get-online-users', () => {
    socket.emit('online users', Array.from(onlineUsers.keys()));
  });

  // ========================================================================================================

  // Join user to a chat room
  socket.on('join chat', chatId => {
    socket.join(chatId);
    console.log(`📦 User joined chat room: ${chatId}`);
  });

  // ========================================================================================================

  // Handle send message
  socket.on('send-message', async message => {
    try {
      // Save the message to the database
      const newMessage = await Message.create({
        sender: message.sender._id,
        chat: message.chatId,
        content: message.content,
      });

      // Fetch the populated message
      const populatedMessage = await Message.findById(newMessage._id)
        .populate('sender', 'name email')
        .populate('chat');

      // Update latestMessage in chat
      const updatedChat = await Chat.findByIdAndUpdate(
        message.chatId,
        {
          latestMessage: newMessage._id,
        },
        { new: true }
      )
        .populate('participants', 'name email')
        .populate('groupAdmin', 'name email')
        .populate('latestMessage');

      // Send the message to everyone in the chat room
      io.to(message.chatId).emit('message received', {
        ...message,
        _id: newMessage._id,
        createdAt: newMessage.createdAt,
      });

      // Notify all participants who aren't in the current chat
      updatedChat.participants.forEach(participant => {
        // Skip the sender
        if (participant._id.toString() === message.sender._id.toString())
          return;

        // Get the socket ID for this user
        const userSocketId = onlineUsers.get(participant._id.toString());

        // If user is online but not in this chat, notify them about new message
        if (userSocketId) {    
          io.to(userSocketId).emit('new message notification', {
            chatId: updatedChat._id,
            message: populatedMessage,
            chat: updatedChat,
          });
        }
      });
      io.emit('online users', Array.from(onlineUsers.keys()));
      
    } catch (err) {
      console.error('❌ Error sending message:', err);
    }
  });

  // ========================================================================================================

  // Handle creating a new group chat
  socket.on('create group chat', async groupChat => {
    try {
      // Notify all participants about the new group
      groupChat.participants.forEach(participant => {
        // Get the socket ID for this user
        const userSocketId = onlineUsers.get(participant._id);

        // If user is online, notify them about new group
        if (userSocketId) {
          io.to(userSocketId).emit('new group created', groupChat);
        }
      });
    } catch (err) {
      console.error('❌ Error notifying about new group:', err);
    }
  });

  // ========================================================================================================

  socket.on('create direct chat', async chatData => {
    try {
      // Find all participants except the sender
      const otherParticipants = chatData.participants.filter(
        id => id.toString() !== socket.userId.toString()
      );
  
      // Notify all other participants about the new chat
      otherParticipants.forEach(participantId => {
        const participantSocketId = onlineUsers.get(participantId.toString());
        
        if (participantSocketId) {
          io.to(participantSocketId).emit('new direct chat', chatData);
          
          // Force update online status for both users
          setTimeout(() => {
            io.emit('online users', Array.from(onlineUsers.keys()));
          }, 350);
        }
      });
  
    } catch (err) {
      console.error('❌ Error notifying about new direct chat:', err);
    }
  });
  
  socket.on('disconnect', () => {
    // Remove user from online users
    if (socket.userId) {
      onlineUsers.delete(socket.userId);
    }
    console.log('❌ User disconnected:', socket.id);
    io.emit('online users', Array.from(onlineUsers.keys()));
  });
});

// ========================================================================================================

const port = process.env.PORT || 5000;

server.listen(port, () => {
  console.log(`✅ Server running on PORT: ${port}`);
});
