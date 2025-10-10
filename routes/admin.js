const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const adminController = require('../controllers/admincontroller');

const router = express.Router();

// Admin routes
router.get('/users', authMiddleware, adminController.isAdmin, adminController.getUsers);
router.delete('/users/:id', authMiddleware, adminController.isAdmin, adminController.deleteUser);
router.get('/submissions', authMiddleware, adminController.isAdmin, adminController.getSubmissions);
router.get('/submissions/:id', authMiddleware, adminController.getSubmissionById);
router.delete('/submissions/:id', authMiddleware, adminController.isAdmin, adminController.deleteSubmission);
router.patch('/submissions/:id/approve', authMiddleware, adminController.isAdmin, adminController.approveSubmission);
router.patch('/submissions/:id/reject', authMiddleware, adminController.isAdmin, adminController.rejectSubmission);

module.exports = router;