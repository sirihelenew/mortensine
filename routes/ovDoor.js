var express = require('express');
var router = express.Router();

router.get('/', (req, res) => {
    fetch('https://omegav.no/api/dooropen.php')
        .then(response => response.json())
        .then(data => res.json(data))
        .catch(error => res.status(500).json({ error: error.toString() }));
});

module.exports = router;