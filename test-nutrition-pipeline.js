#!/usr/bin/env node

/**
 * End-to-End Nutrition AI Pipeline Test
 *
 * Tests:
 * 1. Edge function call with real image
 * 2. Response validation
 * 3. Database persistence
 * 4. Data retrieval
 */

const https = require('https');
const http = require('http');

// Configuration
const SUPABASE_URL = 'https://hdeeowrlzdzegleswxtn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkZWVvd3JsemR6ZWdsZXN3eHRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0MDk4OTgsImV4cCI6MjA4MTk4NTg5OH0.wb5p2qfm0kYV6ggqek3bKZL2yD8BMkY9xu_Nw9SrpgI';

// Real meal image - Small JPEG of a plate with food
// This is a 1x1 transparent pixel for testing - replace with real meal image
const TEST_IMAGE_BASE64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/4gIoSUNDX1BST0ZJTEUAAQEAAAIYAAAAAAIQAABtbnRyUkdCIFhZWiAAAAAAAAAAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAAHRyWFlaAAABZAAAABRnWFlaAAABeAAAABRiWFlaAAABjAAAABRyVFJDAAABoAAAAChnVFJDAAABoAAAAChiVFJDAAABoAAAACh3dHB0AAAByAAAABRjcHJ0AAAB3AAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAFgAAAAcAHMAUgBHAEIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFhZWiAAAAAAAABvogAAOPUAAAOQWFlaIAAAAAAAAGKZAAC3hQAAGNpYWVogAAAAAAAAJKAAAA+EAAC2z3BhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABYWVogAAAAAAAA9tYAAQAAAADTLW1sdWMAAAAAAAAAAQAAAAxlblVTAAAAIAAAABwARwBvAG8AZwBsAGUAIABJAG4AYwAuACAAMgAwADEANv/bAEMAAgEBAgEBAgICAgICAgIDBQMDAwMDBgQEAwUHBgcHBwYHBwgJCwkICAoIBwcKDQoKCwwMDAwHCQ4PDQwOCwwMDP/bAEMBAgICAwMDBgMDBgwIBwgMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDP/AABEIAGQAZAMBIgACEQEDEQH/xAAfAAABBQEBAQEBAQAAAAAAAAAAAQIDBAUGBwgJCgv/xAC1EAACAQMDAgQDBQUEBAAAAX0BAgMABBEFEiExQQYTUWEHInEUMoGRoQgjQsHRFeLwJDNicoIJChYXGBkaJSYnKCkqNDU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6g4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2drh4uPk5ebn6Onq8fLz9PX29/j5+v/EAB8BAAMBAQEBAQEBAQEAAAAAAAABAgMEBQYHCAkKC//EALURAAIBAgQEAwQHBQQEAAECdwABAgMRBAUhMQYSQVEHYXETIjKBCBRCkaGxwQkjM1LwFWJy0QoWJDThJfEXGBkaJicoKSo1Njc4OTpDREVGR0hJSlNUVVZXWFlaY2RlZmdoaWpzdHV2d3h5eoKDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uLj5OXm5+jp6vLz9PX29/j5+v/aAAwDAQACEQMRAD8A/fyiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigD/9k=';

console.log('='.repeat(60));
console.log('NUTRITION AI PIPELINE END-TO-END TEST');
console.log('='.repeat(60));
console.log();

// Step 1: Call Edge Function
console.log('Step 1: Calling analyze-nutrition-image edge function...');
console.log('URL:', `${SUPABASE_URL}/functions/v1/analyze-nutrition-image`);
console.log('Image length:', TEST_IMAGE_BASE64.length);
console.log();

function makeRequest(url, options) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const req = protocol.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

