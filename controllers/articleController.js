// Backend Controllers - controllers/articleController.js (public)
const Article = require('../models/Article');

exports.getAllArticles = async (req, res) => {
  try {
    const articles = await Article.find().populate(['volume', 'issue']);
    res.json({ status: 200, data: articles });
  } catch (err) {
    res.status(500).json({ status: 500, message: err.message });
  }
};

exports.getArticleBySlug = async (req, res) => {
  try {
    const article = await Article.findOne({ slug: req.params.slug }).populate(['volume', 'issue']);
    if (!article) return res.status(404).json({ status: 404, message: 'Not found' });
    res.json({ status: 200, data: article });
  } catch (err) {
    res.status(500).json({ status: 500, message: err.message });
  }
};