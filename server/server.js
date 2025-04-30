// server.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const http = require('http');
const app = require('./app');
const {socketController} = require('./controllers/socketController');

dotenv.config({ path: './config.env' });

mongoose
  .connect(process.env.DATABASE_URI)
  .then(() => console.log('✅ MongoDB connected :)'))
  .catch(err => {
    console.log(`MongoDB connection Error ${err}`);
    process.exit(1);
  });


const server = http.createServer(app);

const io = socketController(server);
app.set('io', io);

const port = process.env.PORT || 5000;

server.listen(port, () => {
  console.log(`✅ Server running on PORT: ${port}`);
});
