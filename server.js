const express = require('express');
const path = require('path');
let deviceData = [];
const app = express();
const PORT = 4000;
const bodyParser = require('body-parser');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from "public" folder
app.use(express.static(path.join(__dirname, 'public')));

app.post("/data", async (req, res) => {
  console.log("Received data:", req.body);

  // 1️⃣ Store data in memory
  deviceData.push({
    timestamp: new Date().toISOString(),
    ...req.body
  });

  // 2️⃣ Optional: keep only last 1000 entries to avoid memory bloat
  if (deviceData.length > 1000) deviceData.shift();

  res.json({ status: 'success' });
});

app.get("/report/data", (req, res) => {
  res.json(deviceData);
});

// Download data as JSON
// app.get("/export/json", (req, res) => {
//   res.setHeader('Content-Disposition', 'attachment; filename="machine_data.json"');
//   res.setHeader('Content-Type', 'application/json');
//   res.send(JSON.stringify(deviceData, null, 2));
// });



// Start the server
app.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
});
