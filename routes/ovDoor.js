var express = require('express');
var router = express.Router();


var latestStatus = null;
var fetchError = null;

function fetchStatus() {
    fetch('https://www.omegav.no/api/dooropen.php')
        .then(response => response.json())
        .then(data => {
            latestStatus = data;
            fetchError = null;
        })
        .catch(error => {
            console.error('Error fetching status:', error);
            fetchError = error.toString();
        });
}

// Fetch status immediately on server start
fetchStatus();

// Then fetch status every 60 seconds
setInterval(fetchStatus, 60000);

router.get('/', (req, res) => {
    console.log('fetchError:', fetchError);
    console.log('latestStatus:', latestStatus);
    if (fetchError) {
        res.status(500).json({ error: fetchError });
    } else if (latestStatus) {
        res.json(latestStatus);
    } else {
        res.status(500).json({ error: 'No status available' });
    }
});

module.exports = router;