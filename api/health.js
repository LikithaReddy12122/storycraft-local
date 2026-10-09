const { TOURISM_DATABASE } = require('../data/tourismData');

module.exports = (req, res) => {
  const isKeyConfigured = Boolean(
    process.env.GEMINI_API_KEY && 
    process.env.GEMINI_API_KEY.trim() !== '' && 
    process.env.GEMINI_API_KEY.trim() !== 'your_gemini_api_key_here'
  );

  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    aiConfigured: isKeyConfigured,
    model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
    databaseRecordsCount: TOURISM_DATABASE.length,
    environment: 'vercel-serverless',
    service: 'StoryCraft Local AI Tourism Engine'
  });
};
