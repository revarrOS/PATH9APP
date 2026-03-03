# Architecture Pivot Summary

## What Changed

You had a critical realization: **Path9 doesn't need to build its own LLM or medical knowledge base.**

Instead, we're leveraging ChatGPT/Claude (which already understand CLL, AML, treatment protocols, etc.) and wrapping them with:
- Gemma's compassionate personality
- Safety guardrails for medical boundaries
- User journey context from your database
- Behavioral science principles (not medical facts)

## The Old Approach (Abandoned)

❌ Build a custom LLM or fine-tune models
❌ Create a medical knowledge database
❌ Implement complex RAG with embeddings
❌ Train on medical literature
❌ Teach the AI about blood cancer

**Problems**:
- Massive development effort
- Weeks/months of work before MVP
- Expensive to train and maintain
- Medical accuracy concerns
- Hard to update knowledge

## The New Approach (Implemented)

✅ Use OpenAI or Anthropic APIs (they know medical stuff)
✅ Send them Gemma's personality as system prompts
✅ Add user context from YOUR database
✅ Safety guardrails BEFORE and AFTER LLM calls
✅ Canon system for behavioral principles (not medical facts)

**Benefits**:
- Works TODAY (API keys are already configured)
- Focus on Gemma's unique value (personality, boundaries, journey tracking)
- Iterate quickly on prompts, not model training
- SOTA conversational AI quality
- Easy to maintain and update

## What's Already Built and Working

### 1. LLM Integration ✅

**Files**:
- `supabase/functions/orchestrate/llm-openai.ts` - OpenAI integration
- `supabase/functions/orchestrate/llm-anthropic.ts` - Anthropic integration
- `supabase/functions/orchestrate/llm-adapter.ts` - Provider abstraction
- `supabase/functions/orchestrate/llm-config.ts` - Configuration

**Status**: READY. API keys configured in `.env`. Defaults to Anthropic's `claude-3-5-sonnet-20241022`.

### 2. Gemma's Personality System ✅

**Files**:
- `config/prompts/gemma-core-system.txt` - Who Gemma is, how she talks, what she never does
- `config/prompts/boundary-safety.txt` - Medical, emotional, spiritual boundaries
- `config/prompts/state-template.txt` - User context hydration
- `config/prompts/knowledge-canon-usage.txt` - How to use canon knowledge

**Status**: READY. These get sent to ChatGPT/Claude as system prompts.

### 3. Canon System (Behavioral Principles) ✅

**Files**:
- `config/canon/habit-formation-principles.md`
- `config/canon/goal-setting-basics.md`
- `config/canon/reflection-practices.md`
- `config/canon/overcoming-resistance.md`

**Purpose**: NOT medical facts. These are behavioral science principles for supporting behavior change.

**Status**: READY. Can be expanded with more pathway-specific principles.

### 4. Safety Guardrails ✅

**Files**:
- `supabase/functions/safety-guardrails/service.ts` - Detection logic
- `supabase/functions/safety-guardrails/index.ts` - Edge function endpoint

**Features**:
- **Input Safety**: Detects crisis language, suicidal ideation, catastrophizing
- **Output Validation**: Detects medical advice, diagnoses, treatment recommendations
- **Interventions**: Crisis resources, grounding exercises, calming protocols

**Status**: ENHANCED. Now validates both input (pre-LLM) and output (post-LLM).

### 5. Orchestration Flow ✅

**File**: `supabase/functions/orchestrate/index.ts`

**Flow**:
1. Validate auth and request envelope
2. Check rate limits
3. Safety check input (crisis detection)
4. Classify intent
5. Route to specialized services if needed (medical translation, timeline inference, etc.)
6. Retrieve relevant canon chunks (behavioral principles)
7. Assemble prompts (Gemma + user context + canon)
8. Call OpenAI/Anthropic
9. Validate output (medical advice check)
10. Audit and store
11. Return response

**Status**: READY. Full end-to-end flow implemented.

### 6. Specialized Services ✅

All pathway-specific services are built:

**Medical Journey**:
- `translate-medical` - Plain language medical term translation
- `understand-appointment` - Parse appointment notes
- `infer-timeline` - Build medical timeline from messages
- `generate-education` - Create educational content

**Nutrition Journey**:
- `nutrition-questions` - Generate personalized questions
- `nutrition-reality` - Reality check on current habits
- `nutrition-insight` - Analyze nutrition logs
- `smoothie-generator` - Create smoothie recipes
- `supplement-checker` - Check supplement interactions

**Meditation Journey**:
- `meditation-selector` - Choose meditation type
- `meditation-session` - Guide meditation
- `meditation-adapt` - Adjust based on feedback
- `stillness-starter` - Beginner meditation intro

**Movement Journey**:
- `movement-activity` - Log and analyze activities
- `movement-reality-explainer` - Explain movement reality
- `walking-medicine-guide` - Walking as medicine
- `permission-to-rest` - Normalize rest needs

**Mindfulness Journey**:
- `emotion-check-in` - Track emotional state
- `breath-guide` - Breathing exercises
- `normalize-emotion` - Validate feelings
- `journal-entry` - Structured journaling
- `journal-summary` - Summarize journal entries
- `meaning-explorer` - Explore meaning-making

**Status**: ALL BUILT. Ready to be called by orchestrator based on intent classification.

### 7. Database Schema ✅

