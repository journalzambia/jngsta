const mongoose = require('mongoose');
const Article = require('../models/Article');
const admin = require('firebase-admin');
const retry = require('async-retry');

exports.createArticle = async (req, res) => {
  try {
    const { title, author, abstract, issn, doi, slug, volume, issue } = req.body;
    if (!req.files || (!req.files['image'] && !req.files['pdf'])) {
      return res.status(400).json({ message: 'At least one file (image or pdf) is required' });
    }

    const bucket = admin.storage().bucket();
    let imageUrl = null;
    let pdfUrl = null;

    // Upload image to Firebase Storage
    if (req.files['image']) {
      const imageFile = req.files['image'][0];
      const imageFileName = `articles/images/${Date.now()}-${Math.round(Math.random() * 1e9)}-${imageFile.originalname}`;
      const storageImageFile = bucket.file(imageFileName);

      await retry(
        async () => {
          await storageImageFile.save(imageFile.buffer, {
            metadata: { contentType: imageFile.mimetype },
          });
        },
        {
          retries: 3,
          factor: 2,
          minTimeout: 100,
          maxTimeout: 1000,
          onRetry: (err, attempt) => {
            console.log(`Image upload retry attempt ${attempt}:`, err.message);
          },
        }
      );

      await storageImageFile.makePublic();
      imageUrl = `https://storage.googleapis.com/${bucket.name}/${imageFileName}`;
    }

    // Upload PDF to Firebase Storage
    if (req.files['pdf']) {
      const pdfFile = req.files['pdf'][0];
      const pdfFileName = `articles/pdfs/${Date.now()}-${Math.round(Math.random() * 1e9)}-${pdfFile.originalname}`;
      const storagePdfFile = bucket.file(pdfFileName);

      await retry(
        async () => {
          await storagePdfFile.save(pdfFile.buffer, {
            metadata: { contentType: pdfFile.mimetype },
          });
        },
        {
          retries: 3,
          factor: 2,
          minTimeout: 100,
          maxTimeout: 1000,
          onRetry: (err, attempt) => {
            console.log(`PDF upload retry attempt ${attempt}:`, err.message);
          },
        }
      );

      await storagePdfFile.makePublic();
      pdfUrl = `https://storage.googleapis.com/${bucket.name}/${pdfFileName}`;
    }

    const article = new Article({
      title,
      author,
      abstract,
      image: imageUrl,
      pdf: pdfUrl,
      issn,
      doi,
      slug,
      volume,
      issue,
    });

    const savedArticle = await article.save();
    console.log('Saved article:', savedArticle);
    res.status(201).json({ status: 201, data: savedArticle });
  } catch (error) {
    console.error('Error creating article:', error);
    res.status(500).json({ message: 'Failed to create article', error: error.message });
  }
};

exports.getAllAdminArticles = async (req, res) => {
  try {
    const articles = await Article.find().populate('volume issue');
    res.json({ status: 200, data: articles });
  } catch (error) {
    console.error('Error fetching articles:', error);
    res.status(500).json({ message: 'Failed to fetch articles', error: error.message });
  }
};

exports.getArticleBySlug = async (req, res) => {
  try {
    const article = await Article.findOne({ slug: req.params.slug }).populate('volume issue');
    if (!article) {
      return res.status(404).json({ status: 404, message: 'Article not found' });
    }
    res.json({ status: 200, data: article });
  } catch (error) {
    console.error('Error fetching article by slug:', error);
    res.status(500).json({ message: 'Failed to fetch article', error: error.message });
  }
};

exports.deleteArticle = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }

    const bucket = admin.storage().bucket();

    // Delete image from Firebase Storage
    if (article.image) {
      const imageFileName = article.image.split('/').pop().split('?')[0];
      await bucket.file(`articles/images/${imageFileName}`).delete().catch((err) => {
        console.warn('Warning: Could not delete image file:', err.message);
      });
    }

    // Delete PDF from Firebase Storage
    if (article.pdf) {
      const pdfFileName = article.pdf.split('/').pop().split('?')[0];
      await bucket.file(`articles/pdfs/${pdfFileName}`).delete().catch((err) => {
        console.warn('Warning: Could not delete PDF file:', err.message);
      });
    }

    await article.deleteOne();
    res.json({ status: 200, message: 'Article deleted successfully' });
  } catch (error) {
    console.error('Error deleting article:', error);
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid article ID' });
    }
    res.status(500).json({ message: 'Failed to delete article', error: error.message });
  }
};

exports.getArticleFile = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }

    if (req.query.download !== 'true' || !article.pdf) {
      return res.status(400).json({ message: 'No PDF available for download' });
    }

    const bucket = admin.storage().bucket();
    const pdfFileName = article.pdf.split('/').pop().split('?')[0];
    const file = bucket.file(`articles/pdfs/${pdfFileName}`);

    // Check if file exists
    const [exists] = await file.exists();
    if (!exists) {
      console.error(`File not found in Firebase Storage: articles/pdfs/${pdfFileName}`);
      return res.status(404).json({ message: 'PDF file not found in storage' });
    }

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${pdfFileName}"`);

    // Stream the file
    file.createReadStream()
      .on('error', (error) => {
        console.error('Error streaming file:', error);
        res.status(500).json({ message: 'Error downloading file', error: error.message });
      })
      .pipe(res);
  } catch (error) {
    console.error('Get article file error:', error);
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid article ID' });
    }
    res.status(500).json({ message: 'Server error retrieving article file', error: error.message });
  }
};


exports.setFeaturedArticle = async (req, res) => {
  try {
    const articleId = req.params.id;

    // Clear existing featured article
    await Article.updateMany({}, { $set: { featured: false } });

    // Set the selected article as featured
    const article = await Article.findByIdAndUpdate(
      articleId,
      { $set: { featured: true } },
      { new: true }
    ).populate('volume issue');

    if (!article) {
      return res.status(404).json({ status: 404, message: 'Article not found' });
    }

    res.json({ status: 200, data: article });
  } catch (error) {
    console.error('Error setting featured article:', error);
    res.status(500).json({ message: 'Failed to set featured article', error: error.message });
  }
};