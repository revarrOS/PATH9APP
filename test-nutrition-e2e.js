const SUPABASE_URL = 'https://hdeeowrlzdzegleswxtn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkZWVvd3JsemR6ZWdsZXN3eHRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0MDk4OTgsImV4cCI6MjA4MTk4NTg5OH0.wb5p2qfm0kYV6ggqek3bKZL2yD8BMkY9xu_Nw9SrpgI';

const MEAL_IMAGE_BASE64 = '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wAARCABkAGQDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlbaWmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD9U6KKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigD/9k=';

async function runTest() {
  console.log('=== NUTRITION E2E TEST ===\n');

  console.log('Step 1: Call analyze-nutrition-image edge function...');
  const analyzeUrl = `${SUPABASE_URL}/functions/v1/analyze-nutrition-image`;

  const analyzeResponse = await fetch(analyzeUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ image_base64: MEAL_IMAGE_BASE64 })
  });

  console.log(`Status: ${analyzeResponse.status}`);
  const analysisResult = await analyzeResponse.json();
  console.log('Response:', JSON.stringify(analysisResult, null, 2));

  if (!analysisResult.success) {
    console.error('\n❌ FAILED: Edge function did not return success');
    process.exit(1);
  }

  console.log('\n✅ Edge function returned success\n');

  console.log('Step 2: Get auth token for test user...');
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'test@example.com',
    password: 'testpassword123'
  });

  if (authError) {
    console.error('Auth error:', authError);
    process.exit(1);
  }

  console.log('Authenticated as:', authData.user.email);

  console.log('\nStep 3: Insert into nutrition_entries...');
  const { data: insertData, error: insertError } = await supabase
    .from('nutrition_entries')
    .insert({
      user_id: authData.user.id,
      entry_date: new Date().toISOString(),
      entry_type: 'meal',
      image_path: 'test/meal.jpg',
      ai_interpretation: analysisResult.analysis,
      user_notes: 'E2E test entry'
    })
    .select()
    .single();

  if (insertError) {
    console.error('Insert error:', insertError);
    process.exit(1);
  }

  console.log('Inserted entry ID:', insertData.id);

  console.log('\nStep 4: Query database to verify...');
  const { data: queryData, error: queryError } = await supabase
    .from('nutrition_entries')
    .select('id, entry_type, ai_interpretation, created_at')
    .eq('id', insertData.id)
    .single();

  if (queryError) {
    console.error('Query error:', queryError);
    process.exit(1);
  }

  console.log('\n=== DATABASE QUERY RESULT ===');
  console.log(JSON.stringify(queryData, null, 2));

  const hasAiInterpretation = queryData.ai_interpretation && Object.keys(queryData.ai_interpretation).length > 0;
  const hasSupportAreas = queryData.ai_interpretation?.supportAreas?.length > 0;

  console.log('\n=== VERIFICATION ===');
  console.log(`ai_interpretation populated: ${hasAiInterpretation ? '✅' : '❌'}`);
  console.log(`support_areas populated: ${hasSupportAreas ? '✅' : '❌'}`);

  if (hasAiInterpretation && hasSupportAreas) {
    console.log('\n✅ TEST PASSED: Nutrition pipeline working end-to-end');
    process.exit(0);
  } else {
    console.log('\n❌ TEST FAILED: Data not properly populated');
    process.exit(1);
  }
}

runTest().catch(error => {
  console.error('Test error:', error);
  process.exit(1);
});
