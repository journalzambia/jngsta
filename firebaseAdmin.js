const admin = require('firebase-admin');
const serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
   storageBucket: 'jngsta-425a7.firebasestorage.app' // Add this!
});

module.exports = admin;

