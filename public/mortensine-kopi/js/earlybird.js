function displayEarlybird() {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of today

    db.collection('Innlogginger')
        .where('tid', '>=', today)
        .orderBy('tid', 'asc')  // Sort by time ascending
        .limit(1)  // Only fetch the earliest record
        .get()
        .then(snapshot => {
            if (snapshot.empty) {
                console.error("No earlybird found for today.");
                return;
            }
            const earlybirdDoc = snapshot.docs[0];
            const userID = earlybirdDoc.data().userID;
            return db.collection('brukere').doc(userID).get();
        })
        .then(userDoc => {
            if (!userDoc.exists) {
                console.error("User document does not exist.");
                return;
            }
            const userData = userDoc.data();
            const profilbildePath = userData.profilbilde;
            if (profilbildePath) {
                updateProfilePicture(profilbildePath);
            } else {
                console.error("Profile picture path is missing.");
            }
        })
        .catch(error => {
            console.error("Error fetching or displaying earlybird data: ", error);
        });
}

function updateProfilePicture(path) {
    const imgElement = document.getElementById('earlybirdPic');
    imgElement.src = path;
}
