localStorage.setItem('serverStarted', 'true');
let socketInstance = null;

function getSocketInstance() {
    if (!socketInstance) {
        socketInstance = io.connect('http://localhost:3000');
    }
    return socketInstance;
}

getSocketInstance().on('connect', function () {
    console.log("Connected to server");
    getSocketInstance().on('message', function (data) {
        console.log("recieved message: ", data);
        if (data.type === 'welcome') {
          showWelcomeMessage(data.fornavn, data.metode, data.sted, data.profilbilde);
        } else if (data.type === 'goodbye') {
          showGoodbyeMessage(data.userID, data.fornavn, data.profilbilde);
        } else if (data.type === "leaderboard"){
            loadLeaderboard(data.userData);
        }else if (data.type ==="lastOutData"){
            setupLastOutListener(data.lastOutArray);
        }else if (data.type ==="earlybirdData"){
            setupEarlybirdListener(data.earlybirdArr);
        }
    });
});    
getSocketInstance().on('connect_error', function(error) {
    console.log('Connection failed', error);
});

function showWelcomeMessage(userName, loginMethod, loginLocation, profilbildePath) {
    const velkommenText = document.getElementById('velkommenText');
    const loginInfo = document.getElementById('loginInfo');
    const profileImage = document.getElementById('profileImage');

    if (loginMethod === 'RFID') {
        velkommenText.innerHTML = `Velkommen ${userName}!`;
        loginInfo.style.display = "none";
    } else if (loginMethod === 'manual') {
        velkommenText.innerHTML = `${userName} har stemplet inn her: ${loginLocation}!`;
    }


    profileImage.src = profilbildePath;
    document.getElementById('velkommenSide').classList.remove('hidden');
    setTimeout(() => {
        document.getElementById('velkommenSide').classList.add('hidden');
    }, 7000); 


}

function showGoodbyeMessage(userID, userName, profilbildePath) {
    db.collection('brukere').doc(userID).get().then(doc => {
        const userData = doc.data();
        const timeEntered = userData.timeEntered.toDate();
        const timeNow = new Date();
        const durationMs = timeNow - timeEntered;
        const durationMinutes = Math.floor(durationMs / 60000);
        const durationHours = Math.floor(durationMinutes / 60);

        const velkommenText = document.getElementById('velkommenText');
        const profileImage = document.getElementById('profileImage');

        velkommenText.innerHTML = `Hade ${userName}! Total tid idag: ${durationHours} timer og ${durationMinutes % 60} minutter.`;



  
        profileImage.src = profilbildePath;

        document.getElementById('velkommenSide').classList.remove('hidden');
        setTimeout(() => {
            document.getElementById('velkommenSide').classList.add('hidden');
        }, 7000); 

        
    }).catch(error => {
        console.error("Error getting user document: ", error);
    });
}


function loadLeaderboard(usersData) {
    htmlContent = '';
    rank = 1;
    const storedLeaderboard = localStorage.getItem('leaderboard');
    if (storedLeaderboard) {
        document.getElementById('leaderboardContent').innerHTML = storedLeaderboard;
    }
    usersData.forEach((userData) => {
        const totalMinutes = userData.totalMinutes || 0;
        const kaffeCount = userData.kaffeCount || 0;
        const quote = userData.quote || '';
        const totalHours = Math.floor(totalMinutes / 60);
        const totalMinutesLeft = totalMinutes % 60;
        const totalHoursToday = userData.totalHoursToday || 0;
        // Check if the user has punched in today
        const hasPunchedInToday = userData.status === true;

        // Set the row color based on whether the user has punched in today
        const rowColor = hasPunchedInToday ? '#9ADE7B' : '#D04848';

        htmlContent += `
            <div class="leaderboard" >
                <div class="leaderboardsplit">${rank++}</div>
                <div class="leaderboardsplit" style="width: 15%;">${totalHours}t ${totalMinutesLeft}m</div>
                <div class="leaderboardsplit" style="width: 15%;">${Math.floor(totalHoursToday)}t, ${Math.round((totalHoursToday % 1) * 60)}m i dag</div>
                <div class="leaderboardsplit" style="width: 8%;">${kaffeCount} ☕️</div>
                <div class="leaders" style="background-color: ${rowColor}; width=25%;">
                    <span class="name" style="margin-right: 20px;">${userData.fornavn + ' ' + userData.etternavn || 'Unknown'}</span>
                    <span class="quote">${quote}</span></div>
                </div>`;
    });
    leaderboardContent.innerHTML = htmlContent;
    localStorage.setItem('leaderboard', htmlContent);
}

function toggleMenu() {
    const menuItems = document.querySelector('.menu-items');
    menuItems.classList.toggle('hidden');
}

