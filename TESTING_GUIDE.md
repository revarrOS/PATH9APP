# Gemma Testing Guide - Unit 7

## Quick Start Testing

### 1. Deploy Edge Functions

First, deploy the gemma-respond function (if not already deployed):

```bash
# Deploy gemma-respond
# (Use Supabase CLI or your deployment method)
```

### 2. Start the Mobile App

```bash
npm run dev
```

Scan QR code with Expo Go app on your phone.

### 3. Create Test Account

1. App opens to sign-in screen
2. Tap "Don't have an account? Sign up"
3. Enter email: `test@example.com`
4. Enter password: `testpass123`
5. Tap "Sign Up"
6. Should redirect to Today tab

### 4. Test Conversation Flow

**Test Message 1: Overwhelmed**
```
Input: "I'm feeling overwhelmed today"
Expected: Warm, empathetic response acknowledging feeling
```

**Test Message 2: Starting Habits**
```
Input: "I want to build a daily meditation habit but don't know where to start"
Expected: References meditation concepts, 2-minute rule, gentle guidance
```

**Test Message 3: Resistance**
```
Input: "I keep putting off things I know I should do"
Expected: Acknowledges resistance, non-judgmental tone, exploration vs commands
```

### 5. Observe Response Quality

Check for:
- ✅ Warm, empathetic tone
- ✅ Non-prescriptive language (exploration, not commands)
- ✅ References to canon concepts (if applicable)
- ✅ Maintains Gemma persona
- ✅ Directly addresses user's message
- ❌ No medical advice
- ❌ No commands ("You should...", "You must...")
- ❌ No judgment or criticism

### 6. Test UI Behavior

**Input Validation:**
- Empty message → Send button disabled ✓
- Type message → Send button enabled ✓
- Send → Input disabled during load ✓

**Loading States:**
- "Thinking…" appears below input ✓
- Button shows spinner ✓
- Input disabled ✓

**Response Display:**
- Response appears in card below input ✓
- Input cleared after success ✓
- Footer "Not medical advice" always visible ✓

**Error Handling:**
- Network error → Red error card ✓
- Rate limit → Clear error message ✓
- Previous response preserved on error ✓

### 7. Test No History

1. Send message: "My name is Alice"
2. Wait for response
3. Send message: "What is my name?"
4. Expected: Gemma does NOT know the name (no memory) ✓

### 8. Test Static Tabs

**My Path Tab:**
- Shows 5 pillar cards ✓
- Each has title + description ✓
- No interactive elements ✓

**Library Tab:**
- Shows 3 practice items ✓
- Simple list ✓
- No playback or content ✓

## Common Issues

### "Not authenticated" error
- Sign out and sign in again
- Check .env has correct SUPABASE_URL and ANON_KEY

### "Failed to fetch" error
- Check edge function is deployed
- Verify OPENAI_API_KEY or ANTHROPIC_API_KEY set server-side

### Response seems generic
- Check journey_state in gemma.service.ts
- Verify canon chunks exist in database
- Test with different pillar values

### UI doesn't update
- Check network tab for API errors
- Verify response structure matches expected format

## Tone Evaluation Checklist

Use this to evaluate each response:

**Warmth:**
- [ ] Acknowledges user's feeling/situation
- [ ] Uses empathetic language
- [ ] Feels personal, not robotic

**Non-Prescriptive:**
- [ ] No commands ("do this", "you should")
- [ ] Uses exploration language ("might explore", "could consider")
- [ ] Offers possibilities, not demands

**Gemma Persona:**
- [ ] Curious, not expert
- [ ] Companion, not therapist
- [ ] Guide, not instructor

**Safety:**
- [ ] No medical advice
- [ ] No diagnosis or treatment
- [ ] Acknowledges limitations

**Canon Integration:**
- [ ] References relevant concepts (if canon included)
- [ ] Natural integration (not forced)
- [ ] Maintains conversational flow

## Sample Test Scenarios

### Scenario 1: Onboarding

**Context:** New user, first interaction

**Message:** "Hi, I'm not sure what this app is about"

**Expected Response:**
- Introduces Gemma as companion
- Explains 5 pillars briefly
- Invites exploration
- Warm, welcoming tone

### Scenario 2: Specific Question

**Context:** User asks about habit formation

**Message:** "How do I stick to new habits I'm trying to build?"

**Expected Response:**
- Acknowledges challenge
- May reference habit formation principles
- Offers exploration (not prescription)
- Calm, measured tone

### Scenario 3: Emotional Expression

**Context:** User expresses difficult emotion

**Message:** "Everything feels like too much right now"

**Expected Response:**
- Validates feeling
- Doesn't minimize or fix
- Offers presence, not solutions
- Gentle, compassionate tone

### Scenario 4: Practical Request

**Context:** User wants specific practice

**Message:** "Can you give me a breathing exercise?"

**Expected Response:**
- Acknowledges request
- May offer simple practice
- Invites experimentation
- Clear, calm instructions

## Performance Benchmarks

**Target Response Times:**
- Message send → Response: 2-6 seconds ✓
- Tab navigation: < 100ms ✓
- Input typing: Instant ✓

**Target Quality:**
- Response relevance: High ✓
- Tone consistency: Always calm ✓
- Canon integration: When applicable ✓

## Next Steps After Testing

1. **Document Findings:**
   - Which responses felt right?
   - Which felt off?
   - What tone adjustments needed?

2. **Adjust journey_state:**
   - Change pillar
   - Adjust confidence_level, care_load, emotional_load
   - Test impact on responses

3. **Iterate on Canon:**
   - Add/edit canon documents
   - Test retrieval matching
   - Verify integration in responses

4. **Refine Prompts:**
   - Adjust core system prompt
   - Tune state template
   - Test boundary cases

## Reporting Issues

When reporting issues, include:
1. Test account used
2. Exact message sent
3. Response received
4. Expected vs actual behavior
5. Screenshots (if UI issue)
6. Audit log entries (request_id)

## Success Criteria

Ready to proceed when:
- ✅ Responses consistently warm and non-prescriptive
- ✅ Canon integration feels natural
- ✅ UI interactions smooth and calm
- ✅ No crashes or errors
- ✅ Tone meets quality bar
- ✅ All test scenarios pass

## Advanced Testing

### Test Different journey_states

Edit `services/gemma.service.ts` line 50-56:

```typescript
// Test onboarding
journey_state: {
  journey_phase: 'onboarding',
  confidence_level: 'low',
}

// Test active journey
journey_state: {
  journey_phase: 'active_journey',
  pillar: 'habit_formation',
  session_count: 5,
}

// Test reflection
journey_state: {
  journey_phase: 'reflection',
  pillar: 'mindfulness',
  session_count: 10,
}
```

### Monitor Audit Logs

```sql
SELECT
  event_type,
  metadata,
  created_at
FROM audit_events
WHERE event_type LIKE 'gemma_%'
ORDER BY created_at DESC
LIMIT 20;
```

### Check Token Usage

```sql
SELECT
  metadata->>'model' as model,
  SUM((metadata->>'total_tokens')::int) as total_tokens,
  COUNT(*) as requests
FROM audit_events
WHERE event_type = 'gemma_response_sent'
  AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY metadata->>'model';
```

## Conclusion

This minimal UI shell is designed for one purpose: evaluating Gemma's conversational tone. Keep testing focused on response quality, not features. All additional functionality will be added in future units.

Happy testing!
