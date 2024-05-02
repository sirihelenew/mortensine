window.onload = () => {
    const rfidContainer = document.querySelector('.text-container');
    const loginContainer = document.querySelector('.login-container');
    const image = document.querySelector('img');

    db.collection('Innlogginger').orderBy('tid', 'desc').limit(1).onSnapshot((snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === 'added' || change.type === 'modified') {
                const loginData = change.doc.data();
                if (loginData.status === 'inn') {
                    const velkommenSide = document.querySelector('.js-container container1');
                    velkommenSide.classList.toggle('hidden');
                    
            

                db.collection('brukere').doc(loginData.userID).get().then(doc => {
                    const userData = doc.data();
                    const profilbildePath = userData.profilbilde;
                    console.log("Type of profilbilde:", typeof userData.profilbilde);
                    console.log("Content of profilbilde:", userData.profilbilde);

                    let imageRef;
                    if (profilbildePath && profilbildePath.startsWith('http')) {
                        imageRef = storage.refFromURL(profilbildePath);
                    } else if (profilbildePath) {
                        imageRef = storage.ref(profilbildePath);
                    }

                    if (imageRef) {
                        imageRef.getDownloadURL().then((url) => {
                            image.src = url;
                        }).catch((error) => {
                            console.error("Finner ikke bildet: ", error);
                        });
                    } else {
                        console.error('Filsti for bilde eksisterer ikke');
                    }

                    if (loginData.metode === 'RFID') {
                        rfidContainer.innerHTML = `<h1>Velkommen ${userData.fornavn}!</h1>`;
                        rfidContainer.style.display = "block"; 
                        loginContainer.style.display = "none";
                    } else if (loginData.metode === 'manual') {
                        loginContainer.innerHTML = `<h1>${userData.fornavn} har stemplet inn her: ${loginData.sted}!</h1>`;
                        loginContainer.style.display = "block"; 
                        rfidContainer.style.display = "none";
                    }
                

                }).catch(error => {
                    console.error("Feil ved å hente bruker: ", error);
                });
            } else {
                console.log("Ingen nye innstemplinger!");
                }
            }
        });
    });
};