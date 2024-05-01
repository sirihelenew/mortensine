// function beregnOppholdstid(userID) {
//     db.collection('Innlogginger')
//     .where('userID', '==', userID)
//     .orderBy('tid', 'asc')
//     .get()
//     .then(snapshot => {
//         let totalTid = 0;
//         let forrigeTid = null;
//         let forrigeStatus = null;

//         snapshot.forEach(doc => {
//             const data = doc.data();
//             if (forrigeStatus === 'inn' && data.status === 'ut') {
//                 totalTid += data.tid.toDate() - forrigeTid.toDate();
//             }
//             forrigeTid = data.tid.toDate();
//             forrigeStatus = data.status;
//         });

//         console.log("Total tid på skolen: ", totalTid);
//     })
//     .catch(error => {
//         console.error("Feil ved å hente data: ", error);
//     });
// }


function kaffe() {
    const kaffeStats = document.querySelector('.kaffe');
    kaffeStats.classList.toggle('hidden');

    document.querySelector('#kaffeStats').addEventListener('submit', function(event) {
        event.preventDefault();
        kaffeStats.classList.toggle('hidden');
        const user = firebase.auth().currentUser;
        if (user) {
            db.collection('brukere').doc(user.uid).update({
                kaffeCount: firebase.firestore.FieldValue.increment(1)
            })
            db.collection('leaderboardData').doc(user.uid).update({
                kaffeKanner: firebase.firestore.FieldValue.increment(1)
            })
            .then(() => {
                console.log('Document updated successfully');
                // stempling.classList.toggle('hidden');
                window.location.href = "brukerside.html";
            })
            .catch((error) => {
                console.error("Error updating document: ", error);
            });
        } else {
            // User is signed out
            console.log('User is not logged in');
        }
    });

}

function beregnOppholdstid(userID) {
    db.collection('Innlogginger')
        .where('userID', '==', userID)
        .orderBy('tid', 'asc')
        .get()
        .then(snapshot => {
            let totalTid = 0;
            let forrigeTid = null;
            let forrigeStatus = null;

            snapshot.forEach(doc => {
                const data = doc.data();
                const currentTid = data.tid.toDate();
                if (forrigeStatus === 'inn' && data.status === 'ut' && forrigeTid) {
                    const diff = currentTid - forrigeTid;
                    totalTid += diff;  // Accumulate the total time
                }
                forrigeTid = currentTid;
                forrigeStatus = data.status;
            });

        const tidsStats = document.getElementById('timestatistikk');
        const totalTimer = Math.floor(totalTid / (1000 * 60 * 60));
        const totalMinutter = Math.floor((totalTid / (1000 * 60)) % 60);
        const sekunder = Math.floor((totalTid / 1000) % 60);

        console.log(`Total tid på skolen: ${totalTimer} timer, ${totalMinutter} minutter og ${sekunder} sekunder`);
        tidsStats.textContent = `Total tid på skolen: ${totalTimer} timer, ${totalMinutter} minutter og ${sekunder} sekunder`;

            // Prepare to update Firestore
            const brukereRef = db.collection('brukere').doc(userID);
            const leaderboardRef = db.collection('leaderboardData');
            const batch = db.batch();

            // Update the 'brukere' document
            batch.update(brukereRef, {
                totalHours: firebase.firestore.FieldValue.increment(totalHours)
            });

            // Update the 'leaderboardData' document
            return leaderboardRef.where("userID", "==", userID).get().then(querySnapshot => {
                if (querySnapshot.empty) {
                    // Create a new document if it does not exist
                    const newDocRef = leaderboardRef.doc();
                    batch.set(newDocRef, {
                        userID: userID,
                        totalHours: totalHours,
                        kaffeKanner: 0  // Assuming you might also track coffee here
                    });
                } else {
                    // Update existing document
                    querySnapshot.forEach(doc => {
                        batch.update(doc.ref, {
                            totalHours: firebase.firestore.FieldValue.increment(totalHours)
                        });
                    });
                }
                return batch.commit();
            });
        })
        .then(() => {
            console.log("Both documents updated successfully!");
        })
        .catch(error => {
            console.error("Feil ved å hente data: ", error);
        });
}

