# Service Family: TRANSLATORS
## Pattern: Complex Technical → Plain English

---

## PROBLEM STATEMENT

Users in medical crisis receive information that is:
- **Inaccessible** - Written for medical professionals
- **Overwhelming** - Too much information at once
- **Alienating** - Uses jargon that creates fear/confusion
- **Context-free** - Doesn't explain why it matters to them

**Examples:**
- "Stage IIB invasive ductal carcinoma, ER+/PR+/HER2-"
- "Recommended: neoadjuvant chemotherapy followed by lumpectomy"
- "Monitor for febrile neutropenia during treatment"

---

## TRANSLATOR PATTERN

### Core Function
Take complex technical input → Return digestible, contextualized explanation

### Key Characteristics
1. **Complexity Leveling** - Adjusts to user's current understanding
2. **Jargon Detection** - Identifies technical terms automatically
3. **Analogy Generation** - Creates relatable metaphors
4. **Emotional Safety** - Avoids triggering catastrophizing
5. **Actionability** - Includes "what this means for you" section

### Input
```typescript
interface TranslatorInput {
  technical_text: string;          // The complex input
  user_id: string;                 // For personalization
  context: {
    user_literacy_level?: number;   // 1-10 scale
    emotional_state?: string;        // anxious, calm, overwhelmed
    journey_phase?: string;          // chaos, clarity, control
    domain?: string;                 // medical, nutrition, etc.
  };
  translation_style?: string;       // "simple" | "detailed" | "conversational"
}
```

### Output
```typescript
interface TranslatorOutput {
  success: boolean;
  data: {
    plain_english: string;           // Main translation
    key_terms: {                     // Glossary
      term: string;
      definition: string;
      analogy?: string;
    }[];
    what_this_means: string;         // Personal relevance
    questions_to_ask: string[];      // Suggested follow-ups
    emotional_note?: string;         // If input is scary
    complexity_score: number;        // 1-10 (how complex was input)
    confidence_score: number;        // 1-10 (how confident in translation)
  };
}
```

---

## IMPLEMENTATION ARCHITECTURE

### Shared Infrastructure

```
supabase/functions/_shared/
├── translators/
│   ├── core.ts                    # Base translator class
│   ├── jargon-detector.ts         # Identify technical terms
│   ├── complexity-scorer.ts       # Rate input complexity
│   ├── analogy-generator.ts       # Create metaphors
│   ├── emotional-safety.ts        # Flag/soften scary content
│   └── glossaries/
│       ├── medical.json           # Medical term database
│       ├── nutrition.json         # Nutrition term database
│       └── general.json           # General health terms
```

### Service-Specific Implementation

Each translator service (medical, nutrition, etc.) extends the base pattern:

```
supabase/functions/translate-medical/
├── index.ts                       # Edge function handler
├── service.ts                     # Medical-specific logic
└── prompts/
    ├── system.txt                 # Medical translation system prompt
    └── user-template.txt          # User prompt template
```

---

## CODE IMPLEMENTATION

### 1. Base Translator Core

