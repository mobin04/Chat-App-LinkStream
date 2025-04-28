const express = require('express');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const globalErrorHandler = require('./controllers/errorController');
const userRoutes = require('./routes/userRoutes');
const chatRoutes = require('./routes/chatRoutes');
const messageRoutes = require('./routes/messageRoutes');

dotenv.config({ path: './config.env' });

const app = express();

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

// app.options('*', cors());

app.use(cookieParser());


// middlewares
app.use(express.json());

app.use('/api/v1/users', userRoutes);
app.use('/api/v1/chat', chatRoutes);
app.use('/api/v1/messages', messageRoutes);

// Global error handle middleware.
app.use(globalErrorHandler);

module.exports = app;
