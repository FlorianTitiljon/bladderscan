console.log('Script.js geladen!');
let useBluetooth = false; // Boolean om bij te houden of Bluetooth gebruikt moet worden
let databaseInitialized = false; // Boolean om bij te houden of de Firebase-database is geïnitialiseerd

// Firebase configuratie
const firebaseConfig = {
    apiKey: "AIzaSyAY5mWwlop-JNq5bnXVIyk_hwHAQ7BX2-0",
    authDomain: "bladder-c7004.firebaseapp.com",
    databaseURL: "https://bladder-c7004-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "bladder-c7004",
    storageBucket: "bladder-c7004.appspot.com",
    messagingSenderId: "670249866246",
    appId: "1:670249866246:web:a14f5cf2709bc944bf1f87",
    measurementId: "G-RYX31FK1M9"
};

// Dynamisch laden van Firebase SDK-scripts
const firebaseScript = document.createElement('script');
firebaseScript.src = "https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js";
firebaseScript.defer = true;
document.head.appendChild(firebaseScript);

const databaseScript = document.createElement('script');
databaseScript.src = "https://www.gstatic.com/firebasejs/10.8.1/firebase-database-compat.js";
databaseScript.defer = true;
document.head.appendChild(databaseScript);

let database;

// Wacht tot beide scripts zijn geladen voordat de Firebase-app wordt geïnitialiseerd
Promise.all([
    new Promise(resolve => firebaseScript.onload = resolve),
    new Promise(resolve => databaseScript.onload = resolve)
]).then(() => {
    // Initialize Firebase
    const app = firebase.initializeApp(firebaseConfig);
    database = firebase.database();
    databaseInitialized = true;
});

// Functie voor het verzenden van blaasvolume
function submitBlaasvolume() {
    let blaasvolume = document.getElementById('blaasvolumeInput').value;
    if (blaasvolume !== '') {
        blaasvolume = parseInt(blaasvolume); // Converteer de waarde naar een integer
        if (blaasvolume > 5000) {
            alert('Het blaasvolume mag niet meer dan 1000ml zijn.');
            return;
        }
        if (useBluetooth) {
            // Stuur gegevens via Bluetooth
            sendDataViaBluetooth(blaasvolume);
        } else {
            // Stuur gegevens via Firebase als de database geïnitialiseerd is
            if (databaseInitialized) {
                sendViaFirebase(blaasvolume);
            } else {
                alert('Firebase wordt geïnitialiseerd. Probeer het later opnieuw.');
            }
        }
    } else {
        alert('Voer een blaasvolume in.');
    }
}

// Voeg event listener toe aan de knop voor het verzenden van gegevens
document.getElementById('submitBtn').addEventListener('click', submitBlaasvolume);


function toggleProtocol() {
    useBluetooth = !useBluetooth; // Wissel de waarde van useBluetooth
    const toggleBtn = document.getElementById('protocolToggle');
    toggleBtn.textContent = useBluetooth ? 'Schakelen naar Firebase' : 'Schakelen naar Bluetooth';
    // Als Bluetooth wordt geselecteerd, initialiseer de Firebase-database niet
    if (!useBluetooth) {
        databaseInitialized = true; // Zet de databaseInitialized op true om te voorkomen dat Firebase opnieuw wordt geïnitialiseerd
    } else {
        selectBluetoothDevice();
    }
}
 
// Variabele om het geselecteerde Bluetooth-apparaat op te slaan
let selectedDevice;

// Functie om een Bluetooth-apparaat te selecteren
async function selectBluetoothDevice() {
    try {
        // Vraag om een Bluetooth-apparaat
        selectedDevice = await navigator.bluetooth.requestDevice({
            acceptAllDevices: true,
            //filters: [{ name: 'bladder' }], // Filter op naam van het apparaat
            optionalServices: ['00001800-0000-1000-8000-00805f9b34fb'] // Voeg de UUID van de service die je wilt gebruiken toe aan deze array
        });

        console.log('Geselecteerd Bluetooth-apparaat:', selectedDevice);

        // Verbind met het geselecteerde apparaat
        const server = await selectedDevice.gatt.connect();
        console.log('Verbonden met het Bluetooth-apparaat:', server);

        // Hier kun je verdere logica toevoegen voor het werken met het verbonden Bluetooth-apparaat
    } catch (error) {
        console.error('Fout bij het selecteren van Bluetooth-apparaat:', error);
        alert('Er is een fout opgetreden bij het selecteren van Bluetooth-apparaat.');
    }
}

