
function toggleProtocol() {
    selectBluetoothDevice();
}
 
// Variabele om het geselecteerde Bluetooth-apparaat op te slaan
let selectedDevice;

async function selectBluetoothDevice() {
    try {
        const device = await navigator.bluetooth.requestDevice({
            filters: [{
                name: 'bladder'
            }],
            optionalServices: ['00001800-0000-1000-8000-00805f9b34fb'] // Voeg de UUID van de service die je wilt gebruiken toe aan deze array
        });

        const tekstElement = document.querySelector('.tekst');
        tekstElement.textContent = `Geselecteerd Bluetooth-apparaat: ${selectedDevice.name}`; 
        const server = await selectedDevice.gatt.connect();
        alert('Verbonden met het Bluetooth-apparaat:', selectedDevice.name);

    } catch (error) {
        alert('Fout bij het selecteren van Bluetooth-apparaat:', error);
        const tekstElement = document.querySelector('.tekst');
        tekstElement.textContent = 'No device connected!';
    }
}

// Voeg een event listener toe aan de "Send data"-knop
document.getElementById('sendDataBtn').addEventListener('click', () => {
    // Haal de waarde op van het invoerveld
    const dataInput = document.getElementById('dataInput').value;
    
    // Controleer of er een waarde is ingevoerd
    if (dataInput !== '') {
        const blaasvolume = parseInt(dataInput); // Converteer naar een integer
        sendDataViaBluetooth(blaasvolume); // Roep de functie aan en stuur de waarde
    } else {
        alert('Voer een waarde in om te verzenden.');
    }
});

const statusElement = document.getElementById('tekst');
// Functie om gegevens via Bluetooth te verzenden
async function sendDataViaBluetooth(blaasvolume) {
    try {
        if (!selectedDevice || !selectedDevice.gatt.connected) {
            alert('Geen verbinding met Bluetooth-apparaat.');
            return;
        }
        const statusElement = document.getElementById('tekst');
        // Gebruik het geselecteerde Bluetooth-apparaat
        const service = await server.getPrimaryService('00001800-0000-1000-8000-00805f9b34fb');
        const characteristic = await service.getCharacteristic('00005678-0000-1000-8000-00805f9b34fb');
        // Verkrijg de juiste service en karakteristiek voor schrijven

        // Schrijf de blaasvolumegegevens naar de karakteristiek
        const value = new TextEncoder().encode(blaasvolume.toString()); // Zet naar string en encode
        await characteristic.writeValue(value);
        statusElement.textContent += ' | Gegevens verzonden: ' + dataToSend;

        alert('Blaasvolume verzonden via Bluetooth!');
    } catch (error) {
        console.error('Fout bij het verzenden van gegevens via Bluetooth:', error);
        alert('Er is een fout opgetreden bij het verzenden van gegevens via Bluetooth.');
        statusElement.textContent = 'Fout: ' + error;
    }
}
