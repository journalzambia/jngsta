const Article = require('../models/Article');

// Increment read count
exports.incrementReadCount = async (req, res) => {
  try {
    const article = await Article.findOneAndUpdate(
      { slug: req.params.slug },
      { $inc: { readCount: 1 } },
      { new: true }
    );
    
    if (!article) return res.status(404).json({ status: 404, message: 'Article not found' });
    
    res.json({ 
      status: 200, 
      message: 'Read count incremented',
      readCount: article.readCount 
    });
  } catch (err) {
    res.status(500).json({ status: 500, message: err.message });
  }
};

// Increment download count
exports.incrementDownloadCount = async (req, res) => {
  try {
    const article = await Article.findOneAndUpdate(
      { slug: req.params.slug },
      { $inc: { downloadCount: 1 } },
      { new: true }
    );
    
    if (!article) return res.status(404).json({ status: 404, message: 'Article not found' });
    
    res.json({ 
      status: 200, 
      message: 'Download count incremented',
      downloadCount: article.downloadCount 
    });
  } catch (err) {
    res.status(500).json({ status: 500, message: err.message });
  }
};

// Get all articles (existing)
exports.getAllArticles = async (req, res) => {
  try {
    const articles = await Article.find().populate(['volume', 'issue']);
    res.json({ status: 200, data: articles });
  } catch (err) {
    res.status(500).json({ status: 500, message: err.message });
  }
};

// Get article by slug (existing)
exports.getArticleBySlug = async (req, res) => {
  try {
    const article = await Article.findOne({ slug: req.params.slug }).populate(['volume', 'issue']);
    if (!article) return res.status(404).json({ status: 404, message: 'Not found' });
    res.json({ status: 200, data: article });
  } catch (err) {
    res.status(500).json({ status: 500, message: err.message });
  }
};