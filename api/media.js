// Vercel Serverless Function fallback handler for /api/media
const fs = require('fs');
const path = require('path');

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const dataPath = path.join(process.cwd(), 'data', 'media.json');

  try {
    if (fs.existsSync(dataPath)) {
      const content = fs.readFileSync(dataPath, 'utf8');
      const json = JSON.parse(content);
      return res.status(200).json({
        success: true,
        data: {
          instagram: (json.instagram || []).slice(0, 5),
          youtube: (json.youtube || []).slice(0, 5),
          gallery: (json.gallery || []).slice(0, 5)
        }
      });
    }
  } catch (e) {
    console.error('Vercel API Handler error:', e);
  }

  return res.status(200).json({
    success: true,
    data: { instagram: [], youtube: [], gallery: [] }
  });
};
