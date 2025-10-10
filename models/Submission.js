const mongoose = require('mongoose');

const coAuthorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  affiliation: { type: String, required: true }
});

const submissionSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  correspondingAuthor: { type: String, required: true },
  authorEmail: { type: String, required: true },
  authorAffiliation: { type: String, required: true },
  authorCountry: { type: String, required: true },
  coAuthors: [coAuthorSchema],
  paperTitle: { type: String, required: true },
  paperAbstract: { type: String, required: true },
  keywords: { type: String, required: true },
  paperType: { type: String, required: true },
  subjectArea: { type: String, required: true },
  manuscriptFilePath: { type: String, required: true },
manuscriptFileName: { type: String, required: true }, // Ensure this exists
  mimetype: { type: String, required: true }, // Ensure this exists
  copyrightAgreement: { type: Boolean, required: true },
  ethicsAgreement: { type: Boolean, required: true },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Submission', submissionSchema);