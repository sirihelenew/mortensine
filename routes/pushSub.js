var express = require('express');
var router = express.Router();
var Subscription;
if (!process.env.NODE_ENV === "test") {
  Subscription = require('../funcs/mongoose');
}



router.post("/", function (req, res) {
  if (!req.body.subscription || !req.body.subscription.endpoint || !req.body.subscription.keys) {
    console.error('Invalid subscription:', req.body);
    return res.sendStatus(400);
  }
  // Create a new Subscription document from the request body
  // Save the Subscription document to the database
  var subscription = new Subscription(req.body.subscription);
  console.log('New subscription:');


  subscription.save()
    .then(() => res.sendStatus(201))
    .catch(error => {
      console.error(error);
      res.sendStatus(500);
    });
});

module.exports=router;