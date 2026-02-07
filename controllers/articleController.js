const Article = require('../models/Article');

// Helper function to check if already counted in session
const hasCounted = (req, slug, type) => {
  const key = `${type}_${slug}`;
  return req.session[key] || false;
};

// Helper function to mark as counted in session
const markAsCounted = (req, slug, type) => {
  const key = `${type}_${slug}`;
  req.session[key] = true;
};

// Increment read count with session check
exports.incrementReadCount = async (req, res) => {
  try {
    const { slug } = req.params;
    
    // Check if already counted in this session
    if (hasCounted(req, slug, 'read')) {
      const article = await Article.findOne({ slug });
      return res.json({ 
        status: 200, 
        message: 'Already counted in this session',
        readCount: article ? article.readCount : 0
      });
    }
    
    const article = await Article.findOneAndUpdate(
      { slug },
      { $inc: { readCount: 1 } },
      { new: true }
    );
    
    if (!article) return res.status(404).json({ status: 404, message: 'Article not found' });
    
    // Mark as counted in session
    markAsCounted(req, slug, 'read');
    
    res.json({ 
      status: 200, 
      message: 'Read count incremented',
      readCount: article.readCount 
    });
  } catch (err) {
    res.status(500).json({ status: 500, message: err.message });
  }
};

// Increment download count with session check
exports.incrementDownloadCount = async (req, res) => {
  try {
    const { slug } = req.params;
    
    // Check if already counted in this session
    if (hasCounted(req, slug, 'download')) {
      const article = await Article.findOne({ slug });
      return res.json({ 
        status: 200, 
        message: 'Already counted in this session',
        downloadCount: article ? article.downloadCount : 0
      });
    }
    
    const article = await Article.findOneAndUpdate(
      { slug },
      { $inc: { downloadCount: 1 } },
      { new: true }
    );
    
    if (!article) return res.status(404).json({ status: 404, message: 'Article not found' });
    
    // Mark as counted in session
    markAsCounted(req, slug, 'download');
    
    res.json({ 
      status: 200, 
      message: 'Download count incremented',
      downloadCount: article.downloadCount 
    });
  } catch (err) {
    res.status(500).json({ status: 500, message: err.message });
  }
};

// Get article by slug - increment read count when viewing article page
exports.getArticleBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    
    // Find article first
    const article = await Article.findOne({ slug }).populate(['volume', 'issue']);
    if (!article) return res.status(404).json({ status: 404, message: 'Not found' });
    
    // Check if already counted read in this session
    if (!hasCounted(req, slug, 'read')) {
      // Increment read count
      await Article.findOneAndUpdate(
        { slug },
        { $inc: { readCount: 1 } },
        { new: true }
      );
      
      // Mark as counted in session
      markAsCounted(req, slug, 'read');
      
      // Fetch updated article
      const updatedArticle = await Article.findOne({ slug }).populate(['volume', 'issue']);
      return res.json({ status: 200, data: updatedArticle });
    }
    
    res.json({ status: 200, data: article });
  } catch (err) {
    res.status(500).json({ status: 500, message: err.message });
  }
};

// Get all articles (existing) - no changes needed
exports.getAllArticles = async (req, res) => {
  try {
    const articles = await Article.find().populate(['volume', 'issue']);
    res.json({ status: 200, data: articles });
  } catch (err) {
    res.status(500).json({ status: 500, message: err.message });
  }
};