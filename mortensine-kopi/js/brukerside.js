document.addEventListener('DOMContentLoaded', function() {
    auth.onAuthStateChanged((user) => {
    console.log(user)
    if (user) {
        console.log('Bruker er logget inn!');
        db.collection('brukere').doc(user.uid).get().then((doc) => {
            if (doc.exists) {
                const userData = doc.data();
                const brukernavn = document.getElementById('brukernavn');
                const profilbilde = document.getElementById('profilbilde');
                const kaffeCount = document.getElementById('kaffeStatistikk');
                const profilbildePath = userData.profilbilde;
                const timeAtSchool = beregnOppholdstid(user.uid);
                const tidsStats = document.getElementById('timestatistikk');
                displayProfilbilde(profilbildePath);
                brukernavn.textContent = userData.fornavn + ' ' + userData.etternavn;
                if(userData && !userData.kaffeCount) {
                    kaffeCount.textContent = 'Antall kaffekanne traktet: 0';
                } else {
                    kaffeCount.textContent = 'Antall kaffekanner traktet: ' + userData.kaffeCount;
                }
                kaffeCount.textContent = 'Antall kaffekanner traktet: ' + userData.kaffeCount;

            } else {
                console.log("No such document!");
            }
        }).catch((error) => {
            console.log("Error getting document:", error);
        });
    } else {
        console.log('Ingen bruker logget inn!');
        }
    });

    function displayProfilbilde(profilbildePath) {
        const image = document.querySelector('profilbilde');
        let imageRef;
        if (profilbildePath && profilbildePath.startsWith('http')) {
            imageRef = storage.refFromURL(profilbildePath);
        } else if (profilbildePath) {
            imageRef = storage.ref(profilbildePath);
        }

        if (imageRef) {
            imageRef.getDownloadURL().then((url) => {
                profilbilde.src = url;
            }).catch((error) => {
                console.error("Finner ikke bildet: ", error);
            });
        } else {
            console.error('Filsti for bilde eksisterer ikke');
        }
    }
});

document.getElementById('byttpb').addEventListener('click', function() {
    document.getElementById('byttprofilbilde').style.display = 'block';
    document.getElementById('byttpb').style.display = 'none';

    document.querySelector('#byttprofilbilde').addEventListener('submit', function(event) {
            event.preventDefault();
            const picture = document.querySelector('input[name="picture"]').files[0];
            const submitButton = document.getElementById('submitButton');

            let imageURL = '';
            if(picture) {
                const storageRef = storage.ref('profilbilder/' + picture.name);
                storageRef.put(picture)
                    .then((snapshot) => {
                        console.log('File uploaded successfully');
                        return snapshot.ref.getDownloadURL(); // Get URL of uploaded file
                    })
                    .then((downloadURL) => {
                        const user = firebase.auth().currentUser;
                        if (user) {
                        return db.collection('brukere').doc(user.uid).update({
                            profilbilde: downloadURL
                        });
                        } else {
                            console.log('User is not logged in');
                        }
                    })
                .then(() => {
                    console.log('Document updated successfully');
                    document.getElementById('byttprofilbilde').style.display = 'none';
                    document.getElementById('byttpb').style.display = 'block';
                    window.location.href = "brukerside.html";
                })
                .catch((error) => {
                    console.error("Error updating document: ", error);
                });
        }
    });
});


    
    function stempleInnManuelt() {
        // const iceStafett = document.querySelector('.ice-stafett');
        // iceStafett.classList.toggle('hidden');
        
        const stempling = document.querySelector('.stemple-inn');
        stempling.classList.toggle('hidden');
        document.querySelector('#stempling-inn').addEventListener('submit', function(event) {
            event.preventDefault();
            const user = firebase.auth().currentUser;
            if (user) {
                const userID = user.uid;
                const sted = document.querySelector('input[name="sted"]').value;
                const tid = firebase.firestore.Timestamp.now();
                const metode = 'manual';
                db.collection('Innlogginger').add({
                    userID,
                    tid,
                    metode,
                    sted,
                    status: true
                })
                .then(() => {
                    console.log('Document updated successfully');
                    stempling.classList.toggle('hidden');
                    window.location.href = "brukerside.html";
                })
        .catch((error) => {
            console.error("Error updating document: ", error);
        });
        } else {
            console.log('User is not logged in');
        }
    });
}
function stempleUtManuelt () {
    const user = firebase.auth().currentUser;
    if (user) {
        const userID = user.uid;
        const tid = firebase.firestore.Timestamp.now();
        const metode = 'manual';
        db.collection('Innlogginger').add({
            userID,
            tid,
            metode,
            status: false
        })
        .then(() => {
            console.log('Document updated successfully');
            window.location.href = "brukerside.html";
        })
        .catch((error) => {
            console.error("Error updating document: ", error);
        });
    } else { console.log('User is not logged in'); }
}




