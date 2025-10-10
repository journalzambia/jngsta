const express = require('express');
const multer = require('multer');
const authMiddleware = require('../middleware/authMiddleware');
const submissionController = require('../controllers/submissionController');

const router = express.Router();

// Configure multer for MEMORY storage (for Firebase upload)
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { 
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX allowed.'), false);
    }
  }
});

// Routes
router.post('/', authMiddleware, upload.single('manuscriptFile'), submissionController.createSubmission);
router.get('/', authMiddleware, submissionController.getSubmissions);
router.get('/:id', authMiddleware, submissionController.getSubmissionById);
router.delete('/:id', authMiddleware, submissionController.deleteSubmission);

module.exports = router;