require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { TOURISM_DATABASE } = require('./data/tourismData');
const { generateTourismAdvice, findRelevantPlaces } = require('./services/aiService');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Health / Status Check Endpoint
app.get('/api/health', (req, res) => {
  const isKeyConfigured = Boolean(
    process.env.GEMINI_API_KEY && 
    process.env.GEMINI_API_KEY.trim() !== '' && 
    process.env.GEMINI_API_KEY.trim() !== 'your_gemini_api_key_here'
  );

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    aiConfigured: isKeyConfigured,
    model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
    databaseRecordsCount: TOURISM_DATABASE.length,
    service: 'StoryCraft Local AI Tourism Engine'
  });
});

// Verified Database Query Endpoint
app.get('/api/places', (req, res) => {
  const { category, location, maxPrice, search } = req.query;
  let results = [...TOURISM_DATABASE];

  if (category && category !== 'all') {
    results = results.filter(p => p.category.toLowerCase() === category.toLowerCase());
  }
  if (location && location !== 'all') {
    results = results.filter(p => p.location.toLowerCase() === location.toLowerCase());
  }
  if (maxPrice && !isNaN(Number(maxPrice))) {
    results = results.filter(p => p.price <= Number(maxPrice));
  }
  if (search) {
    const q = search.toLowerCase();
    results = results.filter(p => 
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.tags.some(t => t.toLowerCase().includes(q))
    );
  }

  res.json({ count: results.length, places: results });
});

// AI Tourism Assistant Chat Endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history, preferences } = req.body;

    if (!message || typeof message !== 'string' || message.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'INVALID_INPUT',
        message: 'A travel query or message is required.'
      });
    }

    const result = await generateTourismAdvice({
      message: message.trim(),
      history: history || [],
      preferences: preferences || {}
    });

    if (!result.success) {
      if (result.error === 'MISSING_API_KEY') {
        return res.status(401).json(result);
      }
      return res.status(502).json(result);
    }

    return res.json(result);
  } catch (err) {
    console.error('[Server Error in /api/chat]:', err);
    return res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: `An unexpected server error occurred: ${err.message}`
    });
  }
});

// Root / Frontend fallback (Express 5 compatible)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start Server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`===================================================`);
    console.log(`🚀 StoryCraft Local AI Server running at http://localhost:${PORT}`);
    console.log(`🔑 AI Status: ${process.env.GEMINI_API_KEY ? 'Configured (Live Gemini)' : 'Awaiting GEMINI_API_KEY in .env'}`);
    console.log(`📚 Verified Database: ${TOURISM_DATABASE.length} places loaded`);
    console.log(`===================================================`);
  });
}

module.exports = app;
