/* eslint-disable no-param-reassign */


const AppError = require('../utils/appError');

// HANDLING INVALID DATABASE IDs
const handleCastErrorDB = err => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

// HANDLING DUPLICATE DATABASE FIELDS
const handleDuplicateFieldsDB = err => {
  const message = `Duplicate field value: '${err.keyValue.name}' Please use another value!`;
  return new AppError(message, 400);
};

// HANDLE VALIDATION ERROR
const handleValidationErrorDB = err => {
  // loop over the error message.
  const errors = Object.values(err.errors).map(el => el.message);

  const message = `Invalid input data: ${errors.join('. ')}`;
  return new AppError(message, 400);
};

// HANDLE JSONWEBTOKEN ERROR
const handleJWTError = () =>
  new AppError('Invalid token. Please log in again!', 401);

// HANDLE JWT EXPIRED ERROR
const handleJWTExpiredError = () =>
  new AppError('Your token has expired! Please log in again.', 401);

// FOR DEVELOPMENT
const sendErrorDev = (err, req, res) => {
  // A) FOR API.
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }
  // B) FOR RENDERED WEBSITE
  console.error('ERROR 💥', err);
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: err.message,
  });
};

// FOR PRODUCTION

const sendErrorProd = (err, req, res) => {
  // A) FOR API
  if (req.originalUrl.startsWith('/api')) {
    // A) Operational, trusted error: send message to client
    if (err.isOperational) {
      // only send operational error
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }

    // B) Programing or other unknown error: don't leak details to client
    // 1) Log error
    console.error('ERROR 💥', err);
    // 2) Send generic message
    return res.status(500).json({
      status: 'error',
      message: 'Somethng went very wrong!',
    });
  }

  // B) FOR RENDERED WEBSITE
  // A) Operational, trusted error: send message to client
  if (err.isOperational) {
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: err.message,
    });
  }
  // 1) Log error
  // B) Programing or other unknown error: don't leak details to client
  console.error('ERROR 💥', err);
  // // 2) Send generic message
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: 'Please try again later',
  });
};

// GLOBAL ERROR HANDLINING MIDDLEWARE 👑
module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    // A hard copy of err
    let error = { ...err };
    error.message = err.message;

    // HANDLING INVALID DATABASE IDs
    if (err.name === 'CastError') error = handleCastErrorDB(error);

    // HANDLING DUPLICATE DATABASE FIELDS
    if (err.code === 11000) error = handleDuplicateFieldsDB(error);

    // HANDLING MONGOOSE VALIDATION ERROR
    if (err.name === 'ValidationError') error = handleValidationErrorDB(error);

    // HANDLE JSONWEBTOKEN ERROR
    if (err.name === 'JsonWebTokenError') error = handleJWTError();

    // HANDLE JWT TOKEN EXPIRES ERROR
    if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, req, res);
  }
};
