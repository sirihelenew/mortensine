var express = require('express');
var router = express.Router();
var { exec } = require('child_process');
var logger = require('../funcs/logger');

router.get('/', (req, res) => {
    res.send('Restarting app...');
    setTimeout(() => {
      exec('pm2 restart app', (error, stdout, stderr) => {
        if (error) {
          logger.error(`Error restarting app: ${error}`);
        }
        logger.info(`App restart stdout: ${stdout}`);
        logger.error(`App restart stderr: ${stderr}`);
      });
    }, 5000); // delay the restart for 5 seconds
  });

module.exports = router;