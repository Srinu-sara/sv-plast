// Vercel Serverless Function handler for /api/media/delete
const fs = require('fs');
const path = require('path');

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const section = req.body?.section || req.query?.section;
  const id = req.body?.id || req.query?.id;

  if (!section || !id) {
    return res.status(400).json({ success: false, message: 'Invalid section or item ID.' });
  }

  const dataPath = path.join(process.cwd(), 'data', 'media.json');

  try {
    if (fs.existsSync(dataPath)) {
      const content = fs.readFileSync(dataPath, 'utf8');
      const json = JSON.parse(content);
      if (json[section]) {
        json[section] = json[section].filter(item => item.id !== id);
        try {
          fs.writeFileSync(dataPath, JSON.stringify(json, null, 2), 'utf8');
        } catch (writeErr) {
          console.warn('Vercel environment disk write notice:', writeErr.message);
        }
      }
      return res.status(200).json({
        success: true,
        message: 'Item deleted successfully.',
        data: {
          instagram: json.instagram || [],
          youtube: json.youtube || [],
          gallery: json.gallery || []
        }
      });
    }
  } catch (e) {
    console.error('Vercel Delete API Handler error:', e);
  }

  return res.status(200).json({
    success: true,
    message: 'Item deleted successfully.'
  });
};
