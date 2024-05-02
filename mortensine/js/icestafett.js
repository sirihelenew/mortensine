function calculateCountdown(targetDateTime) {
    var now = new Date();
    var timeDiff = targetDateTime - now;
  
    var days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    var hours = Math.floor((timeDiff % ((1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));
    var minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
  
    return days + "d " + hours + "t " + minutes + "m ";
  }
  
  db.collection('icestafett').doc('OO6yweoYrlh7mDW5BTLt').get().then(doc => {
    if (!doc.exists) {
      console.error("Document does not exist.");
      return;
    }
    console.log("Document ICE data:", doc.data());
  
    var targetDate = doc.data().tid.toDate(); 
  
    var day = targetDate.getDay();
    var hour = targetDate.getHours();
  
    if ((day === 5 && hour >= 10) || day === 6 || day === 0) {
      var daysUntilMonday;
      if (day === 5 && hour >= 10) {
        daysUntilMonday = 2; 
      } else if (day === 6) {
        daysUntilMonday = 1; 
      } else {
        daysUntilMonday = 0; 
      }
      targetDate.setDate(targetDate.getDate() + daysUntilMonday);
    }
    targetDate.setDate(targetDate.getDate() + 3);
  
    var countdownString = calculateCountdown(targetDate);
    document.getElementById("iceCountdown").innerHTML = countdownString;
  }).catch(error => {
    console.error("Error getting document: ", error);
  });