const mqtt= require('mqtt');
const {db,storage} = require('./firebase');
const logger = require('./logger');
const {spawn} = require('child_process');
const admin = require('firebase-admin');
const io=require('../bin/socket').getIO();



const mqttBroker = 'mqtt://broker.hivemq.com';
const mqttTopic = 'mortensineRfid/scan';
const mqttOutboundTopic = 'mortensinaActivate/go';

var client = mqtt.connect(mqttBroker);

client.on('connect', function () {
    client.subscribe(mqttTopic, function (err) {
      if (err) {
        logger.error('Error subscribing to topic: ', err);
      }
    });
  });



client.on('message', function (topic, message) {
    if (topic === mqttTopic) {
      const blob = message.toString();
      const parts = blob.split(", ");
      const rfidTag = parts[0].split(": ")[1];
      const status = parts[1].split(": ")[1] === "LOW";
      console.log(JSON.stringify({ rfid: rfidTag, in_out: status }));
      client.publish(mqttOutboundTopic, 'true');
  
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
              let output = '';
              sound.stdout.on('data', (data) => {
                output += data;
                io.emit('message', { type: 'sound', message: output });
              });
              
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
    }
  });
  
client.on('error', function (error) {
    logger.error('MQTT client error: ', error);
    let reconnectInterval;
    const startReconnectTime = Date.now();

    reconnectInterval = setInterval(() => {
        if (Date.now() - startReconnectTime >= 60000) { // Stop trying after 1 minute
            clearInterval(reconnectInterval);
            if (!client.connected) {
                logger.info('Client not connected after 1 minute, attempting to restart app...');
                /*exec('pm2 restart www', (error, stdout, stderr) => {
                    if (error) {
                        logger.error(`Error restarting app: ${error}`);
                    } else {
                        logger.info(`App restarted. stdout: ${stdout}. stderr: ${stderr}`);
                    }
                });*/
            } else {
                logger.info('Client reconnected successfully within 1 minute.');
            }
        } else {
            logger.info('Attempting to reconnect client...');
            client.end();
            client = mqtt.connect(mqttBroker);
        }
    }, 5000); // Try to reconnect every 5 seconds
});