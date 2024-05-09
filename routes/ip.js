var express = require('express');
var router = express.Router();
const ip = require('ip');


router.get('/', (req, res) => {
    res.send(ip.address());
  });

module.exports = router;