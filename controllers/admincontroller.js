const mongoose = require('mongoose');
const User = require('../models/user');
const Submission = require('../models/Submission');
const admin = require('firebase-admin');

exports.isAdmin = async (req, res, next) => {
  try {
    console.log('Checking admin for UID:', req.user.uid);
    const user = await User.findOne({ uid: req.user.uid });
    if (!user) {
      console.log('User not found for UID:', req.user.uid);
      return res.status(404).json({ message: 'User not found' });
    }
    if (user.email !== 'uelms2025@gmail.com') {
      console.log('Non-admin user attempted access:', user.email);
      return res.status(403).json({ message: 'Admin access required' });
    }
    console.log('Admin check passed for:', user.email);
    next();
  } catch (error) {
    console.error('Admin check error:', error);
    res.status(500).json({ message: 'Server error checking admin status' });
  }
};

exports.getUsers = async (req, res) => {
  try {
    console.log('Fetching all users');
    const users = await User.find();
    console.log('Found users:', users.length);
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error retrieving users' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    console.log('Deleting user:', req.params.id);
    const user = await User.findById(req.params.id);
    if (!user) {
      console.log('User not found:', req.params.id);
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete user from Firebase Authentication
    try {
      await admin.auth().deleteUser(user.uid);
      console.log('Firebase user deleted:', user.uid);
    } catch (firebaseError) {
      console.error('Error deleting Firebase user:', firebaseError);
      return res.status(500).json({ message: 'Failed to delete user from Firebase Authentication' });
    }

    // Delete user from MongoDB
    await user.deleteOne();
    console.log('MongoDB user deleted:', req.params.id);
    res.json({ message: 'User deleted successfully from both MongoDB and Firebase' });
  } catch (error) {
    console.error('Delete user error:', error);
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    res.status(500).json({ message: 'Server error deleting user' });
  }
};

exports.getSubmissions = async (req, res) => {
  try {
    console.log('Fetching all submissions');
    const submissions = await Submission.find();
    console.log('Found submissions:', submissions.length);
    res.json(submissions);
  } catch (error) {
    console.error('Get submissions error:', error);
    res.status(500).json({ message: 'Server error retrieving submissions' });
  }
};

exports.deleteSubmission = async (req, res) => {
  try {
    console.log('Deleting submission:', req.params.id);
    const submission = await Submission.findById(req.params.id);
    if (!submission) {
      console.log('Submission not found:', req.params.id);
      return res.status(404).json({ message: 'Submission not found' });
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
    console.log('Submission deleted:', req.params.id);
    res.json({ message: 'Submission deleted successfully' });
  } catch (error) {
    console.error('Delete submission error:', error);
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid submission ID' });
    }
    res.status(500).json({ message: 'Server error deleting submission' });
  }
};

exports.approveSubmission = async (req, res) => {
  try {
    console.log('Approving submission:', req.params.id);
    const submission = await Submission.findById(req.params.id);
    if (!submission) {
      console.log('Submission not found:', req.params.id);
      return res.status(404).json({ message: 'Submission not found' });
    }
    submission.status = 'Approved';
    await submission.save();
    console.log('Submission approved:', req.params.id);
    res.json({ message: 'Submission approved successfully' });
  } catch (error) {
    console.error('Approve submission error:', error);
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid submission ID' });
    }
    res.status(500).json({ message: 'Server error approving submission' });
  }
};

exports.rejectSubmission = async (req, res) => {
  try {
    console.log('Rejecting submission:', req.params.id);
    const submission = await Submission.findById(req.params.id);
    if (!submission) {
      console.log('Submission not found:', req.params.id);
      return res.status(404).json({ message: 'Submission not found' });
    }
    submission.status = 'Rejected';
    await submission.save();
    console.log('Submission rejected:', req.params.id);
    res.json({ message: 'Submission rejected successfully' });
  } catch (error) {
    console.error('Reject submission error:', error);
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid submission ID' });
    }
    res.status(500).json({ message: 'Server error rejecting submission' });
  }
};

exports.getSubmissionById = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id);
    if (!submission) {
      console.log('Submission not found:', req.params.id);
      return res.status(404).json({ message: 'Submission not found' });
    }

    if (req.query.download === 'true') {
      const bucket = admin.storage().bucket();
      // Extract the file path from the public URL
      const fileName = submission.manuscriptFilePath.split('/').pop().split('?')[0];
      const file = bucket.file(`submissions/${fileName}`);

      // Check if file exists in Firebase Storage
      const [exists] = await file.exists();
      if (!exists) {
        console.error(`File not found in Firebase Storage: submissions/${fileName}`);
        return res.status(404).json({ message: 'File not found in storage' });
      }

      // Set response headers
      res.setHeader('Content-Type', submission.mimetype || 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${submission.manuscriptFileName}"`);

      // Stream the file from Firebase Storage
      file.createReadStream()
        .on('error', (err) => {
          console.error('Error streaming file:', err);
          res.status(500).json({ message: 'Error streaming file' });
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
    res.status(500).json({ message: 'Server error retrieving submission' });
  }
};