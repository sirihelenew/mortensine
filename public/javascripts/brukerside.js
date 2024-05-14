
let socketInstance = null;

function getSocketInstance() {
    if (!socketInstance) {
        socketInstance = io.connect("https://mortensine.no",{ query: "source=brukerside" });
    }
    return socketInstance;
}

let selfRegEnabled=false;
getSocketInstance().on('connect', function () {
    console.log("Connected to server");
    getSocketInstance().on('rfid', function (data) {
        console.log(data);
        rfid=data.rfid;
        if (selfRegEnabled){
            const user = firebase.auth().currentUser;
            if (user) {
                const userID = user.uid;
                db.collection('brukere').doc(userID).update({
                    rfidTag: rfid
                }).then(() => {
                    console.log("User updated with RFID: ", rfid);
                    selfRegEnabled=false;
                }).catch((error) => {
                    console.error("Error updating user: ", error);
                });
            }
        }
    }); 
});


document.addEventListener('DOMContentLoaded', function() {
    auth.onAuthStateChanged((user) => {
    console.log(user)
    if (user) {
        console.log('Bruker er logget inn!');
        db.collection('brukere').doc(user.uid).get().then((doc) => {
            if (doc.exists) {
                const preferences = doc.data().notificationPreferences;
                if (preferences) {
                document.querySelector('#notif_mov').checked = preferences.movements;
                document.querySelector('#notif_ann').checked = preferences.announcements;
                }
                const userData = doc.data();
                const brukernavn = document.getElementById('brukernavn');
                const profilbilde = document.getElementById('profilbilde');
                const kaffeCount = document.getElementById('kaffeStatistikk');
                const pilsCount = document.getElementById('pilsStatistikk');
                const profilbildePath = userData.profilbilde;
                const tidsStats = document.getElementById('timestatistikk');
                const hours= Math.floor(userData.totalMinutes/60);
                const minutes = userData.totalMinutes % 60;
                const selfEnrollButton = document.getElementById('selfEnrollLink');
                if (!userData.rfidTag){
                    selfEnrollButton.style.display = 'block';
                }

                tidsStats.textContent = 'Total tid på skolen: ' + hours + ' timer og ' + minutes + ' minutter';
                displayProfilbilde(profilbildePath);
                brukernavn.textContent = userData.fornavn + ' ' + userData.etternavn;
                if(userData && !userData.kaffeCount) {
                    kaffeCount.textContent = 'Antall kaffekanne traktet: 0';
                } else {
                    kaffeCount.textContent = 'Antall kaffekanner traktet: ' + userData.kaffeCount;
                }
                if(userData && !userData.pils) {
                    pilsCount.textContent = 'Antall pils på Loftet: 0';
                } else {
                    pilsCount.textContent = 'Antall pils på Loftet: ' + userData.pils;
                }

            } else {
                console.log("No such document!");
            }
        }).catch((error) => {
            console.log("Error getting document:", error);
        });
    } else {
        console.log('Ingen bruker logget inn!');
        }
    });

    function displayProfilbilde(profilbildePath) {
        const image = document.querySelector('profilbilde');
        let imageRef;
        if (profilbildePath && profilbildePath.startsWith('http')) {
            imageRef = storage.refFromURL(profilbildePath);
        } else if (profilbildePath) {
            imageRef = storage.ref(profilbildePath);
        }

        if (imageRef) {
            imageRef.getDownloadURL().then((url) => {
                profilbilde.src = url;
            }).catch((error) => {
                console.error("Finner ikke bildet: ", error);
            });
        } else {
            console.error('Filsti for bilde eksisterer ikke');
        }
    }
});

