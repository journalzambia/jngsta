// Backend Routes - routes/adminIssueRoutes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const adminIssueController = require('../controllers/adminIssueController');

router.use(authMiddleware);

router.get('/', adminIssueController.getAllAdminIssues);
router.post('/', adminIssueController.createIssue);
router.delete('/:id', adminIssueController.deleteIssue);

module.exports = router;