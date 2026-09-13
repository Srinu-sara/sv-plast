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

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
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

// 1. GET /api/media - Fetch current items for 3 sections (Max 5 each)
app.get('/api/media', (req, res) => {
  const data = getMediaData();
  // Ensure array bounds strictly max 5 each
  const responseData = {
    instagram: (data.instagram || []).slice(0, 5),
    youtube: (data.youtube || []).slice(0, 5),
    gallery: (data.gallery || []).slice(0, 5)
  };
  res.json({ success: true, data: responseData });
});

// 2. POST /api/media/add - Add new item to section
app.post('/api/media/add', upload.single('photo'), (req, res) => {
  const { section, title, url, location } = req.body;
  
  if (!['instagram', 'youtube', 'gallery'].includes(section)) {
    return res.status(400).json({ success: false, message: 'Invalid section specified.' });
  }

  const currentData = getMediaData();
  const dateStr = new Date().toISOString().split('T')[0];
  let newItem = null;

  if (section === 'instagram') {
    if (!url) {
      return res.status(400).json({ success: false, message: 'Instagram post/reel URL is required.' });
    }
    let imageUrl = 'images/frame_018.webp';
    if (req.file) {
      imageUrl = 'images/uploads/' + req.file.filename;
    }
    newItem = {
      id: 'insta_' + Date.now(),
      url: url.trim(),
      imageUrl: imageUrl,
      title: title || 'Instagram Video Update',
      date: dateStr
    };
  } else if (section === 'youtube') {
    if (!url) {
      return res.status(400).json({ success: false, message: 'YouTube video URL is required.' });
    }
    const videoId = extractYouTubeId(url);
    if (!videoId) {
      return res.status(400).json({ success: false, message: 'Could not extract YouTube video ID from URL.' });
    }
    newItem = {
      id: 'yt_' + Date.now(),
      url: url.trim(),
      videoId: videoId,
      title: title || 'YouTube Video Highlight',
      date: dateStr
    };
  } else if (section === 'gallery') {
    let imageUrl = '';
    if (req.file) {
      imageUrl = 'images/uploads/' + req.file.filename;
    } else if (url) {
      imageUrl = url.trim();
    } else {
      return res.status(400).json({ success: false, message: 'Please upload an image file or provide an image URL.' });
    }

    newItem = {
      id: 'gal_' + Date.now(),
      imageUrl: imageUrl,
      title: title || 'SV PLAST Project Showcase',
      location: location || 'Project Site',
      date: dateStr
    };
  }

  if (newItem) {
    if (!currentData[section]) {
      currentData[section] = [];
    }
    // Prepend new item to top
    currentData[section].unshift(newItem);
    // STRICTOR RULE: Keep max 5 items per section
    currentData[section] = currentData[section].slice(0, 5);

    saveMediaData(currentData);
    return res.json({
      success: true,
      message: `Successfully added to ${section}! (Showing 5 latest items)`,
      item: newItem,
      data: {
        instagram: currentData.instagram.slice(0, 5),
        youtube: currentData.youtube.slice(0, 5),
        gallery: currentData.gallery.slice(0, 5)
      }
    });
  }

  res.status(500).json({ success: false, message: 'Failed to process post request.' });
});

// 3. DELETE /api/media/delete - Delete item by ID
app.delete('/api/media/delete', (req, res) => {
  const { section, id } = req.body;
  if (!section || !id || !['instagram', 'youtube', 'gallery'].includes(section)) {
    return res.status(400).json({ success: false, message: 'Invalid section or item ID.' });
  }

  const currentData = getMediaData();
  if (currentData[section]) {
    currentData[section] = currentData[section].filter(item => item.id !== id);
    saveMediaData(currentData);
  }

  res.json({
    success: true,
    message: 'Item deleted successfully.',
    data: {
      instagram: currentData.instagram.slice(0, 5),
      youtube: currentData.youtube.slice(0, 5),
      gallery: currentData.gallery.slice(0, 5)
    }
  });
});

// Fallback to index.html for single-page routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`================================================`);
  console.log(`SV PLAST Web App & API running at http://localhost:${PORT}`);
  console.log(`Companion Admin Sender App at http://localhost:${PORT}/admin.html`);
  console.log(`================================================`);
});
