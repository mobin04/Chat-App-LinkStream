const Chat = require('../models/chatModel');
const Message = require('../models/messageModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const { onlineUsers } = require('./socketController');

exports.createChat = catchAsync(async (req, res, next) => {
  const { userId } = req.body;

  if (!userId) {
    return next(new AppError('Opps! userId not found!', 400));
  }

  const chat = await Chat.findOne({
    isGroupChat: false,
    participants: { $all: [req.user._id, userId] },
  });

  if (chat && chat.isGroupChat) {
    return res.status(200).json({
      status: 'success',
      data: { chat },
    });
  }

  const createNewChat = await Chat.create({
    participants: [req.user._id, userId],
  });

  const newChat = await Chat.findById(createNewChat._id).populate(
    'participants',
    'name email profilePic'
  );

  res.status(200).json({
    status: 'success',
    data: { newChat },
  });
});

// Get the current loged in user chats.
exports.getMyChats = catchAsync(async (req, res, next) => {
  const chats = await Chat.find({
    participants: { $in: [req.user.id] },
  })
    .populate('participants', 'name email profilePic')
    .populate({
      path: 'latestMessage',
      select: 'content',
    })
    .sort({ updatedAt: -1 });

  if (!chats) {
    return next(new AppError('No chats found!'));
  }


  res.status(200).json({
    status: 'success',
    results: chats.length,
    data: {
      chats,
    },
  });
});

exports.createGroupChat = catchAsync(async (req, res, next) => {
  const { name, userIds } = req.body;

  if (!name || !userIds || userIds.length < 2) {
    return next(
      new AppError('Group must have atleast 3 members including creator', 400)
    );
  }

  userIds.push(req.user._id);

  const newGroup = await Chat.create({
    name,
    participants: userIds,
    groupAdmin: req.user._id,
    isGroupChat: true,
  });

  const fullGroupChat = await Chat.findById(newGroup._id)
    .populate('participants', '-password')
    .populate('groupAdmin', '-password');

  res.status(200).json({
    status: 'success',
    data: {
      fullGroupChat,
    },
  });
});

exports.getSingleChat = async (req, res) => {
  const chatId = req.params.id;

  const chat = await Chat.findById(chatId)
    .populate('participants', 'name email profilePic')
    .populate('groupAdmin', 'name email');

  res.status(200).json({
    status: 'success',
    data: { chat },
  });
};

exports.deleteChat = catchAsync(async (req, res, next) => {
  const { chatId } = req.query;

  if (!chatId) {
    return next(new AppError('Chat ID not found😑', 400));
  }

  const chat = await Chat.findById(chatId);
  if (!chat) {
    return next(new AppError('No chat found!', 404));
  }

  // Notify users *before* deletion
  const io = req.app.get('io');

  chat.participants.forEach(participant => {
    const socketId = onlineUsers.get(participant.toString());
    if (socketId) {
      io.to(socketId).emit('chat-deleted-client', chatId);
    }
  });

  // Then delete messages and chat
  await Message.deleteMany({ chat: chatId });
  await Chat.findByIdAndDelete(chatId);

  res.status(201).json({
    status: 'success',
  });
});

exports.exitGroup = catchAsync(async (req, res, next) => {
  const { userId } = req.query;
  const { chatId } = req.query;
  if (!userId) {
    return next(new AppError('Please provide the valid userId', 400));
  }

  const removeUser = await Chat.findByIdAndUpdate(chatId, {
    $pull: { participants: userId },
  });

  if (!removeUser) {
    return next(new AppError('Error Removing user', 500));
  }

  res.status(201).json({
    status: 'success',
  });
});
