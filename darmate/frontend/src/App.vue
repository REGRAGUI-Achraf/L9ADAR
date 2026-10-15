<template>
  <div class="app-wrapper" :class="{ 'dark-theme': isDarkMode }">
    
    <!-- DARMATE EMERALD/AMBER AURORA -->
    <div class="aurora-bg">
      <div class="aurora-1"></div><div class="aurora-2"></div>
      <div class="aurora-3"></div><div class="aurora-4"></div>
    </div>

    <!-- TOAST NOTIFICATION -->
    <div class="toast" :class="{ 'toast-visible': toastMsg !== '' }">{{ toastMsg }}</div>

    <!-- ========================================== -->
    <!-- 1. AUTHENTICATION SCREEN                   -->
    <!-- ========================================== -->
    <div v-if="!currentUser" class="login-overlay">
      <div class="login-glass-box slide-up aurora-border">
        <div class="logo-large gradient-text">DarMate</div>
        <p class="subtitle">The Premier Moroccan Housing Network</p>
        
        <div class="auth-tabs">
          <button :class="['auth-tab', authMode === 'login' ? 'active' : '']" @click="authMode = 'login'">Sign In</button>
          <button :class="['auth-tab', authMode === 'register' ? 'active' : '']" @click="authMode = 'register'">Join DarMate</button>
        </div>

        <form @submit.prevent="authenticateUser" class="login-form mt-4">
          <div class="input-group">
            <span class="input-icon">👤</span><input v-model="authName" type="text" placeholder="Username" required />
          </div>
          <div class="input-group mt-3">
            <span class="input-icon">🔒</span><input v-model="authPassword" type="password" placeholder="Password" required />
          </div>
          
          <div class="role-selector" v-if="authMode === 'register'">
            <label class="check-btn glass-btn"><input type="checkbox" v-model="loginIsClient" /><span>🔍 Looking for a space</span></label>
            <label class="check-btn glass-btn"><input type="checkbox" v-model="loginIsPublisher" /><span>🏠 Hosting a space</span></label>
          </div>
          <button type="submit" class="btn primary full-width glow-effect mt-4">
            {{ authMode === 'login' ? 'Enter DarMate 🚀' : 'Create Account ✨' }}
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
          <button class="theme-toggle" @click="toggleTheme">{{ isDarkMode ? '☀️' : '🌙' }}</button>
        </div>

        <div class="nav-menu">
          <p class="nav-label" v-if="currentUser.is_client === 1">FIND HOUSING</p>
          <button v-if="currentUser.is_client === 1" @click="changeTab('browse')" :class="['nav-btn', currentTab === 'browse' ? 'active' : '']"><span class="nav-icon">✨</span> Discover</button>
          <button v-if="currentUser.is_client === 1" @click="changeTab('saved')" :class="['nav-btn', currentTab === 'saved' ? 'active' : '']"><span class="nav-icon">❤️</span> Shortlist</button>
          
          <p class="nav-label mt-3" v-if="currentUser.is_publisher === 1">HOSTING</p>
          <button v-if="currentUser.is_publisher === 1" @click="changeTab('manage')" :class="['nav-btn', currentTab === 'manage' ? 'active' : '']"><span class="nav-icon">🏠</span> Dashboard</button>

          <p class="nav-label mt-3">NETWORK</p>
          <button @click="changeTab('notifications')" :class="['nav-btn', currentTab === 'notifications' ? 'active' : '']">
            <span class="nav-icon">🔔</span> Alerts <span class="badge pulse" v-if="unreadNotifications > 0">{{ unreadNotifications }}</span>
          </button>
          <button @click="changeTab('inbox')" :class="['nav-btn', currentTab === 'inbox' ? 'active' : '']"><span class="nav-icon">📬</span> Inbox</button>
          <button @click="changeTab('chat')" :class="['nav-btn', currentTab === 'chat' ? 'active' : '']"><span class="nav-icon">🌍</span> Lounge</button>
          <button @click="changeTab('profile')" :class="['nav-btn', currentTab === 'profile' ? 'active' : '']"><span class="nav-icon">⚙️</span> Profile</button>
        </div>
        
        <div class="sidebar-footer">
          <div class="user-profile-badge glass-panel-light">
            <div class="avatar-small gradient-bg">{{ getInitials(currentUser.name) }}</div>
            <div class="user-details">
              <strong>{{ currentUser.name }}</strong>
              <div class="verified-badge">🛡️ Verified Identity</div>
            </div>
          </div>
          <button @click="logout" class="btn super-danger full-width"><span class="nav-icon">🚪</span> Sign Out</button>
        </div>
      </aside>

      <!-- MAIN CONTENT -->
      <main class="main-content" :class="{ 'no-scroll': activeListing }">
        
        <!-- BROWSE TAB -->
        <div v-if="currentTab === 'browse' || currentTab === 'saved'" class="tab-content fade-in">
          
          <!-- AIRBNB STYLE SEARCH PILL -->
          <div class="search-pill-container" v-if="currentTab === 'browse'">
            <div class="search-pill glass-panel shadow-lg">
              <div class="pill-section">
                <label>Where</label>
                <input v-model="filters.query" type="text" placeholder="City or Neighborhood" />
              </div>
              <div class="pill-divider"></div>
              <div class="pill-section">
                <label>Max Budget</label>
                <input type="number" v-model="filters.maxPrice" placeholder="MAD/mo" />
              </div>
              <div class="pill-divider"></div>
              <div class="pill-section">
                <label>Category</label>
                <select v-model="filters.category">
                  <option value="">All Types</option><option value="Shared Room">Shared Room</option>
                  <option value="Private Room">Private Room</option><option value="Entire Place">Entire Place</option>
                </select>
              </div>
              <button class="pill-btn primary glow-effect">🔍 Search</button>
            </div>
          </div>
          
          <h2 class="hero-title mt-4 mb-4">{{ currentTab === 'saved' ? 'Your Shortlist' : 'Trending on DarMate' }}</h2>

          <div class="listings-grid-bento">
            <div v-if="displayListings.length === 0" class="empty-state glass-panel shadow-sm"><span class="emoji bounce">🏜️</span><p>No properties match your filters.</p></div>
            
            <div v-for="listing in displayListings" :key="listing.id" class="bento-card hover-lift glass-panel">
              <button class="favorite-btn" @click.stop="toggleFavorite(listing)">
                <span v-if="listing.is_favorited === 1" class="heart-active glow">❤️</span><span v-else class="heart-inactive">🤍</span>
              </button>
              
              <div class="card-img-wrapper" @click="openListing(listing)">
                <div class="superhost-badge" v-if="listing.avg_rating >= 4.5">🏅 Superhost</div>
                <div class="rating-badge" v-else-if="listing.avg_rating">⭐ {{ listing.avg_rating }}</div>
                <img :src="listing.images[0]" loading="lazy" class="card-img" />
              </div>
              
              <div class="card-info" @click="openListing(listing)">
                <div class="card-location">{{ listing.city }}, {{ listing.neighborhood }}</div>
                <div class="card-title">{{ listing.title }}</div>
                <div class="card-price"><strong>{{ formatMoney(listing.rent) }}</strong> / mo</div>
                <div class="card-amenities-preview mt-2">
                  <span v-for="(am, i) in (listing.amenities || []).slice(0,3)" :key="i" class="tiny-chip glass-panel-light">{{ am }}</span>
                  <span v-if="(listing.amenities || []).length > 3" class="tiny-chip glass-panel-light">+{{ listing.amenities.length - 3 }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- LISTING MODAL WITH BOOKING ENGINE -->
        <div v-if="activeListing" class="listing-modal-overlay">
          <div class="listing-modal slide-up-fast glass-panel aurora-border">
            <button class="close-modal-btn glass-btn" @click="activeListing = null">✖ Close</button>
            
            <!-- IMAGE GALLERY CAROUSEL -->
            <div class="modal-hero">
              <button class="carousel-btn left" @click="prevImage">❮</button>
              <img :src="activeListing.images[currentImageIndex]" />
              <button class="carousel-btn right" @click="nextImage">❯</button>
              <div class="carousel-dots">
                <span v-for="(img, idx) in activeListing.images" :key="idx" :class="['dot', currentImageIndex === idx ? 'active-dot' : '']"></span>
              </div>
            </div>
            
            <div class="modal-body">
              <div class="modal-header-info">
                <h1>{{ activeListing.title }}</h1>
                <div class="modal-meta-bar">
                  <span class="meta-item">⭐ {{ activeListing.avg_rating || 'New' }} ({{ activeListing.review_count }} reviews)</span>
                  <span class="meta-item">📍 {{ activeListing.city }}, {{ activeListing.neighborhood }}</span>
                  <span class="meta-item">🏠 {{ activeListing.category }}</span>
                  <span class="meta-item">👥 {{ activeListing.spots }} spot(s)</span>
                </div>
              </div>
              
              <div class="modal-grid mt-4">
                <div class="modal-main-col">
                  
                  <div class="host-section glass-panel-light">
                    <div class="host-header">
                      <div class="avatar-large gradient-bg">{{ getInitials(activeListing.owner_name) }}</div>
                      <div>
                        <h3>Hosted by {{ activeListing.owner_name }} <span v-if="activeListing.avg_rating >= 4.5" class="superhost-text">🏅 Superhost</span></h3>
                        <p class="host-joined">Joined DarMate in {{ new Date(activeListing.owner_joined).getFullYear() }}</p>
                        <p class="host-bio mt-2">{{ activeListing.owner_bio || 'Verified Host.' }}</p>
                        <div class="lifestyle-tags mt-2" v-if="activeListing.owner_tags && activeListing.owner_tags.length > 0">
                          <span v-for="tag in activeListing.owner_tags" :key="tag" class="tag-chip">{{ tag }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div class="description-section mt-5"><h3>About the Space</h3><p>{{ activeListing.description }}</p></div>
                  <div class="amenities-section mt-5" v-if="activeListing.amenities && activeListing.amenities.length > 0">
                    <h3>What this place offers</h3>
                    <div class="amenities-grid"><div class="amenity-item glass-btn" v-for="amenity in activeListing.amenities" :key="amenity">✨ {{ amenity }}</div></div>
                  </div>

                  <!-- SIMULATED MAP UI -->
                  <div class="map-section mt-5">
                    <h3>Where you'll be</h3>
                    <div class="map-placeholder glass-panel-light">
                      <div class="map-pin pulse">📍</div>
                      <div class="map-radius"></div>
                      <p>Exact location provided after booking.</p>
                    </div>
                  </div>

                  <!-- REVIEWS -->
                  <div class="reviews-section mt-5 border-t pt-5">
                    <h3>⭐ Reviews & Ratings</h3>
                    <form v-if="activeListing.owner_id !== currentUser.id" @submit.prevent="submitReview" class="glass-panel-light mt-4 p-4 border-radius-lg">
                      <h4 class="mb-3">Leave a Review</h4>
                      <div class="star-rating mb-3"><span v-for="star in 5" :key="star" @click="newReview.rating = star" :class="['star', newReview.rating >= star ? 'active-star' : '']">★</span></div>
                      <textarea v-model="newReview.comment" rows="2" placeholder="Share your experience..." required class="mb-3"></textarea>
                      <button type="submit" class="btn primary small-btn glow-effect">Post Review</button>
                    </form>
                    <div class="reviews-list mt-4">
                      <div v-if="activeReviews.length === 0" class="text-muted">No reviews yet. Be the first!</div>
                      <div v-for="review in activeReviews" :key="review.id" class="review-item glass-panel-light mt-3 p-4">
                        <div class="review-header">
                          <div class="avatar-tiny gradient-bg">{{ getInitials(review.client_name) }}</div>
                          <strong>{{ review.client_name }}</strong>
                          <span class="stars-display text-warning ml-auto"><span v-for="s in 5" :key="s">{{ review.rating >= s ? '★' : '☆' }}</span></span>
                        </div>
                        <p class="review-comment mt-2">{{ review.comment }}</p>
                      </div>
                    </div>
                  </div>

                </div>

                <!-- AIRBNB STYLE BOOKING CARD -->
                <div class="modal-side-col">
                  <div class="booking-card glass-panel shadow-lg glow-shadow">
                    <div class="booking-price gradient-text"><strong>{{ formatMoney(activeListing.rent) }}</strong> <span>/ mo</span></div>
                    
                    <div v-if="activeListing.owner_id === currentUser.id" class="mt-4 text-center">
                      <button class="btn outline full-width" disabled>This is your listing</button>
                    </div>
                    
                    <div v-else class="booking-engine mt-4">
                      <div class="date-picker-group">
                        <div class="date-box border-r">
                          <label>CHECK-IN</label>
                          <input type="date" v-model="booking.checkIn" :min="todayDate()" />
                        </div>
                        <div class="date-box">
                          <label>CHECK-OUT</label>
                          <input type="date" v-model="booking.checkOut" :min="booking.checkIn || todayDate()" />
                        </div>
                      </div>

                      <div class="price-breakdown mt-4" v-if="bookingMonths > 0">
                        <div class="breakdown-row"><span>{{ formatMoney(activeListing.rent) }} x {{ bookingMonths }} months</span><span>{{ formatMoney(baseRentTotal) }}</span></div>
                        <div class="breakdown-row"><span>Cleaning fee</span><span>{{ formatMoney(200) }}</span></div>
                        <div class="breakdown-row"><span>DarMate service fee</span><span>{{ formatMoney(serviceFee) }}</span></div>
                        <div class="breakdown-row total-row mt-3 pt-3 border-t"><strong>Total before taxes</strong><strong>{{ formatMoney(grandTotal) }}</strong></div>
                      </div>
                      <div class="price-breakdown mt-4 text-center text-muted" v-else>Select dates to see price breakdown.</div>

                      <button @click="requestBooking(activeListing)" :disabled="bookingMonths <= 0" class="btn primary full-width mt-4 glow-effect">
                        Reserve Space
                      </button>
                      <p class="booking-disclaimer">You won't be charged yet.</p>
                      <button @click="contactHost(activeListing)" class="btn outline full-width mt-3">💬 Contact Host</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- MANAGE PROPERTIES TAB -->
        <div v-if="currentTab === 'manage' && currentUser.is_publisher === 1" class="tab-content fade-in">
          <h2 class="hero-title gradient-text mb-4">Host Dashboard</h2>
          
          <div class="glass-panel shadow-lg mb-5" v-if="hostBookings.length > 0">
            <h3 class="p-4 border-b">📅 Booking Applications</h3>
            <div v-for="req in hostBookings" :key="req.id" class="booking-request-row">
              <div>
                <strong>{{ req.client_name }}</strong> requested <em>{{ req.title }}</em> <br/>
                <span class="text-muted text-sm">{{ req.check_in }} to {{ req.check_out }} • {{ formatMoney(req.total_price) }} total</span>
                <span :class="['status-badge', req.status]">{{ req.status }}</span>
              </div>
              <div class="action-btns" v-if="req.status === 'pending'">
                <button @click="updateBookingStatus(req, 'approved')" class="btn success-btn small-btn">Approve</button>
                <button @click="updateBookingStatus(req, 'rejected')" class="btn super-danger small-btn">Decline</button>
              </div>
            </div>
          </div>

          <form @submit.prevent="submitListing" class="glass-panel add-form shadow-lg">
            <h3>✨ Post a Property</h3>
            <div class="form-row-2">
              <div class="input-group"><span class="input-icon">🏷️</span><input v-model="form.title" type="text" placeholder="Title (e.g. Modern Studio Agdal)" required /></div>
              <div class="input-group"><span class="input-icon">🖼️</span><input v-model="form.imageInput" type="url" placeholder="Main Image URL" required /></div>
            </div>
            <div class="form-row-3 mt-3">
              <select v-model="form.category" class="custom-select" required>
                <option value="Shared Room">Shared Room</option><option value="Private Room">Private Room</option><option value="Entire Place">Entire Place</option>
              </select>
              <div class="input-group"><span class="input-icon">👥</span><input v-model="form.spots" type="number" min="1" placeholder="Spots Available" required /></div>
              <div class="input-group"><input v-model="form.rent" type="number" placeholder="Rent/Person" required /><span class="input-suffix">MAD</span></div>
            </div>
            <div class="form-row-2 mt-3">
              <input v-model="form.city" type="text" placeholder="City" required />
              <input v-model="form.neighborhood" type="text" placeholder="Neighborhood" required />
            </div>
            <textarea v-model="form.description" class="mt-3" placeholder="Describe the space..." rows="3" required></textarea>
            
            <div class="amenities-checklist mt-4">
              <p class="role-label">Included Amenities:</p>
              <div class="checkbox-grid">
                <label v-for="item in availableAmenities" :key="item" class="check-btn-small glass-btn"><input type="checkbox" :value="item" v-model="form.amenities" /><span>{{ item }}</span></label>
              </div>
            </div>
            <div class="form-actions mt-4"><button type="submit" class="btn primary glow-effect">Publish to DarMate 🚀</button></div>
          </form>

          <h3 class="section-title mt-5">Your Active Properties</h3>
          <div class="listings-grid-bento">
            <div v-for="listing in publisherListings" :key="listing.id" class="bento-card glass-panel hover-lift">
              <div class="card-img-wrapper" @click="openListing(listing)">
                <div class="category-badge">{{ listing.category }}</div>
                <img :src="listing.images[0]" class="card-img" />
                <div class="price-pill">{{ formatMoney(listing.rent) }}</div>
              </div>
              <div class="card-info">
                <div class="card-title">{{ listing.title }}</div>
                <button @click="deleteListing(listing.id)" class="btn danger-outline full-width mt-3">🗑️ Remove</button>
              </div>
            </div>
          </div>
        </div>

        <!-- NOTIFICATIONS TAB -->
        <div v-if="currentTab === 'notifications'" class="tab-content fade-in">
          <h2 class="hero-title mb-4">🔔 Alerts</h2>
          <div class="glass-panel shadow-lg">
            <div v-if="notifications.length === 0" class="empty-state"><p>You're all caught up!</p></div>
            <div v-for="notif in notifications" :key="notif.id" :class="['notif-row', notif.is_read ? 'read' : 'unread']">
              <div class="notif-icon">💡</div><div class="notif-text">{{ notif.message }}</div>
              <button v-if="!notif.is_read" @click="markNotificationRead(notif.id)" class="btn outline small-btn">Mark Read</button>
            </div>
          </div>
        </div>

        <!-- INBOX TAB -->
        <div v-if="currentTab === 'inbox'" class="tab-content fade-in inbox-layout">
          <h2 class="hero-title mb-4">📬 Inbox</h2>
          <div class="inbox-container glass-panel shadow-lg">
            <div class="inbox-sidebar glass-panel-light">
              <div class="inbox-header">Messages</div>
              <div v-if="inboxContacts.length === 0" class="empty-contacts text-center p-4">No messages yet.</div>
              <div v-for="contact in inboxContacts" :key="contact.id" @click="selectContact(contact)" :class="['contact-item', activeChatUser && activeChatUser.id === contact.id ? 'active-contact' : '']">
                <div class="avatar-small gradient-bg">{{ getInitials(contact.name) }}</div><div class="contact-name">{{ contact.name }}</div>
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
            <div class="inbox-chat-empty" v-else><span class="emoji bounce">💬</span><p>Select a chat.</p></div>
          </div>
        </div>

        <!-- GLOBAL CHAT TAB -->
        <div v-if="currentTab === 'chat'" class="tab-content chat-layout fade-in">
          <h2 class="hero-title mb-4">🌍 DarMate Global Lounge</h2>
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
            <input type="text" v-model="newGlobalMessage" placeholder="Ask the community..." required />
            <button type="submit" class="btn primary send-btn glow-effect">Broadcast 🚀</button>
          </form>
        </div>

        <!-- PROFILE TAB -->
        <div v-if="currentTab === 'profile'" class="tab-content fade-in">
          <h2 class="hero-title mb-4">Profile & Settings</h2>
          <div class="profile-card glass-panel shadow-lg aurora-border">
            <div class="profile-header">
              <div class="avatar-large gradient-bg">{{ getInitials(currentUser.name) }}</div>
              <div><h3 class="city-title">{{ currentUser.name }}</h3><div class="verified-badge mt-2">🛡️ Identity Verified</div></div>
            </div>
            <form @submit.prevent="updateProfile" class="profile-form">
              <div class="form-group">
                <label>Contact Phone</label>
                <div class="input-group"><span class="input-icon">📱</span><input v-model="currentUser.phone" type="text" placeholder="06 XX XX XX XX" /></div>
              </div>
              <div class="form-group"><label>Bio</label><textarea v-model="currentUser.bio" rows="2" placeholder="Tell potential roommates about yourself..."></textarea></div>
              <div class="form-group mt-2">
                <label>Lifestyle Tags:</label>
                <div class="checkbox-grid">
                  <label v-for="tag in allLifestyleTags" :key="tag" class="check-btn-small glass-btn">
                    <input type="checkbox" :value="tag" v-model="currentUser.lifestyle_tags" /><span>{{ tag }}</span>
                  </label>
                </div>
              </div>
              <div class="permissions-box glass-panel-light mt-4">
                <label class="permissions-title">DarMate Capabilities</label>
                <label class="check-btn glass-btn mt-2"><input type="checkbox" v-model="profileIsClient" /><span>🔍 Buyer Mode</span></label>
                <label class="check-btn glass-btn mt-2"><input type="checkbox" v-model="profileIsPublisher" /><span>🏠 Host Mode</span></label>
              </div>
              <button type="submit" class="btn primary glow-effect mt-4 full-width">Save Settings</button>
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
      socket: null, currentUser: null, currentTab: '', isDarkMode: false,
      authMode: 'login', authName: "", authPassword: "", loginIsClient: true, loginIsPublisher: false,
      profileIsClient: true, profileIsPublisher: false,
      
      filters: { query: "", category: "", maxPrice: 15000, sortBy: "newest" },
      listings: [], hostBookings: [], activeListing: null, currentImageIndex: 0,
      activeReviews: [], newReview: { rating: 5, comment: '' },
      booking: { checkIn: '', checkOut: '' },
      
      availableAmenities: ['WiFi', 'Kitchen', 'Washing Machine', 'Air Conditioning', 'Free Parking', 'Workspace', 'Balcony', 'Gym'],
      allLifestyleTags: ['Night Owl', 'Early Bird', 'Clean', 'Smoker', 'Non-Smoker', 'Pet Friendly', 'Student', 'Professional', 'Quiet', 'Social'],
      form: { title: "", category: "Shared Room", spots: 1, city: "", neighborhood: "", rent: "", description: "", imageInput: "", amenities: [] },
      
      globalMessages: [], newGlobalMessage: "", inboxContacts: [], activeChatUser: null, privateMessages: [], newPrivateMessage: "",
      notifications: [], toastMsg: ""
    };
  },
  computed: {
    displayListings() {
      let source = this.listings.filter(l => l.rent <= this.filters.maxPrice);
      if (this.currentTab === 'saved') source = source.filter(l => l.is_favorited === 1);
      if (this.filters.category) source = source.filter(l => l.category === this.filters.category);
      if (this.filters.query) {
        const q = this.filters.query.toLowerCase();
        source = source.filter(l => l.city.toLowerCase().includes(q) || l.neighborhood.toLowerCase().includes(q) || l.title.toLowerCase().includes(q));
      }
      if (this.filters.sortBy === 'price_low') source.sort((a,b) => a.rent - b.rent);
      else if (this.filters.sortBy === 'price_high') source.sort((a,b) => b.rent - a.rent);
      else if (this.filters.sortBy === 'rating') source.sort((a,b) => (b.avg_rating||0) - (a.avg_rating||0));
      else source.sort((a,b) => b.id - a.id); 
      return source;
    },
    publisherListings() { return this.listings.filter(l => l.owner_id === this.currentUser.id); },
    unreadNotifications() { return this.notifications.filter(n => n.is_read === 0).length; },
    
    // Booking Math
    bookingMonths() {
      if(!this.booking.checkIn || !this.booking.checkOut) return 0;
      const d1 = new Date(this.booking.checkIn); const d2 = new Date(this.booking.checkOut);
      const diffTime = Math.abs(d2 - d1);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return Math.max(1, Math.ceil(diffDays / 30)); // Approximate months, minimum 1
    },
    baseRentTotal() { return this.bookingMonths * (this.activeListing ? this.activeListing.rent : 0); },
    serviceFee() { return Math.floor(this.baseRentTotal * 0.12); },
    grandTotal() { return this.baseRentTotal + 200 + this.serviceFee; }
  },
  mounted() {
    const savedUser = localStorage.getItem('darMateUserUlt');
    const savedTab = localStorage.getItem('darMateTabUlt');
    const savedTheme = localStorage.getItem('darMateThemeUlt');
    if (savedTheme) this.isDarkMode = savedTheme === 'dark';
    if (savedUser) {
      this.currentUser = JSON.parse(savedUser);
      if (!this.currentUser.lifestyle_tags) this.currentUser.lifestyle_tags = [];
      else if (typeof this.currentUser.lifestyle_tags === 'string') this.currentUser.lifestyle_tags = JSON.parse(this.currentUser.lifestyle_tags);
      this.profileIsClient = this.currentUser.is_client === 1; this.profileIsPublisher = this.currentUser.is_publisher === 1;
      this.currentTab = savedTab || (this.currentUser.is_client === 1 ? 'browse' : 'manage');
      this.initializeData();
    }
  },
  methods: {
    formatMoney(amount) { return new Intl.NumberFormat('en-MA', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(amount); },
    toggleTheme() { this.isDarkMode = !this.isDarkMode; localStorage.setItem('darMateThemeUlt', this.isDarkMode ? 'dark' : 'light'); },
    showToast(message) { this.toastMsg = message; setTimeout(() => { this.toastMsg = ""; }, 3000); },
    getInitials(name) { return name ? name.substring(0, 2).toUpperCase() : "?"; },
    todayDate() { return new Date().toISOString().split('T')[0]; },
    changeTab(tab) { this.currentTab = tab; this.activeListing = null; localStorage.setItem('darMateTabUlt', tab); if (tab === 'inbox') this.fetchInboxContacts(); if (tab === 'manage') this.fetchHostBookings(); if (tab === 'notifications') this.fetchNotifications(); },

    // Image Gallery
    nextImage() { if(this.activeListing && this.currentImageIndex < this.activeListing.images.length - 1) this.currentImageIndex++; else this.currentImageIndex = 0; },
    prevImage() { if(this.activeListing && this.currentImageIndex > 0) this.currentImageIndex--; else this.currentImageIndex = this.activeListing.images.length - 1; },

    async authenticateUser() {
      const endpoint = this.authMode === 'login' ? '/api/login' : '/api/register';
      const body = { name: this.authName, password: this.authPassword };
      if (this.authMode === 'register') {
        if (!this.loginIsClient && !this.loginIsPublisher) return this.showToast("⚠️ Select at least one role.");
        body.is_client = this.loginIsClient; body.is_publisher = this.loginIsPublisher;
      }
      const response = await fetch(`http://localhost:3000${endpoint}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await response.json();
      if (!response.ok) return this.showToast(`❌ ${data.error}`);
      
      this.currentUser = data;
      if (typeof this.currentUser.lifestyle_tags === 'string') this.currentUser.lifestyle_tags = JSON.parse(this.currentUser.lifestyle_tags);
      this.profileIsClient = this.currentUser.is_client === 1; this.profileIsPublisher = this.currentUser.is_publisher === 1;
      localStorage.setItem('darMateUserUlt', JSON.stringify(this.currentUser));
      this.changeTab(this.currentUser.is_client === 1 ? 'browse' : 'manage'); this.initializeData(); this.showToast(`Welcome, ${this.currentUser.name}!`);
    },
    logout() { this.currentUser = null; localStorage.removeItem('darMateUserUlt'); localStorage.removeItem('darMateTabUlt'); if (this.socket) this.socket.disconnect(); },
    
    async updateProfile() {
      await fetch(`http://localhost:3000/api/users/${this.currentUser.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone: this.currentUser.phone, bio: this.currentUser.bio, lifestyle_tags: this.currentUser.lifestyle_tags, is_client: this.profileIsClient, is_publisher: this.profileIsPublisher }) });
      this.currentUser.is_client = this.profileIsClient ? 1 : 0; this.currentUser.is_publisher = this.profileIsPublisher ? 1 : 0;
      localStorage.setItem('darMateUserUlt', JSON.stringify(this.currentUser)); this.showToast("✅ Settings saved.");
    },

    initializeData() {
      this.fetchListings(); this.fetchGlobalMessages(); this.fetchInboxContacts(); this.fetchHostBookings(); this.fetchNotifications();
      this.socket = io("http://localhost:3000"); this.socket.emit('register', this.currentUser.id);
      this.socket.on("receive_message", (msg) => { this.globalMessages.push(msg); this.scrollChat('global-scroll'); });
      this.socket.on("receive_private", (msg) => {
        if (this.activeChatUser && (msg.sender_id === this.activeChatUser.id || msg.receiver_id === this.activeChatUser.id)) { this.privateMessages.push(msg); this.scrollChat('private-scroll'); }
        else if (msg.sender_id !== this.currentUser.id) { this.fetchInboxContacts(); this.showToast(`New message received!`); }
      });
      this.socket.on("new_notification", (notif) => { this.notifications.unshift(notif); this.showToast("🔔 " + notif.message); });
    },

    async fetchReviews(listingId) { const res = await fetch(`http://localhost:3000/api/reviews/${listingId}`); this.activeReviews = await res.json(); },
    async submitReview() { await fetch("http://localhost:3000/api/reviews", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ listing_id: this.activeListing.id, client_id: this.currentUser.id, rating: this.newReview.rating, comment: this.newReview.comment }) }); this.newReview.comment = ''; this.fetchReviews(this.activeListing.id); this.fetchListings(); this.showToast("⭐ Review posted!"); },

    async requestBooking(listing) {
      await fetch("http://localhost:3000/api/bookings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ listing_id: listing.id, client_id: this.currentUser.id, check_in: this.booking.checkIn, check_out: this.booking.checkOut, total_price: this.grandTotal }) });
      this.showToast("✅ Booking request sent to host."); this.activeListing = null; this.booking = { checkIn: '', checkOut: '' };
    },
    async fetchHostBookings() { if(this.currentUser.is_publisher !== 1) return; const res = await fetch(`http://localhost:3000/api/bookings/${this.currentUser.id}`); this.hostBookings = await res.json(); },
    async updateBookingStatus(req, status) { await fetch(`http://localhost:3000/api/bookings/${req.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status, clientId: req.client_id, listingTitle: req.title, check_in: req.check_in, check_out: req.check_out }) }); this.fetchHostBookings(); this.showToast(`Booking ${status}.`); },
    async fetchNotifications() { const res = await fetch(`http://localhost:3000/api/notifications/${this.currentUser.id}`); this.notifications = await res.json(); },
    async markNotificationRead(id) { await fetch(`http://localhost:3000/api/notifications/read/${id}`, { method: "PUT" }); const n = this.notifications.find(n => n.id === id); if(n) n.is_read = 1; },

    async fetchListings() { const response = await fetch(`http://localhost:3000/api/listings?userId=${this.currentUser.id}`); this.listings = await response.json(); },
    async submitListing() { await fetch("http://localhost:3000/api/listings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...this.form, images: [this.form.imageInput], owner_id: this.currentUser.id }) }); this.form = { title: "", category: "Shared Room", spots: 1, city: "", neighborhood: "", rent: "", description: "", imageInput: "", amenities: [] }; this.fetchListings(); this.showToast("✅ Property live!"); },
    async deleteListing(id) { await fetch(`http://localhost:3000/api/listings/${id}`, { method: "DELETE" }); this.fetchListings(); this.showToast("🗑️ Removed."); },
    async toggleFavorite(listing) { const newStatus = listing.is_favorited === 1 ? 0 : 1; listing.is_favorited = newStatus; await fetch("http://localhost:3000/api/favorites", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ user_id: this.currentUser.id, listing_id: listing.id, is_favorited: newStatus }) }); if (newStatus === 1) this.showToast("❤️ Saved."); },
    
    openListing(listing) { this.activeListing = listing; this.currentImageIndex = 0; this.booking = { checkIn: '', checkOut: '' }; this.fetchReviews(listing.id); },
    contactHost(listing) { this.activeChatUser = { id: listing.owner_id, name: listing.owner_name }; this.activeListing = null; this.changeTab('inbox'); this.fetchPrivateMessages(); if (!this.inboxContacts.find(c => c.id === listing.owner_id)) this.inboxContacts.unshift(this.activeChatUser); },

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
   THEME VARIABLES (DARMATE EMERALD/AMBER)
   ========================================================================== */
:root {
  --bg-main: #f0fdf4; --bg-panel: rgba(255, 255, 255, 0.85); --bg-panel-solid: #ffffff;
  --bg-input: rgba(255, 255, 255, 0.9); --text-primary: #022c22; --text-secondary: #0f766e;
  --border-color: rgba(4, 120, 87, 0.1);
  --accent-1: #059669; --accent-2: #fbbf24; --danger: #ef4444; --success: #10b981;
}

.dark-theme {
  --bg-main: #064e3b; --bg-panel: rgba(2, 44, 34, 0.7); --bg-panel-solid: #022c22;
  --bg-input: rgba(6, 78, 59, 0.6); --text-primary: #f0fdf4; --text-secondary: #6ee7b7;
  --border-color: rgba(255, 255, 255, 0.1);
}

* { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Inter', system-ui, sans-serif; }
body { background: var(--bg-main); color: var(--text-primary); height: 100vh; overflow: hidden; transition: 0.4s ease; }
.app-wrapper { height: 100vh; position: relative; z-index: 1;}
.mt-2 { margin-top: 10px; } .mt-3 { margin-top: 20px; } .mt-4 { margin-top: 30px; } .mt-5 { margin-top: 40px; } .mb-3 { margin-bottom: 15px; } .mb-4 { margin-bottom: 30px; } .mb-5 { margin-bottom: 40px; }
.pt-3 { padding-top: 15px; } .pt-4 { padding-top: 20px; } .pt-5 { padding-top: 40px; } .p-4 { padding: 20px; }
.border-t { border-top: 1px solid var(--border-color); } .border-b { border-bottom: 1px solid var(--border-color); } .border-r { border-right: 1px solid var(--border-color); }
.border-radius-lg { border-radius: 20px; } .text-center { text-align: center; } .text-sm { font-size: 0.9rem; }
.text-muted { color: var(--text-secondary); opacity: 0.8;} .text-warning { color: var(--accent-2); } .ml-auto { margin-left: auto; }
.no-scroll { overflow: hidden !important; }

/* ==========================================================================
   AURORA ANIMATED BACKGROUND
   ========================================================================== */
.aurora-bg { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: -1; overflow: hidden; background: var(--bg-main); transition: 0.4s ease;}
.aurora-1, .aurora-2, .aurora-3, .aurora-4 { position: absolute; filter: blur(120px); opacity: 0.35; border-radius: 50%; animation: floatAurora 25s infinite alternate linear; }
.aurora-1 { top: -20%; left: -10%; width: 50vw; height: 50vw; background: var(--accent-1); animation-delay: 0s; }
.aurora-2 { bottom: -20%; right: -10%; width: 60vw; height: 60vw; background: var(--accent-2); animation-delay: -5s; }
.aurora-3 { top: 40%; left: 40%; width: 40vw; height: 40vw; background: #34d399; animation-delay: -10s; }
.aurora-4 { bottom: 10%; left: -20%; width: 45vw; height: 45vw; background: #f59e0b; animation-delay: -15s; }
@keyframes floatAurora { 0% { transform: translate(0, 0) scale(1); } 100% { transform: translate(10vw, 10vh) scale(1.3); } }

/* ==========================================================================
   GLASSMORPHISM & EFFECTS
   ========================================================================== */
.glass-panel { background: var(--bg-panel); backdrop-filter: blur(30px); -webkit-backdrop-filter: blur(30px); border: 1px solid var(--border-color); border-radius: 24px; }
.glass-panel-light { background: rgba(127, 127, 127, 0.05); border-radius: 16px; padding: 15px; border: 1px solid var(--border-color); }
.glass-btn { background: var(--bg-input); border: 1px solid var(--border-color); transition: all 0.2s; }
.glass-btn:hover { background: rgba(127, 127, 127, 0.1); border-color: var(--accent-1); }

.aurora-border { position: relative; }
.aurora-border::before { content:""; position:absolute; inset: -2px; border-radius: inherit; background: linear-gradient(135deg, var(--accent-1), var(--accent-2)); z-index:-1; opacity:0.4; filter: blur(6px); transition: 0.3s;}

.gradient-text { background: linear-gradient(135deg, var(--accent-1), var(--accent-2)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.gradient-bg { background: linear-gradient(135deg, var(--accent-1), var(--accent-2)); color: white; }
.glow-effect { box-shadow: 0 4px 20px rgba(5, 150, 105, 0.4); transition: 0.3s; }
.glow-effect:hover { box-shadow: 0 8px 30px rgba(251, 191, 36, 0.5); transform: translateY(-3px); }
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
@keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(5, 150, 105, 0.8); } 70% { box-shadow: 0 0 0 10px rgba(5, 150, 105, 0); } 100% { box-shadow: 0 0 0 0 rgba(5, 150, 105, 0); } }
@keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }

.toast { position: fixed; top: 20px; left: 50%; transform: translateX(-50%) translateY(-20px); background: var(--bg-panel-solid); color: var(--text-primary); border: 1px solid var(--border-color); padding: 14px 28px; border-radius: 30px; font-weight: 800; opacity: 0; visibility: hidden; transition: 0.3s; z-index: 9999; box-shadow: 0 10px 30px rgba(0,0,0,0.2); }
.toast-visible { opacity: 1; visibility: visible; transform: translateX(-50%) translateY(0); }

/* ==========================================================================
   INPUTS, BUTTONS & FORMS
   ========================================================================== */
input, textarea, select { width: 100%; padding: 18px 24px; border: 1px solid var(--border-color); border-radius: 16px; font-size: 1.05rem; outline: none; transition: 0.3s; background: var(--bg-input); color: var(--text-primary); font-weight: 600; box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);}
input:focus, textarea:focus, select:focus { border-color: var(--accent-1); box-shadow: 0 0 0 4px rgba(5, 150, 105, 0.2); background: var(--bg-panel-solid); }
.custom-select { appearance: none; background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23666%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E"); background-repeat: no-repeat; background-position: right 20px top 50%; background-size: 12px auto; cursor:pointer;}
.input-group { position: relative; display: flex; align-items: center; }
.input-icon { position: absolute; left: 18px; font-size: 1.3rem; }
.input-group input { padding-left: 55px; }
.input-suffix { position: absolute; right: 18px; font-weight: 800; color: var(--text-secondary); }

.custom-slider { -webkit-appearance: none; width: 100%; height: 8px; border-radius: 5px; background: var(--border-color); outline: none; padding: 0; }
.custom-slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 24px; height: 24px; border-radius: 50%; background: var(--accent-1); cursor: pointer; box-shadow: 0 0 15px rgba(5, 150, 105, 0.6); border: 3px solid white;}

.btn { padding: 18px 26px; border: none; border-radius: 16px; font-weight: 800; cursor: pointer; transition: 0.3s; font-size: 1.1rem; text-align: center; }
.small-btn { padding: 10px 18px; font-size: 0.95rem; border-radius: 12px;}
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
.sidebar { width: 330px; height: 100vh; display: flex; flex-direction: column; padding: 35px 25px; z-index: 10; border-right: 1px solid var(--border-color); border-radius: 0; overflow-y: auto;}
.sidebar::-webkit-scrollbar { width: 0px; background: transparent; }
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
.badge { background: var(--accent-2); color: #451a03; font-size: 0.85rem; padding: 4px 12px; border-radius: 14px; font-weight: 900;}
.sidebar-footer { padding-top: 20px; display: flex; flex-direction: column; gap: 15px;}
.verified-badge { font-size: 0.85rem; color: var(--success); font-weight: 800; margin-top: 4px;}

/* ==========================================================================
   AIRBNB-STYLE SEARCH PILL & FILTERS
   ========================================================================== */
.hero-title { font-size: 3.5rem; font-weight: 900; letter-spacing: -2px; margin: 0; color: var(--text-primary);}
.search-pill-container { display: flex; justify-content: center; margin-bottom: 50px; }
.search-pill { display: flex; align-items: center; background: var(--bg-panel-solid); border-radius: 50px; padding: 10px 10px 10px 30px; border: 1px solid var(--border-color);}
.pill-section { display: flex; flex-direction: column; padding: 0 15px; }
.pill-section label { font-size: 0.75rem; font-weight: 800; color: var(--text-primary); letter-spacing: 1px;}
.pill-section input, .pill-section select { border: none; background: transparent; padding: 5px 0; font-size: 1rem; font-weight: 500; color: var(--text-secondary); box-shadow: none; min-width: 150px; cursor:pointer;}
.pill-section input:focus, .pill-section select:focus { box-shadow: none; background: transparent;}
.pill-divider { width: 1px; height: 35px; background: var(--border-color); margin: 0 10px; }
.pill-btn { border-radius: 40px; padding: 15px 30px; border: none; font-weight: 800; font-size: 1.1rem; cursor: pointer; color: white; display: flex; align-items: center; gap: 10px;}

.header-bar { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 20px; flex-wrap: wrap; gap: 20px;}
.advanced-filters { display: flex; gap: 20px; align-items: flex-end; padding: 25px; flex-wrap: wrap; border-radius: 24px; width: 100%;}
.filter-col { display: flex; flex-direction: column; gap: 10px; flex:1;}
.filter-col label { font-size: 0.95rem; font-weight: 800; color: var(--text-primary); }

.quick-filters { display: flex; gap: 12px; margin-bottom: 40px; overflow-x: auto; padding-bottom: 15px;}
.chip { padding: 12px 24px; border-radius: 25px; color: var(--text-primary); font-weight: 800; cursor: pointer; transition: 0.2s; white-space: nowrap; font-size: 1.05rem;}
.chip:hover { background: var(--text-primary); color: var(--bg-panel-solid); border-color: var(--text-primary); transform: translateY(-2px);}

/* ==========================================================================
   BENTO GRID LISTINGS 
   ========================================================================== */
.listings-grid-bento { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 35px; }
.bento-card { display: flex; flex-direction: column; cursor: pointer; position: relative; padding: 18px; transition: 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
.card-img-wrapper { aspect-ratio: 4 / 3; overflow: hidden; border-radius: 20px; margin-bottom: 20px; position: relative; background: var(--border-color);}
.card-img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
.bento-card:hover .card-img { transform: scale(1.1); }
.price-pill { position: absolute; bottom: 15px; left: 15px; background: rgba(0,0,0,0.8); backdrop-filter: blur(12px); color: white; font-weight: 900; padding: 10px 20px; border-radius: 16px; font-size: 1.3rem; z-index: 2; }
.category-badge { position: absolute; top: 15px; left: 15px; background: var(--bg-panel-solid); color: var(--text-primary); font-weight: 800; padding: 6px 12px; border-radius: 12px; font-size: 0.85rem; z-index: 5;}
.superhost-badge { position: absolute; top: 15px; left: 50%; transform: translateX(-50%); background: var(--bg-panel-solid); color: var(--text-primary); font-weight: 900; padding: 6px 15px; border-radius: 12px; font-size: 0.85rem; z-index: 5; box-shadow: 0 4px 10px rgba(0,0,0,0.2);}
.rating-badge { position: absolute; top: 15px; left: 50%; transform: translateX(-50%); background: var(--bg-panel-solid); color: var(--text-primary); font-weight: 800; padding: 6px 12px; border-radius: 12px; font-size: 0.85rem; z-index: 5;}

.favorite-btn { position: absolute; top: 25px; right: 25px; background: rgba(255,255,255,0.25); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.4); font-size: 1.4rem; cursor: pointer; z-index: 5; border-radius: 50%; width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; transition: 0.2s;}
.favorite-btn:hover { transform: scale(1.15); background: rgba(255,255,255,1);}
.heart-active { color: var(--danger); text-shadow: 0 0 15px rgba(239, 68, 68, 0.6); }

.card-info { padding: 0 10px 10px; }
.card-location { font-weight: 900; font-size: 1.3rem; color: var(--text-primary); display: flex; align-items: center; gap: 6px; letter-spacing: -0.5px;}
.card-title { font-size: 1.1rem; color: var(--text-secondary); margin: 8px 0 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 600;}
.coloc-meta { font-size: 0.9rem; color: var(--accent-1); font-weight: 800; margin-bottom: 12px; }
.card-amenities-preview { display: flex; gap: 8px; flex-wrap: wrap; }
.tiny-chip { font-size: 0.85rem; padding: 6px 12px; border-radius: 12px; font-weight: 800; color: var(--text-secondary); }

/* ==========================================================================
   LISTING MODAL (GALLERY & BOOKING)
   ========================================================================== */
.listing-modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(20px); z-index: 100; overflow-y: auto; padding: 40px; display: flex; justify-content: center;}
.listing-modal { width: 100%; max-width: 1400px; background: var(--bg-panel-solid); border-radius: 40px; overflow: hidden; border: 1px solid var(--border-color); box-shadow: 0 40px 80px -20px rgba(0, 0, 0, 0.4); position: relative; height: fit-content; margin: auto;}
.close-modal-btn { position: absolute; top: 30px; left: 30px; padding: 16px 28px; border-radius: 25px; font-weight: 900; z-index: 101; background: rgba(0,0,0,0.6); color: white; border: 1px solid rgba(255,255,255,0.3); backdrop-filter: blur(12px);}
.close-modal-btn:hover { background: white; color: black; }

/* Image Gallery */
.modal-hero { width: 100%; height: 60vh; position: relative; background: #111; display:flex; align-items: center; justify-content: center;}
.modal-hero img { max-width: 100%; max-height: 100%; object-fit: contain; }
.hero-gradient { position: absolute; inset: 0; background: linear-gradient(to top, var(--bg-panel-solid) 0%, transparent 40%); pointer-events: none;}
.modal-category-badge { position: absolute; bottom: 120px; left: 60px; background: var(--accent-1); color: white; padding: 10px 20px; border-radius: 16px; font-weight: 900; z-index: 3; font-size: 1.1rem;}
.carousel-btn { position: absolute; top: 50%; transform: translateY(-50%); background: rgba(255,255,255,0.8); border: none; width: 60px; height: 60px; border-radius: 50%; font-size: 1.5rem; cursor: pointer; z-index: 10; transition: 0.2s; display: flex; align-items: center; justify-content: center;}
.carousel-btn:hover { background: white; transform: translateY(-50%) scale(1.1);}
.carousel-btn.left { left: 40px; } .carousel-btn.right { right: 40px; }
.carousel-dots { position: absolute; bottom: 140px; left: 50%; transform: translateX(-50%); display: flex; gap: 10px; z-index: 10;}
.dot { width: 10px; height: 10px; border-radius: 50%; background: rgba(255,255,255,0.5); transition: 0.3s;}
.active-dot { background: white; transform: scale(1.3); }

.modal-body { padding: 60px; position: relative; z-index: 2; margin-top: -100px;}
.modal-header-info h1 { font-size: 4.5rem; font-weight: 900; margin-bottom: 15px; line-height: 1; letter-spacing: -2.5px;}
.modal-meta-bar { display: flex; gap: 20px; flex-wrap: wrap; margin-bottom: 50px; font-size: 1.2rem; font-weight: 800; color: var(--text-primary);}
.meta-item { display: flex; align-items: center; gap: 8px; }

.modal-grid { display: grid; grid-template-columns: 2fr 1.2fr; gap: 80px; }
.host-section { padding: 35px; margin-bottom: 40px; border-radius: 28px; }
.host-header { display: flex; align-items: center; gap: 30px; }
.host-joined { font-size: 0.95rem; color: var(--text-secondary); font-weight: 700; margin-top: 5px;}
.superhost-text { color: var(--accent-1); font-weight: 900; font-size: 1rem; margin-left: 10px;}
.host-bio { color: var(--text-primary); line-height: 1.6; font-size: 1.15rem; font-weight: 500;}
.lifestyle-tags { display: flex; gap: 8px; flex-wrap: wrap; }
.tag-chip { background: var(--text-primary); color: var(--bg-panel-solid); padding: 6px 12px; border-radius: 10px; font-size: 0.85rem; font-weight: 800; }

.description-section h3, .amenities-section h3, .reviews-section h3, .map-section h3 { font-size: 2rem; margin-bottom: 25px; font-weight: 900; letter-spacing: -1px;}
.description-section p { font-size: 1.25rem; line-height: 1.8; color: var(--text-primary); white-space: pre-wrap; font-weight: 500;}
.amenities-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
.amenity-item { font-size: 1.2rem; font-weight: 800; display: flex; align-items: center; gap: 15px; padding: 18px; border-radius: 20px; border: 1px solid var(--border-color);}

/* Simulated Map */
.map-placeholder { height: 300px; border-radius: 24px; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; overflow: hidden; background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(251, 191, 36, 0.1)); border: 1px solid var(--border-color);}
.map-pin { font-size: 3rem; z-index: 2;}
.map-radius { position: absolute; width: 150px; height: 150px; background: rgba(5, 150, 105, 0.2); border-radius: 50%; border: 2px solid var(--accent-1); z-index: 1;}
.map-placeholder p { margin-top: 20px; font-weight: 700; color: var(--text-secondary); z-index: 2;}

/* Price Breakdown Engine */
.booking-card { position: sticky; top: 40px; padding: 50px; border-radius: 32px; text-align: left; border: 1px solid var(--border-color); background: var(--bg-panel-solid);}
.booking-price { font-size: 3.2rem; margin-bottom: 20px; letter-spacing: -2px; font-weight: 900; text-align: center;}
.booking-price span { font-size: 1.3rem; font-weight: 700; color: var(--text-secondary); }
.date-picker-group { display: flex; border: 1px solid var(--border-color); border-radius: 16px; overflow: hidden; }
.date-box { flex: 1; padding: 15px; display: flex; flex-direction: column; gap: 5px; }
.date-box label { font-size: 0.7rem; font-weight: 900; letter-spacing: 1px; color: var(--text-secondary); }
.date-box input { border: none; background: transparent; padding: 0; font-size: 1rem; font-weight: 600; outline: none; box-shadow: none;}
.price-breakdown { font-size: 1.1rem; color: var(--text-primary); }
.breakdown-row { display: flex; justify-content: space-between; margin-bottom: 12px; font-weight: 500;}
.total-row { font-size: 1.3rem; font-weight: 900; }
.booking-disclaimer { text-align: center; color: var(--text-secondary); font-size: 1rem; margin-top: 20px; font-weight: 600;}

/* Reviews System */
.star-rating { font-size: 2.5rem; cursor: pointer; color: var(--text-secondary); opacity: 0.5;}
.star-rating .star { transition: 0.2s; display: inline-block; padding: 0 5px;}
.star-rating .star:hover { transform: scale(1.2); }
.active-star { color: var(--accent-2) !important; opacity: 1 !important; text-shadow: 0 0 10px rgba(251, 191, 36, 0.5);}
.review-item { border-radius: 20px; }
.review-header { display: flex; align-items: center; gap: 15px; font-size: 1.1rem; }
.stars-display { letter-spacing: 2px; font-size: 1.2rem; }
.review-comment { font-size: 1.1rem; line-height: 1.6; font-weight: 500;}

/* Booking Row for Hosts */
.booking-request-row { display: flex; justify-content: space-between; align-items: center; padding: 25px; border-bottom: 1px solid var(--border-color); font-size: 1.15rem; background: var(--bg-panel-solid); border-radius: 16px; margin-bottom: 10px;}
.status-badge { padding: 8px 16px; border-radius: 12px; font-size: 0.9rem; font-weight: bold; margin-left: 10px;}
.status-badge.pending { background: #fef08a; color: #854d0e; }
.status-badge.approved { background: #dcfce7; color: #166534; }
.status-badge.rejected { background: #fee2e2; color: #991b1b; }
.action-btns { display: flex; gap: 10px; }

/* NOTIFICATIONS */
.notif-row { padding: 25px; display: flex; align-items: center; gap: 20px; border-bottom: 1px solid var(--border-color); transition: 0.3s; background: var(--bg-panel-solid); border-radius: 16px; margin-bottom: 10px;}
.notif-row.unread { background: rgba(5, 150, 105, 0.05); border-left: 8px solid var(--accent-1); }
.notif-icon { font-size: 2rem; }
.notif-text { flex: 1; font-size: 1.2rem; font-weight: 700; }

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
.my-message .chat-bubble { background: linear-gradient(135deg, var(--accent-1), var(--accent-2)); color: white; border-bottom-right-radius: 8px; box-shadow: 0 10px 25px rgba(5, 150, 105, 0.3);}
.other-message .chat-bubble { background: var(--bg-input); color: var(--text-primary); border: 1px solid var(--border-color); border-bottom-left-radius: 8px; }

.chat-window { flex: 1; overflow-y: auto; padding: 40px; display: flex; flex-direction: column; gap: 30px; margin-bottom: 25px; height: 60vh; border-radius: 32px;}
.chat-meta { font-size: 1rem; color: var(--text-secondary); margin-bottom: 12px; padding-left: 65px; font-weight: 900;}
.chat-bubble-wrapper { display: flex; align-items: flex-end; gap: 15px;}
.chat-inputs { display: flex; gap: 20px; padding: 30px; border-radius: 28px;}
.send-btn { border-radius: 20px; padding: 18px 35px; }

/* ==========================================================================
   FORMS, AVATARS & PROFILE
   ========================================================================== */
.add-form { padding: 60px; border-radius: 40px;}
.form-row-2 { display: grid; grid-template-columns: 2fr 1fr; gap: 30px; }
.form-row-3 { display: grid; grid-template-columns: 1.5fr 1fr 1.5fr; gap: 30px; }

.avatar-small { width: 55px; height: 55px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 1.3rem; box-shadow: 0 4px 15px rgba(0,0,0,0.1);}
.avatar-tiny { width: 45px; height: 45px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 1rem;}
.avatar-large { width: 120px; height: 120px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 3rem; box-shadow: 0 10px 30px rgba(5, 150, 105, 0.4);}
.status-dot { display: inline-flex; align-items: center; gap: 8px; font-size: 0.95rem; color: var(--success); font-weight: 800;}
.status-dot::before { content: ""; width: 14px; height: 14px; background: var(--success); border-radius: 50%; box-shadow: 0 0 15px var(--success);}
.user-profile-badge { display: flex; align-items: center; gap: 20px; margin-bottom: 0; padding: 20px; border-radius: 20px;}

.profile-card { max-width: 900px; padding: 70px; border-radius: 40px;}
.profile-header { display: flex; align-items: center; gap: 40px; margin-bottom: 60px; padding-bottom: 40px; border-bottom: 1px solid var(--border-color);}
.profile-form { display: flex; flex-direction: column; gap: 40px; }
.form-group label { font-weight: 900; color: var(--text-primary); margin-bottom: 15px; display: block; font-size: 1.2rem;}
.permissions-title { font-weight: 900; color: var(--text-primary); font-size: 1.5rem; margin-bottom: 10px;}

/* ==========================================================================
   LOGIN OVERLAY
   ========================================================================== */
.login-overlay { display: flex; align-items: center; justify-content: center; min-height: 100vh; position: relative; padding: 20px;}
.login-glass-box { background: rgba(255, 255, 255, 0.15); backdrop-filter: blur(40px); -webkit-backdrop-filter: blur(40px); text-align: center; max-width: 600px; width: 100%; padding: 50px 40px; border-radius: 40px; border: 1px solid rgba(255,255,255,0.25); position: relative; z-index: 2; box-shadow: 0 40px 80px rgba(0,0,0,0.3); max-height: 95vh; overflow-y: auto;}
.login-glass-box::-webkit-scrollbar { width: 0px; background: transparent; }
.dark-theme .login-glass-box { background: rgba(2, 44, 34, 0.5); border-color: rgba(255,255,255,0.08); }
.login-glass-box .logo-large { font-size: 5rem; margin-bottom: 15px; letter-spacing: -2.5px;}
.login-glass-box .subtitle { margin-bottom: 40px; color: var(--text-primary); font-size: 1.4rem; font-weight: 800;}

.auth-tabs { display: flex; gap: 10px; background: rgba(0,0,0,0.1); padding: 8px; border-radius: 20px; margin-bottom: 30px;}
.auth-tab { flex: 1; padding: 15px; border: none; background: transparent; color: var(--text-primary); font-weight: 800; font-size: 1.1rem; border-radius: 14px; cursor: pointer; transition: 0.3s;}
.auth-tab.active { background: white; box-shadow: 0 4px 15px rgba(0,0,0,0.1); color: var(--accent-1);}
.dark-theme .auth-tab.active { background: var(--bg-panel-solid); }

.role-selector { display: flex; flex-direction: column; gap: 20px; margin: 35px 0; text-align: left; }
</style>
