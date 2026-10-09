const assert = require('assert');
const { TOURISM_DATABASE } = require('../data/tourismData');
const { findRelevantPlaces, generateTourismAdvice } = require('../services/aiService');

async function runTests() {
  console.log('🧪 Starting StoryCraft Local AI Suite Tests...\n');
  let passed = 0;
  let total = 0;

  function test(name, fn) {
    total++;
    try {
      fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(`     Error: ${err.message}`);
    }
  }

  async function testAsync(name, fn) {
    total++;
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(`     Error: ${err.message}`);
    }
  }

  // Test 1: Verified Tourism Database Integrity
  test('Verified Database Integrity (Real Places, Prices, Ratings)', () => {
    assert(TOURISM_DATABASE.length >= 10, 'Database should contain at least 10 verified records');
    
    // Check specific cities
    const hydPlaces = TOURISM_DATABASE.filter(p => p.location === 'Hyderabad');
    assert(hydPlaces.length >= 5, 'Should have verified Hyderabad places');
    
    const tirupatiPlaces = TOURISM_DATABASE.filter(p => p.location === 'Tirupati');
    assert(tirupatiPlaces.length >= 4, 'Should have verified Tirupati places');

    const apPlaces = TOURISM_DATABASE.filter(p => p.state === 'Andhra Pradesh');
    assert(apPlaces.length >= 5, 'Should have verified Andhra Pradesh places');

    // Verify all records have real prices, non-empty hours, and valid ratings
    for (const p of TOURISM_DATABASE) {
      assert(typeof p.price === 'number' && p.price >= 0, `Place ${p.id} must have valid numeric price`);
      assert(p.rating >= 4.0 && p.rating <= 5.0, `Place ${p.id} must have verified rating between 4 and 5`);
      assert(p.hours && p.hours.length > 0, `Place ${p.id} must have operating hours`);
      assert(Array.isArray(p.tags) && p.tags.length > 0, `Place ${p.id} must have tags`);
    }
  });

  // Test 2: AI Grounding Matcher for User Query 1: Hyderabad under 3000
  test('AI Grounding: Hyderabad trip within ₹3,000', () => {
    const matches = findRelevantPlaces('Plan a two-day trip to Hyderabad within ₹3,000', { budget: 3000 });
    assert(matches.length > 0, 'Should find relevant places for Hyderabad');
    const names = matches.map(m => m.name.toLowerCase());
    
    const hasCharminarOrGolconda = names.some(n => n.includes('charminar') || n.includes('golconda'));
    assert(hasCharminarOrGolconda, 'Should match Charminar or Golconda Fort');

    // Budget check: all matched activities should be within reasonable bounds
    const budgetItems = matches.filter(m => m.price <= 3000);
    assert(budgetItems.length > 0, 'Should return budget-friendly options');
  });

  // Test 3: AI Grounding Matcher for User Query 2: Family-friendly destinations in Andhra Pradesh
  test('AI Grounding: Family-friendly destinations in Andhra Pradesh', () => {
    const matches = findRelevantPlaces('Suggest family-friendly tourist destinations in Andhra Pradesh');
    assert(matches.length > 0, 'Should find destinations for Andhra Pradesh');
    
    const hasFamilySpots = matches.some(m => 
      m.tags.includes('family-friendly') && (m.state === 'Andhra Pradesh' || m.location === 'Andhra Pradesh')
    );
    assert(hasFamilySpots, 'Should match family-friendly spots in Andhra Pradesh (e.g. Araku Valley, Tirupati)');
  });

  // Test 4: AI Grounding Matcher for User Query 3: Budget accommodation near Tirupati
  test('AI Grounding: Budget accommodation near Tirupati', () => {
    const matches = findRelevantPlaces('Find budget accommodation near Tirupati');
    assert(matches.length > 0, 'Should find hotels in Tirupati');
    
    const hotels = matches.filter(m => m.category === 'hotels' && m.location === 'Tirupati');
    assert(hotels.length > 0, 'Should identify Tirupati hotels');
    assert(hotels.some(h => h.id === 'tir-minerva-grand'), 'Should include Hotel Minerva Grand Tirupati');
  });

  // Test 5: AI Grounding Matcher for User Query 4: Historical places and local food
  test('AI Grounding: Historical places and local food', () => {
    const matches = findRelevantPlaces('Create a one-day itinerary with historical places and local food');
    assert(matches.length > 0, 'Should find history and food places');
    
    const hasHistory = matches.some(m => m.tags.includes('history') || m.tags.includes('heritage') || m.tags.includes('monument'));
    const hasFood = matches.some(m => m.category === 'restaurants' || m.tags.includes('food') || m.tags.includes('biryani'));
    assert(hasHistory, 'Should include historical places');
    assert(hasFood, 'Should include authentic local food restaurants');
  });

  // Test 6: Secure Missing API Key Handling (Never fake or claim connected when key is absent)
  await testAsync('AI Service: Honest Missing API Key Handling (Phase 2 & Phase 5 requirement)', async () => {
    // Ensure clean state without mock key
    const oldKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;

    const result = await generateTourismAdvice({
      message: 'Plan a two-day trip to Hyderabad within ₹3,000.'
    });

    assert.strictEqual(result.success, false, 'Should fail gracefully when API key is missing');
    assert.strictEqual(result.error, 'MISSING_API_KEY', 'Should explicitly return MISSING_API_KEY error code');
    assert.strictEqual(result.isConfigured, false, 'isConfigured should be false');
    assert(result.message.includes('GEMINI_API_KEY is not configured in .env'), 'Message should instruct user to set key');

    // Restore key
    if (oldKey) process.env.GEMINI_API_KEY = oldKey;
  });

  // Test 7: Express Server Endpoints Test
  await testAsync('Express Server Integration (/api/health and /api/places)', async () => {
    const app = require('../server');
    const http = require('http');

    const server = http.createServer(app);
    await new Promise(resolve => server.listen(0, resolve));
    const port = server.address().port;

    try {
      // Test /api/health
      const healthRes = await fetch(`http://localhost:${port}/api/health`);
      assert.strictEqual(healthRes.status, 200, '/api/health must return 200 OK');
      const healthData = await healthRes.json();
      assert.strictEqual(healthData.status, 'ok', 'Status must be ok');
      assert.strictEqual(healthData.databaseRecordsCount, TOURISM_DATABASE.length, 'Database count should match');

      // Test /api/places?location=Tirupati
      const placesRes = await fetch(`http://localhost:${port}/api/places?location=Tirupati`);
      assert.strictEqual(placesRes.status, 200, '/api/places must return 200 OK');
      const placesData = await placesRes.json();
      assert(placesData.count >= 4, 'Should return Tirupati places');

      // Test /api/chat with empty input
      const chatRes = await fetch(`http://localhost:${port}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: '' })
      });
      assert.strictEqual(chatRes.status, 400, 'Empty message must return 400 Bad Request');

      // Test /api/chat without API key returns 401
      const chatNoKeyRes = await fetch(`http://localhost:${port}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Plan a trip to Hyderabad' })
      });
      assert.strictEqual(chatNoKeyRes.status, 401, 'Unconfigured API key must return 401 Unauthorized');
      const chatNoKeyData = await chatNoKeyRes.json();
      assert.strictEqual(chatNoKeyData.error, 'MISSING_API_KEY');

    } finally {
      await new Promise(resolve => server.close(resolve));
    }
  });

  console.log(`\n📊 Test Results: ${passed}/${total} passed (${Math.round((passed/total)*100)}% success rate)`);
  if (passed === total) {
    console.log('🎉 All tests passed successfully!');
  } else {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
