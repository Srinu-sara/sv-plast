const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS & JSON parsing
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from workspace root
app.use(express.static(path.join(__dirname)));

// Ensure upload & data directories exist
const uploadDir = path.join(__dirname, 'images', 'uploads');
const dataDir = path.join(__dirname, 'data');
const dataFilePath = path.join(dataDir, 'media.json');

try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
} catch (e) {
  // Read-only filesystem in serverless environments
  console.warn('Storage directory check:', e.message);
}

// Multer Storage setup for gallery photo uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, 'photo-' + uniqueSuffix + ext);
  }
});
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Helper to read media.json
function getMediaData() {
  try {
    if (fs.existsSync(dataFilePath)) {
      const raw = fs.readFileSync(dataFilePath, 'utf8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error reading media.json:', err);
  }
  return { instagram: [], youtube: [], gallery: [] };
}

// Helper to save media.json
function saveMediaData(data) {
  try {
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error saving media.json:', err);
    return false;
  }
}

// Helper to extract YouTube Video ID from any format
function extractYouTubeId(url) {
  if (!url) return '';
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : '';
}

// ==========================================
// API ROUTES
// ==========================================

// 1. GET /api/media - Fetch current items for 3 sections (Unlimited)
app.get('/api/media', (req, res) => {
  const data = getMediaData();
  const responseData = {
    instagram: data.instagram || [],
    youtube: data.youtube || [],
    gallery: data.gallery || []
  };
  res.json({ success: true, data: responseData });
});

// 2. POST /api/media/add - Add new item(s) to section
app.post('/api/media/add', upload.any(), (req, res) => {
  const { section, title, url, location, items } = req.body;
  
  if (!['instagram', 'youtube', 'gallery'].includes(section)) {
    return res.status(400).json({ success: false, message: 'Invalid section specified.' });
  }

  const currentData = getMediaData();
  const dateStr = new Date().toISOString().split('T')[0];

  // If array of items passed as JSON
  if (Array.isArray(items) && items.length > 0) {
    if (!currentData[section]) currentData[section] = [];
    currentData[section].unshift(...items);
    saveMediaData(currentData);
    return res.json({
      success: true,
      message: `Successfully added ${items.length} items to ${section}!`,
      data: currentData
    });
  }

  let newItems = [];

  if (section === 'instagram') {
    if (!url) {
      return res.status(400).json({ success: false, message: 'Instagram post/reel URL is required.' });
    }
    let imageUrl = 'images/frame_018.webp';
    const file = req.files && req.files[0];
    if (file) {
      imageUrl = 'images/uploads/' + file.filename;
    }
    newItems.push({
      id: 'insta_' + Date.now(),
      url: url.trim(),
      imageUrl: imageUrl,
      title: title || 'Instagram Video Update',
      date: dateStr
    });
  } else if (section === 'youtube') {
    if (!url) {
      return res.status(400).json({ success: false, message: 'YouTube video URL is required.' });
    }
    const videoId = extractYouTubeId(url);
    if (!videoId) {
      return res.status(400).json({ success: false, message: 'Could not extract YouTube video ID from URL.' });
    }
    newItems.push({
      id: 'yt_' + Date.now(),
      url: url.trim(),
      videoId: videoId,
      title: title || 'YouTube Video Highlight',
      date: dateStr
    });
  } else if (section === 'gallery') {
    const uploadedFiles = req.files || [];
    if (uploadedFiles.length > 0) {
      uploadedFiles.forEach((file, idx) => {
        newItems.push({
          id: 'gal_' + Date.now() + '_' + idx,
          imageUrl: 'images/uploads/' + file.filename,
          title: title ? (uploadedFiles.length > 1 ? `${title} (${idx + 1})` : title) : 'SV PLAST Project Showcase',
          location: location || 'Project Site',
          date: dateStr
        });
      });
    } else if (url) {
      newItems.push({
        id: 'gal_' + Date.now(),
        imageUrl: url.trim(),
        title: title || 'SV PLAST Project Showcase',
        location: location || 'Project Site',
        date: dateStr
      });
    } else {
      return res.status(400).json({ success: false, message: 'Please upload image file(s) or provide an image URL.' });
    }
  }

  if (newItems.length > 0) {
    if (!currentData[section]) {
      currentData[section] = [];
    }
    currentData[section].unshift(...newItems);
    saveMediaData(currentData);
    return res.json({
      success: true,
      message: `Successfully added ${newItems.length} item(s) to ${section}!`,
      items: newItems,
      data: {
        instagram: currentData.instagram || [],
        youtube: currentData.youtube || [],
        gallery: currentData.gallery || []
      }
    });
  }

  res.status(500).json({ success: false, message: 'Failed to process post request.' });
});

// 3. DELETE & POST /api/media/delete - Delete item by ID (supports mobile browsers & proxies)
const handleDeleteItem = (req, res) => {
  const section = req.body?.section || req.query?.section;
  const id = req.body?.id || req.query?.id;

  if (!section || !id || !['instagram', 'youtube', 'gallery'].includes(section)) {
    return res.status(400).json({ success: false, message: 'Invalid section or item ID.' });
  }

  const currentData = getMediaData();
  if (currentData[section]) {
    const initialLen = currentData[section].length;
    currentData[section] = currentData[section].filter(item => item.id !== id);
    saveMediaData(currentData);
    console.log(`[Admin Delete] Deleted "${id}" from "${section}". Count: ${initialLen} -> ${currentData[section].length}`);
  }

  res.json({
    success: true,
    message: 'Item deleted successfully.',
    data: {
      instagram: currentData.instagram || [],
      youtube: currentData.youtube || [],
      gallery: currentData.gallery || []
    }
  });
};

app.delete('/api/media/delete', handleDeleteItem);
app.post('/api/media/delete', handleDeleteItem);

// 4. POST /api/media/order - Save reordered items
app.post('/api/media/order', (req, res) => {
  const { section, items } = req.body;
  if (!section || !Array.isArray(items) || !['instagram', 'youtube', 'gallery'].includes(section)) {
    return res.status(400).json({ success: false, message: 'Invalid section or items array.' });
  }

  const currentData = getMediaData();
  currentData[section] = items;
  saveMediaData(currentData);

  res.json({
    success: true,
    message: `Order updated for ${section}.`,
    data: {
      instagram: currentData.instagram || [],
      youtube: currentData.youtube || [],
      gallery: currentData.gallery || []
    }
  });
});

// Fallback to index.html for single-page routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start Server (only when run directly, not when imported)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`================================================`);
    console.log(`SV PLAST Web App & API running at http://localhost:${PORT}`);
    console.log(`Companion Admin Sender App at http://localhost:${PORT}/admin.html`);
    console.log(`================================================`);
  });
}

module.exports = app;
