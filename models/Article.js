const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String },
  abstract: { type: String },
  image: { type: String },
  pdf: { type: String },
  issn: { type: String },
  doi: { type: String },
  slug: { type: String, required: true, unique: true },
  volume: { type: mongoose.Schema.Types.ObjectId, ref: 'Volume', required: true },
  issue: { type: mongoose.Schema.Types.ObjectId, ref: 'Issue', required: true },
  featured: { type: Boolean, default: false },
  // Add these two fields for tracking
  readCount: { type: Number, default: 0 },
  downloadCount: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Article', articleSchema);