```typescript
// supabase/functions/_shared/translators/core.ts

export interface TranslatorConfig {
  domain: string;
  glossaryPath: string;
  defaultComplexityThreshold: number;
  emotionalSafetyEnabled: boolean;
}

export interface JargonTerm {
  term: string;
  definition: string;
  analogy?: string;
  severity?: "neutral" | "concerning" | "alarming";
}

export interface TranslationResult {
  plain_english: string;
  key_terms: JargonTerm[];
  what_this_means: string;
  questions_to_ask: string[];
  emotional_note?: string;
  complexity_score: number;
  confidence_score: number;
}

export abstract class BaseTranslator {
  protected config: TranslatorConfig;
  protected glossary: Map<string, JargonTerm>;

  constructor(config: TranslatorConfig) {
    this.config = config;
    this.glossary = new Map();
  }

  async loadGlossary(): Promise<void> {
    // Load domain-specific term database
    // In production, this would load from Supabase storage or database
  }

  abstract buildSystemPrompt(userContext: Record<string, unknown>): string;
  abstract buildUserPrompt(technicalText: string): string;

  async translate(
    technicalText: string,
    userId: string,
    context: Record<string, unknown>
  ): Promise<TranslationResult> {
    // 1. Detect jargon terms
    const detectedTerms = this.detectJargon(technicalText);

    // 2. Score complexity
    const complexityScore = this.scoreComplexity(technicalText, detectedTerms);

    // 3. Check emotional safety
    const safetyFlags = this.checkEmotionalSafety(technicalText, detectedTerms);

    // 4. Build prompts
    const systemPrompt = this.buildSystemPrompt(context);
    const userPrompt = this.buildUserPrompt(technicalText);

    // 5. Call LLM (reuse existing llm-adapter)
    const llmResponse = await this.callLLM(systemPrompt, userPrompt, userId);

    // 6. Parse structured output
    const parsed = this.parseTranslation(llmResponse);

    // 7. Add glossary definitions
    const enriched = this.enrichWithGlossary(parsed, detectedTerms);

    return {
      ...enriched,
      complexity_score: complexityScore,
      emotional_note: safetyFlags.length > 0
        ? this.generateEmotionalNote(safetyFlags)
        : undefined,
      confidence_score: this.calculateConfidence(detectedTerms, parsed),
    };
  }

  protected detectJargon(text: string): JargonTerm[] {
    const terms: JargonTerm[] = [];
    const words = text.toLowerCase().split(/\s+/);

    for (const word of words) {
      if (this.glossary.has(word)) {
        terms.push(this.glossary.get(word)!);
      }
    }

    return terms;
  }

  protected scoreComplexity(text: string, jargonTerms: JargonTerm[]): number {
    // Simple heuristic: more jargon = higher complexity
    const jargonRatio = jargonTerms.length / text.split(/\s+/).length;
    const sentenceComplexity = text.split(/[.!?]/).length;
    const avgWordsPerSentence = text.split(/\s+/).length / sentenceComplexity;

    // Score 1-10
    let score = 5;
    if (jargonRatio > 0.3) score += 3;
    else if (jargonRatio > 0.15) score += 2;
    else if (jargonRatio > 0.05) score += 1;

    if (avgWordsPerSentence > 25) score += 2;
    else if (avgWordsPerSentence > 18) score += 1;

    return Math.min(10, score);
  }

  protected checkEmotionalSafety(
    text: string,
    jargonTerms: JargonTerm[]
  ): string[] {
    const flags: string[] = [];
    const alarmingTerms = jargonTerms.filter((t) => t.severity === "alarming");

    if (alarmingTerms.length > 0) {
      flags.push(`Contains ${alarmingTerms.length} potentially alarming terms`);
    }

    // Check for specific scary patterns
    const scaryPatterns = [
      /stage [3-4]/i,
      /metasta(sis|tic)/i,
      /terminal/i,
      /aggressive/i,
      /poor prognosis/i,
    ];

    for (const pattern of scaryPatterns) {
      if (pattern.test(text)) {
        flags.push(`Contains potentially distressing language: ${pattern.source}`);
      }
    }

    return flags;
  }

  protected generateEmotionalNote(flags: string[]): string {
    return (
      "This information might feel overwhelming. Remember: medical language often sounds scarier than it is. " +
      "Take a deep breath, and let's break this down into manageable pieces. You don't need to understand everything at once."
    );
  }

  protected abstract callLLM(
    systemPrompt: string,
    userPrompt: string,
    userId: string
  ): Promise<string>;

  protected abstract parseTranslation(llmResponse: string): Partial<TranslationResult>;

  protected enrichWithGlossary(
    parsed: Partial<TranslationResult>,
    detectedTerms: JargonTerm[]
  ): TranslationResult {
    // Merge LLM-generated definitions with glossary
    return {
      plain_english: parsed.plain_english || "",
      key_terms: detectedTerms,
      what_this_means: parsed.what_this_means || "",
      questions_to_ask: parsed.questions_to_ask || [],
      complexity_score: 0,
      confidence_score: 0,
    };
  }

  protected calculateConfidence(
    detectedTerms: JargonTerm[],
    parsed: Partial<TranslationResult>
  ): number {
    // High confidence if:
    // - All detected terms have definitions
    // - Output is well-structured
    // - Domain-specific glossary had most terms

    const termsWithDefinitions = (parsed.key_terms || []).length;
    const coverageRatio = termsWithDefinitions / Math.max(1, detectedTerms.length);

    let confidence = coverageRatio * 10;

    if (parsed.what_this_means && parsed.what_this_means.length > 50) {
      confidence += 2;
    }

    if (parsed.questions_to_ask && parsed.questions_to_ask.length >= 3) {
      confidence += 1;
    }

    return Math.min(10, confidence);
  }
}
```

