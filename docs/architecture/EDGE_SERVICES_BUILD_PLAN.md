# Path9 Edge Services Build Plan
## Prioritized Implementation Roadmap

---

## CURRENT STATE (What Exists)

### ✅ Built Services
1. **orchestrate** - Request router, prompt assembly, LLM adapter
2. **gemma-respond** - Conversational AI handler
3. **api-gateway** - Unified API entry point
4. **health** - System health check

### ✅ Built Infrastructure
- Prompt enforcement engine
- Knowledge canon retrieval system
- Multi-LLM adapter (OpenAI, Anthropic, mock)
- Request envelope pattern
- Audit logging

### 🎯 What This Gives Us
The foundation is **conversational intelligence** - you can already:
- Have Gemma respond to user messages
- Enforce prompt boundaries (safety)
- Retrieve relevant knowledge from canon
- Route requests through a gateway
- Track system health

**This maps to Cross-Journey Services:**
- ✅ Intent Classifier (basic)
- ✅ Empathy Generator (via prompts)
- ✅ Memory Manager (conversations table)
- ✅ Safety Monitor (boundary enforcement)
- ✅ Knowledge Chunker (canon retrieval)

---

## ARCHITECTURE PATTERN: Service Families

Before building 130 individual services, we should identify **reusable patterns**:

### Family 1: TRANSLATORS (Medical/Technical → Plain English)
**Pattern:** Take complex input, simplify language, return digestible explanation
- Medical Translation
- Nutrition Explainer
- Treatment Options Explainer
- Side Effect Interpreter
- Health Data Interpreter
- Nervous System Educator
- Boundary Explainer

**Common Code:**
- Complexity level adjuster
- Medical terminology database
- Analogy generator
- Visual aid suggester

### Family 2: PATTERN ANALYZERS (Detect trends in user data)
**Pattern:** Ingest time-series data, find patterns, return insights
- Symptom Pattern Detector
- Energy-Food Correlation Analyzer
- Communication Pattern Analyzer
- Distraction Pattern Analyzer
- Trigger Identifier
- Movement-Energy Correlation Tracker
- People-Pleasing Pattern Detector

**Common Code:**
- Time-series analysis engine
- Statistical correlation finder
- Visualization generator
- Insight formatter

### Family 3: RECOMMENDERS (Suggest personalized actions)
**Pattern:** Take user state + goals, return ranked suggestions
- Meal Idea Generator
- Breathing Technique Selector
- Technique Recommender (meditation)
- Calming Protocol Selector
- Exercise Library (adaptive)
- Resource Recommender

**Common Code:**
- User preference model
- Context-aware filtering
- Ranking algorithm
- Explanation generator

### Family 4: TRACKERS (Monitor quantitative data)
**Pattern:** Accept data input, store, visualize, alert on thresholds
- Medication Tracker
- Macro/Micronutrient Tracker
- Progress Marker
- Fitness Goal Tracker
- Decision Confidence Tracker

**Common Code:**
- Data validation
- Threshold alerting
- Visualization engine
- Export functionality

### Family 5: COACHES (Behavioral guidance)
**Pattern:** Assess current behavior, guide toward target behavior
- Self-Advocacy Coach
- Hydration Coach
- "No" Practice Coach
- Pacing Strategy Coach
- Form Coach
- Empathy-Boundary Balancer

**Common Code:**
- Behavior change framework
- Micro-commitment generator
- Progress reinforcement
- Setback handling

### Family 6: ASSESSORS (Evaluate readiness/state)
**Pattern:** Ask questions, score responses, return assessment
- User State Assessor
- Confidence Assessment
- Independence Readiness Assessor
- Teaching Readiness Assessor
- Comprehension Checker

**Common Code:**
- Question bank
- Scoring algorithms
- Threshold-based routing
- Recommendation engine

### Family 7: OPTIMIZERS (Improve existing routines)
**Pattern:** Analyze current approach, suggest improvements
- Routine Optimizer
- Session Length Optimizer
- Practice Reminder Intelligence
- Recovery Optimizer
- Learning Path Optimizer

