// Backend Models - models/Issue.js
const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  volume: { type: mongoose.Schema.Types.ObjectId, ref: 'Volume', required: true }
});

module.exports = mongoose.model('Issue', issueSchema);