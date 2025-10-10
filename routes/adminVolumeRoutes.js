// Backend Routes - routes/adminVolumeRoutes.js
const express = require('express');
const router = express.Router();
// Assume authMiddleware exists for token validation
const authMiddleware = require('../middleware/authMiddleware'); // You need to implement this based on your existing auth
const adminVolumeController = require('../controllers/adminVolumeController');

router.use(authMiddleware); // Protect all admin routes

router.get('/', adminVolumeController.getAllAdminVolumes);
router.post('/', adminVolumeController.createVolume);
router.delete('/:id', adminVolumeController.deleteVolume);

module.exports = router;