// Functie om gegevens via Bluetooth te verzenden
async function sendDataViaBluetooth(blaasvolume) {
    try {
        if (!selectedDevice || !selectedDevice.gatt.connected) {
            alert('Geen verbinding met Bluetooth-apparaat.');
            return;
        }

        // Gebruik het geselecteerde Bluetooth-apparaat
        const service = await selectedDevice.gatt.getPrimaryService('00001800-0000-1000-8000-00805f9b34fb'); // GenericAccess service
        const characteristic = await service.getCharacteristic('2A00'); // DeviceName characteristic

        // Schrijf de blaasvolumegegevens naar de karakteristiek
        const value = new TextEncoder().encode(blaasvolume);
        await characteristic.writeValue(value);

        alert('Blaasvolume verzonden via Bluetooth!');
    } catch (error) {
        console.error('Fout bij het verzenden van gegevens via Bluetooth:', error);
        alert('Er is een fout opgetreden bij het verzenden van gegevens via Bluetooth.');
    }
}


// Functie om gegevens via Firebase te verzenden
function sendViaFirebase(blaasvolume) {
    // Verzend blaasvolumegegevens naar de database
    database.ref('blaasvolume').set({
        volume: Number(blaasvolume),
    });
    document.getElementById('blaasvolumeInput').value = '';
    alert('Blaasvolume verzonden via Firebase!');
}

// Functie om gegevens via Firebase te verzenden (under constrution)
// function sendViaFirebase(glucoseconcentratie) {
//     // Verzend blaasvolumegegevens naar de database
//     database.ref('glucoseconentratie').set({
//         volume: Number(glucoseconcentratie),
//     });
//     document.getElementById('glucoseInput').value = '';
//     alert('Glucoseconcentratie verzonden via Firebase!');
// }



let zeroCount = 0; // Teller voor het aantal keer dat de status 0 is

function updateStatusIndicator() {
    const statusRef = database.ref('healthCheck');
    console.log('Statusreferentie:', statusRef);

    statusRef.once('value', (snapshot) => {
        const status = snapshot.val();
        const indicator = document.getElementById('statusIndicator');

        if(navigator.onLine) {
            if (status === 1) {
                // Zet het bolletje op groen als de status van de microcontroller 1 is
                indicator.style.backgroundColor = 'green';
                zeroCount = 0; // Reset de teller
            } else {
                // Verhoog de teller
                zeroCount++;

                // Zet het bolletje op blauw als de status van de microcontroller 0 is en de teller 3 of hoger is
                if (zeroCount >= 3) {
                    indicator.style.backgroundColor = 'blue';
                }
            }
            // Zet de status op 0
            statusRef.set(0);
        } 
        else {
            // Zet het bolletje op rood als er geen internetverbinding is
            indicator.style.backgroundColor = 'red';
        }
        
    });
}

// Roep de updateStatusIndicator functie aan om de statusindicator in te stellen wanneer de pagina laadt
window.addEventListener('load', function() {
    updateStatusIndicator();
});

// Voeg event listener toe aan de toggle-knop voor het schakelen tussen Bluetooth en Firebase
document.addEventListener("DOMContentLoaded", function() {
    // Controleer of de toggle-knop correct wordt geselecteerd
    const toggleBtn = document.getElementById('protocolToggle');
    if (toggleBtn) {
        // Voeg event listener toe aan de toggle-knop voor het schakelen tussen Bluetooth en Firebase
        toggleBtn.addEventListener('click', toggleProtocol);
    } else {
        console.error("Toggle-knop niet gevonden in het document.");
    }
    const infoBtn = document.getElementById('infoBtn');
});

setInterval(updateStatusIndicator, 7000); // Update elke 6 seconden
