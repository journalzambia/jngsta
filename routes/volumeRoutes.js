// Backend Routes - routes/volumeRoutes.js (public)
const express = require('express');
const router = express.Router();
const volumeController = require('../controllers/volumeController');

router.get('/', volumeController.getAllVolumes);
router.get('/:slug', volumeController.getVolumeBySlug);

module.exports = router;