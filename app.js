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
const winston = require('winston');

const express = require('express');
const path = require('path');
const { spawn, exec } = require('child_process');
const multer = require('multer');
const app = express();
const port = 3000;
let fetch;

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.json()
  ),
  defaultMeta: { service: 'user-service' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

import('node-fetch').then(nodeFetch => {
  fetch = nodeFetch.default;

  app.get('/api/doorstatus', (req, res) => {
      fetch('https://omegav.no/api/dooropen.php')
          .then(response => response.json())
          .then(data => res.json(data))
          .catch(error => res.status(500).json({ error: error.toString() }));
  });
}).catch(err => {
  logger.info(err);
});

app.get('/logs', (req, res) => {
  fs.readFile('logs/combined.log', 'utf8', (err, data) => {
    if (err) {
      logger.error(err);
      return res.status(500).send('Error reading log file');
    }
    res.send(`<pre>${data}</pre>`);
  });
});

app.get('/restart', (req, res) => {
  res.send('Restarting app...');
  setTimeout(() => {
    exec('pm2 restart app', (error, stdout, stderr) => {
      if (error) {
        logger.error(`Error restarting app: ${error}`);
      }
      logger.info(`App restart stdout: ${stdout}`);
      logger.error(`App restart stderr: ${stderr}`);
    });
  }, 5000); // delay the restart for 5 seconds
});

const localstorage = multer.diskStorage({
  destination: function(req, file, cb) {
    const dir = './uploads/' + req.body.username;
    try {
      fs.mkdirSync(dir, { recursive: true });
      logger.info(`Directory ${dir} created successfully`);
    } catch (error) {
      logger.error(`Error creating directory ${dir}: ${error}`);
    }
    cb(null, dir); // Destination folder
  },
  filename: function(req, file, cb) {
    const filename = file.fieldname + '-' + Date.now() + path.extname(file.originalname);
    logger.info(`File to be uploaded: ${filename}`);
    cb(null, filename); // Naming the file
  }
});

const upload = multer({ 
  storage: localstorage,
  limits: { fileSize: 10000000 }  // 10MB
});
app.post('/upload', upload.single('mp3File'), (req, res) => {
  if (req.file) {
    logger.info(`File ${req.file.filename} uploaded successfully`);
    res.send('File uploaded successfully');
  } else {
    const message = 'Error uploading file';
    logger.error(message);
    res.status(500).send(message);
  }
});
app.use(function(err, req, res, next) {
  logger.error(err.stack);
  res.status(500).send('Something broke!');
});
app.get('/ip', (req, res) => {
  res.send(ip.address());
});
// Pull the latest code from the Git repository
exec('./setup.sh', (error, stdout, stderr) => {
  if (error) {
    logger.error(`Error pulling code from Git: ${error}`);
    return;
  }
  logger.info(`Git pull stdout: ${stdout}`);
  logger.error(`Git pull stderr: ${stderr}`);

  // Run Python script
  const python = spawn('./venv/bin/python', ['pythonas.py']);
  // Collect data from script
  python.on('error', (error) => {
    logger.error('Error starting Python script:', error);
  });
  let scriptOutput = '';
  python.stdout.on('data', function (data) {
    logger.info('Python script output:', data.toString());
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
              logger.info("Spawned sound")
              sound.stdout.on('data', (data) => {
                logger.info(`stdout: ${data}`);
              });
              sound.stderr.on('data', (data) => {
                logger.error(`stderr: ${data}`);
               });
              sound.on('error', (error) => {
                logger.error('Error starting Python script:', error);
              });
              db.collection('Innlogginger').add({
                  userID,
                  tid,
                  metode,
                  status // or 'ut' depending on your logic
              })
              .then(() => {
                  //res.json({ status: 'success' });
                  logger.info('Document updated successfully');
              })
              .catch((error) => {
                  //res.json({ status: 'error', error: 'Error updating document: ' + error });
                  logger.error("Error updating document: ", error);
              });
          } else {
              //res.json({ status: 'error', error: 'User not found' });
              logger.info('User not found');
              const python = spawn('./venv/bin/python', ['play_sound.py', NaN]);
          }
      });
    } catch (error) {
      logger.error('Error parsing Python script output:', error);
    }
  });
  // In case of error
  python.stderr.on('data', (data) => {
   logger.error(`stderr: ${data}`);
  });

  // End process
  python.on('close', (code) => {
   logger.info(`child process close all stdio with code ${code}`);
  });

  // Serve static files from the public directory
  app.use(express.static(path.join(__dirname)));


  app.listen(port, () => {
    logger.info(`App listening at http://localhost:${port}`);
  });
});


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
            logger.info('User time updated successfully');
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
setInterval(updateUserTime, 60 * 1000);



module.exports = app;