const admin = require('firebase-admin');
const serviceAccount = require('./mortensine-a58cb-firebase-adminsdk-7r4ub-c075dab8d4.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://mortensine-a58cb.firebaseio.com'
});

const db = admin.firestore();
const storage = admin.storage();
const fs = require('fs');
const ip = require('ip');

const express = require('express');
const path = require('path');
const { spawn, exec } = require('child_process');
const multer = require('multer');
const app = express();
const port = 3000;
let fetch;

import('node-fetch').then(nodeFetch => {
  fetch = nodeFetch.default;

  app.get('/api/doorstatus', (req, res) => {
      fetch('https://omegav.no/api/dooropen.php')
          .then(response => response.json())
          .then(data => res.json(data))
          .catch(error => res.status(500).json({ error: error.toString() }));
  });
}).catch(err => {
  console.log(err);
});

const localstorage = multer.diskStorage({
  destination: function(req, file, cb) {
    const dir = './uploads/' + req.body.username;
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);// Destination folder
},
  filename: function(req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname)) // Naming the file
  }
});
const upload = multer({ 
  storage: localstorage,
  limits: { fileSize: 10000000 }  // 10MB
});
app.post('/upload', upload.single('mp3File'), (req, res) => {
  res.send('File uploaded successfully');
});
app.use(function(err, req, res, next) {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});
app.get('/ip', (req, res) => {
  res.send(ip.address());
});
// Pull the latest code from the Git repository
exec('./setup.sh', (error, stdout, stderr) => {
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
              const navn=querySnapshot.docs[0].data().fornavn+' '+querySnapshot.docs[0].data().etternavn;
              const tid = admin.firestore.Timestamp.now();
              const metode = 'RFID';
              const sound = spawn('./venv/bin/python', ['playsound.py', navn]);
              console.log("Spawned sound")
              sound.stdout.on('data', (data) => {
                console.log(`stdout: ${data}`);
              });
              sound.stderr.on('data', (data) => {
                console.error(`stderr: ${data}`);
               });
              sound.on('error', (error) => {
                console.error('Error starting Python script:', error);
              });
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
              const python = spawn('./venv/bin/python', ['play_sound.py', NaN]);
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


function updateUserTime() {
  if (process.env.NODE_ENV === 'test') {
    console.log('Running in test mode, not updating user time');
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
            console.log('User time updated successfully');
          })
          .catch((error) => {
            console.error("Error updating user time: ", error);
          });
        }
      });
    })
    .catch((error) => {
      console.error("Error getting users: ", error);
    });
}

// Run updateUserTime every minute
setInterval(updateUserTime, 60 * 1000);



module.exports = app;