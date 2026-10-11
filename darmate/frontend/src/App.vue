<template>
  <div class="app-container">
    <header>
      <h1>DarMate</h1>
      <p>Roommate Matching & Housing Platform</p>
    </header>

    <div class="grid">
      <!-- Housing Listings Section (REST API + SQLite) -->
      <section class="card">
        <h2>Housing Database</h2>
        <button class="btn primary" @click="createListing">Add Test Listing</button>
        <button class="btn secondary" @click="fetchListings">Refresh Data</button>
        
        <div class="list-container">
          <div v-for="listing in listings" :key="listing.id" class="listing-item">
            <strong>{{ listing.city }}</strong> ({{ listing.neighborhood }}) 
            <span class="price">{{ listing.rent }} MAD</span>
          </div>
        </div>
      </section>

      <!-- Real-Time Chat Section (Socket.io) -->
      <section class="card">
        <h2>Live Roommate Chat</h2>
        <div class="chat-window">
          <div v-if="messages.length === 0" class="empty-state">No messages yet. Open two tabs to test!</div>
          <div v-for="(msg, index) in messages" :key="index" class="chat-bubble">
            {{ msg }}
          </div>
        </div>
        
        <form @submit.prevent="sendMessage" class="chat-inputs">
          <input type="text" v-model="newMessage" placeholder="Type a message..." required />
          <button type="submit" class="btn primary">Send</button>
        </form>
      </section>
    </div>
  </div>
</template>

<script>
import { io } from "socket.io-client";

export default {
  data() {
    return {
      socket: null,
      listings: [],
      messages: [],
      newMessage: ""
    };
  },
  mounted() {
    // 1. Fetch initial database listings when the page loads
    this.fetchListings();

    // 2. Connect to the Express WebSocket server
    this.socket = io();

    // 3. Listen for incoming chat broadcasts
    this.socket.on("receive_message", (msg) => {
      this.messages.push(msg);
    });
  },
  methods: {
    async fetchListings() {
      const response = await fetch("/api/listings");
      this.listings = await response.json();
    },
    async createListing() {
      await fetch("http://localhost:3000/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city: "Salé",
          neighborhood: "Hay Karima",
          rent: 1800
        })
      });
      this.fetchListings(); // Refresh the list after inserting
    },
    sendMessage() {
      if (this.newMessage.trim() !== "") {
        this.socket.emit("send_message", this.newMessage);
        this.newMessage = ""; // Clear the input box
      }
    }
  }
};
</script>

<style>
/* CSS Reset and Styling */
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f4f4f5; color: #18181b; }
.app-container { max-width: 900px; margin: 40px auto; padding: 20px; }
header { margin-bottom: 30px; border-bottom: 2px solid #e4e4e7; padding-bottom: 10px; }
header h1 { color: #059669; font-size: 2.5rem; }
header p { color: #71717a; }

.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
.card h2 { margin-bottom: 15px; font-size: 1.2rem; border-bottom: 1px solid #e4e4e7; padding-bottom: 5px; }

/* Buttons */
.btn { padding: 8px 12px; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; margin-right: 10px; margin-bottom: 15px;}
.primary { background: #059669; color: white; }
.primary:hover { background: #047857; }
.secondary { background: #3f3f46; color: white; }
.secondary:hover { background: #27272a; }

/* Listings */
.list-container { max-height: 250px; overflow-y: auto; border: 1px solid #e4e4e7; border-radius: 4px; padding: 10px; }
.listing-item { padding: 8px 0; border-bottom: 1px solid #f4f4f5; }
.price { color: #059669; font-weight: bold; float: right; }

/* Chat */
.chat-window { height: 200px; overflow-y: auto; background: #fafafa; border: 1px solid #e4e4e7; border-radius: 4px; padding: 10px; margin-bottom: 15px; }
.chat-bubble { background: #e4e4e7; padding: 8px 12px; border-radius: 16px; display: inline-block; margin-bottom: 8px; width: fit-content; max-width: 80%; }
.empty-state { color: #a1a1aa; font-style: italic; font-size: 0.9rem; }
.chat-inputs { display: flex; gap: 10px; }
.chat-inputs input { flex: 1; padding: 10px; border: 1px solid #e4e4e7; border-radius: 4px; }
</style>
