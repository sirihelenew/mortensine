var express = require('express');
var router = express.Router();
var { exec } = require('child_process');

router.get('/', (req, res) => {
    res.send('ORDER');
    exec("vlc --fullscreen --play-and-exit order.mp4")
  });

module.exports = router;