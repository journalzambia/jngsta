// Backend Models - models/Volume.js
const mongoose = require('mongoose');

const volumeSchema = new mongoose.Schema({
  year: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true }
});

module.exports = mongoose.model('Volume', volumeSchema);