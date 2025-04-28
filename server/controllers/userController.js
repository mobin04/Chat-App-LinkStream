const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const User = require('../models/userModel');

exports.getCurrentUser = (req, res) => {
  res.status(200).json({
    status: 'success',
    data: {
      user: req.user,
    },
  });
};

exports.findUser = catchAsync(async (req, res, next) => {
  const search  = req.query.search.toString();
  let users = [];
  
  if(!search) {
    return next(new AppError('😑 No email found!'))
  }

  users = await User.find({
    email: { $regex: `${search}`, $options: 'i' },
  }).select('-password');
  

  if (!users) return next(new AppError(`can't find the user`, 404));
  
  
  const finalUsers = users.filter((u) => u._id.toString() !== req.user._id.toString());
  
  res.status(200).json({
    status: 'success',
    data: {
      users: finalUsers,
    },
  });
});


