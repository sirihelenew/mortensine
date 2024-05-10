var mongoose = require('mongoose');

// Define a Mongoose schema for the subscription
const SubscriptionSchema = new mongoose.Schema({
    endpoint: {
      type: String,
      required: true,
      unique: true,
    },
    expirationTime: {
      type: String,
      required: false,
    },
    keys: {
      p256dh: {
        type: String,
        required: true,
      },
      auth: {
        type: String,
        required: true,
      },
    },
  });

// Create a Mongoose model from the schema
var Subscription = mongoose.model('subs', SubscriptionSchema);

// Connect to your MongoDB database
mongoose.connect('mongodb://localhost:27017/Subscriptions', { useNewUrlParser: true, useUnifiedTopology: true });

// Listen for the 'connected' event and print a message when it's fired
mongoose.connection.on('connected', function () {
  console.log('Mongoose connection established successfully');
});

// Listen for the 'error' event and print a message when it's fired
mongoose.connection.on('error', function (err) {
  console.error('Mongoose connection error: ' + err);
});

module.exports = Subscription;