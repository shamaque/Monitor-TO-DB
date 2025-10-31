const express = require('express');
const path = require('path');

const app = express();
const PORT = 4000;
const bodyParser = require('body-parser');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from "public" folder
app.use(express.static(path.join(__dirname, 'public')));

app.post("/data",async (req,res)=>{
    console.log("Received data:", req.body);
      const response = await fetch('http://localhost:8857/EHRData/', {
    method: 'POST',
    headers: {  'Content-Type': 'application/json'  },
    body: JSON.stringify(req.body)
  })
  
  console.log("Response from EHR server:", response);
  return res.json({status: 'success' });

})
// Start the server
app.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
});
