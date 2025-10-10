const admin = require('firebase-admin');

if (!process.env.FIREBASE_KEY) {
  throw new Error('Missing FIREBASE_KEY environment variable');
}

let serviceAccount;
try {
  serviceAccount = JSON.parse(process.env.FIREBASE_KEY);
} catch (err) {
  throw new Error('FIREBASE_KEY is not valid JSON');
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'jngsta-425a7.appspot.com',
});

module.exports = admin;
