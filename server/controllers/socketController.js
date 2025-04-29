/* eslint-disable no-param-reassign */
// socketController.js
const { Server } = require('socket.io');
const Message = require('../models/messageModel');
const Chat = require('../models/chatModel');

const onlineUsers = new Map();

const socketController = server => {
  const io = new Server(server, {
    cors: {
      origin: 'https://link-stream-eta.vercel.app',
      credentials: true,
    },
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

    // Handle send message
    socket.on('send-message', async message => {
      try {
        const newMessage = await Message.create({
          sender: message.sender._id,
          chat: message.chatId,
          content: message.content,
        });

        const populatedMessage = await Message.findById(newMessage._id)
          .populate('sender', 'name email')
          .populate('chat');

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
        groupChat.participants.forEach(participant => {
          const userSocketId = onlineUsers.get(participant._id);

          if (userSocketId) {
            io.to(userSocketId).emit('new group created', groupChat);
          }
        });
      } catch (err) {
        console.error('❌ Error notifying about new group:', err);
      }
    });

    socket.on('create direct chat', async chatData => {
      try {
        const otherParticipants = chatData.participants.filter(
          id => id.toString() !== socket.userId.toString()
        );

        otherParticipants.forEach(participantId => {
          const participantSocketId = onlineUsers.get(participantId.toString());

          if (participantSocketId) {
            io.to(participantSocketId).emit('new direct chat', chatData);

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
      if (socket.userId) {
        onlineUsers.delete(socket.userId);
      }
      console.log('❌ User disconnected:', socket.id);
      io.emit('online users', Array.from(onlineUsers.keys()));
    });
  });
};

module.exports = socketController;
