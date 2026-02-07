const express = require('express');
const router = express.Router();
const articleController = require('../controllers/articleController');

router.get('/', articleController.getAllArticles);
router.get('/:slug', articleController.getArticleBySlug); // Auto-increments read count
router.post('/:slug/read', articleController.incrementReadCount);
router.post('/:slug/download', articleController.incrementDownloadCount);


module.exports = router;