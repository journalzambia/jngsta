const admin = require('firebase-admin');
const User = require('../models/user');

exports.signup = async (req, res) => {
  const { idToken, username, email } = req.body;

  if (!idToken || !username) {
    return res.status(400).json({ message: 'Missing required fields: idToken and username' });
  }

  // Validate username (e.g., alphanumeric, 3-20 characters)
  if (!/^[a-zA-Z0-9]{3,20}$/.test(username)) {
    return res.status(400).json({ message: 'Username must be 3-20 alphanumeric characters' });
  }

  try {
    console.log('Verifying ID token for signup:', idToken.substring(0, 10) + '...');
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { uid, email: firebaseEmail } = decodedToken;
    const userEmail = email || firebaseEmail; // Use provided email or fallback to Firebase email
    console.log('Decoded Firebase ID Token:', { uid, email: userEmail });

    if (!userEmail) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const existingUser = await User.findOne({ $or: [{ uid }, { email: userEmail }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this UID, email, or username' });
    }

    const newUser = new User({ uid, username, email: userEmail.toLowerCase() });
    await newUser.save();
    console.log('User saved to MongoDB:', { uid, username, email: userEmail });

    res.status(201).json({
      user: { id: newUser._id, username: newUser.username, email: newUser.email },
      token: idToken
    });
  } catch (error) {
    console.error('Signup error:', error.message, error.stack);
    let message = 'Server error during signup';
    if (error.code === 'auth/id-token-expired') {
      message = 'Firebase ID token has expired';
    } else if (error.code === 'auth/invalid-id-token') {
      message = 'Invalid Firebase ID token';
    } else if (error.name === 'MongoError' && error.code === 11000) {
      message = 'Duplicate username or email';
    }
    res.status(500).json({ message, error: error.message });
  }
};

exports.login = async (req, res) => {
  const { idToken, email } = req.body;

  if (!idToken) {
    return res.status(400).json({ message: 'Missing ID token' });
  }

  try {
    console.log('Verifying ID token for login:', idToken.substring(0, 10) + '...');
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { uid, email: firebaseEmail } = decodedToken;
    const userEmail = email || firebaseEmail;
    console.log('Decoded Firebase ID Token:', { uid, email: userEmail });

    const user = await User.findOne({ uid });
    if (!user) {
      return res.status(404).json({ message: 'User not found in MongoDB' });
    }

    if (user.email !== userEmail.toLowerCase()) {
      return res.status(400).json({ message: 'Email mismatch with stored user data' });
    }

    res.json({
      user: { id: user._id, username: user.username, email: user.email },
      token: idToken
    });
  } catch (error) {
    console.error('Login error:', error.message, error.stack);
    let message = 'Server error during login';
    if (error.code === 'auth/id-token-expired') {
      message = 'Firebase ID token has expired';
    } else if (error.code === 'auth/invalid-id-token') {
      message = 'Invalid Firebase ID token';
    }
    res.status(500).json({ message, error: error.message });
  }
};

exports.getUser = async (req, res) => {
  const idToken = req.headers.authorization?.split('Bearer ')[1];
  if (!idToken) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    console.log('Verifying ID token for getUser:', idToken.substring(0, 10) + '...');
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { uid } = decodedToken;

    const user = await User.findOne({ uid });
    if (!user) {
      return res.status(404).json({ message: 'User not found in MongoDB' });
    }

    res.json({
      user: { id: user._id, username: user.username, email: user.email }
    });
  } catch (error) {
    console.error('Get user error:', error.message, error.stack);
    let message = 'Server error fetching user data';
    if (error.code === 'auth/id-token-expired') {
      message = 'Firebase ID token has expired';
    } else if (error.code === 'auth/invalid-id-token') {
      message = 'Invalid Firebase ID token';
    }
    res.status(500).json({ message, error: error.message });
  }
};