**Common Code:**
- Baseline measurement
- A/B testing framework
- Incremental adjustment logic
- Success metric tracking

### Family 8: SAFETY GUARDRAILS (Risk detection & mitigation)
**Pattern:** Monitor inputs/outputs, flag risks, escalate or block
- Emotional Safety Guardrails
- Side Effect Predictor & Manager
- Safety Monitor (medical emergencies)
- Pain vs. Discomfort Differentiator
- Anomaly Detector

**Common Code:**
- Risk scoring engine
- Escalation protocols
- Human-in-loop triggers
- Crisis resource directory

---

## BUILD PRIORITY FRAMEWORK

### Tier 0: FOUNDATION (Build First)
**These enable all other services:**
1. **User State Assessor** - Know where user is in journey
2. **Context Aggregator** - Pull relevant data across pathways
3. **Personalization Engine** - Adapt all outputs to user
4. **Safety Monitor** - Gate all interactions

**Why:** Every service needs to know user context, personalize, and stay safe.

### Tier 1: CHAOS PHASE ESSENTIALS (Day 1-30)
**Focus on immediate post-diagnosis needs:**

**Medical:**
1. Medical Translation (diagnosis explainer)
2. Appointment Context Understanding
3. Emotional Safety Guardrails
4. Timeline Inference

**Nutrition:**
5. Nutrition Explainer (immune system basics)
6. Food Database Query Engine
7. Meal Idea Generator

**Mindfulness:**
8. Thought-Feeling Separator
9. Emotion Wheel Guide
10. Trigger Identifier

**Movement:**
11. Body Awareness Prompt Generator
12. Safe Movement Educator
13. Pain vs. Discomfort Differentiator

**Meditation:**
14. Nervous System Educator
15. Breathing Technique Selector
16. Anxiety Spiral Breaker

**Why:** These services address the "chaos" emotional state and build immediate coping tools.

### Tier 2: DATA CAPTURE & TRACKING (Day 1-90)
**Enable ongoing monitoring:**
1. Symptom Pattern Detector
2. Energy Level Forecaster
3. Medication Tracker
4. Energy-Food Correlation Analyzer
5. Movement-Energy Correlation Tracker
6. Progress Marker

**Why:** Can't provide insights without data. These establish tracking habits early.

### Tier 3: CLARITY PHASE BUILDERS (Day 31-120)
**Support deeper understanding:**
1. Treatment Options Explainer
2. Side Effect Interpreter
3. Food As Medicine Recommender
4. Emotion Regulation Toolkit
5. Progressive Overload Planner
6. Meditation Depth Tracker

**Why:** Users are ready for more nuanced guidance once chaos subsides.

### Tier 4: CONTROL PHASE MASTERY (Day 121-270)
**Enable independence:**
1. Self-Advocacy Coach
2. Medical Literacy Builder
3. Intuitive Eating Coach
4. Mindfulness Mentor Readiness
5. Movement Philosophy Developer

**Why:** These services prepare users for graduation and self-sufficiency.

---

## RECOMMENDED BUILD SEQUENCE

### Sprint 1-2: Foundation (Weeks 1-2)
**Goal:** Enable intelligent routing and personalization

**Build:**
1. User State Assessor service
2. Context Aggregator service
3. Personalization Engine service
4. Safety Monitor service (enhanced)

**Database Schema:**
```sql
-- User journey tracking
CREATE TABLE user_journey_state (
  user_id uuid PRIMARY KEY,
  current_phase text, -- chaos/clarity/control
  days_since_diagnosis integer,
  active_pathways jsonb, -- {medical: true, nutrition: true, ...}
  energy_level integer, -- 1-10 scale
  readiness_scores jsonb, -- {medical: 7, nutrition: 5, ...}
  last_assessed_at timestamptz
);

-- Cross-pathway context
CREATE TABLE user_context (
  user_id uuid PRIMARY KEY,
  diagnosis_info jsonb,
  care_team jsonb,
  medications jsonb,
  restrictions jsonb, -- dietary, movement limits
  goals jsonb,
  preferences jsonb -- communication style, learning pace
);
```

