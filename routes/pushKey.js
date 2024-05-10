var express = require('express');
var router = express.Router();


router.get("/", function (req, res) {
    res.send(process.env.VAPID_PUBLIC_KEY);
  });

module.exports=router;