All tables are created:
- User isolation (profiles, audit_logs)
- Medical journey (timeline, appointments, symptoms)
- Nutrition pathway (profiles, logs, questions, recipes)
- Meditation pathway (sessions, progress, history)
- Movement pathway (activities, goals, reflections)
- Mindfulness pathway (emotions, journal entries, breathing sessions)
- Canon knowledge (versions, chunks)
- Safety (interventions)

**Status**: COMPLETE. Migrations applied.

### 8. UI Components ✅

All React Native components are built and ready:
- Journey-specific screens (Medical, Nutrition, Meditation, Movement, Mindfulness)
- Progress indicators
- Input components (emotion selectors, energy check-ins, consumption styles)
- Educational components (diagnosis explainer, immune system diagram, reaction normalizer)
- Session components (timers, visualizers, guidance cards)

**Status**: COMPLETE. Ready for integration with services.

## What Changed in This Pivot

### Enhanced Safety Guardrails

**New**: `validateOutput()` method in `SafetyGuardrails` class

**Purpose**: Check LLM responses for medical advice violations AFTER the LLM responds.

**Patterns Detected**:
- Medical advice ("you should take", "I recommend")
- Diagnoses ("you have", "test results show you have")
- Treatment recommendations ("start this treatment", "don't take that medication")

**Action**: If violations detected, replace with safe refusal message.

### Updated Orchestration Flow

**New**: Output validation step added between LLM call and response

```typescript
// After LLM responds successfully
const outputValidation = await validateOutput(llmResponse);
if (!outputValidation.is_safe) {
  finalResponse = outputValidation.suggested_replacement;
}
```

**Audit Events Added**:
- `output_validation_attempt`
- `output_validation_complete`
- `output_replaced` (if violations found)

### Documentation Created

**New Files**:
1. `docs/ARCHITECTURE_OVERVIEW.md` - Complete system architecture
2. `docs/QUICK_START_GUIDE.md` - Testing guide
3. `docs/ARCHITECTURE_PIVOT_SUMMARY.md` - This document

## What You DON'T Need to Build

❌ Custom LLM training
❌ Fine-tuning on medical data
❌ Vector embeddings for medical knowledge
❌ Complex RAG retrieval systems
❌ Medical fact database

ChatGPT and Claude already know this stuff.

## What You DO Need to Build (Future Work)

### 1. Refine Gemma's Personality

Iterate on:
- `config/prompts/gemma-core-system.txt` - Adjust tone, add more personality nuances
- `config/prompts/boundary-safety.txt` - Add more boundary scenarios
- Test with real users and refine based on feedback

### 2. Expand Canon System

Add more behavioral principles:
- Blood cancer specific coping strategies
- Caregiver support principles
- Treatment decision-making frameworks
- Relapse emotional patterns
- Survivorship identity work

### 3. Add More Safety Patterns

Enhance detection in `safety-guardrails/service.ts`:
- More medical advice patterns
- Spiritual boundary violations
- Dependency-inducing language
- False hope or toxic positivity

### 4. Build Conversation Memory

Store and retrieve conversation history:
- Summary generation after conversations
- Long-term memory of user preferences
- Pattern recognition across sessions
- Personalization over time

### 5. Frontend Integration

Connect UI components to services:
- Wire up Gemma chat interface
- Connect pathway screens to edge services
- Implement real-time updates
- Add loading states and error handling

### 6. Analytics & Monitoring

Track system performance:
- LLM token usage and costs
- Safety intervention frequency
- Conversation quality metrics
- User satisfaction scores
- Edge function latency

## Cost Estimates

### OpenAI (gpt-4o-mini)
- **Cost**: ~$0.0002 per message
- **Speed**: Fast (~1-2s response)
- **Quality**: Good for casual conversation
- **Recommended for**: MVP testing, high volume

### Anthropic (claude-3-5-sonnet)
- **Cost**: ~$0.0045 per message
- **Speed**: Medium (~2-3s response)
- **Quality**: Excellent for nuanced, compassionate responses
- **Recommended for**: Production, Gemma's personality shines

**Monthly Estimate** (10,000 messages):
- OpenAI: ~$2/month
- Anthropic: ~$45/month

Both are affordable for MVP and beyond.

## HIPAA/GDPR Compliance

✅ **Compliant Strategy**:
1. Use HIPAA-compliant API endpoints (OpenAI and Anthropic both offer BAAs)
2. Don't send PHI in messages (use "User has CLL" not "John Smith has CLL")
3. Store data in YOUR Supabase (encrypted, you control it)
4. Audit every interaction
5. Users consent to AI usage in terms of service

Path9 implements all of these safeguards.

## Testing Readiness

The system is READY TO TEST:

1. ✅ API keys configured in `.env`
2. ✅ Edge functions deployed
3. ✅ Database schema complete
4. ✅ Safety guardrails active (input + output)
5. ✅ Gemma's personality defined
6. ✅ Orchestration flow complete

**Next Step**: Follow `docs/QUICK_START_GUIDE.md` to test the complete flow.

## Key Takeaways

1. **You DON'T need to build an LLM** - ChatGPT/Claude already know medical stuff
2. **Your IP is Gemma** - Personality, boundaries, journey tracking, behavioral principles
3. **Safety is layered** - Input check → LLM call → Output check
4. **Canon is for behavior change** - Not medical facts
5. **System is READY** - Just needs testing and refinement

This pivot saves you months of development time and gets you to market faster with better quality conversations.

## What Makes This Valuable

You're not building a medical AI.

You're building a **compassionate companion with guardrails** that uses the best AI available while ensuring safety, boundaries, and journey-appropriate support.

That's valuable. That's defensible IP. That's what people need.
