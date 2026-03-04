# Path9 Architecture Overview

## The Big Picture

**Path9 does NOT build its own LLM or medical knowledge base.**

Instead, Path9 uses OpenAI (ChatGPT) or Anthropic (Claude) as the intelligence layer, but wraps them with:
- **Gemma's personality and boundaries**
- **User journey context from your database**
- **Safety guardrails before and after LLM calls**
- **Behavioral science principles (not medical facts)**

## Why This Approach?

ChatGPT and Claude already know about:
- CLL vs AML
- Watch and wait protocols
- Treatment options
- Medical terminology

What they DON'T have:
- Gemma's compassionate, boundaried personality
- Your user's specific journey context
- Safety filters for medical advice
- Behavioral change principles tailored for chronic illness

## The Architecture Flow

```
USER MESSAGE: "Why aren't they treating my CLL yet?"
         ↓
┌────────────────────────────────────────────────────┐
│  1. SAFETY CHECK (Pre-LLM)                        │
│  - Crisis language detection                       │
│  - Self-harm indicators                            │
│  - Blocked: Return crisis resources immediately    │
└────────────────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────────────────┐
│  2. CONTEXT ASSEMBLY                               │
│  - Get user context from Supabase:                 │
│    • Diagnosis: CLL                                │
│    • Diagnosed: 3 weeks ago                        │
│    • Journey phase: Chaos                          │
│    • Recent anxiety: 7/10                          │
│    • Recent journal entries                        │
└────────────────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────────────────┐
│  3. PROMPT ASSEMBLY                                │
│  - Gemma's Core System Prompt (personality)        │
│  - Boundary & Safety Rules                         │
│  - Hydrated User State (context from DB)           │
│  - Knowledge Canon (behavioral principles)         │
│  - Retrieved canon chunks (if relevant)            │
└────────────────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────────────────┐
│  4. CALL OpenAI/Anthropic                          │
│  Provider: Anthropic (configurable)                │
│  Model: claude-3-5-sonnet-20241022                 │
│  Temperature: 0.3 (low for consistency)            │
│  Max Tokens: 2000                                  │
└────────────────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────────────────┐
│  5. OUTPUT VALIDATION (Post-LLM)                   │
│  - Check for medical advice                        │
│  - Check for boundary violations                   │
│  - Check for harmful content                       │
│  - Blocked: Return soft refusal                    │
└────────────────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────────────────┐
│  6. AUDIT & STORE                                  │
│  - Log interaction in audit_logs table             │
│  - Store conversation in conversations table       │
│  - Update user journey state if needed             │
└────────────────────────────────────────────────────┘
         ↓
    RESPONSE TO USER
```

## What We Build vs What We Use

### We BUILD (Your IP):

1. **Gemma's Personality System**
   - Core system prompt (how she talks, what she never does)
   - Boundary and safety rules
   - Emotional intelligence patterns
   - File: `config/prompts/gemma-core-system.txt`

2. **User Journey Tracking**
   - Medical timeline
   - Emotional check-ins
   - Nutrition/Movement/Meditation/Mindfulness pathways
   - Journal entries
   - Database: All Supabase tables

3. **Safety Guardrails**
   - Pre-LLM: Crisis detection, intent classification
   - Post-LLM: Medical advice detection, boundary violation checks
   - Services: `safety-guardrails`, `orchestrate/enforcement.ts`

4. **Behavioral Science Canon**
   - Habit formation principles
   - Goal setting frameworks
   - Resistance patterns
   - Reflection practices
   - Files: `config/canon/*.md`

5. **UI Components & Journey Pathways**
   - All React Native components
   - Pathway logic (nutrition, meditation, etc.)
   - Progress tracking
   - Files: `components/*`, `services/*-journey.service.ts`

### We USE (External APIs):

1. **OpenAI (ChatGPT)**
   - Model: `gpt-4o-mini` (configurable)
   - They provide: Medical knowledge, natural conversation
   - Implementation: `supabase/functions/orchestrate/llm-openai.ts`

2. **Anthropic (Claude)**
   - Model: `claude-3-5-sonnet-20241022` (configurable)
   - They provide: Medical knowledge, natural conversation
   - Implementation: `supabase/functions/orchestrate/llm-anthropic.ts`

## Key Configuration

### Environment Variables (.env)

```bash
# LLM Provider (openai or anthropic)
LLM_PROVIDER=anthropic

# OpenAI Configuration
OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL=gpt-4o-mini

# Anthropic Configuration
ANTHROPIC_API_KEY=sk-ant-api03-...
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022

# LLM Settings
LLM_TEMPERATURE=0.3        # Low for consistency
LLM_MAX_TOKENS=2000        # Response length limit
LLM_TIMEOUT_MS=30000       # 30 second timeout
LLM_MAX_RETRIES=2          # Retry failed calls
```

### How It Works in Code

```typescript
// supabase/functions/orchestrate/index.ts

// 1. Get user context from database
const userContext = await getUserContextFromDatabase(userId);

// 2. Assemble prompts (Gemma + User Context + Canon)
const prompts = assemblePrompts(registry, userContext, canonContext);

// 3. Call external LLM (ChatGPT or Claude)
const llmResponse = await callLLM(prompts, requestId, userId, userMessage);

// 4. Validate output
const isValid = await validateOutput(llmResponse);

// 5. Return to user
return llmResponse;
```

## The Canon System

**What the Canon System IS:**
- Behavioral science principles (habit formation, goal setting)
- Conversation patterns for different journey phases
- Reflection frameworks
- Resistance patterns

**What the Canon System is NOT:**
- Medical knowledge base (ChatGPT already knows this)
- Treatment protocols
- Diagnostic information
- Disease-specific facts

The canon system provides **HOW** to support behavior change, not **WHAT** CLL is.

## HIPAA/GDPR Compliance

Using external LLMs is compliant IF:

1. ✅ Use HIPAA-compliant endpoints (OpenAI and Anthropic both offer BAAs)
2. ✅ Don't send PHI (use "User has CLL" not "John Smith has CLL")
3. ✅ Store data in YOUR Supabase (encrypted, you control it)
4. ✅ Audit every interaction
5. ✅ Users consent to AI usage

Path9 implements all of these safeguards.

## Why This is Better

### Simpler
- No need to train/fine-tune models
- No need to build medical knowledge base
- No need to manage embeddings/RAG complexity

### Faster to Market
- OpenAI/Anthropic APIs work immediately
- Focus on Gemma's personality and user experience
- Iterate on prompts instead of training models

### Better Quality
- ChatGPT/Claude are SOTA conversational AI
- They already understand medical context
- You focus on safety and boundaries

### More Maintainable
- Update Gemma's personality by editing prompt files
- Update behavioral principles by editing canon files
- No model retraining needed

## Next Steps

To see this in action:
1. Check `.env` for configured API keys ✅
2. Review `config/prompts/gemma-core-system.txt` to see Gemma's personality
3. Review `config/prompts/boundary-safety.txt` to see safety rules
4. Test the `/orchestrate` endpoint with a user message
5. Check `audit_logs` table to see the full flow

The system is ready to use ChatGPT/Claude with Gemma's guardrails!