**Edge Function:**
- `assess-user-state` - Returns current phase, readiness, recommended actions

### Sprint 3-4: Medical Chaos Essentials (Weeks 3-4)
**Goal:** Help users understand what's happening

**Build:**
1. Medical Translation service
2. Appointment Context Understanding
3. Timeline Inference
4. Emotional Safety Guardrails (enhanced)

**Database Schema:**
```sql
CREATE TABLE diagnoses (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES profiles(user_id),
  diagnosis_name text,
  diagnosis_date date,
  stage_or_severity text,
  icd_code text,
  plain_english_summary text, -- AI-generated
  created_at timestamptz
);

CREATE TABLE appointments (
  id uuid PRIMARY KEY,
  user_id uuid,
  appointment_date timestamptz,
  provider_name text,
  provider_role text, -- oncologist, surgeon, etc.
  purpose text,
  location text,
  notes text,
  status text -- upcoming, completed, cancelled
);

CREATE TABLE care_team (
  id uuid PRIMARY KEY,
  user_id uuid,
  provider_name text,
  role text,
  contact_info jsonb,
  communication_preferences text,
  added_at timestamptz
);
```

**Edge Functions:**
- `translate-medical` - Converts medical terms to plain English
- `understand-appointment` - Structures appointment data + preps questions
- `infer-timeline` - Creates treatment timeline from diagnosis

### Sprint 5-6: Nutrition Chaos Essentials (Weeks 5-6)
**Goal:** Answer "What can I eat?"

**Build:**
1. Nutrition Explainer
2. Food Database Query Engine
3. Meal Idea Generator
4. Food Safety Educator

**Database Schema:**
```sql
CREATE TABLE food_restrictions (
  user_id uuid PRIMARY KEY,
  immune_status text, -- immunocompromised level
  allergies text[],
  intolerances text[],
  medical_restrictions jsonb, -- based on diagnosis
  preferences jsonb -- vegan, kosher, etc.
);

CREATE TABLE food_database (
  id uuid PRIMARY KEY,
  food_name text,
  category text,
  immune_safety_level text, -- safe, caution, avoid
  nutritional_data jsonb,
  common_alternatives text[]
);

CREATE TABLE meals_log (
  id uuid PRIMARY KEY,
  user_id uuid,
  meal_date date,
  meal_type text, -- breakfast, lunch, dinner, snack
  foods jsonb,
  energy_before integer,
  energy_after integer,
  notes text
);
```

**Edge Functions:**
- `explain-nutrition` - Teaches immune system basics
- `query-food-safety` - Returns safe/unsafe foods
- `generate-meal-ideas` - Suggests recipes based on restrictions

### Sprint 7-8: Mindfulness Chaos Essentials (Weeks 7-8)
**Goal:** Build emotional awareness

**Build:**
1. Thought-Feeling Separator
2. Emotion Wheel Guide
3. Trigger Identifier
4. Cognitive Distortion Detector

**Database Schema:**
```sql
CREATE TABLE emotional_check_ins (
  id uuid PRIMARY KEY,
  user_id uuid,
  check_in_time timestamptz,
  emotions jsonb, -- [{name: "anxious", intensity: 7}, ...]
  thoughts text,
  physical_sensations text,
  triggers jsonb,
  coping_used text[]
);

CREATE TABLE triggers (
  id uuid PRIMARY KEY,
  user_id uuid,
  trigger_type text, -- medical, social, environmental
  trigger_description text,
  emotional_response text,
  frequency text, -- daily, weekly, occasional
  coping_strategies jsonb
);
```

**Edge Functions:**
- `separate-thought-feeling` - Helps user distinguish thoughts from emotions
- `guide-emotion-wheel` - Maps vague feelings to specific emotions
- `identify-triggers` - Detects patterns in emotional responses

### Sprint 9-10: Movement Chaos Essentials (Weeks 9-10)
**Goal:** Reconnect with body safely

**Build:**
1. Body Awareness Prompt Generator
2. Safe Movement Educator
3. Pain vs. Discomfort Differentiator
4. Movement Timer

