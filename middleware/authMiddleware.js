const admin = require('firebase-admin');

module.exports = async (req, res, next) => {

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.error('No token provided in authorization header');
    return res.status(401).json({ message: 'No token provided', code: 'auth/no-token' });
  }

  const token = authHeader.split(' ')[1];
  try {
    // Log token header for debugging
    let tokenHeader;
    try {
      tokenHeader = JSON.parse(atob(token.split('.')[0]));
      console.log('Received token header:', tokenHeader);
    } catch (err) {
      console.error('Failed to decode token header:', err.message);
      return res.status(401).json({ 
        message: 'Invalid token format. Please log in again.',
        code: 'auth/invalid-token-format'
      });
    }

    if (tokenHeader.alg !== 'RS256') {
      console.error('Invalid token algorithm:', tokenHeader.alg);
      return res.status(401).json({ 
        message: 'Invalid token algorithm. Expected RS256. Please log in again.',
        code: 'auth/invalid-algorithm'
      });
    }

    if (!tokenHeader.kid) {
      console.error('Token missing kid claim');
      return res.status(401).json({ 
        message: 'Token missing key ID. Please log in again.',
        code: 'auth/missing-kid'
      });
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = { uid: decodedToken.uid };
    console.log('Token verified, user UID:', req.user.uid);
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ 
      message: error.code === 'auth/argument-error' && error.message.includes('kid')
        ? 'Token missing key ID. Please log in again.'
        : 'Invalid or expired token. Please log in again.',
      code: error.code || 'auth/unknown-error',
      error: error.message
    });
  }
};



// const admin = require('../firebaseAdmin'); // Import the centralized admin instance

// module.exports = async (req, res, next) => {
//   const authHeader = req.headers.authorization;
//   if (!authHeader || !authHeader.startsWith('Bearer ')) {
//     console.error('No token provided in authorization header');
//     return res.status(401).json({ message: 'No token provided', code: 'auth/no-token' });
//   }

//   const token = authHeader.split('Bearer ')[1];
//   try {
//     const decodedToken = await admin.auth().verifyIdToken(token);
    
//     // Check if the user is an admin based on email
//     if (decodedToken.email !== 'vikasr@gmail.com') {
//       console.error('Access denied: User is not an admin');
//       return res.status(403).json({ message: 'Forbidden: Admin access required', code: 'auth/forbidden' });
//     }

//     // Attach user info to request
//     req.user = { uid: decodedToken.uid, email: decodedToken.email };
//     console.log('Token verified, user:', req.user);
//     next();
//   } catch (error) {
//     console.error('Auth middleware error:', error);
//     return res.status(401).json({
//       message: 'Invalid or expired token. Please log in again.',
//       code: error.code || 'auth/unknown-error',
//       error: error.message,
//     });
//   }
// };