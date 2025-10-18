const { SerialPort, ReadlineParser } = require('serialport');

// Create serial connection
const port = new SerialPort({
  path: 'COM5',       // check your correct COM port
  baudRate: 38400,
  dataBits: 8,
  stopBits: 1,
  parity: 'none'
});

// Create a parser to read line by line
const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

port.on('open', () => {
  console.log('✅ Listening on COM5 at 9600 baud...');
});

// When full line is received
parser.on('data', (line) => {

  const fields = line.trim().split(',');

  // Make sure we have enough data fields before parsing
  if (fields.length > 5) {
    const OUTJSON = {
      "time": fields[0] || "",
      "HeartRate": fields[1] || "",
      "ECG Status": fields[2] || "",
      "SPo2": fields[3] || "",
      "Spo2 Flag": fields[5] || "",
      "Respiration rate (breaths/min)": fields[9] || "",
      "NIBP Systolic": fields[10] || "",
      "NIBP Di-Systolic": fields[11] || "",
      "NIBP Mean": fields[12] || "",
      "Temperature 1": fields[13] || "",
      "Temperature 2": fields[14] || "",
      "Alarm or checksum code": fields[15] || ""
    };
    console.log('✅ Parsed:', OUTJSON);
  } else {
    console.log('⚠️ Incomplete data, skipping...');
  }
});
