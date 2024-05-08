

const cron = require('node-cron');
const {db, storage} = require ('../funcs/firebase');
const io = require('../bin/socket').getIO();
const fs = require('fs');


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
                if (userStatus!=loginData.status) {
                    db.collection('brukere').doc(loginData.userID).update({
                        status: loginData.status
                    });
                    if (loginData.status) {
                        db.collection('brukere').doc(loginData.userID).update({
                        timeEntered: new Date()
                    });
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
                    io.sockets.emit('message', data);
                }
                else {
                    const data = {
                        type: 'goodbye',
                        userID: loginData.userID,
                        profilbilde: userData.profilbilde,
                        fornavn: userData.fornavn
                    };
                    io.sockets.emit('message', data);
                    console.log('Bruker har stemplet ut');
                }
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
      console.log(previousLeaderboard);
    }
  });

function updateLeaderboard(socket){
    const today = new Date();
    today.setHours(5, 0, 0, 0);

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
                const previousIndex = previousLeaderboard.findIndex(user => (user.etternavn+user.fornavn) === (userData.etternavn+userData.fornavn));
                if (previousIndex !== index) {
                    console.log("Change in position for user", userData.etternavn, "from", previousIndex, "to", index);
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

console.log("Server running on port 3000")
cron.schedule('0 5 * * *', () => {
    fs.writeFile('previousLeaderboard.json', JSON.stringify(leaderboardData), 'utf8', (err) => {
      if (err) {
        console.error('Error writing previousLeaderboard.json:', err);
      }
    });
  });
// Server-side code
let savedLastoutData=null;

function lastOut() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() -1);
  yesterday.setHours(0, 0, 0, 0); 
  yesterday.setMinutes(yesterday.getMinutes() - yesterday.getTimezoneOffset());

  const today = new Date();
  today.setHours(5, 0, 0, 0);
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset()); // Subtract timezone offset

  db.collection('Innlogginger')
      .where('tid', '<', today)
      .where('tid', '>=', yesterday)
      .where('metode', '==', 'RFID')
      .where('status', '==', false)
      .orderBy('tid', 'desc')
      .onSnapshot(snapshot => {
          if (snapshot.empty) {
              console.log("No last out entries for yesterday.");
              return;
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

          Promise.all(lastOutData).then(results => {
              const data = {
                type: 'lastOutData',
                lastOutArray: results.filter(result => result !== null)
              };
              io.sockets.emit('message', data);
              savedLastoutData=data;
          });
      }, error => {
          console.error("Feil med å lytte på realtime innlogginger ", error);
      });
}

// Server-side code
let savedFirstInData = null;
let earlybirdCounter = 0;

function setupEarlybirdListener() {
    const today = new Date();
    today.setHours(5, 0, 0, 0);

    if (earlybirdCounter >= 3) {
        console.log("Already found 3 earlybirds for today. Stopping listener until next reset.");
        return;
    }

    db.collection('Innlogginger')
        .where('tid', '>=', today)
        .where('metode', '==', 'RFID')
        .orderBy('tid', 'asc')
        .onSnapshot(snapshot => {
            if (snapshot.empty) {
                console.log("No earlybird entries for today yet.");
                return;
            }
            const earlybirdDocs = snapshot.docs.slice(0, 3 - earlybirdCounter);
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

          Promise.all(earlybirdData).then(results => {
            const data = {
              type: 'earlybirdData',
              earlybirdArr: results.filter(result => result !== null)
            };
            io.sockets.emit('message', data);
            savedFirstInData=data;
            earlybirdCounter += data.earlybirdArr.length;

          });
      }, error => {
          console.error("Feil med å lytte på realtime innlogginger ", error);
      });
}

cron.schedule('0 0 * * *', function() {
  earlybirdCounter = 0;
  savedFirstInData=null;
});

io.sockets.on('connection', (socket) =>{
  console.log('A user connected');

  if (leaderboardData){
      console.log("Sending last leaderboard data to new user");
      socket.emit('message', leaderboardData);
  } else {
      console.log("updating");
      updateLeaderboard(socket);
  }

  if (savedLastoutData){
      console.log("Sending last out data to new user");
      socket.emit('message', savedLastoutData);
  } else {
      lastOut();
  }
  if (savedFirstInData){
      console.log("Sending first in data to new user");
      socket.emit('message', savedFirstInData);
  } else {
      setupEarlybirdListener();
  }
});

cron.schedule('0 5 * * *', function() {
  lastOut();
});
setInterval(updateLeaderboard, 60000);

