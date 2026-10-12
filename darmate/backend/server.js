// backend/server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Initialize Database
const db = new sqlite3.Database('./darmate.db', (err) => {
  if (err) console.error('Database error:', err.message);
  else {
    console.log('Connected to SQLite database.');
    db.run('PRAGMA journal_mode = WAL;');
    db.run('PRAGMA foreign_keys = ON;');
  }
});

// Build The Airbnb-Style Schema
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    phone TEXT DEFAULT '',
    bio TEXT DEFAULT '',
    is_client INTEGER DEFAULT 1,
    is_publisher INTEGER DEFAULT 0
  )`);

  // Added title, image_url, and amenities
  db.run(`CREATE TABLE IF NOT EXISTS listings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    owner_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    city TEXT NOT NULL,
    neighborhood TEXT NOT NULL,
    rent INTEGER NOT NULL,
    description TEXT,
    image_url TEXT,
    amenities TEXT, 
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(owner_id) REFERENCES users(id) ON DELETE CASCADE
  )`);

  // NEW: Favorites / Saved Properties Checklist
  db.run(`CREATE TABLE IF NOT EXISTS favorites (
    user_id INTEGER NOT NULL,
    listing_id INTEGER NOT NULL,
    PRIMARY KEY (user_id, listing_id),
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(listing_id) REFERENCES listings(id) ON DELETE CASCADE
  )`);

  // Global Chat Lounge
  db.run(`CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_name TEXT NOT NULL,
    text TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // NEW: Private 1-on-1 Inbox
  db.run(`CREATE TABLE IF NOT EXISTS private_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER NOT NULL,
    receiver_id INTEGER NOT NULL,
    text TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(receiver_id) REFERENCES users(id) ON DELETE CASCADE
  )`);
});

// --- API ROUTES: USERS ---
app.post('/api/users', (req, res) => {
  const { name, is_client, is_publisher } = req.body;
  db.get(`SELECT * FROM users WHERE name = ?`, [name], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (row) return res.json(row); 
    
    const clientFlag = is_client ? 1 : 0;
    const pubFlag = is_publisher ? 1 : 0;
    db.run(`INSERT INTO users (name, is_client, is_publisher) VALUES (?, ?, ?)`, [name, clientFlag, pubFlag], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, name, phone: '', bio: '', is_client: clientFlag, is_publisher: pubFlag });
    });
  });
});

app.put('/api/users/:id', (req, res) => {
  const { phone, bio, is_client, is_publisher } = req.body;
  db.run(`UPDATE users SET phone = ?, bio = ?, is_client = ?, is_publisher = ? WHERE id = ?`, 
    [phone, bio, is_client ? 1 : 0, is_publisher ? 1 : 0, req.params.id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
  });
});

// --- API ROUTES: LISTINGS & FAVORITES ---
app.get('/api/listings', (req, res) => {
  const userId = req.query.userId || 0;
  // This massive query gets all listings, the owner data, and whether the current user has favorited it
  const sql = `
    SELECT listings.*, users.name AS owner_name, users.phone AS owner_phone, users.bio AS owner_bio,
    CASE WHEN favorites.user_id IS NOT NULL THEN 1 ELSE 0 END AS is_favorited
    FROM listings 
    INNER JOIN users ON listings.owner_id = users.id
    LEFT JOIN favorites ON listings.id = favorites.listing_id AND favorites.user_id = ?
    ORDER BY listings.id DESC
  `;
  db.all(sql, [userId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    // Parse the JSON amenities back into arrays for the frontend
    const parsedRows = rows.map(r => ({...r, amenities: JSON.parse(r.amenities || '[]')}));
    res.json(parsedRows);
  });
});

app.post('/api/listings', (req, res) => {
  const { owner_id, title, city, neighborhood, rent, description, image_url, amenities } = req.body;
  const sql = 'INSERT INTO listings (owner_id, title, city, neighborhood, rent, description, image_url, amenities) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
  const amStr = JSON.stringify(amenities || []);
  
  // Default image if none provided
  const img = image_url || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80';

  db.run(sql, [owner_id, title, city, neighborhood, rent, description, img, amStr], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.delete('/api/listings/:id', (req, res) => {
  db.run('DELETE FROM listings WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// Toggle Favorite / Saved Checklist
app.post('/api/favorites', (req, res) => {
  const { user_id, listing_id, is_favorited } = req.body;
  if (is_favorited) {
    db.run('INSERT OR IGNORE INTO favorites (user_id, listing_id) VALUES (?, ?)', [user_id, listing_id], (err) => {
      res.json({ success: true });
    });
  } else {
    db.run('DELETE FROM favorites WHERE user_id = ? AND listing_id = ?', [user_id, listing_id], (err) => {
      res.json({ success: true });
    });
  }
});

// --- API ROUTES: MESSAGING ---
app.get('/api/messages', (req, res) => {
  db.all('SELECT * FROM messages ORDER BY id ASC LIMIT 150', [], (err, rows) => {
    res.json(rows);
  });
});

// Get Inbox Contacts (People you have messaged)
app.get('/api/inbox/:userId', (req, res) => {
  const sql = `
    SELECT DISTINCT u.id, u.name 
    FROM users u
    JOIN private_messages pm ON (u.id = pm.sender_id OR u.id = pm.receiver_id)
    WHERE (pm.sender_id = ? OR pm.receiver_id = ?) AND u.id != ?
  `;
  db.all(sql, [req.params.userId, req.params.userId, req.params.userId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Get Private Chat History with a specific user
app.get('/api/private_messages/:userId/:otherId', (req, res) => {
  const { userId, otherId } = req.params;
  const sql = `
    SELECT * FROM private_messages 
    WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
    ORDER BY created_at ASC
  `;
  db.all(sql, [userId, otherId, otherId, userId], (err, rows) => {
    res.json(rows);
  });
});

// --- WEBSOCKETS (Now with Private Rooms) ---
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

io.on('connection', (socket) => {
  
  // User connects and registers their ID to receive private messages
  socket.on('register', (userId) => {
    socket.join(`user_${userId}`); 
  });

  // Global Lounge
  socket.on('send_message', (data) => {
    db.run(`INSERT INTO messages (sender_name, text) VALUES (?, ?)`, [data.user, data.text], function(err) {
      if (!err) io.emit('receive_message', { id: this.lastID, sender_name: data.user, text: data.text });
    });
  });

  // Private 1-on-1 Messages
  socket.on('send_private', (data) => {
    const { sender_id, receiver_id, text } = data;
    db.run(`INSERT INTO private_messages (sender_id, receiver_id, text) VALUES (?, ?, ?)`, [sender_id, receiver_id, text], function(err) {
      if (!err) {
        const msgObj = { id: this.lastID, sender_id, receiver_id, text, created_at: new Date() };
        // Send to receiver
        io.to(`user_${receiver_id}`).emit('receive_private', msgObj);
        // Send back to sender so their UI updates
        io.to(`user_${sender_id}`).emit('receive_private', msgObj);
      }
    });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend running on port ${PORT}`);
});
