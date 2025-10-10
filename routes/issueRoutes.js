// Backend Routes - routes/issueRoutes.js (public)
const express = require('express');
const router = express.Router();
const issueController = require('../controllers/issueController');

router.get('/', issueController.getAllIssues);
router.get('/:slug', issueController.getIssueBySlug);

module.exports = router;