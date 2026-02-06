const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
   storageBucket: 'jngsta-425a7.firebasestorage.app' // Add this!
});

module.exports = admin;

