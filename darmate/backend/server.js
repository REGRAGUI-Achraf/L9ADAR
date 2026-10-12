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

const db = new sqlite3.Database('./darmate.db', (err) => {
  if (err) console.error('Database error:', err.message);
  else {
    console.log('Connected to SQLite database.');
    db.run('PRAGMA journal_mode = WAL;');
    db.run('PRAGMA foreign_keys = ON;');
  }
});

// Build Schema & Seed Initial Data
db.serialize(() => {
  // NEW: Added password column
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE NOT NULL, password TEXT NOT NULL, 
    phone TEXT DEFAULT '', bio TEXT DEFAULT '', is_client INTEGER DEFAULT 1, is_publisher INTEGER DEFAULT 0
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS listings (
    id INTEGER PRIMARY KEY AUTOINCREMENT, owner_id INTEGER NOT NULL, title TEXT NOT NULL,
    city TEXT NOT NULL, neighborhood TEXT NOT NULL, rent INTEGER NOT NULL, description TEXT,
    image_url TEXT, amenities TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(owner_id) REFERENCES users(id) ON DELETE CASCADE
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS favorites (
    user_id INTEGER NOT NULL, listing_id INTEGER NOT NULL, PRIMARY KEY (user_id, listing_id),
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE, FOREIGN KEY(listing_id) REFERENCES listings(id) ON DELETE CASCADE
  )`);

  // NEW: Booking Engine Table
  db.run(`CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT, listing_id INTEGER NOT NULL, client_id INTEGER NOT NULL,
    status TEXT DEFAULT 'pending', created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(listing_id) REFERENCES listings(id) ON DELETE CASCADE,
    FOREIGN KEY(client_id) REFERENCES users(id) ON DELETE CASCADE
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT, sender_name TEXT NOT NULL, text TEXT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS private_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT, sender_id INTEGER NOT NULL, receiver_id INTEGER NOT NULL,
    text TEXT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(sender_id) REFERENCES users(id) ON DELETE CASCADE, FOREIGN KEY(receiver_id) REFERENCES users(id) ON DELETE CASCADE
  )`);

  // --- AUTO SEEDER (Starting Data) ---
  db.get("SELECT COUNT(*) as count FROM users", [], (err, row) => {
    if (row && row.count === 0) {
      console.log("🌱 Seeding secure initial startup data...");
      
      // Seed Users with default password '123456'
      db.run(`INSERT INTO users (name, password, is_client, is_publisher, bio) VALUES 
        ('Amina', '123456', 0, 1, 'Superhost in Rabat. I love hosting 1337 students!'),
        ('Youssef', '123456', 1, 1, 'Tech enthusiast and landlord in Salé.'),
        ('Sofia', '123456', 1, 1, 'Architecture student, renting out my spare room.')`);

      // Seed Listings
      db.run(`INSERT INTO listings (owner_id, title, city, neighborhood, rent, description, image_url, amenities) VALUES 
        (1, 'Sunny Studio near UM6P', 'Rabat', 'Agdal', 3500, 'Beautiful, bright studio perfect for a student.', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1000&q=80', '["WiFi", "Kitchen", "Air Conditioning", "Workspace"]'),
        (2, 'Cozy Room in Shared Apartment', 'Salé', 'Hay Salam', 1500, 'Looking for a quiet roommate. Fiber internet included!', 'https://images.unsplash.com/photo-1502672260266-1c1e52409818?auto=format&fit=crop&w=1000&q=80', '["WiFi", "Washing Machine", "Balcony"]'),
        (3, 'Modern Loft with Ocean View', 'Rabat', 'Ocean', 4500, 'Stunning loft with a dedicated workspace and ocean breeze.', 'https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?auto=format&fit=crop&w=1000&q=80', '["WiFi", "Workspace", "Kitchen", "Security"]')`);
    }
  });
});

// --- API ROUTES: AUTHENTICATION ---
app.post('/api/register', (req, res) => {
  const { name, password, is_client, is_publisher } = req.body;
  const clientFlag = is_client ? 1 : 0;
  const pubFlag = is_publisher ? 1 : 0;
  
  db.run(`INSERT INTO users (name, password, is_client, is_publisher) VALUES (?, ?, ?, ?)`, 
    [name, password, clientFlag, pubFlag], function(err) {
    if (err) return res.status(400).json({ error: "Username already exists." });
    res.json({ id: this.lastID, name, phone: '', bio: '', is_client: clientFlag, is_publisher: pubFlag });
  });
});

app.post('/api/login', (req, res) => {
  const { name, password } = req.body;
  db.get(`SELECT id, name, phone, bio, is_client, is_publisher FROM users WHERE name = ? AND password = ?`, 
    [name, password], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(401).json({ error: "Invalid username or password." });
    res.json(row); 
  });
});

// --- API ROUTES: USERS & PROFILE ---
app.put('/api/users/:id', (req, res) => {
  const { phone, bio, is_client, is_publisher } = req.body;
  db.run(`UPDATE users SET phone = ?, bio = ?, is_client = ?, is_publisher = ? WHERE id = ?`, 
    [phone, bio, is_client ? 1 : 0, is_publisher ? 1 : 0, req.params.id], () => res.json({ success: true }));
});

// --- API ROUTES: LISTINGS & FAVORITES ---
app.get('/api/listings', (req, res) => {
  const userId = req.query.userId || 0;
  const sql = `SELECT listings.*, users.name AS owner_name, users.phone AS owner_phone, users.bio AS owner_bio,
    CASE WHEN favorites.user_id IS NOT NULL THEN 1 ELSE 0 END AS is_favorited FROM listings 
    INNER JOIN users ON listings.owner_id = users.id LEFT JOIN favorites ON listings.id = favorites.listing_id AND favorites.user_id = ?
    ORDER BY listings.id DESC`;
  db.all(sql, [userId], (err, rows) => {
    res.json(rows.map(r => ({...r, amenities: JSON.parse(r.amenities || '[]')})));
  });
});

app.post('/api/listings', (req, res) => {
  const { owner_id, title, city, neighborhood, rent, description, image_url, amenities } = req.body;
  const img = image_url || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1000&q=80';
  db.run('INSERT INTO listings (owner_id, title, city, neighborhood, rent, description, image_url, amenities) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', 
    [owner_id, title, city, neighborhood, rent, description, img, JSON.stringify(amenities || [])], () => res.json({ success: true }));
});

app.delete('/api/listings/:id', (req, res) => { db.run('DELETE FROM listings WHERE id = ?', [req.params.id], () => res.json({ success: true })); });

app.post('/api/favorites', (req, res) => {
  const { user_id, listing_id, is_favorited } = req.body;
  if (is_favorited) db.run('INSERT OR IGNORE INTO favorites (user_id, listing_id) VALUES (?, ?)', [user_id, listing_id], () => res.json({ success: true }));
  else db.run('DELETE FROM favorites WHERE user_id = ? AND listing_id = ?', [user_id, listing_id], () => res.json({ success: true }));
});

// --- API ROUTES: BOOKINGS ENGINE ---
app.post('/api/bookings', (req, res) => {
  const { listing_id, client_id } = req.body;
  db.run('INSERT INTO bookings (listing_id, client_id) VALUES (?, ?)', [listing_id, client_id], () => res.json({ success: true }));
});

app.get('/api/bookings/:ownerId', (req, res) => {
  const sql = `SELECT b.id, b.status, b.created_at, l.title, u.name AS client_name, u.id AS client_id 
               FROM bookings b JOIN listings l ON b.listing_id = l.id JOIN users u ON b.client_id = u.id 
               WHERE l.owner_id = ? ORDER BY b.created_at DESC`;
  db.all(sql, [req.params.ownerId], (err, rows) => res.json(rows));
});

app.put('/api/bookings/:id', (req, res) => {
  db.run('UPDATE bookings SET status = ? WHERE id = ?', [req.body.status, req.params.id], () => res.json({ success: true }));
});

// --- MESSAGING ---
app.get('/api/messages', (req, res) => { db.all('SELECT * FROM messages ORDER BY id ASC LIMIT 150', [], (err, rows) => res.json(rows)); });
app.get('/api/inbox/:userId', (req, res) => {
  db.all(`SELECT DISTINCT u.id, u.name FROM users u JOIN private_messages pm ON (u.id = pm.sender_id OR u.id = pm.receiver_id) WHERE (pm.sender_id = ? OR pm.receiver_id = ?) AND u.id != ?`, 
    [req.params.userId, req.params.userId, req.params.userId], (err, rows) => res.json(rows));
});
app.get('/api/private_messages/:userId/:otherId', (req, res) => {
  const { userId, otherId } = req.params;
  db.all(`SELECT * FROM private_messages WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?) ORDER BY created_at ASC`, 
    [userId, otherId, otherId, userId], (err, rows) => res.json(rows));
});

// --- WEBSOCKETS ---
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
io.on('connection', (socket) => {
  socket.on('register', (userId) => socket.join(`user_${userId}`));
  socket.on('send_message', (data) => {
    db.run(`INSERT INTO messages (sender_name, text) VALUES (?, ?)`, [data.user, data.text], function() {
      io.emit('receive_message', { id: this.lastID, sender_name: data.user, text: data.text });
    });
  });
  socket.on('send_private', (data) => {
    db.run(`INSERT INTO private_messages (sender_id, receiver_id, text) VALUES (?, ?, ?)`, [data.sender_id, data.receiver_id, data.text], function() {
      const msgObj = { id: this.lastID, sender_id: data.sender_id, receiver_id: data.receiver_id, text: data.text, created_at: new Date() };
      io.to(`user_${data.receiver_id}`).emit('receive_private', msgObj);
      io.to(`user_${data.sender_id}`).emit('receive_private', msgObj);
    });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => console.log(`Backend running on port ${PORT}`));
