

const cron = require('node-cron');
const {db, storage} = require ('../funcs/firebase');
const io = require('../bin/socket').getIO();
const logger = require('./logger');
const fs = require('fs');
const { get } = require('http');

let sendNotificationToAll;

if (process.env.NODE_ENV !== 'test') {
    sendNotificationToAll = require('./sendPushAll');
} else {
    sendNotificationToAll = () => {};
}



var earlbirdArray;

async function getEarlybirds() {
    logger.info("Getting earlybirds");
    earlbirdArray = await Earlybirds();
    logger.info("Got earlybirds", earlbirdArray);
}

getEarlybirds();

db.collection('Innlogginger').orderBy('tid', 'desc').limit(1).onSnapshot((snapshot) => {
    snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
            const loginData = change.doc.data();

            db.collection('brukere').doc(loginData.userID).get().then(doc => {
                const userData = doc.data();
                const profilbildePath = userData.profilbilde;
                const userStatus = userData.status;
                let imageRef;
                                    // Only update the status field of the user's document if it's not already true
                if (userStatus != loginData.status) {
                    const updateData = { status: loginData.status };
                    if (loginData.status) {
                        updateData.timeEntered = new Date();
                    }
                    db.collection('brukere').doc(loginData.userID).update(updateData);
                    if (loginData.metode === 'RFID' && earlbirdArray && earlbirdArray.length < 3) {                        earlbirdArray.push(userData);
                        const data = {
                            type: 'earlybirdData',
                            earlybirdArr: earlbirdArray
                        };
                        io.sockets.emit('message', data);
                        
                    }
                }
  
                if (loginData.status) {
                    const data = {
                        type: 'welcome',
                        fornavn: userData.fornavn,
                        metode: loginData.metode,
                        sted: loginData.sted,
                        profilbilde: userData.profilbilde
                    };
                    let sted = loginData.sted;
                    if (loginData.metode === 'rfid') {
                        sted = 'Mortensine';
                    }

                    const welcomePayload = JSON.stringify({
                        title: 'Welcome',
                        body: `${userData.fornavn} has logged in at ${sted ? ' at ' + sted : ''}`,
                        icon: userData.profilbilde,
                        type: "movements"
                    });
                    sendNotificationToAll(welcomePayload,[]);
                    io.sockets.emit('message', data);

                }
                else {
                    const data = {
                        type: 'goodbye',
                        userID: loginData.userID,
                        profilbilde: userData.profilbilde,
                        fornavn: userData.fornavn
                    };
                    let sted = loginData.sted;
                    if (loginData.metode === 'rfid') {
                        sted = 'Mortensine';
                    }

                    const goodbyePayload = JSON.stringify({
                        title: 'Goodbye',
                        body: `${userData.fornavn} has logged out from ${sted ? ' at ' + sted : ''}`,
                        icon: userData.profilbilde,
                        type: "movements"
                    });
                    sendNotificationToAll(goodbyePayload,[]);
                    io.sockets.emit('message', data);
                    console.log('Bruker har stemplet ut');
                }
                updateLeaderboard();
                currentUsers();
            }).catch(error => {
                console.error("Feil ved å hente bruker: ", error);
            });
            
        }
    });
});


var leaderboardData= null;

let previousLeaderboard = [];

// Read the previousLeaderboard data from the file when the server starts up
fs.readFile('previousLeaderboard.json', 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading previousLeaderboard.json:', err);
    } else {
      previousLeaderboard = JSON.parse(data);
      console.log("Previous leaderboard data loaded successfully");
    }
  });

