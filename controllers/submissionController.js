const mongoose = require('mongoose');
const Submission = require('../models/Submission');
const admin = require('firebase-admin');
const retry = require('async-retry'); // Add retry package

// Create a new submission
exports.createSubmission = async (req, res) => {
  try {
    const {
      correspondingAuthor,
      authorEmail,
      authorAffiliation,
      authorCountry,
      coAuthors,
      paperTitle,
      paperAbstract,
      keywords,
      paperType,
      subjectArea,
      copyrightAgreement,
      ethicsAgreement
    } = req.body;

    // Validate required fields
    if (
      !correspondingAuthor ||
      !authorEmail ||
      !authorAffiliation ||
      !authorCountry ||
      !paperTitle ||
      !paperAbstract ||
      !keywords ||
      !paperType ||
      !subjectArea ||
      !req.file ||
      copyrightAgreement !== 'true' ||
      ethicsAgreement !== 'true'
    ) {
      return res.status(400).json({ message: 'All required fields must be provided' });
    }

    // Parse coAuthors if sent as a JSON string
    let parsedCoAuthors;
    try {
      parsedCoAuthors = typeof coAuthors === 'string' ? JSON.parse(coAuthors) : coAuthors;
    } catch (error) {
      return res.status(400).json({ message: 'Invalid coAuthors format' });
    }

    const file = req.file;

    // Upload to Firebase Storage with retry logic
    const bucket = admin.storage().bucket();
    const fileName = `submissions/${Date.now()}-${Math.round(Math.random() * 1e9)}-${file.originalname}`;
    const storageFile = bucket.file(fileName);

    await retry(
      async () => {
        try {
          await storageFile.save(file.buffer, {
            metadata: {
              contentType: file.mimetype,
            },
          });
        } catch (error) {
          console.error('Upload attempt failed:', error);
          throw error; // Trigger retry
        }
      },
      {
        retries: 3,
        factor: 2,
        minTimeout: 100, // 100ms, 200ms, 400ms
        maxTimeout: 1000,
        onRetry: (err, attempt) => {
          console.log(`Upload retry attempt ${attempt}:`, err.message);
        },
      }
    );

    // Make file publicly accessible
    await storageFile.makePublic();
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

    // Create submission
    const submission = new Submission({
      userId: req.user.uid,
      correspondingAuthor,
      authorEmail,
      authorAffiliation,
      authorCountry,
      coAuthors: parsedCoAuthors,
      paperTitle,
      paperAbstract,
      keywords,
      paperType,
      subjectArea,
      manuscriptFilePath: publicUrl,
      manuscriptFileName: file.originalname,
      mimetype: file.mimetype,
      copyrightAgreement: copyrightAgreement === 'true',
      ethicsAgreement: ethicsAgreement === 'true'
    });

    await submission.save();

    res.status(201).json({
      message: 'Submission created successfully',
      submissionId: submission._id,
      manuscriptUrl: publicUrl
    });
  } catch (error) {
    console.error('Create submission error:', error);
    res.status(500).json({ message: 'Server error during submission', error: error.message });
  }
};

// Get all submissions for the authenticated user
exports.getSubmissions = async (req, res) => {
  try {
    const submissions = await Submission.find({ userId: req.user.uid });
    res.json(submissions);
  } catch (error) {
    console.error('Get submissions error:', error);
    res.status(500).json({ message: 'Server error retrieving submissions' });
  }
};

// Get a submission by ID
exports.getSubmissionById = async (req, res) => {
  try {
    const submission = await Submission.findOne({ _id: req.params.id, userId: req.user.uid });
    if (!submission) {
      return res.status(404).json({ message: `Submission not found for ID ${req.params.id} or user ${req.user.uid}` });
    }

    if (req.query.download === 'true') {
      const bucket = admin.storage().bucket();
      // Extract filename without query parameters
      const fileName = submission.manuscriptFilePath.split('/').pop().split('?')[0];
      const file = bucket.file(`submissions/${fileName}`); // Ensure correct path

      // Check if file exists
      const [exists] = await file.exists();
      if (!exists) {
        console.error(`File not found in Firebase Storage: submissions/${fileName}`);
        return res.status(404).json({ message: 'File not found in storage' });
      }

      // Set response headers
      res.setHeader('Content-Type', submission.mimetype || 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${submission.manuscriptFileName}"`);

      // Stream the file
      file.createReadStream()
        .on('error', (error) => {
          console.error('Error streaming file:', error);
          res.status(500).json({ message: 'Error downloading file', error: error.message });
        })
        .pipe(res);
    } else {
      res.json(submission);
    }
  } catch (error) {
    console.error('Get submission by ID error:', error);
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid submission ID' });
    }
    res.status(500).json({ message: 'Server error retrieving submission', error: error.message });
  }
};

// Delete a submission by ID
exports.deleteSubmission = async (req, res) => {
  try {
    const submission = await Submission.findOne({ _id: req.params.id, userId: req.user.uid });
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found or you do not have access' });
    }

    // Delete file from Firebase Storage
    if (submission.manuscriptFilePath) {
      const bucket = admin.storage().bucket();
      const fileName = submission.manuscriptFilePath.split('/').pop();
      await bucket.file(fileName).delete().catch(err => {
        console.warn('File delete warning:', err);
      });
    }

    await submission.deleteOne();
    res.json({ message: 'Submission deleted successfully' });
  } catch (error) {
    console.error('Delete submission error:', error);
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid submission ID' });
    }
    res.status(500).json({ message: 'Server error deleting submission' });
  }
};