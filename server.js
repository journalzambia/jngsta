const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const submissionRoutes = require('./routes/submissionRoutes');
const adminRoutes = require('./routes/admin');
const path = require('path');

// Initialize Firebase Admin SDK
require('./firebaseAdmin');
dotenv.config();

const app = express();

const allowedOrigins = [
  'http://localhost:3000',
  'https://jngsta.net',
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn('❌ CORS blocked origin:', origin);
      callback(null, false);
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// ❌ REMOVE THIS LINE (no more local uploads)
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/volumes', require('./routes/volumeRoutes'));
app.use('/api/issues', require('./routes/issueRoutes'));
app.use('/api/articles', require('./routes/articleRoutes'));
app.use('/api/admin/volumes', require('./routes/adminVolumeRoutes'));
app.use('/api/admin/issues', require('./routes/adminIssueRoutes'));
app.use('/api/admin/articles', require('./routes/adminArticleRoutes'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));