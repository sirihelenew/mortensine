const admin = require('firebase-admin');
const serviceAccount = require('./mortensine-a58cb-firebase-adminsdk-7r4ub-c075dab8d4.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://mortensine-a58cb.firebaseio.com'
});

const db = admin.firestore();
const storage = admin.storage();


const express = require('express');
const path = require('path');
const { spawn, exec } = require('child_process');
const app = express();
const port = 3000;

// Pull the latest code from the Git repository
exec('git pull', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error pulling code from Git: ${error}`);
    return;
  }
  console.log(`Git pull stdout: ${stdout}`);
  console.error(`Git pull stderr: ${stderr}`);

  // Run Python script
  const python = spawn('./venv/bin/python', ['pythonas.py']);
  // Collect data from script
  python.on('error', (error) => {
    console.error('Error starting Python script:', error);
  });
  let scriptOutput = '';
  python.stdout.on('data', function (data) {
    console.log('Python script output:', data.toString());
    try {
      scriptOutput = JSON.parse(data.toString());
      const rfidTag = scriptOutput.rfid;
      const status=scriptOutput.in_out;
      // Check if the RFID tag is associated with a user...
      const userRef = db.collection('brukere').where('rfidTag', '==', rfidTag);
      userRef.get()
      .then((querySnapshot) => {
          if (!querySnapshot.empty) {
              const userID = querySnapshot.docs[0].id;
              const tid = admin.firestore.Timestamp.now();
              const metode = 'RFID';
              db.collection('Innlogginger').add({
                  userID,
                  tid,
                  metode,
                  status // or 'ut' depending on your logic
              })
              .then(() => {
                  //res.json({ status: 'success' });
                  console.log('Document updated successfully');
              })
              .catch((error) => {
                  //res.json({ status: 'error', error: 'Error updating document: ' + error });
                  console.error("Error updating document: ", error);
              });
          } else {
              //res.json({ status: 'error', error: 'User not found' });
              console.log('User not found');
          }
      });
    } catch (error) {
      console.error('Error parsing Python script output:', error);
    }
  });
  // In case of error
  python.stderr.on('data', (data) => {
   console.error(`stderr: ${data}`);
  });

  // End process
  python.on('close', (code) => {
   console.log(`child process close all stdio with code ${code}`);
  });

  // Serve static files from the public directory
  app.use(express.static(path.join(__dirname)));


  app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`);
  });
});

module.exports = app;