### 2. Medical Translator Implementation

```typescript
// supabase/functions/translate-medical/service.ts

import { BaseTranslator, TranslatorConfig, TranslationResult } from "../_shared/translators/core.ts";
import { callLLM } from "../_shared/llm-adapter.ts";

export class MedicalTranslator extends BaseTranslator {
  constructor() {
    super({
      domain: "medical",
      glossaryPath: "glossaries/medical.json",
      defaultComplexityThreshold: 7,
      emotionalSafetyEnabled: true,
    });
  }

  buildSystemPrompt(userContext: Record<string, unknown>): string {
    const phase = userContext.journey_phase || "chaos";
    const emotionalState = userContext.emotional_state || "unknown";
    const literacyLevel = userContext.user_literacy_level || 5;

    return `You are Gemma, a compassionate medical translator for Path9, an app helping people navigate cancer recovery.

YOUR ROLE:
- Translate complex medical language into clear, accessible English
- Use analogies and metaphors when helpful
- Acknowledge emotional weight while staying factual
- Empower the user with understanding, not overwhelm

USER CONTEXT:
- Journey Phase: ${phase}
- Emotional State: ${emotionalState}
- Medical Literacy: ${literacyLevel}/10

TRANSLATION GUIDELINES:
1. Start with the simplest explanation
2. For each medical term, provide:
   - Plain English definition
   - Why it matters to them specifically
   - Optional: helpful analogy
3. End with "What This Means for You" section
4. Suggest 3-5 questions they should ask their doctor

${literacyLevel < 5 ? "Use very simple language. Avoid all jargon unless absolutely necessary." : ""}
${emotionalState === "anxious" || emotionalState === "overwhelmed"
  ? "The user is feeling anxious. Be extra gentle and reassuring. Break information into small pieces."
  : ""}

EMOTIONAL SAFETY:
- Never use catastrophizing language
- If the information is concerning, acknowledge it but balance with hope
- Remind them they don't need to understand everything immediately

OUTPUT FORMAT (JSON):
{
  "plain_english": "Main translation in conversational language",
  "key_terms": [
    {
      "term": "medical term",
      "definition": "simple explanation",
      "analogy": "optional metaphor"
    }
  ],
  "what_this_means": "Personal relevance and next steps",
  "questions_to_ask": ["question 1", "question 2", "question 3"]
}`;
  }

  buildUserPrompt(technicalText: string): string {
    return `Please translate this medical information into plain English:

"${technicalText}"

Remember: This person just received this information and may be overwhelmed. Make it clear, kind, and actionable.`;
  }

  protected async callLLM(
    systemPrompt: string,
    userPrompt: string,
    userId: string
  ): Promise<string> {
    // Reuse existing LLM adapter from orchestrate function
    // This would import and call the shared LLM logic
    const response = await callLLM(
      {
        prompts: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        metadata: {
          state_hydrated: false,
          canon_included: false,
        },
      },
      crypto.randomUUID(),
      userId,
      userPrompt
    );

    return response.response;
  }

  protected parseTranslation(llmResponse: string): Partial<TranslationResult> {
    try {
      // Try to parse as JSON
      const parsed = JSON.parse(llmResponse);
      return parsed;
    } catch {
      // Fallback: extract from markdown or plain text
      return {
        plain_english: llmResponse,
        key_terms: [],
        what_this_means: "",
        questions_to_ask: [],
      };
    }
  }
}
```

