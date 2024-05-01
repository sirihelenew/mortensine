const express = require('express');
const path = require('path');
const { spawn } = require('child_process');
const app = express();
const port = 3000;

// Run Python script
const python = spawn('./venv/bin/python', ['pythonas.py']);
// Collect data from script
python.on('error', (error) => {
  console.error('Error starting Python script:', error);
});
let scriptOutput = '';
python.stdout.on('data', function (data) {
  console.log('Python script output:', data.toString());
  try {
    scriptOutput = JSON.parse(data.toString());
  } catch (error) {
    console.error('Error parsing Python script output:', error);
  }
});
// In case of error
python.stderr.on('data', (data) => {
 console.error(`stderr: ${data}`);
});

// End process
python.on('close', (code) => {
 console.log(`child process close all stdio with code ${code}`);
});

// Serve static files from the public directory
app.use(express.static(path.join(__dirname)));

app.get('/rfid', (req, res) => {
  res.send(scriptOutput);
});

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});

module.exports = app;