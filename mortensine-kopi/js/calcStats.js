function beregnOppholdstidForAlleBrukere() {
    // Get a reference to the HTML table
    const table = document.getElementById('userTimeTable');

    // Get all users
    db.collection('Innlogginger')
        .get()
        .then(snapshot => {
            // Create a map to store the total time for each user
            const userTimes = new Map();

            snapshot.forEach(doc => {
                const data = doc.data();
                const userID = data.userID;
                const currentTid = data.tid.toDate();

                // Get the previous time and status for this user
                const previous = userTimes.get(userID);
                if (previous && previous.status === 'inn' && data.status === 'ut') {
                    const diff = currentTid - previous.tid;
                    previous.totalTid += diff;  // Accumulate the total time
                }

                // Store the current time and status for this user
                userTimes.set(userID, {
                    tid: currentTid,
                    status: data.status,
                    totalTid: (previous ? previous.totalTid : 0)
                });
            });

            // Update the HTML table with the total time for each user
            userTimes.forEach((value, key) => {
                const totalTimer = Math.floor(value.totalTid / (1000 * 60 * 60));
                const totalMinutter = Math.floor((value.totalTid / (1000 * 60)) % 60);
                const sekunder = Math.floor((value.totalTid / 1000) % 60);

                // Create a new row and cells
                const row = table.insertRow();
                const cell1 = row.insertCell();
                const cell2 = row.insertCell();

                // Set the cell values
                cell1.textContent = key;  // User ID
                cell2.textContent = `Total tid på skolen: ${totalTimer} timer, ${totalMinutter} minutter og ${sekunder} sekunder`;
            });
        })
        .catch(error => {
            console.error("Feil ved å hente data: ", error);
        });
}