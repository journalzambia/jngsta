const Issue = require('../models/Issue');
const Article = require('../models/Article');

exports.getAllAdminIssues = async (req, res) => {
  try {
    const issues = await Issue.find().populate('volume');
    res.json({ status: 200, data: issues });
  } catch (err) {
    res.status(500).json({ status: 500, message: err.message });
  }
};

exports.createIssue = async (req, res) => {
  try {
    const issue = new Issue(req.body);
    await issue.save();
    res.status(201).json({ status: 201, data: issue });
  } catch (err) {
    res.status(400).json({ status: 400, message: err.message });
  }
};

exports.deleteIssue = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ status: 404, message: 'Issue not found' });
    }

    // Delete all articles associated with this issue
    await Article.deleteMany({ issue: issue._id });

    // Delete the issue
    await Issue.findByIdAndDelete(req.params.id);

    res.json({ status: 200, message: 'Issue and associated articles deleted successfully' });
  } catch (err) {
    res.status(500).json({ status: 500, message: err.message });
  }
};