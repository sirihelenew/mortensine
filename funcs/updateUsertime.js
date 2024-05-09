const admin = require('firebase-admin');
const {db, storage } = require('./firebase');
const logger = require('./logger');


function updateUserTime() {
    if (process.env.NODE_ENV === 'test') {
      logger.info('Running in test mode, not updating user time');
      return;
    }
    const usersRef = db.collection('brukere');
    usersRef.get()
      .then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
          if (doc.data().status === true) { // assuming 'status' field indicates if user is in or out
            usersRef.doc(doc.id).update({
              totalMinutes: admin.firestore.FieldValue.increment(1) // assuming 'totalTime' field stores the total time
            })
            .then(() => {
            })
            .catch((error) => {
              logger.error("Error updating user time: ", error);
            });
          }
        });
      })
      .catch((error) => {
        logger.error("Error getting users: ", error);
      });
  }
  
  // Run updateUserTime every minute
module.exports = updateUserTime;