function loggut() {
    firebase.auth().signOut().then(() => {
        console.log('User signed out successfully');
        window.location.href = "templates/login.html";
    }).catch((error) => {
        console.error("Error signing out: ", error);
    });
}


function beregnOppholdstid(userID) {
    return db.collection('Innlogginger')
        .where('userID', '==', userID)
        .orderBy('tid', 'asc')
        .get()
        .then(snapshot => {
            let totalTid = 0;
            let lastInTime = null;

            snapshot.forEach(doc => {
                const data = doc.data();
                const currentTid = data.tid.toDate();

                // Only calculate time difference if current status is 'ut' and there was a preceding 'inn'
                if (data.status === false && lastInTime) {
                    const diff = currentTid - lastInTime;
                    totalTid += diff;  // Accumulate the total time correctly
                    lastInTime = null;  // Reset lastInTime after processing 'ut'
                } else if (data.status === true) {
                    lastInTime = currentTid;  // Set lastInTime when status is 'inn'
                }
            });

            const totalHours = Math.floor(totalTid / (1000 * 60 * 60));
            const totalMinutes = Math.floor((totalTid % (1000 * 60 * 60)) / (1000 * 60));
            const sekunder = Math.floor((totalTid / 1000) % 60);
            const tidsStats = document.getElementById('timestatistikk');
            tidsStats.textContent = `Total tid på skolen: ${totalHours} timer, ${totalMinutes} minutter og ${sekunder} sekunder`;

            console.log(`Total tid på skolen: ${totalHours} timer, ${totalMinutes} minutter og ${sekunder} sekunder`);

            // Prepare to update Firestore
            const brukereRef = db.collection('brukere').doc(userID);
            const leaderboardRef = db.collection('leaderboardData');
            const batch = db.batch();

            // Set or update the user's total time in Firestore using batch operations
            batch.set(brukereRef, {
                totalHours: totalHours,
                totalMinutes: totalMinutes
            }, { merge: true });

            return leaderboardRef.where("userID", "==", userID).get()
            .then(querySnapshot => {
                if (querySnapshot.empty) {
                    const newDocRef = leaderboardRef.doc();
                    batch.set(newDocRef, {
                        userID: userID,
                        totalHours: totalHours,
                        totalMinutes: totalMinutes,
                        kaffeKanner: 0
                    }, { merge: true });
                } else {
                    querySnapshot.forEach(doc => {
                        batch.set(doc.ref, {
                            totalHours: firebase.firestore.FieldValue.increment(totalHours),
                            totalMinutes: firebase.firestore.FieldValue.increment(totalMinutes)
                        }, { merge: true });
                    });
                }
                return batch.commit();
            });
        })
        .then(() => {
            console.log("Both documents updated successfully!");
        })
        .catch(error => {
            console.error("Error calculating or updating total time: ", error);
        });
}


async function displayTimeAtSchool() {
    const user = firebase.auth().currentUser;
    if (user) {
        const timeAtSchool = await beregnOppholdstid(user.uid);
        const tidsStats = document.getElementById('tidsStats'); // Replace 'tidsStats' with the actual ID of the element
        tidsStats.textContent = 'Total tid på skolen: ' + timeAtSchool;
    } else {
        console.log('User is not logged in');
    }
}

displayTimeAtSchool();
