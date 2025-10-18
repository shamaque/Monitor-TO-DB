// ---------------------------------------------
// 🩺 Anesthesia Monitor Simulator (Node.js)
// Sends CSV-like data to a COM port every 2 sec
// ---------------------------------------------

const { SerialPort } = require('serialport');

// 🔧 Change this to your desired COM port
const PORT_NAME = 'COM1';   // Example: COM5 (virtual port created by VSPE)
const BAUD_RATE = 9600;

// Create a serial port instance
const port = new SerialPort({ path: PORT_NAME, baudRate: BAUD_RATE });

port.on('open', () => {
  console.log(`✅ Simulator started on ${PORT_NAME} at ${BAUD_RATE} baud...`);
  startSending();
});

port.on('error', (err) => {
  console.error('❌ Serial Port Error:', err.message);
});

// Function to generate random vitals
function generateVitals() {
  const timestamp = new Date().toISOString().replace('T', ' ').split('.')[0];
  const hr = 70 + Math.floor(Math.random() * 10);          // 70–80 bpm
  const spo2 = 96 + Math.floor(Math.random() * 4);         // 96–99%
  const sys = 110 + Math.floor(Math.random() * 15);        // 110–125 mmHg
  const dia = 70 + Math.floor(Math.random() * 10);         // 70–80 mmHg
  const mean = Math.round((sys + 2 * dia) / 3);            // MAP formula
  const etco2 = 35 + Math.floor(Math.random() * 5);        // 35–40 mmHg
  const rr = 12 + Math.floor(Math.random() * 4);           // 12–15 bpm
  const temp = (36.5 + Math.random() * 0.5).toFixed(1);    // 36.5–37.0 °C
  const agent = "Sevoflurane";
  const mac = (0.8 + Math.random() * 0.3).toFixed(1);

  return `${timestamp},${hr},${spo2},${sys},${dia},${mean},${etco2},${rr},${temp},${agent},${mac}\r\n`;
}

// Function to send vitals continuously
function startSending() {
  setInterval(() => {
    const csv = generateVitals();
    port.write(csv, (err) => {
      if (err) return console.error('Write Error:', err.message);
      console.log('📤 Sent:', csv.trim());
    });
  }, 5000); // every 2 seconds
}
