// middleware/adminMiddleware.js
const admin = require('../firebaseAdmin');
const User = require('../models/user');

const adminMiddleware = async (req, res, next) => {
  try {
    // Check if user exists in our database and has admin privileges
    const user = await User.findOne({ uid: req.user.uid });
    
    if (!user || !user.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }
    
    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(500).json({ message: 'Server error verifying admin privileges' });
  }
};

module.exports = adminMiddleware;