### 3. Edge Function Handler

```typescript
// supabase/functions/translate-medical/index.ts

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {
  validateAuth,
  checkRateLimit,
  logAuditEvent,
} from "../_shared/policy.ts";
import { MedicalTranslator } from "./service.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface TranslateMedicalRequest {
  technical_text: string;
  context?: {
    user_literacy_level?: number;
    emotional_state?: string;
    journey_phase?: string;
  };
  request_id: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed", code: "METHOD_NOT_ALLOWED" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    // 1. Authenticate
    const authResult = await validateAuth(req);
    if (!authResult.valid || !authResult.user_id) {
      return new Response(
        JSON.stringify({ error: "Unauthorized", code: "UNAUTHORIZED" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = authResult.user_id;

    // 2. Parse request
    let body: TranslateMedicalRequest;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON", code: "INVALID_JSON" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const requestId = body.request_id || crypto.randomUUID();

    // 3. Validate input
    if (!body.technical_text || body.technical_text.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Missing technical_text", code: "INVALID_INPUT" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Rate limit
    const rateLimitCheck = await checkRateLimit(userId);
    if (!rateLimitCheck.allowed) {
      await logAuditEvent(userId, "rate_limit_exceeded", requestId, {
        service: "translate-medical",
      });

      return new Response(
        JSON.stringify({ error: "Rate limit exceeded", code: "RATE_LIMIT_EXCEEDED" }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Log request
    await logAuditEvent(userId, "medical_translation_requested", requestId, {
      text_length: body.technical_text.length,
      context: body.context,
    });

    // 6. Translate
    const translator = new MedicalTranslator();
    await translator.loadGlossary();

    const result = await translator.translate(
      body.technical_text,
      userId,
      body.context || {}
    );

    // 7. Log success
    await logAuditEvent(userId, "medical_translation_completed", requestId, {
      complexity_score: result.complexity_score,
      confidence_score: result.confidence_score,
      key_terms_count: result.key_terms.length,
    });

    // 8. Return result
    return new Response(
      JSON.stringify({
        success: true,
        data: result,
        request_id: requestId,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Medical translation error:", error);

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        code: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
```

---

## DATABASE SCHEMA

```sql
-- Translation cache (avoid re-translating same text)
CREATE TABLE IF NOT EXISTS translation_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain text NOT NULL, -- medical, nutrition, etc.
  technical_text text NOT NULL,
  plain_english text NOT NULL,
  key_terms jsonb,
  complexity_score integer,
  context_hash text, -- Hash of user context for cache matching
  created_at timestamptz DEFAULT now(),
  access_count integer DEFAULT 1,
  last_accessed_at timestamptz DEFAULT now()
);

CREATE INDEX idx_translation_cache_lookup
  ON translation_cache (domain, technical_text, context_hash);

-- User literacy tracking (improve personalization over time)
CREATE TABLE IF NOT EXISTS user_literacy_profile (
  user_id uuid PRIMARY KEY REFERENCES profiles(user_id),
  medical_literacy integer DEFAULT 5, -- 1-10 scale
  nutrition_literacy integer DEFAULT 5,
  meditation_literacy integer DEFAULT 5,
  mindfulness_literacy integer DEFAULT 5,
  movement_literacy integer DEFAULT 5,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_literacy_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own literacy profile"
  ON user_literacy_profile FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own literacy profile"
  ON user_literacy_profile FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Translation feedback (users rate translations)
CREATE TABLE IF NOT EXISTS translation_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(user_id),
  translation_cache_id uuid REFERENCES translation_cache(id),
  helpful boolean NOT NULL,
  too_simple boolean DEFAULT false,
  too_complex boolean DEFAULT false,
  comments text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE translation_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own translation feedback"
  ON translation_feedback FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
```

---

## TESTING STRATEGY

