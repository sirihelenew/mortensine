const admin = require('firebase-admin');
const serviceAccount = require('./mortensine-a58cb-firebase-adminsdk-7r4ub-c075dab8d4.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://mortensine-a58cb.firebaseio.com',
  storageBucket: 'mortensine-a58cb.appspot.com'
});

const db = admin.firestore();
const storage = admin.storage();
console.log("Firebase initialized.")
module.exports = { db, storage };