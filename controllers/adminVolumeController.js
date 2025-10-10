// Backend Controllers - controllers/adminVolumeController.js
const Volume = require('../models/Volume');

exports.getAllAdminVolumes = async (req, res) => {
  try {
    const volumes = await Volume.find();
    res.json(volumes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createVolume = async (req, res) => {
  try {
    const volume = new Volume(req.body);
    await volume.save();
    res.status(201).json(volume);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteVolume = async (req, res) => {
  try {
    const volume = await Volume.findByIdAndDelete(req.params.id);
    if (!volume) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};