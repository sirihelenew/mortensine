function kaffe() {
    const kaffeStats = document.querySelector('.kaffe');
    kaffeStats.classList.toggle('hidden');

    document.querySelector('#kaffeStats').addEventListener('submit', function(event) {
        event.preventDefault();
        kaffeStats.classList.toggle('hidden');
        const user = firebase.auth().currentUser;
        if (!user) {
            console.log("Ingen bruker logget inn");
            return;
        }
        const brukereRef = db.collection('brukere').doc(user.uid);
        const leaderboardRef = db.collection('leaderboardData');
    
        const batch = db.batch();

        batch.update(brukereRef, {
            kaffeCount: firebase.firestore.FieldValue.increment(1)
        });

        leaderboardRef.where("userID", "==", user.uid).get()
            .then(querySnapshot => {
                if (querySnapshot.empty) {
                    const newDocRef = leaderboardRef.doc();
                    batch.set(newDocRef, {
                        userID: user.uid,
                        kaffeKanner: 1, 
                        totalHours: 0
                    });
                } else {
                    querySnapshot.forEach(doc => {
                        batch.update(doc.ref, {
                            kaffeKanner: firebase.firestore.FieldValue.increment(1)
                        });
                    });
                }
            return batch.commit();
        })
        .then(() => {
            console.log("Both brukere and leaderboardData documents updated successfully!");
            window.location.href = "brukerside";
        })
        .catch((error) => {
            console.error("Error updating documents: ", error);
        });
    });
}

