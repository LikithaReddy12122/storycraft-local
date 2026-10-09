const { generateTourismAdvice } = require('../services/aiService');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'METHOD_NOT_ALLOWED', message: 'Only POST requests are supported.' });
  }

  try {
    const { message, history, preferences } = req.body || {};

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

    return res.status(200).json(result);
  } catch (err) {
    console.error('[Vercel Serverless Error in /api/chat]:', err);
    return res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: `An unexpected server error occurred: ${err.message}`
    });
  }
};
