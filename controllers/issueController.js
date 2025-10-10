// Backend Controllers - controllers/issueController.js (public)
const Issue = require('../models/Issue');

exports.getAllIssues = async (req, res) => {
  try {
    const issues = await Issue.find().populate('volume');
    res.json({ status: 200, data: issues });
  } catch (err) {
    res.status(500).json({ status: 500, message: err.message });
  }
};

exports.getIssueBySlug = async (req, res) => {
  try {
    const issue = await Issue.findOne({ slug: req.params.slug }).populate('volume');
    if (!issue) return res.status(404).json({ status: 404, message: 'Not found' });
    res.json({ status: 200, data: issue });
  } catch (err) {
    res.status(500).json({ status: 500, message: err.message });
  }
};