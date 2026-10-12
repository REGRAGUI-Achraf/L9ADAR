<template>
  <div class="app-wrapper">
    
    <!-- TOAST NOTIFICATION -->
    <div class="toast" :class="{ 'toast-visible': toastMsg !== '' }">{{ toastMsg }}</div>

    <!-- 1. LOGIN SCREEN -->
    <div v-if="!currentUser" class="login-overlay">
      <div class="login-box card shadow-lg">
        <div class="logo-large">DarMate</div>
        <p class="subtitle">The Next-Gen 1337 Housing Network</p>
        
        <form @submit.prevent="loginUser" class="login-form">
          <input v-model="loginName" type="text" placeholder="Username (e.g., Nemo)" required />
          <div class="role-selector">
            <label class="check-btn">
              <input type="checkbox" v-model="loginIsClient" />
              <span>🔍 Looking for a room</span>
            </label>
            <label class="check-btn">
              <input type="checkbox" v-model="loginIsPublisher" />
              <span>🏠 Have a room to rent</span>
            </label>
          </div>
          <button type="submit" class="btn primary full-width">Enter Platform</button>
        </form>
      </div>
    </div>

    <!-- 2. MAIN APPLICATION -->
    <div v-else class="app-layout">
      
      <!-- SIDEBAR -->
      <aside class="sidebar shadow-md">
        <div class="sidebar-brand">DarMate</div>
        <div class="nav-menu">
          
          <p class="nav-label" v-if="currentUser.is_client === 1">CLIENT TOOLS</p>
          <button v-if="currentUser.is_client === 1" @click="changeTab('browse')" :class="['nav-btn', currentTab === 'browse' ? 'active' : '']">🔍 Explore Housing</button>
          <button v-if="currentUser.is_client === 1" @click="changeTab('saved')" :class="['nav-btn', currentTab === 'saved' ? 'active' : '']">❤️ Saved Homes</button>
          
          <p class="nav-label mt-3" v-if="currentUser.is_publisher === 1">HOST TOOLS</p>
          <button v-if="currentUser.is_publisher === 1" @click="changeTab('manage')" :class="['nav-btn', currentTab === 'manage' ? 'active' : '']">🏠 Manage Listings</button>

          <p class="nav-label mt-3">COMMUNITY</p>
          <button @click="changeTab('inbox')" :class="['nav-btn', currentTab === 'inbox' ? 'active' : '']">
            📬 Direct Inbox
            <span class="badge" v-if="inboxContacts.length > 0">{{ inboxContacts.length }}</span>
          </button>
          <button @click="changeTab('chat')" :class="['nav-btn', currentTab === 'chat' ? 'active' : '']">🌍 Global Lounge</button>
          <button @click="changeTab('profile')" :class="['nav-btn', currentTab === 'profile' ? 'active' : '']">👤 My Profile</button>
        </div>
        
        <div class="sidebar-footer">
          <div class="user-profile-badge">
            <div class="avatar-small">{{ getInitials(currentUser.name) }}</div>
            <div class="user-details">
              <strong>{{ currentUser.name }}</strong>
              <span class="status-dot">Online</span>
            </div>
          </div>
          <button @click="logout" class="btn outline full-width">Logout</button>
        </div>
      </aside>

      <!-- MAIN CONTENT -->
      <main class="main-content" :class="{ 'no-scroll': activeListing }">
        
        <!-- ========================================== -->
        <!-- TAB: BROWSE (AND SAVED) HOMES              -->
        <!-- ========================================== -->
        <div v-if="currentTab === 'browse' || currentTab === 'saved'" class="tab-content fade-in">
          <div class="header-bar">
            <h2>{{ currentTab === 'saved' ? 'Your Saved Homes Checklist' : 'Explore Properties' }}</h2>
            <input v-if="currentTab === 'browse'" v-model="searchQuery" type="text" class="search-bar" placeholder="Search cities..." />
          </div>

          <div class="listings-grid-airbnb">
            <div v-if="displayListings.length === 0" class="empty-state card">
              <span class="emoji">🏜️</span>
              <p>No properties found.</p>
            </div>
            
            <!-- AIRBNB STYLE CARD -->
            <div v-for="listing in displayListings" :key="listing.id" class="airbnb-card hover-lift">
              
              <!-- Heart Favorite Button -->
              <button class="favorite-btn" @click.stop="toggleFavorite(listing)">
                <span v-if="listing.is_favorited === 1" class="heart-active">❤️</span>
                <span v-else class="heart-inactive">🤍</span>
              </button>

              <!-- Image & Click to open details -->
              <div class="card-img-wrapper" @click="openListing(listing)">
                <img :src="listing.image_url" class="card-img" />
              </div>
              
              <!-- Details -->
              <div class="card-info" @click="openListing(listing)">
                <div class="card-location">{{ listing.city }}, {{ listing.neighborhood }}</div>
                <div class="card-title">{{ listing.title }}</div>
                <div class="card-price"><strong>{{ listing.rent }} MAD</strong> / month</div>
              </div>
            </div>
          </div>
        </div>

        <!-- ========================================== -->
        <!-- LISTING DETAIL OVERLAY (MODAL)             -->
        <!-- ========================================== -->
        <div v-if="activeListing" class="listing-modal-overlay">
          <div class="listing-modal">
            <button class="close-modal-btn" @click="activeListing = null">✖ Close</button>
            
            <div class="modal-hero">
              <img :src="activeListing.image_url" />
            </div>
            
            <div class="modal-body">
              <div class="modal-header-info">
                <h1>{{ activeListing.title }}</h1>
                <div class="modal-location">📍 {{ activeListing.city }}, {{ activeListing.neighborhood }}</div>
              </div>
              
              <div class="modal-grid">
                <div class="modal-main-col">
                  <!-- Host Info -->
                  <div class="host-section card shadow-sm">
                    <div class="host-header">
                      <div class="avatar-large">{{ getInitials(activeListing.owner_name) }}</div>
                      <div>
                        <h3>Hosted by {{ activeListing.owner_name }}</h3>
                        <p class="host-bio" v-if="activeListing.owner_bio">{{ activeListing.owner_bio }}</p>
                        <p class="host-bio" v-else>Joined DarMate recently.</p>
                      </div>
                    </div>
                  </div>

                  <!-- Description -->
                  <div class="description-section">
                    <h3>About this space</h3>
                    <p>{{ activeListing.description }}</p>
                  </div>

                  <!-- Amenities Checklist Display -->
                  <div class="amenities-section" v-if="activeListing.amenities && activeListing.amenities.length > 0">
                    <h3>What this place offers</h3>
                    <div class="amenities-grid">
                      <div class="amenity-item" v-for="amenity in activeListing.amenities" :key="amenity">
                        ✨ {{ amenity }}
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Floating Booking/Contact Box -->
                <div class="modal-side-col">
                  <div class="booking-card card shadow-lg">
                    <div class="booking-price"><strong>{{ activeListing.rent }} MAD</strong> <span>/ month</span></div>
                    
                    <!-- If looking at own listing -->
                    <button v-if="activeListing.owner_id === currentUser.id" class="btn outline full-width mt-3" disabled>
                      This is your listing
                    </button>
                    <!-- If looking at someone else's, message them! -->
                    <button v-else @click="contactHost(activeListing)" class="btn primary full-width mt-3">
                      💬 Message Host
                    </button>
                    <p class="booking-disclaimer">You won't be charged yet.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ========================================== -->
        <!-- TAB: MANAGE PROPERTIES (HOST DASHBOARD)    -->
        <!-- ========================================== -->
        <div v-if="currentTab === 'manage' && currentUser.is_publisher === 1" class="tab-content fade-in">
          <h2>Host Dashboard</h2>

          <form @submit.prevent="submitListing" class="card add-form shadow-sm">
            <h3>🏠 Create New Listing</h3>
            
            <div class="form-row-2">
              <input v-model="form.title" type="text" placeholder="Catchy Title (e.g., Sunny Agdal Studio)" required />
              <input v-model="form.image_url" type="url" placeholder="Image URL (Optional)" />
            </div>
            
            <div class="form-row-3 mt-2">
              <input v-model="form.city" type="text" placeholder="City" required />
              <input v-model="form.neighborhood" type="text" placeholder="Neighborhood" required />
              <input v-model="form.rent" type="number" placeholder="Rent (MAD)" required />
            </div>
            
            <textarea v-model="form.description" class="mt-2" placeholder="Describe the space..." rows="3" required></textarea>
            
            <!-- Amenities Interactive Checklist -->
            <div class="amenities-checklist mt-3">
              <p class="role-label">Amenities Checklist (Select all that apply):</p>
              <div class="checkbox-grid">
                <label v-for="item in availableAmenities" :key="item" class="check-btn-small">
                  <input type="checkbox" :value="item" v-model="form.amenities" />
                  <span>{{ item }}</span>
                </label>
              </div>
            </div>

            <div class="form-actions mt-3">
              <button type="submit" class="btn primary">Publish to DarMate</button>
            </div>
          </form>

          <h3 class="section-title">Your Active Properties</h3>
          <div class="listings-grid-airbnb">
            <div v-for="listing in publisherListings" :key="listing.id" class="airbnb-card">
              <div class="card-img-wrapper" @click="openListing(listing)"><img :src="listing.image_url" class="card-img" /></div>
              <div class="card-info">
                <div class="card-title">{{ listing.title }}</div>
                <button @click="deleteListing(listing.id)" class="btn danger-outline full-width mt-2">🗑️ Delete</button>
              </div>
            </div>
          </div>
        </div>

        <!-- ========================================== -->
        <!-- TAB: 1-ON-1 INBOX                          -->
        <!-- ========================================== -->
        <div v-if="currentTab === 'inbox'" class="tab-content fade-in inbox-layout">
          <h2>📬 Direct Messages</h2>
          <div class="inbox-container card shadow-sm">
            
            <!-- Left: Contact List -->
            <div class="inbox-sidebar">
              <div class="inbox-header">Conversations</div>
              <div v-if="inboxContacts.length === 0" class="empty-contacts">No messages yet.</div>
              <div v-for="contact in inboxContacts" :key="contact.id" 
                   @click="selectContact(contact)" 
                   :class="['contact-item', activeChatUser && activeChatUser.id === contact.id ? 'active-contact' : '']">
                <div class="avatar-small">{{ getInitials(contact.name) }}</div>
                <div class="contact-name">{{ contact.name }}</div>
              </div>
            </div>

            <!-- Right: Private Chat Window -->
            <div class="inbox-chat" v-if="activeChatUser">
              <div class="inbox-chat-header">
                <strong>Chatting with {{ activeChatUser.name }}</strong>
              </div>
              <div class="private-chat-window" id="private-scroll">
                <div v-for="(msg, index) in privateMessages" :key="index" 
                     :class="['chat-row', msg.sender_id === currentUser.id ? 'my-message' : 'other-message']">
                  <div class="chat-bubble">{{ msg.text }}</div>
                </div>
              </div>
              <form @submit.prevent="sendPrivateMessage" class="private-chat-inputs">
                <input type="text" v-model="newPrivateMessage" placeholder="Type a private message..." required />
                <button type="submit" class="btn primary">Send</button>
              </form>
            </div>
            
            <!-- Right: Empty State -->
            <div class="inbox-chat-empty" v-else>
              Select a conversation to start chatting, or contact a host from their listing.
            </div>
          </div>
        </div>

        <!-- ========================================== -->
        <!-- TAB: GLOBAL LOUNGE                         -->
        <!-- ========================================== -->
        <div v-if="currentTab === 'chat'" class="tab-content chat-layout fade-in">
          <h2>🌍 Global Roommate Lounge</h2>
          <div class="card chat-window shadow-sm" id="global-scroll">
            <div v-if="globalMessages.length === 0" class="empty-state"><p>Lounge is empty. Say hello!</p></div>
            <div v-for="(msg, index) in globalMessages" :key="index" 
                 :class="['chat-row', msg.sender_name === currentUser.name ? 'my-message' : 'other-message']">
              <div class="chat-meta" v-if="msg.sender_name !== currentUser.name">{{ msg.sender_name }}</div>
              <div class="chat-bubble-wrapper">
                <div v-if="msg.sender_name !== currentUser.name" class="avatar-tiny">{{ getInitials(msg.sender_name) }}</div>
                <div class="chat-bubble">{{ msg.text }}</div>
              </div>
            </div>
          </div>
          <form @submit.prevent="sendGlobalMessage" class="chat-inputs card shadow-sm">
            <input type="text" v-model="newGlobalMessage" placeholder="Say hello to everyone..." required />
            <button type="submit" class="btn primary send-btn">Send 🚀</button>
          </form>
        </div>

        <!-- ========================================== -->
        <!-- TAB: PROFILE                               -->
        <!-- ========================================== -->
        <div v-if="currentTab === 'profile'" class="tab-content fade-in">
          <h2>Profile Settings</h2>
          <div class="card profile-card shadow-sm">
            <div class="profile-header">
              <div class="avatar-large">{{ getInitials(currentUser.name) }}</div>
              <div>
                <h3 class="city-title">{{ currentUser.name }}</h3>
                <span class="status-dot">Active Account</span>
              </div>
            </div>
            <form @submit.prevent="updateProfile" class="profile-form">
              <div class="form-group">
                <label>Phone Number</label>
                <input v-model="currentUser.phone" type="text" />
              </div>
              <div class="form-group">
                <label>About Me</label>
                <textarea v-model="currentUser.bio" rows="3"></textarea>
              </div>
              <div class="permissions-box">
                <label class="permissions-title">Platform Capabilities</label>
                <label class="check-btn"><input type="checkbox" v-model="profileIsClient" /><span>🔍 Enable "Find Housing" Dashboard</span></label>
                <label class="check-btn"><input type="checkbox" v-model="profileIsPublisher" /><span>🏠 Enable "Manage Properties" Dashboard</span></label>
              </div>
              <button type="submit" class="btn primary">Save Changes</button>
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
      loginName: "",
      loginIsClient: true,
      loginIsPublisher: false,
      profileIsClient: true,
      profileIsPublisher: false,
      
      // Listings & Favorites
      searchQuery: "",
      listings: [],
      activeListing: null, // Controls the Modal Overlay
      availableAmenities: ['WiFi', 'Air Conditioning', 'Kitchen', 'Free Parking', 'Washing Machine', 'Dedicated Workspace', 'Pool', 'Balcony'],
      form: { title: "", city: "", neighborhood: "", rent: "", description: "", image_url: "", amenities: [] },
      
      // Global Chat
      globalMessages: [],
      newGlobalMessage: "",
      
      // Private Inbox
      inboxContacts: [],
      activeChatUser: null,
      privateMessages: [],
      newPrivateMessage: "",
      
      toastMsg: ""
    };
  },
  computed: {
    // Dynamically toggle between All search results vs just Saved results
    displayListings() {
      let source = this.listings;
      if (this.currentTab === 'saved') {
        source = this.listings.filter(l => l.is_favorited === 1);
      } else if (this.searchQuery) {
        const lowerQ = this.searchQuery.toLowerCase();
        source = this.listings.filter(l => 
          l.city.toLowerCase().includes(lowerQ) || l.neighborhood.toLowerCase().includes(lowerQ) || l.title.toLowerCase().includes(lowerQ)
        );
      }
      return source;
    },
    publisherListings() {
      return this.listings.filter(l => l.owner_id === this.currentUser.id);
    }
  },
  methods: {
    // --- UI Helpers ---
    showToast(message) { this.toastMsg = message; setTimeout(() => { this.toastMsg = ""; }, 3000); },
    getInitials(name) { return name ? name.substring(0, 2).toUpperCase() : "?"; },
    changeTab(tab) { 
      this.currentTab = tab; 
      this.activeListing = null; // Close modal if switching tabs
      if (tab === 'inbox') this.fetchInboxContacts();
    },

    // --- Authentication ---
    async loginUser() {
      if (!this.loginIsClient && !this.loginIsPublisher) return this.showToast("⚠️ Select at least one role.");
      const response = await fetch("http://localhost:3000/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: this.loginName, is_client: this.loginIsClient, is_publisher: this.loginIsPublisher })
      });
      this.currentUser = await response.json();
      this.profileIsClient = this.currentUser.is_client === 1;
      this.profileIsPublisher = this.currentUser.is_publisher === 1;
      
      this.currentTab = this.currentUser.is_client === 1 ? 'browse' : 'manage';
      this.initializeData();
      this.showToast(`Welcome, ${this.currentUser.name}!`);
    },
    logout() { this.currentUser = null; if (this.socket) this.socket.disconnect(); },
    async updateProfile() {
      await fetch(`http://localhost:3000/api/users/${this.currentUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: this.currentUser.phone, bio: this.currentUser.bio, is_client: this.profileIsClient, is_publisher: this.profileIsPublisher })
      });
      this.currentUser.is_client = this.profileIsClient ? 1 : 0;
      this.currentUser.is_publisher = this.profileIsPublisher ? 1 : 0;
      this.showToast("✅ Profile saved.");
    },

    // --- Data Initialization & Sockets ---
    initializeData() {
      this.fetchListings();
      this.fetchGlobalMessages();
      this.fetchInboxContacts();
      
      this.socket = io("http://localhost:3000");
      
      // Register for private messages
      this.socket.emit('register', this.currentUser.id);

      this.socket.on("receive_message", (msg) => {
        this.globalMessages.push(msg);
        this.scrollChat('global-scroll');
      });

      this.socket.on("receive_private", (msg) => {
        // If we are currently chatting with the person who sent this (or we sent it)
        if (this.activeChatUser && (msg.sender_id === this.activeChatUser.id || msg.receiver_id === this.activeChatUser.id)) {
          this.privateMessages.push(msg);
          this.scrollChat('private-scroll');
        } else if (msg.sender_id !== this.currentUser.id) {
          // Received a message from someone else, refresh contact list to show badge
          this.fetchInboxContacts();
          this.showToast(`New message from contact!`);
        }
      });
    },

    // --- Listings & Favorites ---
    async fetchListings() {
      const response = await fetch(`http://localhost:3000/api/listings?userId=${this.currentUser.id}`);
      this.listings = await response.json();
    },
    async submitListing() {
      await fetch("http://localhost:3000/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...this.form, owner_id: this.currentUser.id })
      });
      this.form = { title: "", city: "", neighborhood: "", rent: "", description: "", image_url: "", amenities: [] };
      this.fetchListings();
      this.showToast("✅ Property listed!");
    },
    async deleteListing(id) {
      await fetch(`http://localhost:3000/api/listings/${id}`, { method: "DELETE" });
      this.fetchListings();
      this.showToast("🗑️ Listing removed.");
    },
    async toggleFavorite(listing) {
      const newStatus = listing.is_favorited === 1 ? 0 : 1;
      // Optimistic UI update
      listing.is_favorited = newStatus; 
      await fetch("http://localhost:3000/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: this.currentUser.id, listing_id: listing.id, is_favorited: newStatus })
      });
      if (newStatus === 1) this.showToast("❤️ Saved to checklist!");
    },
    
    // --- Airbnb Modal & Contact ---
    openListing(listing) {
      this.activeListing = listing;
    },
    contactHost(listing) {
      // Setup active chat user based on host
      this.activeChatUser = { id: listing.owner_id, name: listing.owner_name };
      this.activeListing = null; // Close modal
      this.currentTab = 'inbox'; // Switch to inbox
      this.fetchPrivateMessages(); // Load history
      
      // Ensure host is in contacts list locally to avoid extra fetch delay
      if (!this.inboxContacts.find(c => c.id === listing.owner_id)) {
        this.inboxContacts.unshift(this.activeChatUser);
      }
    },

    // --- Global Chat ---
    async fetchGlobalMessages() {
      const response = await fetch("http://localhost:3000/api/messages");
      this.globalMessages = await response.json();
      this.scrollChat('global-scroll');
    },
    sendGlobalMessage() {
      if (this.newGlobalMessage.trim() !== "") {
        this.socket.emit("send_message", { user: this.currentUser.name, text: this.newGlobalMessage });
        this.newGlobalMessage = "";
      }
    },

    // --- Private Inbox ---
    async fetchInboxContacts() {
      const response = await fetch(`http://localhost:3000/api/inbox/${this.currentUser.id}`);
      this.inboxContacts = await response.json();
    },
    selectContact(contact) {
      this.activeChatUser = contact;
      this.fetchPrivateMessages();
    },
    async fetchPrivateMessages() {
      if (!this.activeChatUser) return;
      const response = await fetch(`http://localhost:3000/api/private_messages/${this.currentUser.id}/${this.activeChatUser.id}`);
      this.privateMessages = await response.json();
      this.scrollChat('private-scroll');
    },
    sendPrivateMessage() {
      if (this.newPrivateMessage.trim() !== "" && this.activeChatUser) {
        this.socket.emit("send_private", { 
          sender_id: this.currentUser.id, 
          receiver_id: this.activeChatUser.id, 
          text: this.newPrivateMessage 
        });
        this.newPrivateMessage = "";
      }
    },

    scrollChat(containerId) {
      setTimeout(() => {
        const el = document.getElementById(containerId);
        if (el) el.scrollTop = el.scrollHeight;
      }, 50);
    }
  }
};
</script>

