var express = require('express');
var router = express.Router();
var { exec } = require('child_process');

router.get('/:action', (req, res) => {
  if (req.params.action === 'start') {
      res.send('Starting VLC...');
      exec("vlc --fullscreen --play-and-exit order.mp4");
      console.log("Playing video: order.mp4");
  } else if (req.params.action === 'stop') {
      res.send('Stopping VLC...');
      exec("pkill vlc");
      console.log("Stopped VLC");
  } else {
      res.send('Invalid action. Please use either "start" or "stop".');
  }
});

module.exports = router;