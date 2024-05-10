const webPush = require("web-push");
const Subscription = require('./mongoose');

process.env.VAPID_PUBLIC_KEY = 'BNGsyVCJBQoe7DDP3rqP_wdrp8IG2KiVTol38CKYAHqibOP7mUsdefigQ4ccE1ixk2VhfSBc1ia5wCgFABOyTEw';
process.env.VAPID_PRIVATE_KEY = "ZaYBjpZdQ5ZCAh245WK4akJrqL0zA2fbVhbz-HakyJo"
if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
  console.log(
    "You must set the VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY " +
      "environment variables. You can use the following ones:"
  );
  console.log(webPush.generateVAPIDKeys());
  return;
}

// Set the keys used for encrypting the push messages.
webPush.setVapidDetails(
  process.env.NODE_ENV_HOST,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY);  


function sendNotificationToAll(payload, options) {
  // Fetch all subscriptions from the database

  return Subscription.find().then(function(subscriptions) {
    // Send a notification to each subscription
    var promises = subscriptions.map(function(subscription) {
      console.log(subscription.toObject());
      if (subscription.endpoint) {
        return webPush.sendNotification(subscription, payload, options);
      } else {
        console.warn('Subscription does not have an endpoint:', subscription);
      }
    });

    // Wait for all notifications to be sent
    return Promise.all(promises)
      .then(function () {
        return { status: 201 };
      })
      .catch(function (error) {
        console.log(error);
        return { status: 500, error: error };
      });
  });
}

module.exports = sendNotificationToAll;