function beregnOppholdstid(userID) {
    db.collection('Innlogginger')
    .where('userID', '==', userID)
    .orderBy('tid', 'asc')
    .get()
    .then(snapshot => {
        let totalTid = 0;
        let forrigeTid = null;
        let forrigeStatus = null;

        snapshot.forEach(doc => {
            const data = doc.data();
            const currentTid = data.tid.toDate();
            console.log(`Gjeldende tid: ${currentTid}, Status: ${data.status}`);  // Logger hver hendelse

            if (forrigeStatus === 'inn' && data.status === 'ut' && forrigeTid) {
                const diff = currentTid - forrigeTid;
                console.log(`Tidsdifferanse: ${diff} ms, fra ${forrigeTid} til ${currentTid}`);  // Logger tidsdifferansen
                totalTid = diff;
                console.log(`Total tid: ${totalTid} ms`)
            }

            forrigeTid = currentTid;
            forrigeStatus = data.status;
        });
        const tidsStats = document.getElementById('timestatistikk');
        const totalTimer = Math.floor(totalTid / (1000 * 60 * 60));
        const totalMinutter = Math.floor((totalTid / (1000 * 60)) % 60);
        const sekunder = Math.floor((totalTid / 1000) % 60);

        console.log(`Total tid på skolen: ${totalTimer} timer, ${totalMinutter} minutter og ${sekunder} sekunder`);
        tidsStats.textContent = `Total tid på skolen: ${totalTimer} timer, ${totalMinutter} minutter og ${sekunder} sekunder`;
        
    })
    .catch(error => {
        console.error("Feil ved å hente data: ", error);
    });
}


function beregnOppholdstid(userID) {
    db.collection('Innlogginger')
        .where('userID', '==', userID)
        .orderBy('tid', 'asc')
        .get()
        .then(snapshot => {
            let totalTid = 0;
            let forrigeTid = null;
            let forrigeStatus = null;

            snapshot.forEach(doc => {
                const data = doc.data();
                const currentTid = data.tid.toDate();
                if (forrigeStatus === 'inn' && data.status === 'ut' && forrigeTid) {
                    const diff = currentTid - forrigeTid;
                    totalTid = diff;  // Accumulate the total time
                }
                forrigeTid = currentTid;
                forrigeStatus = data.status;
            });

        const tidsStats = document.getElementById('timestatistikk');
        const totalTimer = Math.floor(totalTid / (1000 * 60 * 60));
        const totalMinutter = Math.floor((totalTid % (1000 * 60 * 60)) / (1000 * 60));
        const sekunder = Math.floor((totalTid / 1000) % 60);

        console.log(`Total tid på skolen: ${totalTimer} timer, ${totalMinutter} minutter og ${sekunder} sekunder`);
        tidsStats.textContent = `Total tid på skolen: ${totalTimer} timer, ${totalMinutter} minutter og ${sekunder} sekunder`;

            // Prepare to update Firestore
            const brukereRef = db.collection('brukere').doc(userID);
            const leaderboardRef = db.collection('leaderboardData');
            const batch = db.batch();

            // Update the 'brukere' document
            batch.set(brukereRef, {
                totalHours: firebase.firestore.FieldValue.increment(totalTimer),
                totalMinutes: firebase.firestore.FieldValue.increment(totalMinutter),
            }, { merge: true });

            // Update the 'leaderboardData' document
            leaderboardRef.where("userID", "==", userID).get()
            .then(querySnapshot => {
            if (querySnapshot.empty) {
                const newDocRef = leaderboardRef.doc();
                batch.set(newDocRef, {
                    userID: userID,
                    totalHours: totalTimer,
                    totalMinutes: totalMinutter,
                    kaffeKanner: 0
                }, { merge: true });
            } else {
                querySnapshot.forEach(doc => {
                    batch.set(doc.ref, {
                        totalHours: firebase.firestore.FieldValue.increment(totalTimer),
                        totalMinutes: firebase.firestore.FieldValue.increment(totalMinutter)
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
            console.error("Feil ved å hente data: ", error);
        });
}