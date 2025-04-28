const Chat = require('../models/chatModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const Message = require('../models/messageModel');

exports.sendMessage = catchAsync(async (req, res, next) => {
  const { content, chatId } = req.body;

  if (!content || !chatId) {
    return next(new AppError('content and chat id must be required!', 400));
  }

  const message = await Message.create({
    sender: req.user.id,
    content,
    chat: chatId,
  });

  const fullMessage = await Message.findById(message.id)
    .populate('content', 'name email profilePic')
    .populate('chat');

  // Update chat's latest message
  await Chat.findByIdAndUpdate(chatId, {
    latestMessage: fullMessage,
  });

  res.status(200).json({
    status: 'success',
    result: fullMessage.length,
    data: {
      message: fullMessage,
    },
  });
});

exports.getAllMessages = catchAsync(async (req, res, next) => {
  const { chatId } = req.params;

  if (!chatId) {
    return next(new AppError('Please provide the chatId', 400));
  }

  const messages = await Message.find({ chat: chatId })
    .populate('sender', 'name email profilePic')
    .populate('chat');
    
  res.status(200).json({
    status: 'success',
    result: messages.length,
    data: {
      messages,
    },
  });
});