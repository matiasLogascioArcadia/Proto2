const express = require('express');
const path = require('path');

const app = express();
const port = 3000;

// Serve static files from the current directory (for index.html, app.js)
app.use(express.static(path.join(__dirname, '')));

// Serve data directory separately
app.use('/data', express.static(path.join(__dirname, 'data')));

// Serve styles directory separately
app.use('/styles', express.static(path.join(__dirname, 'styles')));

// Start the server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
}); 