function updateLeaderboard(socket){
    const today = new Date();
    today.setHours(4, 0, 0, 0);

    db.collection('brukere')
    .orderBy('totalMinutes', 'desc')
    .limit(50)
    .get()
    .then((querySnapshot) => {
        const promises = querySnapshot.docs.map((doc) => {
            const userData = doc.data() || {};
            const userID = doc.id;

            return db.collection('Innlogginger')
            .where('userID', '==', userID)
            .where('tid', '>=', today)
            .orderBy('tid')
            .get()
            .then((innloggingerSnapshot) => {
                let totalMinutesToday = 0;
                let punchInTime = null;

                innloggingerSnapshot.forEach((innloggingerDoc) => {
                    const innloggingerData = innloggingerDoc.data();
                    const tid = innloggingerData.tid.toDate();
                    const status = innloggingerData.status;

                    if (status && !punchInTime) {
                        punchInTime = tid;
                    } else if (!status && punchInTime) {
                        const minutesWorked = (tid.getTime() - punchInTime.getTime()) / 60000;
                        totalMinutesToday += minutesWorked;
                        punchInTime = null;
                    }
                });

                if (punchInTime) {
                    const minutesWorked = (new Date().getTime() - punchInTime.getTime()) / 60000;
                    totalMinutesToday += minutesWorked;
                }

                const totalHoursToday = totalMinutesToday / 60;
                userData.totalHoursToday = totalHoursToday;

                return userData;
            });
        });

        Promise.all(promises).then((usersData) => {
            usersData.forEach((userData, index) => {
                let previousIndex = previousLeaderboard.findIndex(user => (user.etternavn+user.fornavn) === (userData.etternavn+userData.fornavn));
                // If the user was not found in the previous leaderboard, set its index to one bigger than the length of the previous leaderboard
                if (previousIndex === -1) {
                    previousIndex = previousLeaderboard.length;
                }
                if (previousIndex !== index) {
                    userData.changeInPosition = previousIndex - index;
                } else {
                    userData.changeInPosition = 0;
                }
            });
            
            const data = {
                type: 'leaderboard',
                userData: usersData
            };
            leaderboardData=data;
            
            if (socket){
                console.log("sent to socket", socket.id);
                socket.emit('message', data);
            }
            else {
                console.log("sent to all sockets");
                io.sockets.emit('message', data);
            }
        });

    })
    .catch((error) => { console.error("Error getting leaderboard entries: ", error); });
}


// Server-side code

var savedLastoutData;

async function getLastOut() {
    savedLastoutData = await lastOut();
}

getLastOut();
async function lastOut() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() -1);
  yesterday.setHours(0, 0, 0, 0); 
  yesterday.setMinutes(yesterday.getMinutes() - yesterday.getTimezoneOffset());

  const today = new Date();
  today.setHours(4, 0, 0, 0);
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset()); // Subtract timezone offset

  return db.collection('Innlogginger')
      .where('tid', '<', today)
      .where('tid', '>=', yesterday)
      .where('metode', '==', 'RFID')
      .where('status', '==', false)
      .orderBy('tid', 'desc')
      .limit(3)
      .get()
      .then(snapshot => {
          if (snapshot.empty) {
              console.log("No last out entries for yesterday.");
              return [];
          }
          const lastOutDocs = snapshot.docs.slice(0, 3);
          const lastOutData = lastOutDocs.map((lastOutDoc, index) => {
              const userID = lastOutDoc.data().userID;
              const tid = lastOutDoc.data().tid;
              const date = tid.toDate();
              const hours = date.getHours().toString().padStart(2, '0'); 
              const minutes = date.getMinutes().toString().padStart(2, '0'); 
              const seconds = date.getSeconds().toString().padStart(2, '0'); 
              const timeString = `${hours}:${minutes}:${seconds}`;

              return db.collection('brukere').doc(userID).get().then(userDoc => {
                  if (!userDoc.exists) {
                      console.error("Brukerdok finnes ikke.");
                      return null;
                  }
                  const userData = userDoc.data();
                  const profilbildePath = userData.profilbilde;
                  return {
                      userID,
                      timeString,
                      profilbildePath
                  };
              });
          });

          return Promise.all(lastOutData).then(results => {
              const data = {
                type: 'lastOutData',
                lastOutArray: results.filter(result => result !== null)
              };
              io.sockets.emit('message', data);
              return results.filter(result => result !== null);
          });
      }, error => {
          console.error("Feil med å lytte på realtime innlogginger ", error);
      });
}

// Server-side code
async function Earlybirds() {
    const today = new Date();
    today.setHours(4, 0, 0, 0);

    return db.collection('Innlogginger')
        .where('tid', '>=', today)
        .where('metode', '==', 'RFID')
        .orderBy('tid', 'asc')
        .limit(3)
        .get()
        .then(snapshot => {
            if (snapshot.empty) {
                console.log("No earlybird entries for today yet.");
                return [];
            }
            const earlybirdDocs = snapshot.docs.slice(0, 3);
            const earlybirdData = earlybirdDocs.map((earlybirdDoc, index) => {
              const userID = earlybirdDoc.data().userID;
              const tid = earlybirdDoc.data().tid;
              const date = tid.toDate();
              const hours = date.getHours().toString().padStart(2, '0'); 
              const minutes = date.getMinutes().toString().padStart(2, '0'); 
              const seconds = date.getSeconds().toString().padStart(2, '0'); 
              const timeString = `${hours}:${minutes}:${seconds}`;

              return db.collection('brukere').doc(userID).get().then(userDoc => {
                  if (!userDoc.exists) {
                      console.error("Brukerdok finnes ikke.");
                      return null;
                  }
                  const userData = userDoc.data();
                  const profilbildePath = userData.profilbilde;
                  return {
                      userID,
                      timeString,
                      profilbildePath
                  };
              });
          });

          return Promise.all(earlybirdData).then(results => {
            return results.filter(result => result !== null);
          });
      }, error => {
          console.error("Feil med å lytte på realtime innlogginger ", error);
      });
}



