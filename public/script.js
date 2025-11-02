const connectBtn = document.getElementById('connectBtn');
const hrElem = document.getElementById('hr');
const spo2Elem = document.getElementById('spo2');
const respElem = document.getElementById('resp');
const INCO2Elem = document.getElementById('INCO2');
const ETCO2Elem = document.getElementById('ETCO2');
const timeElem = document.getElementById('TF');
const BPSysElem = document.getElementById('BPSys');
const BPDiasElem = document.getElementById('BPDia');
const BPMeanElem = document.getElementById('BPMean');
const disconnectBtn = document.getElementById('disconnectBtn');


const chartHR = new Chart(document.getElementById('chartHR'), {
  type: 'line',
  data: { labels: [], datasets: [{ label: 'Heart Rate (bpm)', data: [], borderColor: 'red', tension: 0.3 }] },
  options: { responsive: true, animation: false, scales: { x: { display: true }, y: { min: 0, max: 200 } } }
});

const chartSpO2 = new Chart(document.getElementById('chartSpO2'), {
  type: 'line',
  data: { labels: [], datasets: [{ label: 'SpO₂ (%)', data: [], borderColor: 'green', tension: 0.3 }] },
  options: { responsive: true, animation: false, scales: { x: { display: true }, y: { min: 0, max: 100 } } }
});

// Store last known non-empty readings
let lastValues = {
  time: "__",
  heartRate: "--",
  spo2: "--",
  RESP: "--",
  INCO2: "--",
  ETCO2: "--",
  nibpSystolic: "__",
  nibpDiastolic: "__",
  nibpMean: "__"
};

let port;
let reader;
let inputDone;
let inputStream;

connectBtn.addEventListener('click', async () => {
  try {
    if (!('serial' in navigator)) {
      alert('Web Serial API not supported!');
      return;
    }

    port = await navigator.serial.requestPort();
    await port.open({ baudRate: 38400 });
    await new Promise(r => setTimeout(r, 1000)); // Wait 1 second for device to stabilize
    const decoder = new TextDecoderStream();
    inputDone = port.readable.pipeTo(decoder.writable);
    inputStream = decoder.readable;
    reader = inputStream.getReader();

    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += value;
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop();

      for (let line of lines) {
        if (!line.trim()) continue;

        // Ignore noise or corrupted lines
        if (!/^[\x20-\x7E,]+$/.test(line)) {
          console.warn("Ignoring noise:", line);
          continue;
        }
        console.log("Received line:", line);
        const data = parseMonitorData(line);
        await sendToServer(data);
        // Update last non-empty values
        for (const key in data) {
          if (data[key] && data[key].trim() !== "") {
            lastValues[key] = data[key];
          }
        }
        

        // Display on UI (always show last known values)
        hrElem.textContent = lastValues.heartRate;
        spo2Elem.textContent = lastValues.spo2;
        respElem.textContent = lastValues.RESP;
        INCO2Elem.textContent = lastValues.INCO2;
        ETCO2Elem.textContent = lastValues.ETCO2;
        timeElem.textContent = lastValues.time;
        BPSysElem.textContent = lastValues.nibpSystolic;
        BPDiasElem.textContent = lastValues.nibpDiastolic;
        BPMeanElem.textContent = lastValues.nibpMean;

        // Update charts only if new numeric data
        const time = new Date().toLocaleTimeString();
        if (data.heartRate && !isNaN(data.heartRate)) addData(chartHR, time, data.heartRate);
        if (data.spo2 && !isNaN(data.spo2)) addData(chartSpO2, time, data.spo2);
      }
    }

  } catch (err) {
    console.error(err);
    alert(`Error: ${err.message}`);
  }

  // Clear old session data before starting new session
await fetch("http://localhost:4000/resetData", { method: "POST" })
  .then(res => res.json())
  .then(d => console.log("Reset API response:", d))
  .catch(err => console.error("Reset failed:", err));




});


disconnectBtn.addEventListener('click', async () => {
  try {
    if (reader) {
      await reader.cancel();
      reader.releaseLock();
    }
    if (inputDone) {
      await inputDone.catch(() => {});
    }
    if (port) {
      await port.close();
      port = null;
      alert('Disconnected from the monitor.');
    }
  } catch (err) {
    console.error('Error while disconnecting:', err);
  }
});

try{

  function parseMonitorData(line) {
  const fields = line.trim().split(',');
  return {
    time: fields[0] || "",
    heartRate: fields[1] || "",
    ecgStatus: fields[2] || "",
    spo2: fields[3] || "",
    RESP: fields[8] || "",
    nibpSystolic: fields[9] || "",
    nibpDiastolic: fields[10] || "",
    nibpMean: fields[11] || "",
    ETCO2: fields[12] || "",
    INCO2: fields[13] || ""
  };
}

}catch(err){

  alert(`Error Parsing Machine Data: ${err.message}`);
}




function addData(chart, label, value) {
  if (!value) return;
  chart.data.labels.push(label);
  chart.data.datasets[0].data.push(Number(value));
  if (chart.data.labels.length > 20) {
    chart.data.labels.shift();
    chart.data.datasets[0].data.shift();
  }
  chart.update('none');
}


async function sendToServer(data){
  const response = await fetch('/data', {
    method: 'POST',
    headers: {  'Content-Type': 'application/json'  },
    body: JSON.stringify(data)
  })
  const result = await response.json();
  console.log("Server response:", result);
}




