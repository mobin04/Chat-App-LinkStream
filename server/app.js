const express = require('express');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression')
// const mongoSanitize = require('express-mongo-sanitize')
// const xss = require('xss-clean');

const globalErrorHandler = require('./controllers/errorController');
const userRoutes = require('./routes/userRoutes');
const chatRoutes = require('./routes/chatRoutes');
const messageRoutes = require('./routes/messageRoutes');

dotenv.config({ path: './config.env' });

const app = express();

app.use(cors({
  origin: 'https://link-stream-1zqvsc3se-mobins-projects-fc6c261b.vercel.app',
  credentials: true
}));

app.use(helmet());


// middlewares
app.use(express.json());
app.use(cookieParser());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 268, // Limit each IP to 100 requests
  message: 'Too many requests from this IP, please try again after 15 minutes.',
});

// Protect against NoSQL query injection
// app.use(mongoSanitize());

// Protect against Cross-Site Scripting (XSS) attacks
// app.use(xss());
app.use(compression())

app.use('/api', limiter);


app.use('/api/v1/users', userRoutes);
app.use('/api/v1/chat', chatRoutes);
app.use('/api/v1/messages', messageRoutes);

// Global error handle middleware.
app.use(globalErrorHandler);

module.exports = app;