var lastUserData;
async function getLastUserData() {
    lastUserData = await currentUsers();
}
getLastUserData();

async function currentUsers(){
    console.log("checking current users");
    const today = new Date();
  today.setHours(0, 0, 0, 0); // Set to start of today

  // Create a Map to keep track of the users and their latest method and sted
  const usersMap = new Map();

  db.collection('Innlogginger')
    .where('tid', '>=', today)
    .orderBy('tid', 'asc')
    .get()
    .then(snapshot => {
      if (snapshot.empty) {
        console.log("No entries for today yet.");
        return;
      }

      const promises = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        const userID = data.userID;
        const metode = data.metode;
        const sted = data.sted;

        const promise = db.collection('brukere').doc(userID).get().then(userDoc => {
          if (!userDoc.exists) {
            console.error("User document does not exist.");
            return;
          }

          const userData = userDoc.data();
          const status = userData.status;

          // Only add the user to the list if their status is true
          if (status) {
            // Update the user's latest method and sted in the Map
            usersMap.set(userID, { metode, sted });
          }
        });

        promises.push(promise);
      });

      Promise.all(promises).then(() => {
        let rfidUsers = '';
        let manualUsers = '';
    
        // Create an array to hold the promises from the get operations
        const getPromises = [];
    
        // Iterate over the Map and add the users to the appropriate list
        usersMap.forEach((value, userID) => {
            const getPromise = db.collection('brukere').doc(userID).get().then(userDoc => {
                const userData = userDoc.data();
                const fornavn = userData.fornavn;
                const etternavn = userData.etternavn;
                const name = fornavn + ' ' + etternavn;
    
                if (value.metode === 'RFID') {
                    rfidUsers += '<li>' + name + '</li>';
                } else if (value.metode === 'manual') {
                    manualUsers += '<li>' + name + ' - ' + value.sted + '</li>';
                }
            });
    
            getPromises.push(getPromise);
        });
    
        // Wait for all of the get operations to complete before sending the user lists
        Promise.all(getPromises).then(() => {
            const data = {
                type: 'usersList',
                usersList: JSON.stringify({ rfidUsers, manualUsers })
            };
            io.sockets.emit('message', data);
            lastUserData=data;
        });
    });
    })
    .catch(error => {
      console.error("Error getting documents: ", error);
    });
}
setInterval(currentUsers, 60000);


io.sockets.on('connection', (socket) =>{
  console.log('A user connected');

  if (leaderboardData){
      console.log("Sending last leaderboard data to new user");
      socket.emit('message', leaderboardData);
  } else {
      console.log("updating");
      updateLeaderboard(socket);
  }

  var data = {
    type: 'lastOutData',
    lastOutArray: savedLastoutData
  };
  io.sockets.emit('message', data);
  logger.info("Sending last out data to new user", data);
    data = {
        type: 'earlybirdData',
        earlybirdArr: earlbirdArray
    };
    socket.emit('message', data);
    logger.info("Sending earlybird to new user", data);

    console.log("Sending current users data to new user");
    socket.emit('message', lastUserData);
});

function purge() {
    // Get all users where status is true
    db.collection('brukere').where('status', '==', true).get()
        .then((querySnapshot) => {
            // Iterate over each user
            querySnapshot.forEach((doc) => {
                const userData = doc.data();

                var newtotalMinutes = userData.totalMinutes - 600;
                if (newtotalMinutes < 0) {
                    newtotalMinutes = 0;
                }
                db.collection('brukere').doc(doc.id).update({
                    totalMinutes: newtotalMinutes,
                    status: false
                });
            });
        })
        .catch((error) => {
            console.log("Error getting documents: ", error);
        });
}

cron.schedule('0 4 * * *', function() {
  lastOut();
  earlbirdArray=[];
    const earlybirdData = {
        type: 'earlybirdData',
        earlybirdArr: earlbirdArray
    };
    io.sockets.emit('message', earlybirdData);
  fs.writeFile('previousLeaderboard.json', JSON.stringify(leaderboardData.userData), 'utf8', (err) => {
    if (err) {
      console.error('Error writing previousLeaderboard.json:', err);
    }
  });
  previousLeaderboard = leaderboardData.userData;
  purge(); // Purge the active minutes of all users (seemlingy active users)
  
});
setInterval(updateLeaderboard, 60000);

