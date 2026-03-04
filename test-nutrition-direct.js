const SUPABASE_URL = 'https://hdeeowrlzdzegleswxtn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkZWVvd3JsemR6ZWdsZXN3eHRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0MDk4OTgsImV4cCI6MjA4MTk4NTg5OH0.wb5p2qfm0kYV6ggqek3bKZL2yD8BMkY9xu_Nw9SrpgI';

async function runTest() {
  console.log('=== NUTRITION DIRECT PERSISTENCE TEST ===\n');

  const mockAnalysisResult = {
    success: true,
    analysis: {
      confidence: 'high',
      foodCategories: ['grilled chicken', 'brown rice', 'steamed broccoli'],
      preparationMethod: 'grilled',
      portionEstimate: 'moderate',
      supportAreas: ['protein-rich', 'anti-inflammatory', 'easily-digestible', 'whole-grains'],
      observableNotes: 'Appears to include protein-rich foods and vegetables with whole grains'
    }
  };

  console.log('Mock analysis result:');
  console.log(JSON.stringify(mockAnalysisResult, null, 2));

  console.log('\nStep 1: Authenticate test user...');
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

  console.log('✅ Authenticated as:', authData.user.email);

  console.log('\nStep 2: Insert nutrition_entries with AI interpretation...');
  const { data: insertData, error: insertError } = await supabase
    .from('nutrition_entries')
    .insert({
      user_id: authData.user.id,
      entry_date: new Date().toISOString(),
      entry_type: 'meal',
      image_path: 'test/direct-test.jpg',
      ai_interpretation: mockAnalysisResult.analysis,
      user_notes: 'Direct persistence test'
    })
    .select()
    .single();

  if (insertError) {
    console.error('❌ Insert error:', insertError);
    process.exit(1);
  }

  console.log('✅ Inserted entry ID:', insertData.id);

  console.log('\nStep 3: Query database to verify fields...');
  const { data: queryData, error: queryError } = await supabase
    .from('nutrition_entries')
    .select('id, entry_type, ai_interpretation, created_at')
    .eq('id', insertData.id)
    .single();

  if (queryError) {
    console.error('❌ Query error:', queryError);
    process.exit(1);
  }

  console.log('\n=== RAW DATABASE QUERY RESULT ===');
  console.log(JSON.stringify(queryData, null, 2));

  console.log('\n=== FIELD VERIFICATION ===');
  const hasAiInterpretation = queryData.ai_interpretation && Object.keys(queryData.ai_interpretation).length > 0;
  const hasSupportAreas = queryData.ai_interpretation?.supportAreas?.length > 0;
  const hasConfidence = queryData.ai_interpretation?.confidence !== undefined;
  const hasFoodCategories = queryData.ai_interpretation?.foodCategories?.length > 0;

  console.log(`✅ ai_interpretation populated: ${hasAiInterpretation}`);
  console.log(`✅ support_areas populated: ${hasSupportAreas} (${queryData.ai_interpretation?.supportAreas?.length} items)`);
  console.log(`✅ confidence present: ${hasConfidence}`);
  console.log(`✅ foodCategories present: ${hasFoodCategories}`);

  console.log('\n=== SQL VERIFICATION QUERY ===');
  const { data: sqlData, error: sqlError } = await supabase.rpc('exec_sql', {
    sql: `SELECT id, entry_type, ai_interpretation->>'confidence' as confidence,
           jsonb_array_length(ai_interpretation->'supportAreas') as support_area_count,
           ai_interpretation->'supportAreas' as support_areas
           FROM nutrition_entries WHERE id = '${insertData.id}'`
  }).single();

  if (!sqlError && sqlData) {
    console.log(JSON.stringify(sqlData, null, 2));
  }

  if (hasAiInterpretation && hasSupportAreas) {
    console.log('\n✅ TEST PASSED: Nutrition pipeline persistence verified');
    process.exit(0);
  } else {
    console.log('\n❌ TEST FAILED: Required fields missing');
    process.exit(1);
  }
}

runTest().catch(error => {
  console.error('Test error:', error);
  process.exit(1);
});