<style>
/* --- CSS Variables & Reset --- */
:root {
  --primary: #ff385c; /* Airbnb Red for modern feel */
  --primary-hover: #e31c5f;
  --bg-color: #f7f7f9;
  --card-bg: #ffffff;
  --text-main: #222222;
  --text-muted: #717171;
  --border: #dddddd;
  --danger: #ef4444;
}
* { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Circular', -apple-system, sans-serif; }
body { background: var(--bg-color); color: var(--text-main); height: 100vh; overflow: hidden; }
.app-wrapper { height: 100vh; }
.mt-2 { margin-top: 10px; } .mt-3 { margin-top: 20px; }
.no-scroll { overflow: hidden !important; }

/* --- Animations & Utilities --- */
.fade-in { animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.hover-lift { transition: transform 0.2s, box-shadow 0.2s; }
.hover-lift:hover { transform: translateY(-4px); box-shadow: 0 12px 28px rgba(0,0,0,0.12); }
.shadow-sm { box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
.shadow-md { box-shadow: 4px 0 15px rgba(0,0,0,0.04); }
.shadow-lg { box-shadow: 0 16px 40px rgba(0,0,0,0.1); }

/* --- Toast --- */
.toast { position: fixed; top: 20px; left: 50%; transform: translateX(-50%) translateY(-20px); background: #222; color: white; padding: 12px 24px; border-radius: 30px; font-weight: 500; opacity: 0; visibility: hidden; transition: 0.3s; z-index: 9999; }
.toast-visible { opacity: 1; visibility: visible; transform: translateX(-50%) translateY(0); }

/* --- Inputs & Buttons --- */
input, textarea { width: 100%; padding: 14px 16px; border: 1px solid var(--border); border-radius: 12px; font-size: 1rem; outline: none; transition: 0.2s; background: white; }
input:focus, textarea:focus { border-color: var(--text-main); box-shadow: 0 0 0 2px rgba(34, 34, 34, 0.1); }
.btn { padding: 14px 24px; border: none; border-radius: 12px; font-weight: 600; cursor: pointer; transition: 0.2s; font-size: 1rem; text-align: center; }
.primary { background: var(--primary); color: white; }
.primary:hover { background: var(--primary-hover); }
.outline { background: transparent; border: 1px solid var(--text-main); color: var(--text-main); }
.outline:hover { background: #f7f7f7; }
.danger-outline { background: transparent; color: var(--danger); border: 1px solid #fca5a5; padding: 10px 16px; border-radius: 8px;}
.danger-outline:hover { background: #fef2f2; border-color: var(--danger); }
.full-width { width: 100%; }

/* --- Checkboxes & Forms --- */
.checkbox-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 10px; }
.check-btn-small { display: flex; align-items: center; gap: 8px; padding: 10px 14px; border: 1px solid var(--border); border-radius: 8px; cursor: pointer; background: white;}
.check-btn-small input { width: 16px; height: 16px; accent-color: var(--primary); }
.check-btn { display: flex; align-items: center; gap: 12px; padding: 16px; border: 1px solid var(--border); border-radius: 12px; cursor: pointer; transition: 0.2s; background: white;}
.check-btn:hover { border-color: var(--text-main); }
.check-btn input[type="checkbox"] { width: 20px; height: 20px; accent-color: var(--primary); margin: 0;}
.check-btn input:checked + span { font-weight: 600; color: var(--text-main); }

/* --- Layout --- */
.app-layout { display: flex; height: 100vh; }
.sidebar { width: 280px; height: 100vh; background: var(--card-bg); display: flex; flex-direction: column; padding: 30px 20px; z-index: 10; border-right: 1px solid var(--border);}
.sidebar-brand { font-size: 2rem; font-weight: 900; color: var(--primary); margin-bottom: 30px; padding-left: 10px; letter-spacing: -1px;}
.main-content { flex: 1; padding: 40px; overflow-y: auto; position: relative; }
.tab-content { max-width: 1200px; margin: 0 auto; }

/* --- Sidebar Navigation --- */
.nav-menu { display: flex; flex-direction: column; gap: 5px; flex: 1; }
.nav-label { font-size: 0.75rem; font-weight: 700; color: var(--text-muted); margin-bottom: 5px; padding-left: 10px; letter-spacing: 1px;}
.nav-btn { text-align: left; padding: 14px 15px; border: none; background: transparent; border-radius: 10px; font-size: 1.05rem; color: var(--text-muted); cursor: pointer; font-weight: 600; display: flex; justify-content: space-between; align-items: center;}
.nav-btn:hover { background: #f7f7f7; color: var(--text-main); }
.nav-btn.active { background: #fff1f3; color: var(--primary); }
.badge { background: var(--primary); color: white; font-size: 0.75rem; padding: 2px 8px; border-radius: 12px; }
.sidebar-footer { padding-top: 20px; }

/* --- Airbnb Style Listings Grid --- */
.header-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
.search-bar { width: 350px; border-radius: 30px; padding: 14px 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid var(--border);}
.listings-grid-airbnb { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 25px; }

.airbnb-card { display: flex; flex-direction: column; cursor: pointer; position: relative; }
.card-img-wrapper { aspect-ratio: 1 / 1; overflow: hidden; border-radius: 16px; margin-bottom: 12px; background: #e0e0e0;}
.card-img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s; }
.airbnb-card:hover .card-img { transform: scale(1.03); }
.favorite-btn { position: absolute; top: 15px; right: 15px; background: transparent; border: none; font-size: 1.5rem; cursor: pointer; z-index: 5; text-shadow: 0 2px 4px rgba(0,0,0,0.3);}
.heart-active { color: var(--primary); }
.heart-inactive { color: rgba(255,255,255,0.9); }

.card-info { padding: 0 4px; }
.card-location { font-weight: 600; font-size: 1rem; color: var(--text-main); }
.card-title { font-size: 0.95rem; color: var(--text-muted); margin: 4px 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.card-price { font-size: 1.05rem; color: var(--text-main); margin-top: 6px; }

/* --- Full Screen Listing Modal Overlay --- */
.listing-modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: white; z-index: 100; overflow-y: auto; padding-bottom: 100px; animation: fadeIn 0.2s;}
.close-modal-btn { position: absolute; top: 20px; left: 20px; padding: 10px 15px; background: rgba(255,255,255,0.9); border: none; border-radius: 8px; font-weight: bold; cursor: pointer; z-index: 101; box-shadow: 0 2px 10px rgba(0,0,0,0.1);}
.modal-hero { width: 100%; height: 50vh; overflow: hidden; background: #222;}
.modal-hero img { width: 100%; height: 100%; object-fit: cover; }
.modal-body { max-width: 1120px; margin: 0 auto; padding: 40px 20px; }
.modal-header-info h1 { font-size: 2.5rem; font-weight: 700; margin-bottom: 10px; line-height: 1.1; }
.modal-location { font-size: 1.2rem; font-weight: 600; text-decoration: underline; margin-bottom: 30px; }

.modal-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 80px; }
.host-section { display: flex; justify-content: space-between; align-items: center; padding-bottom: 30px; border-bottom: 1px solid var(--border); box-shadow: none; border-radius: 0; border: none; border-bottom: 1px solid var(--border); margin-bottom: 30px;}
.host-header { display: flex; align-items: center; gap: 20px; }
.host-bio { color: var(--text-muted); margin-top: 5px; }

.description-section h3, .amenities-section h3 { font-size: 1.4rem; margin-bottom: 20px; }
.description-section p { font-size: 1.1rem; line-height: 1.6; color: var(--text-main); white-space: pre-wrap;}
.amenities-section { margin-top: 40px; padding-top: 40px; border-top: 1px solid var(--border); }
.amenities-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.amenity-item { font-size: 1.1rem; color: var(--text-main); }

.booking-card { position: sticky; top: 40px; border-radius: 16px; border: 1px solid var(--border); padding: 30px; }
.booking-price { font-size: 1.8rem; margin-bottom: 20px; }
.booking-price span { font-size: 1.2rem; font-weight: 400; color: var(--text-muted); }
.booking-disclaimer { text-align: center; color: var(--text-muted); font-size: 0.9rem; margin-top: 15px; }

/* --- Inbox & Messaging System --- */
.inbox-layout { height: calc(100vh - 100px); display: flex; flex-direction: column;}
.inbox-container { flex: 1; display: flex; padding: 0; overflow: hidden; border: 1px solid var(--border); }

.inbox-sidebar { width: 320px; border-right: 1px solid var(--border); display: flex; flex-direction: column; background: white;}
.inbox-header { padding: 25px; font-size: 1.3rem; font-weight: 700; border-bottom: 1px solid var(--border); }
.contact-item { display: flex; align-items: center; gap: 15px; padding: 20px; cursor: pointer; border-bottom: 1px solid #f1f1f1; transition: 0.2s;}
.contact-item:hover { background: #f9f9f9; }
.active-contact { background: #f7f7f7; border-left: 4px solid var(--primary); }
.contact-name { font-weight: 600; font-size: 1.05rem; }

.inbox-chat { flex: 1; display: flex; flex-direction: column; background: var(--bg-color);}
.inbox-chat-empty { flex: 1; display: flex; align-items: center; justify-content: center; color: var(--text-muted); font-size: 1.1rem; background: var(--bg-color);}
.inbox-chat-header { padding: 25px; font-size: 1.1rem; border-bottom: 1px solid var(--border); background: white; }
.private-chat-window { flex: 1; overflow-y: auto; padding: 25px; display: flex; flex-direction: column; gap: 12px; }
.private-chat-inputs { display: flex; gap: 10px; padding: 20px; background: white; border-top: 1px solid var(--border); }

/* Chat Bubbles (Shared Global & Private) */
.chat-row { display: flex; flex-direction: column; max-width: 70%; }
.my-message { align-self: flex-end; align-items: flex-end; }
.other-message { align-self: flex-start; align-items: flex-start; }
.chat-bubble { padding: 14px 18px; border-radius: 20px; font-size: 1rem; line-height: 1.4; }
.my-message .chat-bubble { background: var(--primary); color: white; border-bottom-right-radius: 4px; }
.other-message .chat-bubble { background: #ebebeb; color: var(--text-main); border-bottom-left-radius: 4px; }

/* Global Lounge Specific */
.chat-window { flex: 1; overflow-y: auto; padding: 25px; display: flex; flex-direction: column; gap: 16px; margin-bottom: 15px;}
.chat-meta { font-size: 0.8rem; color: var(--text-muted); margin-bottom: 6px; padding-left: 40px; font-weight: 600;}
.chat-bubble-wrapper { display: flex; align-items: flex-end; }
.chat-inputs { display: flex; gap: 10px; padding: 15px; }

/* --- Forms & Avatars --- */
.card { background: var(--card-bg); border-radius: 16px; padding: 30px; border: 1px solid var(--border); }
.add-form { background: white; }
.form-row-2 { display: grid; grid-template-columns: 2fr 1fr; gap: 15px; }
.form-row-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; }

.avatar-small { width: 40px; height: 40px; border-radius: 50%; background: #222; color: white; display: flex; align-items: center; justify-content: center; font-weight: 700;}
.avatar-tiny { width: 30px; height: 30px; border-radius: 50%; background: #ddd; color: #555; display: flex; align-items: center; justify-content: center; font-weight: 700; margin-right: 10px;}
.avatar-large { width: 70px; height: 70px; border-radius: 50%; background: #222; color: white; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1.5rem;}
.status-dot { display: inline-flex; align-items: center; gap: 6px; font-size: 0.85rem; color: #10b981; font-weight: 600;}
.status-dot::before { content: ""; width: 8px; height: 8px; background: #10b981; border-radius: 50%; }
.user-profile-badge { display: flex; align-items: center; gap: 15px; padding: 15px; background: #f9f9f9; border-radius: 16px; margin-bottom: 15px; }

.login-overlay { display: flex; align-items: center; justify-content: center; height: 100vh; background: url('https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=2000&q=80') center/cover; }
.login-box { background: rgba(255,255,255,0.95); backdrop-filter: blur(10px); text-align: center; max-width: 450px; width: 90%; }
.logo-large { font-size: 2.5rem; font-weight: 900; color: var(--primary); letter-spacing: -1px; margin-bottom: 5px;}
.login-box .subtitle { margin-bottom: 30px; color: var(--text-muted); }
.role-selector { display: flex; flex-direction: column; gap: 12px; margin: 20px 0; text-align: left; }
</style>
