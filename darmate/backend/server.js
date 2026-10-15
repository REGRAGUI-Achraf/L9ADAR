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
    console.log('Connected to DarMate Premium database.');
    db.run('PRAGMA journal_mode = WAL;');
    db.run('PRAGMA foreign_keys = ON;');
  }
});

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE NOT NULL, password TEXT NOT NULL, 
    phone TEXT DEFAULT '', bio TEXT DEFAULT '', lifestyle_tags TEXT DEFAULT '[]',
    is_client INTEGER DEFAULT 1, is_publisher INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // NEW: images column stores a JSON array of image URLs
  db.run(`CREATE TABLE IF NOT EXISTS listings (
    id INTEGER PRIMARY KEY AUTOINCREMENT, owner_id INTEGER NOT NULL, title TEXT NOT NULL,
    category TEXT DEFAULT 'Shared Room', spots INTEGER DEFAULT 1, city TEXT NOT NULL, neighborhood TEXT NOT NULL, 
    rent INTEGER NOT NULL, description TEXT, images TEXT DEFAULT '[]', amenities TEXT DEFAULT '[]', 
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(owner_id) REFERENCES users(id) ON DELETE CASCADE
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT, listing_id INTEGER NOT NULL, client_id INTEGER NOT NULL,
    rating INTEGER NOT NULL, comment TEXT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(listing_id) REFERENCES listings(id) ON DELETE CASCADE, FOREIGN KEY(client_id) REFERENCES users(id) ON DELETE CASCADE
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS favorites (
    user_id INTEGER NOT NULL, listing_id INTEGER NOT NULL, PRIMARY KEY (user_id, listing_id),
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE, FOREIGN KEY(listing_id) REFERENCES listings(id) ON DELETE CASCADE
  )`);

  // NEW: Added check_in, check_out, and total_price to bookings
  db.run(`CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT, listing_id INTEGER NOT NULL, client_id INTEGER NOT NULL,
    check_in DATE, check_out DATE, total_price INTEGER,
    status TEXT DEFAULT 'pending', created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(listing_id) REFERENCES listings(id) ON DELETE CASCADE, FOREIGN KEY(client_id) REFERENCES users(id) ON DELETE CASCADE
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, message TEXT NOT NULL, is_read INTEGER DEFAULT 0, 
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, sender_name TEXT NOT NULL, text TEXT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
  db.run(`CREATE TABLE IF NOT EXISTS private_messages (id INTEGER PRIMARY KEY AUTOINCREMENT, sender_id INTEGER NOT NULL, receiver_id INTEGER NOT NULL, text TEXT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(sender_id) REFERENCES users(id) ON DELETE CASCADE, FOREIGN KEY(receiver_id) REFERENCES users(id) ON DELETE CASCADE)`);

  // --- MASSIVE MULTI-IMAGE AUTO SEEDER ---
  db.get("SELECT COUNT(*) as count FROM users", [], (err, row) => {
    if (row && row.count === 0) {
      console.log("🌱 Seeding DarMate with multi-image galleries...");
      
      db.run(`INSERT INTO users (name, password, is_client, is_publisher, bio, lifestyle_tags) VALUES 
        ('Nemo', '123456', 1, 1, '1337 Student, love coding.', '["Night Owl", "Student"]'),
        ('Amina', '123456', 0, 1, 'Superhost in Rabat.', '["Clean", "Early Bird"]'),
        ('Youssef', '123456', 1, 1, 'Tech enthusiast.', '["Pet Friendly"]'),
        ('Kenza', '123456', 1, 1, 'Design student.', '["Creative", "Quiet"]')`);

      const cities = ['Rabat', 'Salé', 'Kénitra', 'Meknès'];
      const neighborhoods = ['Agdal', 'Hassan', 'Hay Salam', 'Ocean', 'Medina', 'Ryad', 'Bettana', 'Maamora'];
      const categories = ['Shared Room', 'Private Room', 'Entire Place'];
      const adjectives = ['Beautiful', 'Sunny', 'Cozy', 'Modern', 'Luxury'];
      const spaceTypes = ['Studio', 'Apartment', 'Loft', 'Coloc'];
      
      // Galleries (Each listing gets 3 random images)
      const photoBank = [
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1502672260266-1c1e52409818?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?auto=format&fit=crop&w=1000&q=80'
      ];
      
      const allAmens = ['WiFi', 'Kitchen', 'Washing Machine', 'Air Conditioning', 'Free Parking', 'Workspace', 'Balcony', 'Gym'];

      for (let i = 1; i <= 40; i++) {
        const owner_id = Math.floor(Math.random() * 4) + 1;
        const city = cities[Math.floor(Math.random() * cities.length)];
        const neighborhood = neighborhoods[Math.floor(Math.random() * neighborhoods.length)];
        const category = categories[Math.floor(Math.random() * categories.length)];
        const title = `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${spaceTypes[Math.floor(Math.random() * spaceTypes.length)]} in ${neighborhood}`;
        const rent = Math.floor(Math.random() * 70) * 100 + 1000;
        const spots = Math.floor(Math.random() * 3) + 1;
        
        // Pick 3 random images for the gallery
        const shuffled = photoBank.sort(() => 0.5 - Math.random());
        const gallery = JSON.stringify(shuffled.slice(0, 3));
        
        const listingAmens = [];
        allAmens.forEach(am => { if(Math.random() > 0.4) listingAmens.push(am); });
        if(listingAmens.length === 0) listingAmens.push('WiFi');

        const desc = `An incredible ${category.toLowerCase()} perfect for 1337 students or young professionals. Located in the heart of ${city}. Experience premium comfort with top-tier amenities.`;

        db.run('INSERT INTO listings (owner_id, title, category, spots, city, neighborhood, rent, description, images, amenities) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', 
          [owner_id, title, category, spots, city, neighborhood, rent, desc, gallery, JSON.stringify(listingAmens)]);
      }

      setTimeout(() => {
        db.run(`INSERT INTO reviews (listing_id, client_id, rating, comment) VALUES 
          (1, 1, 5, 'Absolutely amazing place! Very clean and quiet for coding.'),
          (1, 3, 5, 'Great location, host was very welcoming. High speed internet.'),
          (2, 4, 4, 'Best coloc experience in Salé.')`);
      }, 1000);

      db.run(`INSERT INTO messages (sender_name, text) VALUES ('Nemo', 'Hello 1337! Who is looking for a coloc?'), ('Amina', 'Check out my new listings!')`);
    }
  });
});

// --- REST APIs ---
app.post('/api/register', (req, res) => {
  const { name, password, is_client, is_publisher } = req.body;
  db.run(`INSERT INTO users (name, password, is_client, is_publisher) VALUES (?, ?, ?, ?)`, 
    [name, password, is_client ? 1 : 0, is_publisher ? 1 : 0], function(err) {
    if (err) return res.status(400).json({ error: "Username taken." });
    res.json({ id: this.lastID, name, phone: '', bio: '', lifestyle_tags: '[]', is_client: is_client ? 1 : 0, is_publisher: is_publisher ? 1 : 0 });
  });
});

app.post('/api/login', (req, res) => {
  db.get(`SELECT id, name, phone, bio, lifestyle_tags, is_client, is_publisher, created_at FROM users WHERE name = ? AND password = ?`, [req.body.name, req.body.password], (err, row) => {
    if (!row) return res.status(401).json({ error: "Invalid credentials." });
    res.json(row); 
  });
});

app.put('/api/users/:id', (req, res) => {
  db.run(`UPDATE users SET phone = ?, bio = ?, lifestyle_tags = ?, is_client = ?, is_publisher = ? WHERE id = ?`, 
    [req.body.phone, req.body.bio, JSON.stringify(req.body.lifestyle_tags || []), req.body.is_client ? 1 : 0, req.body.is_publisher ? 1 : 0, req.params.id], () => res.json({ success: true }));
});

app.get('/api/listings', (req, res) => {
  const sql = `SELECT listings.*, users.name AS owner_name, users.phone AS owner_phone, users.bio AS owner_bio, users.lifestyle_tags AS owner_tags, users.created_at AS owner_joined,
    CASE WHEN favorites.user_id IS NOT NULL THEN 1 ELSE 0 END AS is_favorited,
    (SELECT ROUND(AVG(rating), 1) FROM reviews WHERE reviews.listing_id = listings.id) as avg_rating,
    (SELECT COUNT(*) FROM reviews WHERE reviews.listing_id = listings.id) as review_count
    FROM listings 
    INNER JOIN users ON listings.owner_id = users.id LEFT JOIN favorites ON listings.id = favorites.listing_id AND favorites.user_id = ?
    ORDER BY listings.id DESC`;
  db.all(sql, [req.query.userId || 0], (err, rows) => {
    res.json(rows.map(r => ({...r, images: JSON.parse(r.images || '[]'), amenities: JSON.parse(r.amenities || '[]'), owner_tags: JSON.parse(r.owner_tags || '[]')})));
  });
});

app.post('/api/listings', (req, res) => {
  const imagesArray = req.body.images && req.body.images.length > 0 ? req.body.images : ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1000&q=80'];
  db.run('INSERT INTO listings (owner_id, title, category, spots, city, neighborhood, rent, description, images, amenities) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', 
    [req.body.owner_id, req.body.title, req.body.category, req.body.spots, req.body.city, req.body.neighborhood, req.body.rent, req.body.description, JSON.stringify(imagesArray), JSON.stringify(req.body.amenities || [])], () => res.json({ success: true }));
});

app.delete('/api/listings/:id', (req, res) => { db.run('DELETE FROM listings WHERE id = ?', [req.params.id], () => res.json({ success: true })); });

// Reviews
app.get('/api/reviews/:listingId', (req, res) => { db.all('SELECT r.*, u.name as client_name FROM reviews r JOIN users u ON r.client_id = u.id WHERE r.listing_id = ? ORDER BY r.created_at DESC', [req.params.listingId], (err, rows) => res.json(rows)); });
app.post('/api/reviews', (req, res) => { db.run('INSERT INTO reviews (listing_id, client_id, rating, comment) VALUES (?, ?, ?, ?)', [req.body.listing_id, req.body.client_id, req.body.rating, req.body.comment], () => res.json({ success: true })); });

// Favorites & Bookings
app.post('/api/favorites', (req, res) => {
  if (req.body.is_favorited) db.run('INSERT OR IGNORE INTO favorites (user_id, listing_id) VALUES (?, ?)', [req.body.user_id, req.body.listing_id], () => res.json({ success: true }));
  else db.run('DELETE FROM favorites WHERE user_id = ? AND listing_id = ?', [req.body.user_id, req.body.listing_id], () => res.json({ success: true }));
});

app.post('/api/bookings', (req, res) => { 
  db.run('INSERT INTO bookings (listing_id, client_id, check_in, check_out, total_price) VALUES (?, ?, ?, ?, ?)', 
  [req.body.listing_id, req.body.client_id, req.body.check_in, req.body.check_out, req.body.total_price], () => res.json({ success: true })); 
});
app.get('/api/bookings/:ownerId', (req, res) => { db.all(`SELECT b.*, l.title, u.name AS client_name FROM bookings b JOIN listings l ON b.listing_id = l.id JOIN users u ON b.client_id = u.id WHERE l.owner_id = ? ORDER BY b.created_at DESC`, [req.params.ownerId], (err, rows) => res.json(rows)); });
app.put('/api/bookings/:id', (req, res) => {
  db.run('UPDATE bookings SET status = ? WHERE id = ?', [req.body.status, req.params.id], () => {
    const msg = `Booking for "${req.body.listingTitle}" (${req.body.check_in} to ${req.body.check_out}) was ${req.body.status}!`;
    db.run('INSERT INTO notifications (user_id, message) VALUES (?, ?)', [req.body.clientId, msg], function() {
      io.to(`user_${req.body.clientId}`).emit('new_notification', { id: this.lastID, message: msg, is_read: 0 });
      res.json({ success: true });
    });
  });
});

app.get('/api/notifications/:userId', (req, res) => { db.all('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC', [req.params.userId], (err, rows) => res.json(rows)); });
app.put('/api/notifications/read/:id', (req, res) => { db.run('UPDATE notifications SET is_read = 1 WHERE id = ?', [req.params.id], () => res.json({ success: true })); });

// --- MESSAGING ---
app.get('/api/messages', (req, res) => { db.all('SELECT * FROM messages ORDER BY id ASC LIMIT 150', [], (err, rows) => res.json(rows)); });
app.get('/api/inbox/:userId', (req, res) => { db.all(`SELECT DISTINCT u.id, u.name FROM users u JOIN private_messages pm ON (u.id = pm.sender_id OR u.id = pm.receiver_id) WHERE (pm.sender_id = ? OR pm.receiver_id = ?) AND u.id != ?`, [req.params.userId, req.params.userId, req.params.userId], (err, rows) => res.json(rows)); });
app.get('/api/private_messages/:userId/:otherId', (req, res) => { db.all(`SELECT * FROM private_messages WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?) ORDER BY created_at ASC`, [req.params.userId, req.params.otherId, req.params.otherId, req.params.userId], (err, rows) => res.json(rows)); });

// --- WEBSOCKETS ---
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
io.on('connection', (socket) => {
  socket.on('register', (userId) => socket.join(`user_${userId}`));
  socket.on('send_message', (data) => { db.run(`INSERT INTO messages (sender_name, text) VALUES (?, ?)`, [data.user, data.text], function() { io.emit('receive_message', { id: this.lastID, sender_name: data.user, text: data.text }); }); });
  socket.on('send_private', (data) => {
    db.run(`INSERT INTO private_messages (sender_id, receiver_id, text) VALUES (?, ?, ?)`, [data.sender_id, data.receiver_id, data.text], function() {
      const msgObj = { id: this.lastID, sender_id: data.sender_id, receiver_id: data.receiver_id, text: data.text, created_at: new Date() };
      io.to(`user_${data.receiver_id}`).emit('receive_private', msgObj); io.to(`user_${data.sender_id}`).emit('receive_private', msgObj);
    });
  });
});

server.listen(process.env.PORT || 3000, '0.0.0.0', () => console.log(`DarMate Ultimate Backend Live`));
