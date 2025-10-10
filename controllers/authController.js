const admin = require('firebase-admin');
const User = require('../models/user');

exports.signup = async (req, res) => {
  const { idToken, username } = req.body;

  if (!idToken || !username) {
    return res.status(400).json({ message: 'Missing required fields: idToken and username' });
  }

  try {
    console.log('Verifying ID token for signup:', idToken.substring(0, 10) + '...');
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { uid, email } = decodedToken;
    console.log('Decoded Firebase ID Token:', { uid, email });

    const existingUser = await User.findOne({ $or: [{ uid }, { email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const newUser = new User({ uid, username, email });
    await newUser.save();
    console.log('User saved to MongoDB:', { uid, username, email });

    // Return the Firebase ID token and user data
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
    res.status(500).json({ message });
  }
};

exports.login = async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ message: 'Missing ID token' });
  }

  try {
    console.log('Verifying ID token for login:', idToken.substring(0, 10) + '...');
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { uid, email } = decodedToken;
    console.log('Decoded Firebase ID Token:', { uid, email });

    const user = await User.findOne({ uid });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Return the Firebase ID token and user data
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
    res.status(500).json({ message });
  }
};

// Remove refresh endpoint as it's not needed with Firebase ID tokens