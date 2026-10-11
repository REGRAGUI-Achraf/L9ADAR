// backend/server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Initialize the Express application
const app = express();
app.use(cors());
app.use(express.json());
// Tell Express to serve the compiled Vue HTML/CSS from the frontend folder
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Initialize the Database (creates a file named darmate.db on your hard drive)
const db = new sqlite3.Database('./darmate.db', (err) => {
  if (err) {
    console.error('Database error:', err.message);
  } else {
    console.log('Connected to SQLite database.');
    
    // ENHANCEMENT: Performance and Security Pragmas
    db.run('PRAGMA journal_mode = WAL;');
    db.run('PRAGMA foreign_keys = ON;');
  }
});

// Create the tables and relational schema
db.serialize(() => {
  // 1. Create the Users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL
  )`);

  // 2. Create the Listings table with a Foreign Key linked to the Users table
  db.run(`CREATE TABLE IF NOT EXISTS listings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    owner_id INTEGER NOT NULL,
    city TEXT NOT NULL,
    neighborhood TEXT,
    rent INTEGER,
    FOREIGN KEY(owner_id) REFERENCES users(id) ON DELETE CASCADE
  )`);
  
  // Insert dummy data so you can test it immediately
  db.run(`INSERT OR IGNORE INTO users (id, name, email) VALUES (1, 'Nemo', 'nemo@student.1337.ma')`);
  db.run(`INSERT OR IGNORE INTO listings (id, owner_id, city, neighborhood, rent) VALUES (1, 1, 'Rabat', 'Agdal', 2500)`);
});

// REST API: GET all housing listings WITH the owner's name using an INNER JOIN
app.get('/api/listings', (req, res) => {
  const sql = `
    SELECT listings.*, users.name AS owner_name 
    FROM listings 
    INNER JOIN users ON listings.owner_id = users.id
  `;
  
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// REST API: POST a new housing listing
app.post('/api/listings', (req, res) => {
  const { owner_id, city, neighborhood, rent } = req.body;
  const sql = 'INSERT INTO listings (owner_id, city, neighborhood, rent) VALUES (?, ?, ?, ?)';
  
  // If no owner_id is provided by the frontend, default to User 1
  const actualOwner = owner_id || 1;

  db.run(sql, [actualOwner, city, neighborhood, rent], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, owner_id: actualOwner, city, neighborhood, rent });
  });
});

// Initialize the HTTP server and WebSocket (Socket.io) server
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// Real-Time Chat Logic (Works just like your C++ channel broadcast)
io.on('connection', (socket) => {
  console.log('[WSS] Client connected:', socket.id);

  socket.on('send_message', (data) => {
    // Instantly broadcast the message to all connected clients
    io.emit('receive_message', data);
  });

  socket.on('disconnect', () => {
    console.log('[WSS] Client disconnected:', socket.id);
  });
});

// Start the server on any Port or 3000
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`DarMate Backend running on port ${PORT}`);
});