**Database Schema:**
```sql
CREATE TABLE movement_log (
  id uuid PRIMARY KEY,
  user_id uuid,
  activity_date date,
  activity_type text, -- walk, yoga, strength, etc.
  duration_minutes integer,
  intensity text, -- gentle, moderate, vigorous
  pain_level integer, -- 0-10
  energy_before integer,
  energy_after integer,
  notes text
);

CREATE TABLE movement_restrictions (
  user_id uuid PRIMARY KEY,
  medical_limits jsonb, -- {lifting: "10lbs max", cardio: "low impact only"}
  current_abilities jsonb,
  goals jsonb
);
```

**Edge Functions:**
- `prompt-body-awareness` - Generates body scan prompts
- `educate-safe-movement` - Returns safe exercises based on treatment
- `differentiate-pain` - Helps user assess pain signals

### Sprint 11-12: Meditation Chaos Essentials (Weeks 11-12)
**Goal:** Start regulation practice

**Build:**
1. Nervous System Educator
2. Breathing Technique Selector
3. Anxiety Spiral Breaker
4. Meditation Onboarding

**Database Schema:**
```sql
CREATE TABLE meditation_sessions (
  id uuid PRIMARY KEY,
  user_id uuid,
  session_date timestamptz,
  technique text, -- box breathing, body scan, etc.
  duration_minutes integer,
  anxiety_before integer, -- 1-10
  anxiety_after integer,
  notes text,
  completed boolean
);

CREATE TABLE breathing_techniques (
  id uuid PRIMARY KEY,
  technique_name text,
  description text,
  instructions jsonb,
  best_for text[], -- anxiety, insomnia, focus
  difficulty_level text
);
```

**Edge Functions:**
- `educate-nervous-system` - Explains fight/flight vs. rest/digest
- `select-breathing-technique` - Matches technique to user state
- `break-anxiety-spiral` - Detects catastrophizing, offers intervention

### Sprint 13-16: Data Intelligence & Pattern Detection (Weeks 13-16)
**Goal:** Generate insights from collected data

**Build:**
1. Symptom Pattern Detector
2. Energy-Food Correlation Analyzer
3. Movement-Energy Correlation Tracker
4. Progress Marker
5. Pattern Recognition Engine
6. Correlation Finder

**Edge Functions:**
- `detect-symptom-patterns` - Finds correlations in symptom data
- `analyze-food-energy` - Links meals to energy levels
- `track-movement-energy` - Correlates activity with fatigue
- `mark-progress` - Identifies wins across all pathways

### Sprint 17+: Clarity & Control Phase Services
**Build order based on user cohort progression**

---

## IMPLEMENTATION STRATEGY

### Service Architecture Pattern
Each edge service should follow this structure:

```
supabase/functions/[service-name]/
├── index.ts              # Main handler (CORS, routing)
├── service.ts            # Core service logic
├── validation.ts         # Input validation
├── types.ts              # TypeScript interfaces
└── prompts/
    ├── system.txt        # System prompt
    └── user-template.txt # User prompt template
```

### Reusable Modules (Create Once, Use Everywhere)
```
supabase/functions/_shared/
├── policy.ts             # ✅ Exists - RLS helper
├── user-context.ts       # 🆕 Fetch user state + context
├── personalization.ts    # 🆕 Adapt tone, complexity, pacing
├── safety-check.ts       # 🆕 Pre/post safety validation
├── llm-caller.ts         # 🆕 Abstracted LLM calls
├── prompt-loader.ts      # 🆕 Load from prompt registry
├── canon-retriever.ts    # 🆕 Query knowledge canon
└── analytics.ts          # 🆕 Track usage, performance
```

### Testing Strategy
- Unit tests for each service's core logic
- Integration tests for service chains
- Safety tests (adversarial inputs)
- Performance tests (latency budgets)

---

## SUCCESS METRICS

