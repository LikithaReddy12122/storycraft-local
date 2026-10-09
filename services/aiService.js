const { TOURISM_DATABASE } = require('../data/tourismData');

/**
 * Filter relevant database records based on user message and filters
 */
function findRelevantPlaces(message, userPreferences = {}) {
  const query = (message || '').toLowerCase();
  const matched = [];

  for (const item of TOURISM_DATABASE) {
    let score = 0;
    const nameLower = item.name.toLowerCase();
    const locLower = item.location.toLowerCase();
    const descLower = item.description.toLowerCase();
    const tagsStr = item.tags.join(' ').toLowerCase();

    if (query.includes(locLower)) score += 3;
    if (query.includes(item.category.toLowerCase())) score += 2;
    if (tagsStr.split(' ').some(t => query.includes(t))) score += 2;
    if (query.includes(nameLower)) score += 5;

    // Check budget match if specified in query or preferences
    if (userPreferences.budget && item.price <= userPreferences.budget) {
      score += 2;
    }
    if (query.includes('budget') && item.budgetTier === 'budget') {
      score += 2;
    }
    if (query.includes('family') && item.tags.includes('family-friendly')) {
      score += 2;
    }

    if (score > 0) {
      matched.push({ item, score });
    }
  }

  // Sort by score descending and return top matches
  matched.sort((a, b) => b.score - a.score);
  return matched.slice(0, 8).map(m => m.item);
}

/**
 * Format verified database items as grounding context for Gemini
 */
function buildGroundingContext(relevantPlaces) {
  const datasetToUse = relevantPlaces.length > 0 ? relevantPlaces : TOURISM_DATABASE;
  
  return datasetToUse.map(p => `
- [${p.id}] ${p.name} (${p.category.toUpperCase()})
  Location: ${p.location}, ${p.state}
  Price: ${p.priceDisplay} (Numeric value: ₹${p.price})
  Budget Tier: ${p.budgetTier} | Rating: ${p.rating}★ (${p.reviewsCount.toLocaleString()} reviews)
  Operating Hours: ${p.hours}
  Best Time to Visit: ${p.bestTimeToVisit}
  Crowd Level: ${p.crowdLevel}
  Description: ${p.description}
  Tags: ${p.tags.join(', ')}
`).join('\n');
}

/**
 * Core function to query Gemini with Grounded Tourism Data
 */
async function generateTourismAdvice({ message, history = [], preferences = {} }) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === '' || apiKey.trim() === 'your_gemini_api_key_here') {
    return {
      success: false,
      error: 'MISSING_API_KEY',
      message: 'GEMINI_API_KEY is not configured in .env. Please configure your official Gemini API key in the server environment to activate live AI generation.',
      isConfigured: false
    };
  }

  // Determine relevant database items
  const relevantPlaces = findRelevantPlaces(message, preferences);
  const groundingContext = buildGroundingContext(relevantPlaces);

  // System Prompt for Grounded Tourism Intelligence
  const systemInstruction = `You are "StoryCraft Local AI", a verified cultural tourism assistant and trip planner for mindful travelers.

STRICT GROUNDING & TRUTH RULES:
1. ONLY recommend destinations, attractions, hotels, restaurants, and transport services that exist in the VERIFIED TOURISM DATABASE provided below.
2. DO NOT INVENT fake hotel names, fake prices, fake ratings, opening hours, or fictitious availability under any circumstances.
3. If the user asks for a destination, city, or service that is NOT present in the verified database, clearly inform the user that live verified inventory for that specific location is not yet registered in the platform, and provide general cultural advice without fabricating fake prices or listings.
4. For travel itineraries:
   - Provide a realistic day-by-day plan with morning, afternoon, and evening segments.
   - Calculate an exact budget breakdown using the verified numeric prices from the database.
   - Mention crowd levels and best times to visit to help travelers avoid congestion.
5. Multilingual Support: If the user communicates in Telugu, Hindi, Spanish, Japanese, or another language, respond naturally in that language while maintaining the verified factual details.
6. Local Impact: Highlight local heritage, sustainable travel habits, and authentic artisan crafts.
7. Format with clear Markdown headings (###), bullet points, and bold text for readability.

VERIFIED TOURISM DATABASE:
${groundingContext}
`;

  // Format conversational contents for Gemini API
  const contents = [];

  // Add previous history turns if present
  if (Array.isArray(history) && history.length > 0) {
    for (const h of history.slice(-6)) {
      if (h.role && h.text) {
        contents.push({
          role: h.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: h.text }]
        });
      }
    }
  }

  // Append current user message with system grounding instruction
  const userPrompt = `${systemInstruction}\n\nUSER TRAVEL QUERY / REQUEST: "${message}"\nUSER PREFERENCES: Destination: ${preferences.destination || 'Not specified'}, Budget: ₹${preferences.budget || 'Any'}, Travelers: ${preferences.travelers || 1}, Days: ${preferences.days || 'Flexible'}`;
  
  contents.push({
    role: 'user',
    parts: [{ text: userPrompt }]
  });

  const preferredModel = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
  const modelsToTry = [preferredModel, 'gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro'];
  const uniqueModels = [...new Set(modelsToTry)];

  let lastError = null;

  for (const model of uniqueModels) {
    try {
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: contents,
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 2048
          }
        }),
        signal: AbortSignal.timeout(25000)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errMsg = errorData.error?.message || `HTTP ${response.status} ${response.statusText}`;
        lastError = new Error(`Gemini API (${model}) failed: ${errMsg}`);
        console.warn(`[AI Service] Model ${model} returned error:`, errMsg);
        continue; // Try next fallback model
      }

      const data = await response.json();
      const candidate = data.candidates?.[0];
      const replyText = candidate?.content?.parts?.[0]?.text;

      if (!replyText) {
        throw new Error('No response content returned by Gemini API.');
      }

      // Detect which verified database records were recommended
      const mentionedPlaces = TOURISM_DATABASE.filter(p => {
        const nameMatch = replyText.toLowerCase().includes(p.name.toLowerCase().split(' ')[0]);
        return nameMatch;
      });

      return {
        success: true,
        reply: replyText,
        groundedPlaces: mentionedPlaces.slice(0, 4),
        modelUsed: model,
        isConfigured: true
      };
    } catch (err) {
      lastError = err;
      console.warn(`[AI Service] Error calling ${model}:`, err.message);
    }
  }

  // If all models failed
  return {
    success: false,
    error: 'API_REQUEST_FAILED',
    message: `AI service request failed: ${lastError?.message || 'Unknown network error'}. Please check your GEMINI_API_KEY and network connection.`,
    isConfigured: true
  };
}

module.exports = {
  generateTourismAdvice,
  findRelevantPlaces
};