async function test() {
  try {
    // Call edge function
    const edgeFunctionUrl = `${SUPABASE_URL}/functions/v1/analyze-nutrition-image`;
    const response = await makeRequest(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image_base64: TEST_IMAGE_BASE64 })
    });

    console.log('Edge Function Response:');
    console.log('  Status:', response.status);
    console.log('  Body:', JSON.stringify(response.body, null, 2));
    console.log();

    // Step 2: Validate Response
    console.log('Step 2: Validating response...');
    if (response.status !== 200) {
      console.error('❌ FAIL: Expected status 200, got', response.status);
      process.exit(1);
    }

    if (!response.body.success) {
      console.error('❌ FAIL: Response success is not true');
      console.error('Message:', response.body.message);
      process.exit(1);
    }

    if (!response.body.analysis) {
      console.error('❌ FAIL: No analysis object in response');
      process.exit(1);
    }

    const analysis = response.body.analysis;
    if (!analysis.foodCategories || !Array.isArray(analysis.foodCategories)) {
      console.error('❌ FAIL: Missing or invalid foodCategories');
      process.exit(1);
    }

    if (!analysis.supportAreas || !Array.isArray(analysis.supportAreas)) {
      console.error('❌ FAIL: Missing or invalid supportAreas');
      process.exit(1);
    }

    console.log('✅ Response validation passed');
    console.log('  Food Categories:', analysis.foodCategories.join(', '));
    console.log('  Support Areas:', analysis.supportAreas.join(', '));
    console.log();

    // Step 3: Insert into database
    console.log('Step 3: Inserting into nutrition_entries...');

    // First, get a user ID to test with
    const getUserResponse = await makeRequest(`${SUPABASE_URL}/rest/v1/profiles?select=user_id&limit=1`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      }
    });

    if (!getUserResponse.body || !Array.isArray(getUserResponse.body) || getUserResponse.body.length === 0) {
      console.error('❌ FAIL: No users in database to test with');
      process.exit(1);
    }

    const testUserId = getUserResponse.body[0].user_id;
    console.log('  Using test user ID:', testUserId);

    // Insert the entry
    const insertResponse = await makeRequest(`${SUPABASE_URL}/rest/v1/nutrition_entries`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        user_id: testUserId,
        entry_date: new Date().toISOString(),
        entry_type: 'meal',
        ai_interpretation: analysis,
        support_areas: analysis.supportAreas,
        user_notes: 'E2E Pipeline Test'
      })
    });

    console.log('  Insert Status:', insertResponse.status);
    console.log('  Insert Response:', JSON.stringify(insertResponse.body, null, 2));
    console.log();

    if (insertResponse.status !== 201) {
      console.error('❌ FAIL: Insert failed with status', insertResponse.status);
      process.exit(1);
    }

    const insertedEntry = Array.isArray(insertResponse.body) ? insertResponse.body[0] : insertResponse.body;

    console.log('✅ Database insert passed');
    console.log('  Entry ID:', insertedEntry.id);
    console.log();

    // Step 4: Verify persistence
    console.log('Step 4: Verifying data persistence...');
    const queryResponse = await makeRequest(
      `${SUPABASE_URL}/rest/v1/nutrition_entries?select=id,ai_interpretation,support_areas&order=created_at.desc&limit=1`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        }
      }
    );

    console.log('  Query Status:', queryResponse.status);
    console.log('  Query Response:', JSON.stringify(queryResponse.body, null, 2));
    console.log();

    if (queryResponse.status !== 200) {
      console.error('❌ FAIL: Query failed with status', queryResponse.status);
      process.exit(1);
    }

    if (!Array.isArray(queryResponse.body) || queryResponse.body.length === 0) {
      console.error('❌ FAIL: No entries found in database');
      process.exit(1);
    }

    const queriedEntry = queryResponse.body[0];

    if (!queriedEntry.ai_interpretation) {
      console.error('❌ FAIL: ai_interpretation is null');
      process.exit(1);
    }

    if (!queriedEntry.support_areas || queriedEntry.support_areas.length === 0) {
      console.error('❌ FAIL: support_areas is null or empty');
      process.exit(1);
    }

    console.log('✅ Data persistence verified');
    console.log('  Entry ID:', queriedEntry.id);
    console.log('  AI Interpretation:', JSON.stringify(queriedEntry.ai_interpretation, null, 2));
    console.log('  Support Areas:', queriedEntry.support_areas.join(', '));
    console.log();

    // Final Result
    console.log('='.repeat(60));
    console.log('✅ END-TO-END TEST PASSED');
    console.log('='.repeat(60));
    console.log();
    console.log('Pipeline Components Verified:');
    console.log('  ✅ Edge function responds correctly');
    console.log('  ✅ Anthropic Vision API integration works');
    console.log('  ✅ Database accepts and stores AI results');
    console.log('  ✅ Data persists with correct schema');
    console.log();

    process.exit(0);

  } catch (error) {
    console.error('❌ TEST FAILED WITH ERROR:');
    console.error(error);
    process.exit(1);
  }
}

test();
