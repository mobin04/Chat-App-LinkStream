/* eslint-disable prefer-destructuring */
const jwt = require('jsonwebtoken');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const User = require('../models/userModel');

const createToken = userId => {
  return jwt.sign({ id: userId }, process.env.JWT_SECREAT, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, req, res) => {
  const token = createToken(user._id);

  res.cookie('jwt', token, {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // Only secure in production
    sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax', // MUST be 'None' for cross-site cookies
  });
  

  res.status(statusCode).json({
    status: 'success',
    token,
    user,
  });
};

exports.protect = catchAsync(async (req, res, next) => {
  let token;

  // Get the token from Bearer or cookie
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1]; // to get the second value using index
  } else if (req.cookies.jwt) {
    // get the token from the cookie
    token = req.cookies.jwt;
  }

  // If not token
  if (!token) {
    return next(
      new AppError(
        '🙂 You are not logged in, Please log in to get access!',
        401
      )
    );
  }

  // Verify the token.
  const decode = jwt.verify(token, process.env.JWT_SECREAT);

  // Get the user based on the token
  const currentUser = await User.findById(decode.id);

  if (!currentUser) {
    return next(
      new AppError('User belong to this token does not exists 😪', 401)
    );
  }

  // Check if user changed password after the token issued.
  if (currentUser.changedPasswordAfter(decode.iat)) {
    return next(
      new AppError('Password recently changed, Please Log in again!')
    );
  }

  req.user = currentUser;

  next();
});

exports.createUser = catchAsync(async (req, res) => {
  const { name, email, password } = req.body;
  const user = await User.create({
    name,
    email,
    password,
  });

  createSendToken(user, 200, req, res);
});

exports.login = catchAsync(async (req, res, next) => {
  // Get the user info from the body;
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Please enter your email and password!', 400));
  }

  const user = await User.findOne({ email }).select('+password');

  // check the entered password is match as the original password.
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  createSendToken(user, 200, req, res);
});

exports.logedOut = (req, res) => {
  res.cookie('jwt', 'logedOut', {
    httpOnly: true,
    expires: new Date(Date.now() + 10 * 1000), // Expires in 10 sec
  });
  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully',
  });
};