### Unit Tests
```typescript
// Test complexity scoring
Deno.test("MedicalTranslator: High jargon text scores high complexity", () => {
  const translator = new MedicalTranslator();
  const text = "Invasive ductal carcinoma with lymphovascular invasion and perineural infiltration";
  const score = translator.scoreComplexity(text, []);
  assert(score >= 7, `Expected complexity >= 7, got ${score}`);
});

// Test emotional safety detection
Deno.test("MedicalTranslator: Detects alarming language", () => {
  const translator = new MedicalTranslator();
  const text = "Stage 4 metastatic disease with poor prognosis";
  const flags = translator.checkEmotionalSafety(text, []);
  assert(flags.length > 0, "Should flag alarming language");
});
```

### Integration Tests
```typescript
// Test full translation flow
Deno.test("MedicalTranslator: Translates diagnosis correctly", async () => {
  const translator = new MedicalTranslator();
  await translator.loadGlossary();

  const result = await translator.translate(
    "ER+/PR+/HER2- invasive ductal carcinoma, Grade 2",
    "test-user-id",
    { journey_phase: "chaos", emotional_state: "anxious" }
  );

  assert(result.plain_english.length > 0, "Should return translation");
  assert(result.key_terms.length >= 3, "Should identify key terms");
  assert(result.what_this_means.length > 0, "Should provide personal relevance");
  assert(result.questions_to_ask.length >= 3, "Should suggest questions");
});
```

---

## SCALING TO OTHER DOMAINS

### Nutrition Translator
```typescript
// supabase/functions/translate-nutrition/service.ts

export class NutritionTranslator extends BaseTranslator {
  constructor() {
    super({
      domain: "nutrition",
      glossaryPath: "glossaries/nutrition.json",
      defaultComplexityThreshold: 6,
      emotionalSafetyEnabled: true,
    });
  }

  buildSystemPrompt(userContext: Record<string, unknown>): string {
    return `You are Gemma, a nutrition translator for Path9.

Translate complex nutritional science into practical, actionable advice.

Focus on:
- What foods are safe/unsafe for immunocompromised users
- Why certain nutrients matter during recovery
- How to implement nutrition changes practically

Avoid:
- Fad diet language
- Overwhelming lists
- Judgment about current eating habits`;
  }

  // ... rest similar to MedicalTranslator
}
```

### Side Effect Interpreter (Medical Subdomain)
```typescript
// supabase/functions/interpret-side-effect/service.ts

export class SideEffectInterpreter extends BaseTranslator {
  constructor() {
    super({
      domain: "medical-side-effects",
      glossaryPath: "glossaries/medical.json",
      defaultComplexityThreshold: 5,
      emotionalSafetyEnabled: true,
    });
  }

  buildSystemPrompt(userContext: Record<string, unknown>): string {
    return `You are Gemma, helping users understand treatment side effects.

Critical distinction: NORMAL vs. CONCERNING

For each side effect, explain:
1. Is this expected? (yes/no)
2. How long does it typically last?
3. What can help? (practical tips)
4. When to call the doctor immediately?

Be reassuring but never dismiss concerns.`;
  }
}
```

---

## REUSABILITY SCORECARD

**Code Reuse Across Translator Family:**
- ✅ Base translator class: 100% reuse
- ✅ Jargon detector: 100% reuse
- ✅ Complexity scorer: 90% reuse (minor domain tweaks)
- ✅ Emotional safety checker: 80% reuse (domain-specific patterns)
- ✅ LLM caller: 100% reuse
- ✅ Database schema: 100% reuse
- ❌ System prompts: 0% reuse (domain-specific)
- ❌ Glossaries: 0% reuse (domain-specific)

**Estimated Development Time:**
- First translator (Medical): 1 week
- Second translator (Nutrition): 2 days
- Third translator (Side Effects): 1 day
- Each additional translator: 4-8 hours

**ROI:** Build framework once, deploy 7+ translator services with minimal effort.

---

## NEXT: VERTICAL SLICE (Medical Day 1-7)

With this translator pattern established, we can now build the complete Medical Day 1-7 flow:

1. ✅ **Medical Translation** (just designed above)
2. **Appointment Context Understanding** (similar pattern)
3. **Timeline Inference** (pattern analyzer + translator)
4. **Emotional Safety Guardrails** (enhancement to existing)

Ready to proceed with **B: Build complete vertical slice**?