// function playIceIce() {
//     // Set a flag in LocalStorage
//     localStorage.setItem('playSong', 'true');
// }
// function stopIceIce() {
//     // Set a flag in LocalStorage
//     localStorage.setItem('stopSong', 'true');
// }
function displayLatestProfilbilde() {
db.collection('icestafett').get()
    .then(snapshot => {
        if (snapshot.empty) {
            console.error("Ingen dokumenter i 'icestafett'.");
            return; 
        }
        const lastDoc = snapshot.docs[0];
        const userIDArray = lastDoc.data().userID;
        if (!userIDArray || userIDArray.length === 0) {
            console.error("UserID array er tom.");
            return; 
        }
        const lastUserID = userIDArray[userIDArray.length - 1]; 
        console.log("Siste userID:", lastUserID);

        return db.collection('brukere').doc(lastUserID).get();
    })
    .then(userDoc => {
        if (!userDoc.exists) {
            console.error("Brukerdokument finnes ikke.");
            return; 
        }
        const userData = userDoc.data();
        console.log("Bruker dok data:", userDoc.data());
        const imgElement = document.querySelector('.iceimg');
        const profilbildePath = userData.profilbilde;
        // displayProfilbilde(profilbilde);
        let imageref;
        if (profilbildePath && profilbildePath.startsWith('http')) {
            imageref = storage.refFromURL(profilbildePath);
            console.log("ImageRef:", imageref);
        } else if (profilbildePath) {
            imageref = storage.ref(profilbildePath);
            console.log("ImageRef:", imageref);
        }

    if (imageref) {
        imageref.getDownloadURL().then((url) => {
            iceimg.src = url;
            //iceimg2.src = url;
            //iceimg3.src = url;
        }).catch((error) => {
            console.error("Finner ikke bildet: ", error);
        });
    } else { console.error('Filsti for bilde eksisterer ikke'); }
    })
}

function displayProfilbilde(profilbildePath) {
        const image = document.querySelector('iceimg');
        console.log("Profilbilde path:", profilbildePath);
        let imageRef;
        if (profilbildePath && profilbildePath.startsWith('http')) {
            imageRef = storage.refFromURL(profilbildePath);
            console.log("ImageRef:", imageRef);
        } else if (profilbildePath) {
            imageRef = storage.ref(profilbildePath);
            console.log("ImageRef:", imageRef);
        }

        if (imageRef) {
            imageRef.getDownloadURL().then((url) => {
                image.src = url;
            }).catch((error) => {
                console.error("Finner ikke bildet: ", error);
            });
        } else {
            console.error('Filsti for bilde eksisterer ikke');
        }
    }


displayLatestProfilbilde();
loadLeaderboard();


function setupLastOutListener(lastoutDataArray) {
    lastoutDataArray.forEach((lastoutData, index) => {
        const userID = lastoutData.userID;
        const timeString = lastoutData.timeString;
        const profilbildePath = lastoutData.profilbildePath;

        console.log(`Last out #${index + 1}: ${userID} at ${timeString}`);
        const lastOutTime = document.getElementById(`latebirdTime${index + 1}`);
        if (lastOutTime) {
            lastOutTime.textContent = `Stemplet ut kl. ${timeString}`;
        }

        if (profilbildePath) {
            const lastOutImg = document.getElementById(`latebird${index + 1}`);
            if (lastOutImg) {
                lastOutImg.src = profilbildePath;
            }
        } else {
            console.error("Finner ikke profilbilde.");
        }
    });
}



function setupEarlybirdListener(data) {
  // Client-side code
    data.forEach((earlybird, index) => {
        const earlybirdTime = document.getElementById(`earlybirdTime${index + 1}`);
        if (earlybirdTime) {
            earlybirdTime.textContent = `Stemplet inn kl. ${earlybird.timeString}`;
        }

        const earlybirdImg = document.getElementById(`earlybird${index + 1}`);
        if (earlybirdImg && earlybird.profilbildePath) {
            earlybirdImg.src = earlybird.profilbildePath;
        }
    });
}
function updateProfilePicture(path) {
    const imgElement = document.getElementById('earlybirdPic');
    imgElement.src = path;
}
function calculateCountdown(targetDateTime) {
    var now = new Date();
    var timeDiff = targetDateTime - now;
  
    var days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    var hours = Math.floor((timeDiff % ((1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));
    var minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
  
    return days + "d " + hours + "t " + minutes + "m ";
  }
  
  db.collection('icestafett').doc('OO6yweoYrlh7mDW5BTLt').get().then(doc => {
    if (!doc.exists) {
      console.error("Document does not exist.");
      return;
    }
    console.log("Document ICE data:", doc.data());
  
    var targetDate = doc.data().tid.toDate(); 
  
    var day = targetDate.getDay();
    var hour = targetDate.getHours();
  
    if ((day === 5 && hour >= 10) || day === 6 || day === 0) {
      var daysUntilMonday;
      if (day === 5 && hour >= 10) {
        daysUntilMonday = 2; 
      } else if (day === 6) {
        daysUntilMonday = 1; 
      } else {
        daysUntilMonday = 0; 
      }
      targetDate.setDate(targetDate.getDate() + daysUntilMonday);
    }
    targetDate.setDate(targetDate.getDate() + 3);
  
    var countdownString = calculateCountdown(targetDate);
    document.getElementById("iceCountdown").innerHTML = "Tid som gjenstår: " + countdownString;
  }).catch(error => {
    console.error("Error getting document: ", error);
  });
