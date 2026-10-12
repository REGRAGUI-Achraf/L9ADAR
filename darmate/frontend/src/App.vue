<template>
  <div class="app-wrapper" :class="{ 'dark-theme': isDarkMode }">
    
    <!-- AURORA ANIMATED BACKGROUND -->
    <div class="aurora-bg">
      <div class="aurora-1"></div>
      <div class="aurora-2"></div>
      <div class="aurora-3"></div>
      <div class="aurora-4"></div>
    </div>

    <!-- TOAST NOTIFICATION -->
    <div class="toast" :class="{ 'toast-visible': toastMsg !== '' }">{{ toastMsg }}</div>

    <!-- ========================================== -->
    <!-- 1. AUTHENTICATION SCREEN (LOGIN/REGISTER)  -->
    <!-- ========================================== -->
    <div v-if="!currentUser" class="login-overlay">
      <div class="login-glass-box slide-up aurora-border">
        <div class="logo-large gradient-text">DarMate</div>
        <p class="subtitle">The Next-Gen Housing Network</p>
        
        <!-- Auth Mode Toggles -->
        <div class="auth-tabs">
          <button :class="['auth-tab', authMode === 'login' ? 'active' : '']" @click="authMode = 'login'">Sign In</button>
          <button :class="['auth-tab', authMode === 'register' ? 'active' : '']" @click="authMode = 'register'">Create Account</button>
        </div>

        <form @submit.prevent="authenticateUser" class="login-form mt-4">
          <div class="input-group">
            <span class="input-icon">👤</span>
            <input v-model="authName" type="text" placeholder="Username" required />
          </div>
          <div class="input-group mt-3">
            <span class="input-icon">🔒</span>
            <input v-model="authPassword" type="password" placeholder="Password" required />
          </div>
          
          <div class="role-selector" v-if="authMode === 'register'">
            <label class="check-btn glass-btn">
              <input type="checkbox" v-model="loginIsClient" /><span>🔍 I want to find a home</span>
            </label>
            <label class="check-btn glass-btn">
              <input type="checkbox" v-model="loginIsPublisher" /><span>🏠 I want to host a home</span>
            </label>
          </div>
          
          <button type="submit" class="btn primary full-width glow-effect mt-4">
            {{ authMode === 'login' ? 'Enter Network 🚀' : 'Join DarMate ✨' }}
          </button>
        </form>
      </div>
    </div>

    <!-- ========================================== -->
    <!-- 2. MAIN APPLICATION                        -->
    <!-- ========================================== -->
    <div v-else class="app-layout fade-in">
      
      <!-- SIDEBAR -->
      <aside class="sidebar glass-panel">
        <div class="sidebar-header">
          <div class="sidebar-brand gradient-text">DarMate</div>
          <button class="theme-toggle" @click="toggleTheme" :title="isDarkMode ? 'Light Mode' : 'Dark Mode'">{{ isDarkMode ? '☀️' : '🌙' }}</button>
        </div>

        <div class="nav-menu">
          <p class="nav-label" v-if="currentUser.is_client === 1">EXPLORE</p>
          <button v-if="currentUser.is_client === 1" @click="changeTab('browse')" :class="['nav-btn', currentTab === 'browse' ? 'active' : '']"><span class="nav-icon">✨</span> Discover</button>
          <button v-if="currentUser.is_client === 1" @click="changeTab('saved')" :class="['nav-btn', currentTab === 'saved' ? 'active' : '']"><span class="nav-icon">❤️</span> Saved List</button>
          
          <p class="nav-label mt-3" v-if="currentUser.is_publisher === 1">HOSTING</p>
          <button v-if="currentUser.is_publisher === 1" @click="changeTab('manage')" :class="['nav-btn', currentTab === 'manage' ? 'active' : '']"><span class="nav-icon">🏠</span> Dashboard</button>

          <p class="nav-label mt-3">NETWORK</p>
          <button @click="changeTab('inbox')" :class="['nav-btn', currentTab === 'inbox' ? 'active' : '']">
            <span class="nav-icon">📬</span> Messages
            <span class="badge pulse" v-if="inboxContacts.length > 0">{{ inboxContacts.length }}</span>
          </button>
          <button @click="changeTab('chat')" :class="['nav-btn', currentTab === 'chat' ? 'active' : '']"><span class="nav-icon">🌍</span> Lounge</button>
          <button @click="changeTab('profile')" :class="['nav-btn', currentTab === 'profile' ? 'active' : '']"><span class="nav-icon">⚙️</span> Settings</button>
        </div>
        
        <!-- FIXED LOGOUT FOOTER -->
        <div class="sidebar-footer">
          <div class="user-profile-badge glass-panel-light">
            <div class="avatar-small gradient-bg">{{ getInitials(currentUser.name) }}</div>
            <div class="user-details">
              <strong>{{ currentUser.name }}</strong>
              <span class="status-dot">Online</span>
            </div>
          </div>
          <button @click="logout" class="btn super-danger full-width">
            <span class="nav-icon">🚪</span> Sign Out
          </button>
        </div>
      </aside>

      <!-- MAIN CONTENT -->
      <main class="main-content" :class="{ 'no-scroll': activeListing }">
        
        <!-- BROWSE / SAVED TAB -->
        <div v-if="currentTab === 'browse' || currentTab === 'saved'" class="tab-content fade-in">
          <div class="header-bar">
            <h2 class="hero-title">{{ currentTab === 'saved' ? 'Your Saved Homes' : 'Discover Properties' }}</h2>
            
            <div class="advanced-filters" v-if="currentTab === 'browse'">
              <div class="input-group search-bar-group">
                <span class="input-icon">📍</span>
                <input v-model="searchQuery" type="text" class="search-bar" placeholder="Search cities or areas..." />
              </div>
              <div class="price-slider-group glass-panel-light">
                <label>Max Budget: <strong class="gradient-text">{{ maxPrice }} MAD</strong></label>
                <input type="range" v-model="maxPrice" min="500" max="15000" step="500" class="custom-slider" />
              </div>
            </div>
          </div>

          <div class="quick-filters" v-if="currentTab === 'browse'">
            <button class="chip glass-btn" @click="searchQuery = 'Salé'">Salé</button>
            <button class="chip glass-btn" @click="searchQuery = 'Rabat'">Rabat</button>
            <button class="chip glass-btn" @click="searchQuery = 'Kénitra'">Kénitra</button>
            <button class="chip glass-btn" @click="searchQuery = 'Meknès'">Meknès</button>
            <button class="chip glass-btn" @click="searchQuery = ''">Clear Filters</button>
          </div>

          <div class="listings-grid-bento">
            <div v-if="displayListings.length === 0" class="empty-state glass-panel shadow-sm">
              <span class="emoji bounce">🏜️</span>
              <p>No properties match your criteria.</p>
            </div>
            
            <div v-for="listing in displayListings" :key="listing.id" class="bento-card hover-lift glass-panel">
              <button class="favorite-btn" @click.stop="toggleFavorite(listing)">
                <span v-if="listing.is_favorited === 1" class="heart-active glow">❤️</span><span v-else class="heart-inactive">🤍</span>
              </button>
              <div class="card-img-wrapper" @click="openListing(listing)">
                <img :src="listing.image_url" class="card-img" />
                <div class="price-pill">{{ formatMoney(listing.rent) }}</div>
              </div>
              <div class="card-info" @click="openListing(listing)">
                <div class="card-location">{{ listing.city }}, {{ listing.neighborhood }}</div>
                <div class="card-title">{{ listing.title }}</div>
                <div class="card-amenities-preview">
                  <span v-for="(am, i) in (listing.amenities || []).slice(0,3)" :key="i" class="tiny-chip glass-panel-light">{{ am }}</span>
                  <span v-if="(listing.amenities || []).length > 3" class="tiny-chip glass-panel-light">+{{ listing.amenities.length - 3 }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- LISTING MODAL -->
        <div v-if="activeListing" class="listing-modal-overlay">
          <div class="listing-modal slide-up-fast glass-panel aurora-border">
            <button class="close-modal-btn glass-btn" @click="activeListing = null">✖ Close</button>
            <div class="modal-hero">
              <img :src="activeListing.image_url" />
              <div class="hero-gradient"></div>
            </div>
            <div class="modal-body">
              <div class="modal-header-info">
                <h1>{{ activeListing.title }}</h1>
                <div class="modal-location">📍 {{ activeListing.city }}, {{ activeListing.neighborhood }}</div>
              </div>
              
              <div class="modal-grid">
                <div class="modal-main-col">
                  <div class="host-section glass-panel-light">
                    <div class="host-header">
                      <div class="avatar-large gradient-bg">{{ getInitials(activeListing.owner_name) }}</div>
                      <div>
                        <h3>Hosted by {{ activeListing.owner_name }}</h3>
                        <p class="host-bio">{{ activeListing.owner_bio || 'Verified DarMate Host.' }}</p>
                      </div>
                    </div>
                  </div>
                  <div class="description-section mt-4"><h3>About this space</h3><p>{{ activeListing.description }}</p></div>
                  <div class="amenities-section mt-4" v-if="activeListing.amenities && activeListing.amenities.length > 0">
                    <h3>Premium Amenities</h3>
                    <div class="amenities-grid"><div class="amenity-item glass-btn" v-for="amenity in activeListing.amenities" :key="amenity">✨ {{ amenity }}</div></div>
                  </div>
                </div>

                <div class="modal-side-col">
                  <div class="booking-card glass-panel shadow-lg glow-shadow">
                    <div class="booking-price gradient-text"><strong>{{ formatMoney(activeListing.rent) }}</strong> <span>/ month</span></div>
                    
                    <button v-if="activeListing.owner_id === currentUser.id" class="btn outline full-width mt-3" disabled>This is your listing</button>
                    <div v-else>
                      <button @click="requestBooking(activeListing.id)" class="btn primary full-width mt-3 glow-effect">📅 Request to Book</button>
                      <button @click="contactHost(activeListing)" class="btn outline full-width mt-2">💬 Message Host</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- MANAGE PROPERTIES (HOST DASHBOARD) -->
        <div v-if="currentTab === 'manage' && currentUser.is_publisher === 1" class="tab-content fade-in">
          <h2 class="hero-title gradient-text">Host Dashboard</h2>
          
          <!-- Booking Requests Section -->
          <div class="glass-panel shadow-lg mb-5" v-if="hostBookings.length > 0">
            <h3 class="p-4 border-b">📅 Pending Booking Requests</h3>
            <div v-for="req in hostBookings" :key="req.id" class="booking-request-row">
              <div>
                <strong>{{ req.client_name }}</strong> wants to book <em>{{ req.title }}</em>.
                <span :class="['status-badge', req.status]">{{ req.status }}</span>
              </div>
              <div class="action-btns" v-if="req.status === 'pending'">
                <button @click="updateBookingStatus(req.id, 'approved')" class="btn success-btn small-btn">Approve</button>
                <button @click="updateBookingStatus(req.id, 'rejected')" class="btn super-danger small-btn">Reject</button>
              </div>
            </div>
          </div>

          <form @submit.prevent="submitListing" class="glass-panel add-form shadow-lg mt-4">
            <h3>✨ Create New Listing</h3>
            <div class="form-row-2">
              <div class="input-group"><span class="input-icon">🏷️</span><input v-model="form.title" type="text" placeholder="Catchy Title" required /></div>
              <div class="input-group"><span class="input-icon">🖼️</span><input v-model="form.image_url" type="url" placeholder="Image URL (Optional)" /></div>
            </div>
            <div class="form-row-3 mt-3">
              <input v-model="form.city" type="text" placeholder="City" required />
              <input v-model="form.neighborhood" type="text" placeholder="Neighborhood" required />
              <div class="input-group"><input v-model="form.rent" type="number" placeholder="Monthly Rent" required /><span class="input-suffix">MAD</span></div>
            </div>
            <textarea v-model="form.description" class="mt-3" placeholder="Describe the space in detail..." rows="3" required></textarea>
            <div class="amenities-checklist mt-4">
              <p class="role-label">Included Amenities:</p>
              <div class="checkbox-grid">
                <label v-for="item in availableAmenities" :key="item" class="check-btn-small glass-btn">
                  <input type="checkbox" :value="item" v-model="form.amenities" /><span>{{ item }}</span>
                </label>
              </div>
            </div>
            <div class="form-actions mt-4"><button type="submit" class="btn primary glow-effect">Publish to Network 🚀</button></div>
          </form>

          <h3 class="section-title mt-5">Your Active Properties</h3>
          <div class="listings-grid-bento">
            <div v-for="listing in publisherListings" :key="listing.id" class="bento-card glass-panel hover-lift">
              <div class="card-img-wrapper" @click="openListing(listing)"><img :src="listing.image_url" class="card-img" /><div class="price-pill">{{ formatMoney(listing.rent) }}</div></div>
              <div class="card-info">
                <div class="card-title">{{ listing.title }}</div>
                <button @click="deleteListing(listing.id)" class="btn danger-outline full-width mt-3">🗑️ Remove Listing</button>
              </div>
            </div>
          </div>
        </div>

        <!-- INBOX TAB -->
        <div v-if="currentTab === 'inbox'" class="tab-content fade-in inbox-layout">
          <h2>📬 Direct Messages</h2>
          <div class="inbox-container glass-panel shadow-lg">
            <div class="inbox-sidebar glass-panel-light">
              <div class="inbox-header">Active Chats</div>
              <div v-if="inboxContacts.length === 0" class="empty-contacts">No messages yet.</div>
              <div v-for="contact in inboxContacts" :key="contact.id" @click="selectContact(contact)" :class="['contact-item', activeChatUser && activeChatUser.id === contact.id ? 'active-contact' : '']">
                <div class="avatar-small gradient-bg">{{ getInitials(contact.name) }}</div>
                <div class="contact-name">{{ contact.name }}</div>
              </div>
            </div>
            <div class="inbox-chat" v-if="activeChatUser">
              <div class="inbox-chat-header glass-panel-light"><strong>{{ activeChatUser.name }}</strong></div>
              <div class="private-chat-window" id="private-scroll">
                <div v-for="(msg, index) in privateMessages" :key="index" :class="['chat-row', msg.sender_id === currentUser.id ? 'my-message slide-left' : 'other-message slide-right']">
                  <div class="chat-bubble">{{ msg.text }}</div>
                </div>
              </div>
              <form @submit.prevent="sendPrivateMessage" class="private-chat-inputs glass-panel-light">
                <input type="text" v-model="newPrivateMessage" placeholder="Type a message..." required />
                <button type="submit" class="btn primary glow-effect">Send ↗</button>
              </form>
            </div>
            <div class="inbox-chat-empty" v-else>
              <span class="emoji bounce">💬</span><p>Select a conversation to start chatting.</p>
            </div>
          </div>
        </div>

        <!-- GLOBAL CHAT TAB -->
        <div v-if="currentTab === 'chat'" class="tab-content chat-layout fade-in">
          <h2>🌍 Global Roommate Lounge</h2>
          <div class="chat-window glass-panel shadow-lg" id="global-scroll">
            <div v-if="globalMessages.length === 0" class="empty-state"><p>Lounge is empty. Drop a message!</p></div>
            <div v-for="(msg, index) in globalMessages" :key="index" :class="['chat-row', msg.sender_name === currentUser.name ? 'my-message slide-left' : 'other-message slide-right']">
              <div class="chat-meta" v-if="msg.sender_name !== currentUser.name">{{ msg.sender_name }}</div>
              <div class="chat-bubble-wrapper">
                <div v-if="msg.sender_name !== currentUser.name" class="avatar-tiny gradient-bg">{{ getInitials(msg.sender_name) }}</div>
                <div class="chat-bubble">{{ msg.text }}</div>
              </div>
            </div>
          </div>
          <form @submit.prevent="sendGlobalMessage" class="chat-inputs glass-panel shadow-lg mt-3">
            <input type="text" v-model="newGlobalMessage" placeholder="Say hello to the network..." required />
            <button type="submit" class="btn primary send-btn glow-effect">Send 🚀</button>
          </form>
        </div>

        <!-- PROFILE TAB -->
        <div v-if="currentTab === 'profile'" class="tab-content fade-in">
          <h2>Profile Settings</h2>
          <div class="profile-card glass-panel shadow-lg aurora-border">
            <div class="profile-header">
              <div class="avatar-large gradient-bg">{{ getInitials(currentUser.name) }}</div>
              <div><h3 class="city-title">{{ currentUser.name }}</h3><span class="status-dot">Authenticated on DarMate</span></div>
            </div>
            <form @submit.prevent="updateProfile" class="profile-form">
              <div class="form-group">
                <label>Contact Phone</label>
                <div class="input-group"><span class="input-icon">📱</span><input v-model="currentUser.phone" type="text" placeholder="06 XX XX XX XX" /></div>
              </div>
              <div class="form-group"><label>About Me</label><textarea v-model="currentUser.bio" rows="3" placeholder="Tell the community about yourself..."></textarea></div>
              <div class="permissions-box glass-panel-light">
                <label class="permissions-title">Network Capabilities</label>
                <label class="check-btn glass-btn mt-2"><input type="checkbox" v-model="profileIsClient" /><span>🔍 Buyer Mode (Explore Housing)</span></label>
                <label class="check-btn glass-btn mt-2"><input type="checkbox" v-model="profileIsPublisher" /><span>🏠 Host Mode (Manage Properties)</span></label>
              </div>
              <button type="submit" class="btn primary glow-effect mt-3 full-width">Save Configuration</button>
            </form>
          </div>
        </div>

      </main>
    </div>
  </div>
</template>

<script>
import { io } from "socket.io-client";

export default {
  data() {
    return {
      socket: null,
      currentUser: null,
      currentTab: '',
      isDarkMode: false,
      
      // Auth 
      authMode: 'login', // 'login' or 'register'
      authName: "",
      authPassword: "",
      loginIsClient: true,
      loginIsPublisher: false,
      
      // Profile Toggles
      profileIsClient: true,
      profileIsPublisher: false,
      
      // Data
      searchQuery: "",
      maxPrice: 15000,
      listings: [],
      hostBookings: [],
      activeListing: null,
      availableAmenities: ['WiFi', 'Air Conditioning', 'Kitchen', 'Free Parking', 'Washing Machine', 'Workspace', 'Pool', 'Balcony', 'Security', 'Gym'],
      form: { title: "", city: "", neighborhood: "", rent: "", description: "", image_url: "", amenities: [] },
      globalMessages: [],
      newGlobalMessage: "",
      inboxContacts: [],
      activeChatUser: null,
      privateMessages: [],
      newPrivateMessage: "",
      toastMsg: ""
    };
  },
  computed: {
    displayListings() {
      let source = this.listings.filter(l => l.rent <= this.maxPrice);
      if (this.currentTab === 'saved') source = source.filter(l => l.is_favorited === 1);
      else if (this.searchQuery) {
        const lowerQ = this.searchQuery.toLowerCase();
        source = source.filter(l => l.city.toLowerCase().includes(lowerQ) || l.neighborhood.toLowerCase().includes(lowerQ) || l.title.toLowerCase().includes(lowerQ));
      }
      return source;
    },
    publisherListings() { return this.listings.filter(l => l.owner_id === this.currentUser.id); }
  },
  mounted() {
    const savedUser = localStorage.getItem('darMateUser');
    const savedTab = localStorage.getItem('darMateTab');
    const savedTheme = localStorage.getItem('darMateTheme');
    if (savedTheme) this.isDarkMode = savedTheme === 'dark';
    if (savedUser) {
      this.currentUser = JSON.parse(savedUser);
      this.profileIsClient = this.currentUser.is_client === 1;
      this.profileIsPublisher = this.currentUser.is_publisher === 1;
      this.currentTab = savedTab || (this.currentUser.is_client === 1 ? 'browse' : 'manage');
      this.initializeData();
    }
  },
  methods: {
    formatMoney(amount) { return new Intl.NumberFormat('en-MA', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(amount); },
    toggleTheme() { this.isDarkMode = !this.isDarkMode; localStorage.setItem('darMateTheme', this.isDarkMode ? 'dark' : 'light'); },
    showToast(message) { this.toastMsg = message; setTimeout(() => { this.toastMsg = ""; }, 3000); },
    getInitials(name) { return name ? name.substring(0, 2).toUpperCase() : "?"; },
    changeTab(tab) { this.currentTab = tab; this.activeListing = null; localStorage.setItem('darMateTab', tab); if (tab === 'inbox') this.fetchInboxContacts(); if (tab === 'manage') this.fetchHostBookings(); },

    async authenticateUser() {
      const endpoint = this.authMode === 'login' ? '/api/login' : '/api/register';
      const body = { name: this.authName, password: this.authPassword };
      if (this.authMode === 'register') {
        if (!this.loginIsClient && !this.loginIsPublisher) return this.showToast("⚠️ Select at least one role.");
        body.is_client = this.loginIsClient;
        body.is_publisher = this.loginIsPublisher;
      }
      
      const response = await fetch(`http://localhost:3000${endpoint}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await response.json();
      
      if (!response.ok) return this.showToast(`❌ ${data.error}`);
      
      this.currentUser = data;
      this.profileIsClient = this.currentUser.is_client === 1;
      this.profileIsPublisher = this.currentUser.is_publisher === 1;
      localStorage.setItem('darMateUser', JSON.stringify(this.currentUser));
      this.changeTab(this.currentUser.is_client === 1 ? 'browse' : 'manage');
      this.initializeData();
      this.showToast(`Welcome to the network, ${this.currentUser.name}!`);
    },
    
    logout() { this.currentUser = null; localStorage.removeItem('darMateUser'); localStorage.removeItem('darMateTab'); if (this.socket) this.socket.disconnect(); },
    
    async updateProfile() {
      await fetch(`http://localhost:3000/api/users/${this.currentUser.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone: this.currentUser.phone, bio: this.currentUser.bio, is_client: this.profileIsClient, is_publisher: this.profileIsPublisher }) });
      this.currentUser.is_client = this.profileIsClient ? 1 : 0;
      this.currentUser.is_publisher = this.profileIsPublisher ? 1 : 0;
      localStorage.setItem('darMateUser', JSON.stringify(this.currentUser));
      this.showToast("✅ Configuration saved.");
    },

    initializeData() {
      this.fetchListings(); this.fetchGlobalMessages(); this.fetchInboxContacts(); this.fetchHostBookings();
      this.socket = io("http://localhost:3000");
      this.socket.emit('register', this.currentUser.id);
      this.socket.on("receive_message", (msg) => { this.globalMessages.push(msg); this.scrollChat('global-scroll'); });
      this.socket.on("receive_private", (msg) => {
        if (this.activeChatUser && (msg.sender_id === this.activeChatUser.id || msg.receiver_id === this.activeChatUser.id)) { this.privateMessages.push(msg); this.scrollChat('private-scroll'); }
        else if (msg.sender_id !== this.currentUser.id) { this.fetchInboxContacts(); this.showToast(`New message received!`); }
      });
    },

    // --- Bookings ---
    async requestBooking(listingId) {
      await fetch("http://localhost:3000/api/bookings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ listing_id: listingId, client_id: this.currentUser.id }) });
      this.showToast("✅ Booking request sent to the host.");
      this.activeListing = null;
    },
    async fetchHostBookings() {
      if(this.currentUser.is_publisher !== 1) return;
      const res = await fetch(`http://localhost:3000/api/bookings/${this.currentUser.id}`);
      this.hostBookings = await res.json();
    },
    async updateBookingStatus(id, status) {
      await fetch(`http://localhost:3000/api/bookings/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
      this.fetchHostBookings();
      this.showToast(`Booking ${status}.`);
    },

    async fetchListings() { const response = await fetch(`http://localhost:3000/api/listings?userId=${this.currentUser.id}`); this.listings = await response.json(); },
    async submitListing() {
      await fetch("http://localhost:3000/api/listings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...this.form, owner_id: this.currentUser.id }) });
      this.form = { title: "", city: "", neighborhood: "", rent: "", description: "", image_url: "", amenities: [] }; this.fetchListings(); this.showToast("✅ Property live!");
    },
    async deleteListing(id) { await fetch(`http://localhost:3000/api/listings/${id}`, { method: "DELETE" }); this.fetchListings(); this.showToast("🗑️ Listing removed."); },
    async toggleFavorite(listing) {
      const newStatus = listing.is_favorited === 1 ? 0 : 1; listing.is_favorited = newStatus; 
      await fetch("http://localhost:3000/api/favorites", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ user_id: this.currentUser.id, listing_id: listing.id, is_favorited: newStatus }) });
      if (newStatus === 1) this.showToast("❤️ Saved to checklist.");
    },
    
    openListing(listing) { this.activeListing = listing; },
    contactHost(listing) {
      this.activeChatUser = { id: listing.owner_id, name: listing.owner_name }; this.activeListing = null; this.changeTab('inbox'); this.fetchPrivateMessages();
      if (!this.inboxContacts.find(c => c.id === listing.owner_id)) this.inboxContacts.unshift(this.activeChatUser);
    },

    async fetchGlobalMessages() { const response = await fetch("http://localhost:3000/api/messages"); this.globalMessages = await response.json(); this.scrollChat('global-scroll'); },
    sendGlobalMessage() { if (this.newGlobalMessage.trim() !== "") { this.socket.emit("send_message", { user: this.currentUser.name, text: this.newGlobalMessage }); this.newGlobalMessage = ""; } },

    async fetchInboxContacts() { const response = await fetch(`http://localhost:3000/api/inbox/${this.currentUser.id}`); this.inboxContacts = await response.json(); },
    selectContact(contact) { this.activeChatUser = contact; this.fetchPrivateMessages(); },
    async fetchPrivateMessages() { if (!this.activeChatUser) return; const response = await fetch(`http://localhost:3000/api/private_messages/${this.currentUser.id}/${this.activeChatUser.id}`); this.privateMessages = await response.json(); this.scrollChat('private-scroll'); },
    sendPrivateMessage() { if (this.newPrivateMessage.trim() !== "" && this.activeChatUser) { this.socket.emit("send_private", { sender_id: this.currentUser.id, receiver_id: this.activeChatUser.id, text: this.newPrivateMessage }); this.newPrivateMessage = ""; } },
    scrollChat(containerId) { setTimeout(() => { const el = document.getElementById(containerId); if (el) el.scrollTop = el.scrollHeight; }, 50); }
  }
};
</script>

<style>
/* ==========================================================================
   THEME VARIABLES & CSS RESET
   ========================================================================== */
:root {
  --bg-main: #f8fafc; --bg-panel: rgba(255, 255, 255, 0.75); --bg-panel-solid: #ffffff;
  --bg-input: rgba(255, 255, 255, 0.9); --text-primary: #0f172a; --text-secondary: #475569;
  --border-color: rgba(15, 23, 42, 0.08);
  --accent-1: #6366f1; --accent-2: #ec4899; --danger: #ef4444; --success: #10b981;
}

.dark-theme {
  --bg-main: #020617; --bg-panel: rgba(15, 23, 42, 0.7); --bg-panel-solid: #0f172a;
  --bg-input: rgba(30, 41, 59, 0.6); --text-primary: #f8fafc; --text-secondary: #94a3b8;
  --border-color: rgba(255, 255, 255, 0.1);
}

* { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Inter', system-ui, sans-serif; }
body { background: var(--bg-main); color: var(--text-primary); height: 100vh; overflow: hidden; transition: 0.4s ease; }
.app-wrapper { height: 100vh; position: relative; z-index: 1;}
.mt-2 { margin-top: 10px; } .mt-3 { margin-top: 20px; } .mt-4 { margin-top: 30px; } .mt-5 { margin-top: 40px; } .mb-5 { margin-bottom: 40px; }
.no-scroll { overflow: hidden !important; }
.p-4 { padding: 20px; } .border-b { border-bottom: 1px solid var(--border-color); }

/* ==========================================================================
   AURORA ANIMATED BACKGROUND
   ========================================================================== */
.aurora-bg { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: -1; overflow: hidden; background: var(--bg-main); transition: 0.4s ease;}
.aurora-1, .aurora-2, .aurora-3, .aurora-4 { position: absolute; filter: blur(100px); opacity: 0.5; border-radius: 50%; animation: floatAurora 20s infinite alternate linear; }
.aurora-1 { top: -20%; left: -10%; width: 50vw; height: 50vw; background: var(--accent-1); animation-delay: 0s; }
.aurora-2 { bottom: -20%; right: -10%; width: 60vw; height: 60vw; background: var(--accent-2); animation-delay: -5s; }
.aurora-3 { top: 40%; left: 40%; width: 40vw; height: 40vw; background: #8b5cf6; animation-delay: -10s; }
.aurora-4 { bottom: 10%; left: -20%; width: 45vw; height: 45vw; background: #06b6d4; animation-delay: -15s; }
@keyframes floatAurora { 0% { transform: translate(0, 0) scale(1); } 100% { transform: translate(10vw, 10vh) scale(1.3); } }

/* ==========================================================================
   GLASSMORPHISM & EFFECTS
   ========================================================================== */
.glass-panel { background: var(--bg-panel); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); border: 1px solid var(--border-color); border-radius: 24px; }
.glass-panel-light { background: rgba(127, 127, 127, 0.05); border-radius: 16px; padding: 15px; border: 1px solid var(--border-color); }
.glass-btn { background: var(--bg-input); border: 1px solid var(--border-color); transition: all 0.2s; }
.glass-btn:hover { background: rgba(127, 127, 127, 0.1); border-color: var(--accent-1); }

.aurora-border { position: relative; }
.aurora-border::before { content:""; position:absolute; inset: -2px; border-radius: inherit; background: linear-gradient(135deg, var(--accent-1), var(--accent-2)); z-index:-1; opacity:0.3; filter: blur(5px); transition: 0.3s;}

.gradient-text { background: linear-gradient(135deg, var(--accent-1), var(--accent-2)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.gradient-bg { background: linear-gradient(135deg, var(--accent-1), var(--accent-2)); color: white; }
.glow-effect { box-shadow: 0 4px 20px rgba(99, 102, 241, 0.5); transition: 0.3s; }
.glow-effect:hover { box-shadow: 0 8px 30px rgba(236, 72, 153, 0.6); transform: translateY(-3px); }
.glow-shadow { box-shadow: 0 10px 40px rgba(0,0,0,0.1); }

.fade-in { animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
.slide-up { animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
.slide-up-fast { animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
.slide-left { animation: slideLeft 0.3s ease; }
.slide-right { animation: slideRight 0.3s ease; }
.hover-lift { transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s; }
.hover-lift:hover { transform: translateY(-8px); box-shadow: 0 25px 50px rgba(0,0,0,0.15); }
.pulse { animation: pulse 2s infinite; }
.bounce { animation: bounce 2s infinite; display: inline-block; }

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideUp { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
@keyframes slideLeft { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
@keyframes slideRight { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
@keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.8); } 70% { box-shadow: 0 0 0 10px rgba(99, 102, 241, 0); } 100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0); } }
@keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }

.toast { position: fixed; top: 20px; left: 50%; transform: translateX(-50%) translateY(-20px); background: var(--bg-panel-solid); color: var(--text-primary); border: 1px solid var(--border-color); padding: 14px 28px; border-radius: 30px; font-weight: 800; opacity: 0; visibility: hidden; transition: 0.3s; z-index: 9999; box-shadow: 0 10px 30px rgba(0,0,0,0.2); }
.toast-visible { opacity: 1; visibility: visible; transform: translateX(-50%) translateY(0); }

/* ==========================================================================
   INPUTS, BUTTONS & FORMS
   ========================================================================== */
input, textarea { width: 100%; padding: 18px 24px; border: 1px solid var(--border-color); border-radius: 16px; font-size: 1.05rem; outline: none; transition: 0.3s; background: var(--bg-input); color: var(--text-primary); font-weight: 500; box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);}
input:focus, textarea:focus { border-color: var(--accent-1); box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.2); background: var(--bg-panel-solid); }
.input-group { position: relative; display: flex; align-items: center; }
.input-icon { position: absolute; left: 18px; font-size: 1.3rem; }
.input-group input { padding-left: 55px; }
.input-suffix { position: absolute; right: 18px; font-weight: 800; color: var(--text-secondary); }

.custom-slider { -webkit-appearance: none; width: 100%; height: 8px; border-radius: 5px; background: var(--border-color); outline: none; padding: 0; }
.custom-slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 24px; height: 24px; border-radius: 50%; background: var(--accent-1); cursor: pointer; box-shadow: 0 0 15px rgba(99, 102, 241, 0.6); border: 3px solid white;}

.btn { padding: 18px 26px; border: none; border-radius: 16px; font-weight: 800; cursor: pointer; transition: 0.3s; font-size: 1.1rem; text-align: center; }
.small-btn { padding: 8px 16px; font-size: 0.9rem; border-radius: 8px;}
.primary { background: linear-gradient(135deg, var(--accent-1), var(--accent-2)); color: white; border: none; }
.outline { background: transparent; border: 2px solid var(--border-color); color: var(--text-primary); }
.outline:hover { border-color: var(--text-primary); background: var(--bg-input);}
.danger-outline { background: transparent; color: var(--danger); border: 2px solid rgba(239, 68, 68, 0.2); }
.danger-outline:hover { background: rgba(239, 68, 68, 0.1); border-color: var(--danger); }
.super-danger { background: rgba(239, 68, 68, 0.1); color: var(--danger); border: 1px solid rgba(239, 68, 68, 0.2); transition: 0.3s; }
.super-danger:hover { background: var(--danger); color: white; box-shadow: 0 4px 15px rgba(239, 68, 68, 0.4); }
.success-btn { background: var(--success); color: white; border:none; }
.full-width { width: 100%; }

.checkbox-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px; }
.check-btn-small { display: flex; align-items: center; gap: 10px; padding: 14px 18px; border-radius: 14px; cursor: pointer; font-weight: 700;}
.check-btn-small input { width: 18px; height: 18px; accent-color: var(--accent-1); }
.check-btn { display: flex; align-items: center; gap: 14px; padding: 22px; border-radius: 18px; cursor: pointer; }
.check-btn input[type="checkbox"] { width: 24px; height: 24px; accent-color: var(--accent-1); margin: 0;}
.check-btn input:checked + span { font-weight: 900; color: var(--accent-1); }

/* ==========================================================================
   LAYOUT & SIDEBAR
   ========================================================================== */
.app-layout { display: flex; height: 100vh; }
.sidebar { width: 330px; height: 100vh; display: flex; flex-direction: column; padding: 35px 25px; z-index: 10; border-right: 1px solid var(--border-color); border-radius: 0; overflow-y: auto; }
.sidebar::-webkit-scrollbar { wirth: 0px; background: transparent; }
.sidebar-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 45px; padding-left: 5px; }
.sidebar-brand { font-size: 2.4rem; font-weight: 900; letter-spacing: -1.5px; }
.theme-toggle { background: var(--bg-input); border: 1px solid var(--border-color); width: 48px; height: 48px; border-radius: 50%; font-size: 1.4rem; cursor: pointer; transition: 0.3s; display: flex; align-items: center; justify-content: center;}
.theme-toggle:hover { transform: rotate(15deg) scale(1.1); box-shadow: 0 4px 12px rgba(0,0,0,0.1);}

.main-content { flex: 1; padding: 45px; overflow-y: auto; position: relative; }
.tab-content { max-width: 1500px; margin: 0 auto; }

.nav-menu { display: flex; flex-direction: column; gap: 8px; flex: 1; }
.nav-label { font-size: 0.75rem; font-weight: 900; color: var(--text-secondary); margin-bottom: 12px; padding-left: 15px; letter-spacing: 2px; opacity: 0.8;}
.nav-btn { text-align: left; padding: 18px 20px; border: none; background: transparent; border-radius: 16px; font-size: 1.15rem; color: var(--text-secondary); cursor: pointer; font-weight: 800; display: flex; justify-content: space-between; align-items: center; transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);}
.nav-icon { margin-right: 14px; font-size: 1.4rem; }
.nav-btn:hover { background: var(--bg-input); color: var(--text-primary); transform: translateX(8px); }
.nav-btn.active { background: var(--bg-panel-solid); color: var(--accent-1); box-shadow: 0 8px 20px rgba(0,0,0,0.05); border: 1px solid var(--border-color);}
.badge { background: var(--accent-2); color: white; font-size: 0.85rem; padding: 4px 12px; border-radius: 14px; font-weight: 900;}
.sidebar-footer { padding-top: 20px; display: flex; flex-direction: column; gap: 15px;}

/* ==========================================================================
   BENTO GRID LISTINGS (BROWSE TAB)
   ========================================================================== */
.hero-title { font-size: 3rem; font-weight: 900; letter-spacing: -2px; margin: 0; color: var(--text-primary);}
.header-bar { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 30px; flex-wrap: wrap; gap: 20px;}
.advanced-filters { display: flex; gap: 20px; align-items: center; }
.search-bar-group { width: 400px; }
.search-bar-group input { border-radius: 30px; }
.price-slider-group { display: flex; flex-direction: column; min-width: 250px; padding: 15px 25px;}
.price-slider-group label { font-size: 1rem; color: var(--text-secondary); margin-bottom: 10px; font-weight: 700;}

.quick-filters { display: flex; gap: 12px; margin-bottom: 40px; overflow-x: auto; padding-bottom: 15px;}
.chip { padding: 12px 24px; border-radius: 25px; color: var(--text-primary); font-weight: 800; cursor: pointer; transition: 0.2s; white-space: nowrap; font-size: 1.05rem;}
.chip:hover { background: var(--text-primary); color: var(--bg-panel-solid); border-color: var(--text-primary); transform: translateY(-2px);}

.listings-grid-bento { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 35px; }
.bento-card { display: flex; flex-direction: column; cursor: pointer; position: relative; padding: 18px; transition: 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
.card-img-wrapper { aspect-ratio: 4 / 3; overflow: hidden; border-radius: 20px; margin-bottom: 20px; position: relative; background: var(--border-color);}
.card-img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
.bento-card:hover .card-img { transform: scale(1.1); }
.price-pill { position: absolute; bottom: 15px; left: 15px; background: rgba(0,0,0,0.8); backdrop-filter: blur(12px); color: white; font-weight: 900; padding: 10px 20px; border-radius: 16px; font-size: 1.3rem; }

.favorite-btn { position: absolute; top: 25px; right: 25px; background: rgba(255,255,255,0.25); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.4); font-size: 1.4rem; cursor: pointer; z-index: 5; border-radius: 50%; width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; transition: 0.2s;}
.favorite-btn:hover { transform: scale(1.15); background: rgba(255,255,255,1);}
.heart-active { color: var(--accent-2); text-shadow: 0 0 15px rgba(236, 72, 153, 0.6); }

.card-info { padding: 0 10px 10px; }
.card-location { font-weight: 900; font-size: 1.3rem; color: var(--text-primary); display: flex; align-items: center; gap: 6px; letter-spacing: -0.5px;}
.card-title { font-size: 1.1rem; color: var(--text-secondary); margin: 8px 0 15px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 600;}
.card-amenities-preview { display: flex; gap: 8px; flex-wrap: wrap; }
.tiny-chip { font-size: 0.85rem; padding: 6px 12px; border-radius: 12px; font-weight: 800; color: var(--text-secondary); }

/* ==========================================================================
   LISTING MODAL (OVERLAY)
   ========================================================================== */
.listing-modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(20px); z-index: 100; overflow-y: auto; padding: 40px; display: flex; align-items: center; justify-content: center;}
.listing-modal { width: 100%; max-width: 1300px; background: var(--bg-panel-solid); border-radius: 40px; overflow: hidden; border: 1px solid var(--border-color); box-shadow: 0 40px 80px -20px rgba(0, 0, 0, 0.4); position: relative; max-height: 90vh; overflow-y: auto;}
.close-modal-btn { position: absolute; top: 30px; left: 30px; padding: 16px 28px; border-radius: 25px; font-weight: 900; z-index: 101; background: rgba(0,0,0,0.6); color: white; border: 1px solid rgba(255,255,255,0.3); backdrop-filter: blur(12px);}
.close-modal-btn:hover { background: white; color: black; }
.modal-hero { width: 100%; height: 55vh; position: relative; }
.modal-hero img { width: 100%; height: 100%; object-fit: cover; }
.hero-gradient { position: absolute; inset: 0; background: linear-gradient(to top, var(--bg-panel-solid) 0%, transparent 70%); }

.modal-body { padding: 60px; position: relative; z-index: 2; margin-top: -100px;}
.modal-header-info h1 { font-size: 4rem; font-weight: 900; margin-bottom: 15px; line-height: 1.1; letter-spacing: -2.5px;}
.modal-location { font-size: 1.5rem; font-weight: 900; color: var(--accent-1); margin-bottom: 50px; }

.modal-grid { display: grid; grid-template-columns: 2fr 1.2fr; gap: 80px; }
.host-section { padding: 35px; margin-bottom: 40px; border-radius: 28px; }
.host-header { display: flex; align-items: center; gap: 30px; }
.host-bio { color: var(--text-secondary); margin-top: 10px; line-height: 1.6; font-size: 1.15rem;}

.description-section h3, .amenities-section h3 { font-size: 2rem; margin-bottom: 25px; font-weight: 900; letter-spacing: -1px;}
.description-section p { font-size: 1.25rem; line-height: 1.8; color: var(--text-primary); white-space: pre-wrap; font-weight: 500;}
.amenities-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
.amenity-item { font-size: 1.2rem; font-weight: 800; display: flex; align-items: center; gap: 15px; padding: 18px; border-radius: 20px; border: 1px solid var(--border-color);}

.booking-card { position: sticky; top: 40px; padding: 50px; border-radius: 32px; text-align: center; border: 1px solid var(--border-color); background: var(--bg-panel-solid);}
.booking-price { font-size: 3.2rem; margin-bottom: 30px; letter-spacing: -2px; font-weight: 900;}
.booking-price span { font-size: 1.3rem; font-weight: 700; color: var(--text-secondary); }
.booking-disclaimer { color: var(--text-secondary); font-size: 1.1rem; margin-top: 30px; font-weight: 600;}

/* Booking Row for Hosts */
.booking-request-row { display: flex; justify-content: space-between; align-items: center; padding: 20px; border-bottom: 1px solid var(--border-color); font-size: 1.1rem;}
.status-badge { padding: 6px 12px; border-radius: 12px; font-size: 0.85rem; font-weight: bold; margin-left: 10px;}
.status-badge.pending { background: #fef08a; color: #854d0e; }
.status-badge.approved { background: #dcfce7; color: #166534; }
.status-badge.rejected { background: #fee2e2; color: #991b1b; }
.action-btns { display: flex; gap: 10px; }

/* ==========================================================================
   INBOX & CHAT SYSTEM
   ========================================================================== */
.inbox-layout { height: calc(100vh - 150px); display: flex; flex-direction: column;}
.inbox-container { flex: 1; display: flex; padding: 0; overflow: hidden; border-radius: 32px; border: 1px solid var(--border-color); }

.inbox-sidebar { width: 400px; border-right: 1px solid var(--border-color); display: flex; flex-direction: column;}
.inbox-header { padding: 40px 35px; font-size: 2rem; font-weight: 900; border-bottom: 1px solid var(--border-color); letter-spacing: -1px;}
.contact-item { display: flex; align-items: center; gap: 20px; padding: 25px 35px; cursor: pointer; border-bottom: 1px solid var(--border-color); transition: 0.2s;}
.contact-item:hover { background: var(--bg-input); }
.active-contact { background: var(--bg-panel-solid); border-left: 8px solid var(--accent-1); }
.contact-name { font-weight: 900; font-size: 1.25rem; }

.inbox-chat { flex: 1; display: flex; flex-direction: column; background: var(--bg-panel-solid);}
.inbox-chat-empty { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--text-secondary); font-size: 1.4rem; background: var(--bg-panel-solid); font-weight: 700;}
.inbox-chat-empty .emoji { font-size: 6rem; margin-bottom: 30px; opacity: 0.6;}
.inbox-chat-header { padding: 40px 35px; font-size: 1.6rem; border-bottom: 1px solid var(--border-color); font-weight: 900;}
.private-chat-window { flex: 1; overflow-y: auto; padding: 40px 35px; display: flex; flex-direction: column; gap: 25px; }
.private-chat-inputs { display: flex; gap: 20px; padding: 35px; border-top: 1px solid var(--border-color); border-radius: 0;}

.chat-row { display: flex; flex-direction: column; max-width: 75%; }
.my-message { align-self: flex-end; align-items: flex-end; }
.other-message { align-self: flex-start; align-items: flex-start; }
.chat-bubble { padding: 20px 28px; border-radius: 28px; font-size: 1.15rem; line-height: 1.6; font-weight: 600;}
.my-message .chat-bubble { background: linear-gradient(135deg, var(--accent-1), var(--accent-2)); color: white; border-bottom-right-radius: 8px; box-shadow: 0 10px 25px rgba(99, 102, 241, 0.3);}
.other-message .chat-bubble { background: var(--bg-input); color: var(--text-primary); border: 1px solid var(--border-color); border-bottom-left-radius: 8px; }

.chat-window { flex: 1; overflow-y: auto; padding: 40px; display: flex; flex-direction: column; gap: 30px; margin-bottom: 25px; height: 60vh; border-radius: 32px;}
.chat-meta { font-size: 1rem; color: var(--text-secondary); margin-bottom: 12px; padding-left: 65px; font-weight: 900;}
.chat-bubble-wrapper { display: flex; align-items: flex-end; gap: 15px;}
.chat-inputs { display: flex; gap: 20px; padding: 30px; border-radius: 28px;}
.send-btn { border-radius: 20px; padding: 18px 35px; }

/* ==========================================================================
   FORMS, AVATARS & PROFILE
   ========================================================================== */
.add-form { padding: 50px; border-radius: 36px;}
.form-row-2 { display: grid; grid-template-columns: 2fr 1fr; gap: 30px; }
.form-row-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 30px; }

.avatar-small { width: 55px; height: 55px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 1.3rem; box-shadow: 0 4px 15px rgba(0,0,0,0.1);}
.avatar-tiny { width: 45px; height: 45px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 1rem;}
.avatar-large { width: 100px; height: 100px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 2.5rem; box-shadow: 0 10px 30px rgba(99, 102, 241, 0.4);}
.status-dot { display: inline-flex; align-items: center; gap: 8px; font-size: 0.95rem; color: var(--success); font-weight: 800;}
.status-dot::before { content: ""; width: 14px; height: 14px; background: var(--success); border-radius: 50%; box-shadow: 0 0 15px var(--success);}
.user-profile-badge { display: flex; align-items: center; gap: 20px; margin-bottom: 0; padding: 20px; border-radius: 20px;}

.profile-card { max-width: 850px; padding: 60px; border-radius: 36px;}
.profile-header { display: flex; align-items: center; gap: 35px; margin-bottom: 50px; padding-bottom: 40px; border-bottom: 1px solid var(--border-color);}
.profile-form { display: flex; flex-direction: column; gap: 35px; }
.form-group label { font-weight: 900; color: var(--text-primary); margin-bottom: 15px; display: block; font-size: 1.2rem;}
.permissions-title { font-weight: 900; color: var(--text-primary); font-size: 1.4rem; margin-bottom: 10px;}

/* ==========================================================================
   LOGIN OVERLAY (AUTH TABS)
   ========================================================================== */
.login-overlay { 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  min-height: 100vh; 
  position: relative;
  padding: 20px;
}

.login-glass-box { 
  background: rgba(255, 255, 255, 0.15); 
  backdrop-filter: blur(40px); 
  -webkit-backdrop-filter: blur(40px); 
  text-align: center; 
  max-width: 600px; 
  width: 100%; 
  padding: 40px 30px; /* Reduced from 70px to fit laptop screens better */
  border-radius: 32px; 
  border: 1px solid rgba(255,255,255,0.25); 
  position: relative; 
  z-index: 2; 
  box-shadow: 0 40px 80px rgba(0,0,0,0.3);
  max-height: 90vh; /* Forces it to stay inside the screen */
  overflow-y: auto; /* Adds a scrollbar inside the box if needed */
}

/* Hide the ugly default scrollbar inside the glass box for a cleaner look */
.login-glass-box::-webkit-scrollbar { width: 0px; background: transparent; }

.dark-theme .login-glass-box { background: rgba(15, 23, 42, 0.5); border-color: rgba(255,255,255,0.08); }
.login-glass-box .logo-large { font-size: 3.5rem; margin-bottom: 10px; letter-spacing: -2px;}
.login-glass-box .subtitle { margin-bottom: 30px; color: var(--text-primary); font-size: 1.2rem; font-weight: 800;}

.auth-tabs { display: flex; gap: 10px; background: rgba(0,0,0,0.1); padding: 8px; border-radius: 20px; margin-bottom: 30px;}
.auth-tab { flex: 1; padding: 15px; border: none; background: transparent; color: var(--text-primary); font-weight: 800; font-size: 1.1rem; border-radius: 14px; cursor: pointer; transition: 0.3s;}
.auth-tab.active { background: white; box-shadow: 0 4px 15px rgba(0,0,0,0.1); color: var(--accent-1);}
.dark-theme .auth-tab.active { background: var(--bg-panel-solid); }

.role-selector { display: flex; flex-direction: column; gap: 20px; margin: 35px 0; text-align: left; }
</style>
