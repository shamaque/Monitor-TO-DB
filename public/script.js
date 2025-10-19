const connectBtn = document.getElementById('connectBtn');
const hrElem = document.getElementById('hr');
const spo2Elem = document.getElementById('spo2');
const respElem = document.getElementById('resp');
const INCO2Elem = document.getElementById('INCO2');
const ETCO2Elem = document.getElementById('ETCO2');
const timeElem = document.getElementById('TF');
const BPSysElem = document.getElementById('BPSys');
const BPDiasElem = document.getElementById('BPDia');
const BPMeanElem = document.getElementById('BPMean')


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

connectBtn.addEventListener('click', async () => {
  try {
    if (!('serial' in navigator)) {
      alert('Web Serial API not supported!');
      return;
    }

    const port = await navigator.serial.requestPort();
    await port.open({ baudRate: 38400 });
    await new Promise(r => setTimeout(r, 1000)); // Wait 1 second for device to stabilize
    const decoder = new TextDecoderStream();
    port.readable.pipeTo(decoder.writable);
    const reader = decoder.readable.getReader();

    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += value;
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop();

      for (let line of lines) {
        if (!line.trim()) continue;

          if (!/^[\x20-\x7E,]+$/.test(line)) {
        console.warn("Ignoring noise:", line);
        continue;
        }
        const data = parseMonitorData(line);

        // Update cards
        hrElem.textContent = data.heartRate || "--";
        spo2Elem.textContent = data.spo2 || "--";
        respElem.textContent = data.RESP || "--";
        INCO2Elem.textContent = data.INCO2 || "--";
        ETCO2Elem.textContent = data.E2Co2 || "--";
        timeElem.textContent= data.time || "__";
        BPSysElem.textContent=data.nibpSystolic || "__";
        BPDiasElem.textContent=data.nibpDiastolic || "__";
        BPMeanElem.textContent=data.nibpMean || "__";
        
        // Update charts
        const time = new Date().toLocaleTimeString();

        addData(chartHR, time, data.heartRate);
        addData(chartSpO2, time, data.spo2);
      }
    }

  } catch (err) {
    console.error(err);
    alert(`Error: ${err.message}`);
  }
});

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
    E2Co2: fields[12] || "",
    INCO2: fields[13] || "",
    INCO2: fields[14] || ""
  };

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

