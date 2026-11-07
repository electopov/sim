import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// SSL Certificate Configuration
let options = {};
try {
  options = {
    key: fs.readFileSync(path.join(__dirname, 'key.pem')),
    cert: fs.readFileSync(path.join(__dirname, 'cert.pem'))
  };
} catch (error) {
  console.error('Error loading SSL certificates (key.pem / cert.pem):', error.message);
  process.exit(1);
}

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/logo', (req, res) => {
  res.sendFile(path.join(__dirname, 'custom.png'));
});

app.get('/logo2', (req, res) => {
  res.sendFile(path.join(__dirname, 'custom2.png'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'lohin.html'));
});

app.get('/startsound', (req, res) => {
  res.sendFile(path.join(__dirname, 'start.mp3'));
});

// POST /login handler for index.html script
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Example authentication check (Replace with real user authentication as needed)
  if (username === 'admin' && password === 'admin123') {
    return res.json({
      success: true,
      message: 'Welcome back, Admin!',
      redirectUrl: '/request/autho2/loginadmin'
    });
  } else if (username && password) {
    return res.json({
      success: true,
      message: `Welcome, ${username}!`,
      redirectUrl: '/'
    });
  }

  res.status(401).json({
    success: false,
    message: 'Invalid username or password'
  });
});

// Using Express URL Parameters instead of query string-like literal URLs
// In-memory storage for cards (will reset if the server restarts)
// In-memory array to store cards issued by admin
const cardDatabase = [];

// Serve the Admin Panel HTML page
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// API endpoint to fetch all active cards for the admin panel table
app.get('/request/autho2/getcards', (req, res) => {
  res.json({
    success: true,
    cards: cardDatabase
  });
});





// Admin endpoint to add / send a card
app.post('/request/autho2/sendtoadmin', (req, res) => {
  const { cardCode, studentName } = req.body;

  if (!cardCode) {
    return res.status(400).json({ success: false, message: 'Card code is required.' });
  }

  // Check if card code already exists
  const exists = cardDatabase.find(c => c.cardCode === cardCode);
  if (exists) {
    return res.status(400).json({ success: false, message: 'This card code already exists!' });
  }

  // Save card info
  cardDatabase.push({
    cardCode,
    studentName: studentName || 'General Student',
    createdAt: new Date().toISOString()
  });

  console.log(`Admin created card: ${cardCode} for ${studentName}`);
  res.json({ success: true, message: `Card ${cardCode} successfully issued!` });
});

// Student endpoint to verify their entered card
app.post('/student/entercard', (req, res) => {
  const { cardCode } = req.body;
  const cardFound = cardDatabase.find(c => c.cardCode === cardCode);

  if (cardFound) {
    res.json({ 
      success: true, 
      message: `Card verified! Welcome, ${cardFound.studentName}. Access granted.` 
    });
  } else {
    res.status(401).json({ 
      success: false, 
      message: 'Invalid card code. Please check with your admin.' 
    });
  }
});
app.get('/api/reuse/users', (req, res) => {
  res.send('sent login to admin');
});

app.get('/request/autho2/loginadmin', (req, res) => {
  res.send('login to admin');
});

// 404 Handler for undefined routes
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, '404.html'));
});

// HTTPS Server Startup
const SECURE_PORT = process.env.PORT || 443;

https.createServer(options, app).listen(SECURE_PORT, () => {
  console.log(`Secure server running on https://localhost:${SECURE_PORT}`);
});