document.querySelector('#notification-preferences').addEventListener('submit', (event) => {
    event.preventDefault();

    const user = firebase.auth().currentUser;
    if (user) {
      const preferences = {
        movements: document.querySelector('#notif_mov').checked,
        announcements: document.querySelector('#notif_ann').checked,
        // Add more types as needed
      };
      if (preferences.movements || preferences.announcements) {
        Notification.requestPermission();
      }
  
      db.collection('brukere').doc(user.uid).update({
        notificationPreferences: preferences
      }).then(() => {
        console.log('Notification preferences updated successfully');
        navigator.serviceWorker.controller.postMessage({
            type: 'SET_PREFERENCES',
            preferences: preferences
          });
        alert('Notification preferences updated successfully');

      }).catch((error) => {
        console.error("Error updating document: ", error);
      });
    } else {
      console.log('User is not logged in');
    }
  });

document.getElementById('uploadButton').addEventListener('click', function() {
    const mp3File = document.getElementById('mp3Upload').files[0];
    const selectedUser = document.getElementById('userSelect').value;
    const author= document.getElementById('brukernavn').textContent;
    if (mp3File && selectedUser) {
        const formData = new FormData();
        formData.append('username', selectedUser);
        formData.append('author', author);
        formData.append('mp3File', mp3File);
        console.log(formData);
        fetch('/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => response.text())
        .then(result => {
            console.log('File uploaded succesfully');
            document.getElementById('mp3Upload').value = ''; // Clear the file input field
            alert('Filen er lastet opp');
        })

        .catch(error => {
            console.error('Error:', error);
        });

        uploadButton.disabled = true;
        uploadButton.textContent = 'Laster opp...';
        setTimeout(() => {
            uploadButton.disabled = false;
            uploadButton.textContent = 'Last opp';
        }, 3000);

    } else {
        console.log('No file selected or no user selected');
    }
});

const userSelect = document.getElementById('userSelect');

db.collection('brukere').get().then((snapshot) => {
  snapshot.forEach((doc) => {
    const option = document.createElement('option');
    option.value = doc.data().fornavn+' '+doc.data().etternavn;
    option.text = doc.data().fornavn+' '+doc.data().etternavn;
    userSelect.appendChild(option);
  });
});



document.getElementById('byttpb').addEventListener('click', function() {
    document.getElementById('byttprofilbilde').style.display = 'block';
    document.getElementById('byttpb').style.display = 'none';

    document.querySelector('#byttprofilbilde').addEventListener('submit', function(event) {
            event.preventDefault();
            const picture = document.querySelector('input[name="picture"]').files[0];
            const submitButton = document.getElementById('submitButton');

            let imageURL = '';
            if(picture) {
                const storageRef = storage.ref('profilbilder/' + picture.name);
                storageRef.put(picture)
                    .then((snapshot) => {
                        console.log('File uploaded successfully');
                        return snapshot.ref.getDownloadURL(); 
                    })
                    .then((downloadURL) => {
                        const user = firebase.auth().currentUser;
                        if (user) {
                        return db.collection('brukere').doc(user.uid).update({
                            profilbilde: downloadURL
                        });
                        } else {
                            console.log('User is not logged in');
                        }
                    })
                .then(() => {
                    console.log('Document updated successfully');
                    document.getElementById('byttprofilbilde').style.display = 'none';
                    document.getElementById('byttpb').style.display = 'block';
                    alert("Profilbildet er oppdatert!")
                    window.location.href = "brukerside";
                })
                .catch((error) => {
                    console.error("Error updating document: ", error);
                });
        }
    });
});


    
    function stempleInnManuelt() {
        const stempling = document.querySelector('.stemple-inn');
        if (!stempling.classList.contains('hidden')) {
            stempling.classList.add('hidden');
        } else {
            hideAllDivs();
            stempling.classList.remove('hidden');
        }
        document.querySelector('#stempling-inn').addEventListener('submit', function(event) {
            event.preventDefault();
            const user = firebase.auth().currentUser;
            if (user) {
                const userID = user.uid;
                const sted = document.querySelector('input[name="sted"]').value;
                const tid = firebase.firestore.Timestamp.now();
                const metode = 'manual';
                db.collection('Innlogginger').add({
                    userID,
                    tid,
                    metode,
                    sted,
                    status: true
                })
                .then(() => {
                    console.log('Document updated successfully');
                    stempling.classList.toggle('hidden');
                    window.location.href = "brukerside";
                })
        .catch((error) => {
            console.error("Error updating document: ", error);
        });
        } else {
            console.log('User is not logged in');
        }
    });
}
function stempleUtManuelt () {
    const user = firebase.auth().currentUser;
    if (user) {
        const userID = user.uid;
        const tid = firebase.firestore.Timestamp.now();
        const metode = 'manual';
        db.collection('Innlogginger').add({
            userID,
            tid,
            metode,
            status: false
        })
        .then(() => {
            console.log('Document updated successfully');
            alert("Du er stemplet ut!")
            window.location.href = "brukerside";
        })
        .catch((error) => {
            console.error("Error updating document: ", error);
        });
    } else { console.log('User is not logged in'); }
}



function StempleEksamen(){
    Swal.fire({
        title: 'ENTERING EKSAMENSMODUS',
        html: `
            <input id="swal-input1" class="swal2-input" placeholder="Romnr">
            <input id="swal-input2" class="swal2-input" placeholder="Fagkode">
        `,
        showDenyButton: true,
        confirmButtonText: `bekreft`,
        denyButtonText: `avbryt`,
        preConfirm: () => {
            const input1 = document.getElementById('swal-input1').value;
            const input2 = document.getElementById('swal-input2').value;
            if (!input1 || !input2) {
                Swal.showValidationMessage(`Vennligst fyll ut begge feltene`);
            }
            return { input1: input1, input2: input2 };
        }
    }).then((result) => {
        if (result.isConfirmed) {
            console.log('User text:', result.value);
            let currentHour = new Date().getHours();
            let time;
            if (currentHour < 10) {
               time = "13:00";
            } else { time = "19:00";}
            Swal.fire("I believe in you!", `You got this! \n See you on the other side! \n PS: Du må stemple ut som vanlig når du er ferdig. Alle blir stemplet ut automatisk kl ${time} (sorry dyssere)`);
            const user = firebase.auth().currentUser;
            if (user) {
                const userID = user.uid;
                const sted = result.value.input1+'#'+result.value.input2;
                const tid = firebase.firestore.Timestamp.now();
                const metode = 'eksamen';
                db.collection('Innlogginger').add({
                    userID,
                    tid,
                    metode,
                    sted,
                    status: true
                })
                .then(() => {
                    console.log('Document updated successfully');
                })
                .catch((error) => {
                    console.error("Error updating document: ", error);
                });
            } else {
                console.log('User is not logged in');
            }
        }
    });
}

function selfEnroll(){
    Swal.fire({
      title: "Klar til å scanne kortet ved RFID-leseren på mortensine?",
      text: "Neste kort som scannes innen 10 sekund vil bli registrert din bruker!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Kjøh!"
    }).then((result) => {
      if (result.isConfirmed) {
        let timerInterval;
        selfRegEnabled=true;
        Swal.fire({
          title: "Scann kortet nå!",
          html: "Jeg lukkes om <b></b> seconds.",
          timer: 10000,
          timerProgressBar: true,
          didOpen: () => {
            Swal.showLoading();
            const timer = Swal.getPopup().querySelector("b");
            timerInterval = setInterval(() => {
              timer.textContent = Math.ceil(Swal.getTimerLeft() / 1000);
              if (!selfRegEnabled){
                Swal.close();
              }
            }, 1000);
          },
          willClose: () => {
            clearInterval(timerInterval);
          }
        }).then((result) => {
          /* Read more about handling dismissals below */
          if (selfRegEnabled){
            Swal.fire({
                icon: "error",
                title: "Oops...",
                text: "Noe gikk galt, RFID ikke registrert!",
              });
          } else {
            Swal.fire({
                icon: "success",
                title: "Success!",
                text: "RFID registered successfully!",
            });
            registerButton=document.getElementById('selfEnrollLink');
            registerButton.style.display = 'none';
            }
          selfRegEnabled=false;
        });
      }
    });
}


function loggut() {
    firebase.auth().signOut().then(() => {
        console.log('User signed out successfully');
        window.location.href = "../";
    }).catch((error) => {
        console.error("Error signing out: ", error);
    });
}

