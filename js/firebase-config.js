/**
 * SV PLAST - Centralized Cloud Database Hub
 * Powered by Google Firebase Firestore (100% Free Forever)
 *
 * This provides real-time, global synchronization across all devices,
 * Chrome profiles, and visitors. When you delete or add a post in Admin Studio,
 * it updates instantly everywhere with zero delay.
 */

const SV_FIREBASE_DEFAULT_CONFIG = {
  apiKey: "AIzaSyBwtwpPkT8bMobdJcX634IUBlFrKcssBT0",
  authDomain: "sv-plast1.firebaseapp.com",
  projectId: "sv-plast1",
  storageBucket: "sv-plast1.firebasestorage.app",
  messagingSenderId: "1066950515619",
  appId: "1:1066950515619:web:682154e5f5b1167411d816"
};

// Allow config override from localStorage or environment
function getFirebaseConfig() {
  try {
    const saved = localStorage.getItem('sv_firebase_config');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.projectId && parsed.apiKey) {
        return parsed;
      }
    }
  } catch (e) {}

  if (SV_FIREBASE_DEFAULT_CONFIG.projectId && SV_FIREBASE_DEFAULT_CONFIG.apiKey) {
    return SV_FIREBASE_DEFAULT_CONFIG;
  }
  return null;
}

class SVCloudHub {
  constructor() {
    this.app = null;
    this.db = null;
    this.isInitialized = false;
    this.subscribers = [];
    this.cachedData = null;
    this.init();
  }

  init() {
    const config = getFirebaseConfig();
    if (!config) {
      console.log('SV Cloud Hub: Firebase credentials not yet configured. Operating in local/seed mode.');
      return;
    }

    const tryConnect = () => {
      try {
        if (typeof firebase !== 'undefined') {
          if (!firebase.apps.length) {
            this.app = firebase.initializeApp(config);
          } else {
            this.app = firebase.app();
          }
          this.db = firebase.firestore();
          this.isInitialized = true;
          console.log('SV Cloud Hub: Connected to Firestore centralized database (' + config.projectId + ')');
          this.listenForRealtimeUpdates();
          return true;
        }
      } catch (err) {
        console.error('SV Cloud Hub: Firebase initialization error:', err);
      }
      return false;
    };

    if (!tryConnect()) {
      window.addEventListener('DOMContentLoaded', () => {
        if (!this.isInitialized) tryConnect();
      });
      setTimeout(() => {
        if (!this.isInitialized) tryConnect();
      }, 500);
    }
  }

  isConfigured() {
    return this.isInitialized && this.db !== null;
  }

  saveConfig(newConfig) {
    try {
      if (newConfig && newConfig.projectId && newConfig.apiKey) {
        localStorage.setItem('sv_firebase_config', JSON.stringify(newConfig));
        location.reload();
        return true;
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  }

  listenForRealtimeUpdates() {
    if (!this.db) return;
    this.db.collection('sv_media').doc('content').onSnapshot((doc) => {
      if (doc.exists) {
        this.cachedData = doc.data();
        this.notifySubscribers(this.cachedData);
      }
    }, (err) => {
      console.warn('SV Cloud Hub: Snapshot listener notice:', err);
    });
  }

  subscribe(callback) {
    if (typeof callback === 'function') {
      this.subscribers.push(callback);
      if (this.cachedData) {
        callback(this.cachedData);
      }
    }
  }

  notifySubscribers(data) {
    this.subscribers.forEach(cb => {
      try { cb(data); } catch (e) { console.error(e); }
    });
  }

  // Fetch all media items
  async getMedia() {
    if (this.isConfigured()) {
      try {
        const docRef = this.db.collection('sv_media').doc('content');
        const doc = await docRef.get();
        if (doc.exists) {
          this.cachedData = doc.data();
          return this.cachedData;
        } else {
          // First-time initialization: seed Firestore from local data/media.json
          const seedData = await this.fetchSeedData();
          if (seedData) {
            await docRef.set(seedData);
            this.cachedData = seedData;
            return seedData;
          }
        }
      } catch (err) {
        console.warn('SV Cloud Hub: Firestore fetch error, falling back to seed:', err);
      }
    }
    return await this.fetchSeedData();
  }

  async fetchSeedData() {
    try {
      const res = await fetch('data/media.json?t=' + Date.now());
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Could not fetch seed data/media.json:', e);
    }
    return { instagram: [], youtube: [], gallery: [] };
  }

  // Add new media item (supports single item or array)
  async addItem(section, itemData) {
    return this.addItems(section, Array.isArray(itemData) ? itemData : [itemData]);
  }

  // Add multiple media items in a single cloud write
  async addItems(section, itemsArray) {
    if (!['instagram', 'youtube', 'gallery'].includes(section)) {
      throw new Error('Invalid section: ' + section);
    }
    const list = Array.isArray(itemsArray) ? itemsArray : [itemsArray];
    if (list.length === 0) {
      return { success: true, data: this.cachedData };
    }

    if (this.isConfigured()) {
      const docRef = this.db.collection('sv_media').doc('content');
      const doc = await docRef.get();
      let currentData = doc.exists ? doc.data() : await this.fetchSeedData();
      if (!currentData[section]) currentData[section] = [];

      // Add to top of list
      currentData[section].unshift(...list);

      // Save back to Firestore
      await docRef.set(currentData);
      this.cachedData = currentData;
      this.notifySubscribers(currentData);
      return { success: true, data: currentData };
    }

    // Fallback: try local server API if running local Node server
    try {
      const res = await fetch('/api/media/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section, items: list, ...list[0] })
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    return { success: false, message: 'Cloud database not connected.' };
  }

  // Update order of items in a section
  async updateOrder(section, reorderedItems) {
    if (!['instagram', 'youtube', 'gallery'].includes(section)) {
      throw new Error('Invalid section: ' + section);
    }
    if (!Array.isArray(reorderedItems)) {
      throw new Error('reorderedItems must be an array');
    }

    if (this.isConfigured()) {
      const docRef = this.db.collection('sv_media').doc('content');
      const doc = await docRef.get();
      let currentData = doc.exists ? doc.data() : await this.fetchSeedData();
      currentData[section] = reorderedItems;

      await docRef.set(currentData);
      this.cachedData = currentData;
      this.notifySubscribers(currentData);
      return { success: true, message: 'Order updated in cloud.', data: currentData };
    }

    // Fallback: try local server API
    try {
      const res = await fetch('/api/media/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section, items: reorderedItems })
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    return { success: false, message: 'Could not connect to cloud to update order.' };
  }

  // Delete media item permanently from cloud
  async deleteItem(section, id) {
    if (!['instagram', 'youtube', 'gallery'].includes(section)) {
      throw new Error('Invalid section: ' + section);
    }

    if (this.isConfigured()) {
      const docRef = this.db.collection('sv_media').doc('content');
      const doc = await docRef.get();
      if (doc.exists) {
        let currentData = doc.data();
        if (Array.isArray(currentData[section])) {
          currentData[section] = currentData[section].filter(item => item.id !== id);
          await docRef.set(currentData);
          this.cachedData = currentData;
          this.notifySubscribers(currentData);
          return { success: true, message: 'Item deleted permanently from cloud hub.', data: currentData };
        }
      }
    }

    // Fallback: try local server API if running local Node server
    try {
      const res = await fetch(`/api/media/delete?section=${encodeURIComponent(section)}&id=${encodeURIComponent(id)}`, {
        method: 'POST'
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    return { success: false, message: 'Could not connect to cloud database to delete.' };
  }
}

// Global Cloud Hub instance
window.SVCloud = new SVCloudHub();
