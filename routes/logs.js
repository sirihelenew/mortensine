var express = require('express');
var router = express.Router();


router.get('/', (req, res) => {
    fs.readFile('./logs/combined.log', 'utf8', (err, data) => {
      if (err) {
        logger.error(err);
        return res.status(500).send('Error reading log file');
      }
      res.send(`<pre>${data}</pre>`);
    });
  });
  
module.exports = router;