/* eslint-disable no-param-reassign */
// socketController.js
const { Server } = require('socket.io');
const Message = require('../models/messageModel');
const Chat = require('../models/chatModel');

const onlineUsers = new Map();

const socketController = server => {
  const io = new Server(server, {
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? 'https://link-stream-eta.vercel.app' 
        : 'http://localhost:3000',
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    maxHttpBufferSize: 1e6,
    transports: ['websocket', 'polling'], // Fallback to polling if websocket fails
  });

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

    // Join user to a chat room
    socket.on('join chat', chatId => {
      socket.join(chatId);
      console.log(`📦 User joined chat room: ${chatId}`);
    });
    
    // Handle delete chat notifify
    socket.on('chat-deleted', async (chatId) => {
      try {
        // Broadcast to everyone in that chat room
        io.to(chatId).emit('chat-deleted-client', chatId);
    
        // Optionally leave the room
        socket.leave(chatId);
      } catch (err) {
        console.error('❌ Error in chat-deleted socket:', err);
      }
    });

    // Handle send message
    socket.on('send-message', async message => {
      try {
        // Create message with Promise
        const newMessagePromise = Message.create({
          sender: message.sender._id,
          chat: message.chatId,
          content: message.content,
        });

        // Wait for message creation to complete
        const newMessage = await newMessagePromise;
        
        // Run these two operations in parallel
        const [populatedMessage, updatedChat] = await Promise.all([
          Message.findById(newMessage._id)
            .populate('sender', 'name email')
            .populate('chat')
            .lean(),
          
          Chat.findByIdAndUpdate(
            message.chatId,
            {
              latestMessage: newMessage._id,
            },
            { new: true }
          )
            .populate('participants', 'name email')
            .populate('groupAdmin', 'name email')
            .populate('latestMessage')
            .lean()
        ]);

        io.to(message.chatId).emit('message received', {
          ...message,
          _id: newMessage._id,
          createdAt: newMessage.createdAt,
        });

        updatedChat.participants.forEach(participant => {
          if (participant._id.toString() === message.sender._id.toString())
            return;

          const userSocketId = onlineUsers.get(participant._id.toString());

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

    // Handle creating a new group chat
    socket.on('create group chat', async groupChat => {
      try {
        const promises = [];
        
        groupChat.participants.forEach(participant => {
          const userSocketId = onlineUsers.get(participant._id);

          if (userSocketId) {
            promises.push(
              new Promise(resolve => {
                io.to(userSocketId).emit('new group created', groupChat);
                resolve();
              })
            );
          }
        });
        
        // Wait for all notifications to be sent in parallel
        await Promise.all(promises);
      } catch (err) {
        console.error('❌ Error notifying about new group:', err);
      }
    });

    socket.on('create direct chat', async chatData => {
      try {
        const otherParticipants = chatData.participants.filter(
          id => id.toString() !== socket.userId.toString()
        );

        const promises = [];
        
        otherParticipants.forEach(participantId => {
          const participantSocketId = onlineUsers.get(participantId.toString());

          if (participantSocketId) {
            promises.push(
              new Promise(resolve => {
                io.to(participantSocketId).emit('new direct chat', chatData);
                resolve();
              })
            );
          }
        });
        
        // Wait for all notifications to be sent in parallel
        await Promise.all(promises);

        setTimeout(() => {
          io.emit('online users', Array.from(onlineUsers.keys()));
        }, 200);
      } catch (err) {
        console.error('❌ Error notifying about new direct chat:', err);
      }
    });

    // Handle socket disconnection
    socket.on('disconnect', () => {
      if (socket.userId) {
        onlineUsers.delete(socket.userId);
      }
      console.log('❌ User disconnected:', socket.id);
      io.emit('online users', Array.from(onlineUsers.keys()));
    });
    
    // Add error handling for socket
    socket.conn.on('error', (err) => {
      console.error('Socket connection error:', err);
    });
  });
  
  // Handle errors at IO level
  io.engine.on('connection_error', (err) => {
    console.error('Connection error:', err);
  });
  
  return io;
};

module.exports = {
  socketController,
  onlineUsers,
};