// Backend Controllers - controllers/volumeController.js (public)
const Volume = require('../models/Volume');

exports.getAllVolumes = async (req, res) => {
  try {
    const volumes = await Volume.find();
    res.json({ status: 200, data: volumes });
  } catch (err) {
    res.status(500).json({ status: 500, message: err.message });
  }
};

exports.getVolumeBySlug = async (req, res) => {
  try {
    const volume = await Volume.findOne({ slug: req.params.slug });
    if (!volume) return res.status(404).json({ status: 404, message: 'Not found' });
    res.json({ status: 200, data: volume });
  } catch (err) {
    res.status(500).json({ status: 500, message: err.message });
  }
};