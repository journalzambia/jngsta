const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const adminController = require('../controllers/admincontroller');
const adminArticleController = require('../controllers/adminArticleController');
const multer = require('multer');

// Use memory storage for multer to handle files in memory before uploading to Firebase
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage, 
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

router.use(authMiddleware);
router.use(adminController.isAdmin); // Ensure admin access for all routes

router.get('/', adminArticleController.getAllAdminArticles);
router.post(
  '/', 
  upload.fields([{ name: 'image' }, { name: 'pdf' }]), 
  (req, res, next) => {
    console.log('Uploaded files:', req.files); // Debug log
    if (!req.files || (!req.files['image'] && !req.files['pdf'])) {
      return res.status(400).json({ message: 'No files uploaded' });
    }
    next();
  }, 
  adminArticleController.createArticle
);
router.get('/:slug', adminArticleController.getArticleBySlug);
router.get('/:id/download', adminArticleController.getArticleFile); // New download route
router.delete('/:id', adminArticleController.deleteArticle);
router.put('/featured/:id', adminArticleController.setFeaturedArticle);

module.exports = router;