### Sprint 1-2 (Foundation)
- [ ] User state accurately reflects journey position
- [ ] Context aggregation pulls all relevant data
- [ ] Personalization adjusts tone appropriately
- [ ] Safety monitor flags 100% of test crisis scenarios

### Sprint 3-4 (Medical Chaos)
- [ ] Medical translation simplifies 90%+ of terms correctly
- [ ] Appointment context extracts purpose, provider, date
- [ ] Timeline inference predicts next 3 steps
- [ ] Users report feeling "understood" (qualitative)

### Sprint 5-6 (Nutrition Chaos)
- [ ] Food safety query returns accurate guidance
- [ ] Meal ideas respect all restrictions
- [ ] Users log meals 5+ days/week

### Sprint 7-8 (Mindfulness Chaos)
- [ ] Emotion wheel narrows vague → specific emotions
- [ ] Trigger identification detects patterns in 3+ check-ins
- [ ] Users complete daily emotional check-ins

### Sprint 9-10 (Movement Chaos)
- [ ] Safe movement educator prevents contraindicated exercises
- [ ] Pain differentiator accurately classifies signals
- [ ] Users complete 3+ movement sessions/week

### Sprint 11-12 (Meditation Chaos)
- [ ] Breathing technique selection improves anxiety scores
- [ ] Meditation completion rate >60%
- [ ] Users report calmer nervous system

### Sprint 13-16 (Data Intelligence)
- [ ] Pattern detection finds correlations in 80%+ of cases
- [ ] Insights actionable (users change behavior)
- [ ] Progress markers celebrated weekly

---

## COST OPTIMIZATION

### LLM Call Hierarchy
1. **Local Logic** (free) - Rules-based when possible
2. **Small Model** (cheap) - Classification, simple queries (GPT-4o-mini, Claude Haiku)
3. **Large Model** (expensive) - Complex reasoning, empathy (GPT-4, Claude Sonnet)

### Caching Strategy
- Prompt caching for system prompts (Anthropic feature)
- Response caching for common queries
- Knowledge canon pre-computed embeddings

### Batch Processing
- Daily summary jobs (not real-time)
- Weekly pattern analysis (scheduled)
- Monthly optimization runs

---

## DEPENDENCY GRAPH

```
Tier 0 (Foundation)
  ↓
Tier 1 (Chaos Essentials) - Can build in parallel
  ↓
Tier 2 (Data Capture) - Requires Tier 1 services
  ↓
Tier 3 (Clarity Phase) - Requires data from Tier 2
  ↓
Tier 4 (Control Phase) - Requires maturity from Tier 3
```

---

## RESOURCE REQUIREMENTS

### Team Structure (Recommended)
- 1 Backend Engineer (Edge Functions + DB)
- 1 Frontend Engineer (React Native UI)
- 1 AI/ML Engineer (LLM integration, prompt engineering)
- 1 Product Manager (prioritization, user testing)
- 1 Medical Advisor (safety, accuracy)

### Timeline Estimate
- **Foundation (Sprints 1-2):** 2 weeks
- **Chaos Phase Coverage (Sprints 3-12):** 10 weeks
- **Data Intelligence (Sprints 13-16):** 4 weeks
- **Clarity Phase (Sprints 17-24):** 8 weeks
- **Control Phase (Sprints 25-32):** 8 weeks

**Total:** ~32 weeks (~8 months) for full 130-service suite

### Budget Estimate (LLM Costs)
- Chaos Phase (Day 1-30): High usage, ~$10-20/user
- Clarity Phase (Day 31-120): Moderate, ~$15-30/user
- Control Phase (Day 121-270): Low, ~$10-20/user

**Total per user (9 months):** ~$35-70 in LLM costs

---

## NEXT ACTIONS

**Option 1:** Start building Foundation (Sprints 1-2)
- Create user journey state tracking
- Build assessment service
- Implement context aggregator

**Option 2:** Design detailed data model for ALL pathways first
- Complete ER diagram
- Define all tables, relationships
- Create migration files

**Option 3:** Build one complete vertical slice (Medical Day 1-7)
- Prove the concept end-to-end
- Validate architecture
- Test with real users

**Which direction?**
