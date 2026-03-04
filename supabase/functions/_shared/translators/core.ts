export interface TranslatorConfig {
  domain: string;
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

  loadGlossary(glossaryData: Record<string, JargonTerm>): void {
    Object.entries(glossaryData).forEach(([key, value]) => {
      this.glossary.set(key.toLowerCase(), value);
    });
  }

  abstract buildSystemPrompt(userContext: Record<string, unknown>): string;
  abstract buildUserPrompt(technicalText: string): string;

  async translate(
    technicalText: string,
    userId: string,
    context: Record<string, unknown>
  ): Promise<TranslationResult> {
    const detectedTerms = this.detectJargon(technicalText);
    const complexityScore = this.scoreComplexity(technicalText, detectedTerms);
    const safetyFlags = this.checkEmotionalSafety(technicalText, detectedTerms);

    const systemPrompt = this.buildSystemPrompt(context);
    const userPrompt = this.buildUserPrompt(technicalText);

    const llmResponse = await this.callLLM(systemPrompt, userPrompt, userId);
    const parsed = this.parseTranslation(llmResponse);
    const enriched = this.enrichWithGlossary(parsed, detectedTerms);

    return {
      ...enriched,
      complexity_score: complexityScore,
      emotional_note: safetyFlags.length > 0
        ? this.generateEmotionalNote(safetyFlags)
        : undefined,
      confidence_score: this.calculateConfidence(detectedTerms, enriched),
    };
  }

  protected detectJargon(text: string): JargonTerm[] {
    const terms: JargonTerm[] = [];
    const lowerText = text.toLowerCase();

    for (const [word, termData] of this.glossary.entries()) {
      if (lowerText.includes(word)) {
        terms.push(termData);
      }
    }

    return terms;
  }

  protected scoreComplexity(text: string, jargonTerms: JargonTerm[]): number {
    const words = text.split(/\s+/);
    const jargonRatio = jargonTerms.length / Math.max(1, words.length);
    const sentences = text.split(/[.!?]/).filter((s) => s.trim().length > 0);
    const avgWordsPerSentence = words.length / Math.max(1, sentences.length);

    let score = 5;
    if (jargonRatio > 0.3) score += 3;
    else if (jargonRatio > 0.15) score += 2;
    else if (jargonRatio > 0.05) score += 1;

    if (avgWordsPerSentence > 25) score += 2;
    else if (avgWordsPerSentence > 18) score += 1;

    return Math.min(10, Math.max(1, score));
  }

  protected checkEmotionalSafety(
    text: string,
    jargonTerms: JargonTerm[]
  ): string[] {
    const flags: string[] = [];
    const alarmingTerms = jargonTerms.filter((t) => t.severity === "alarming");

    if (alarmingTerms.length > 0) {
      flags.push(`alarming_terms:${alarmingTerms.length}`);
    }

    const scaryPatterns = [
      { pattern: /stage [3-4]/i, label: "advanced_stage" },
      { pattern: /metasta(sis|tic)/i, label: "metastatic" },
      { pattern: /terminal/i, label: "terminal_language" },
      { pattern: /aggressive/i, label: "aggressive_descriptor" },
      { pattern: /poor prognosis/i, label: "poor_prognosis" },
    ];

    for (const { pattern, label } of scaryPatterns) {
      if (pattern.test(text)) {
        flags.push(label);
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

  protected parseTranslation(llmResponse: string): Partial<TranslationResult> {
    try {
      const cleanResponse = llmResponse
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      return JSON.parse(cleanResponse);
    } catch {
      return {
        plain_english: llmResponse,
        key_terms: [],
        what_this_means: "",
        questions_to_ask: [],
      };
    }
  }

  protected enrichWithGlossary(
    parsed: Partial<TranslationResult>,
    detectedTerms: JargonTerm[]
  ): TranslationResult {
    const existingTerms = new Set(
      (parsed.key_terms || []).map((t) => t.term.toLowerCase())
    );

    const allTerms = [...(parsed.key_terms || [])];
    for (const term of detectedTerms) {
      if (!existingTerms.has(term.term.toLowerCase())) {
        allTerms.push(term);
      }
    }

    return {
      plain_english: parsed.plain_english || "",
      key_terms: allTerms,
      what_this_means: parsed.what_this_means || "",
      questions_to_ask: parsed.questions_to_ask || [],
      complexity_score: 0,
      confidence_score: 0,
    };
  }

  protected calculateConfidence(
    detectedTerms: JargonTerm[],
    result: TranslationResult
  ): number {
    let confidence = 5;

    const termsWithDefinitions = result.key_terms.length;
    if (termsWithDefinitions > 0) {
      const coverageRatio =
        termsWithDefinitions / Math.max(1, detectedTerms.length);
      confidence += coverageRatio * 3;
    }

    if (result.plain_english.length > 100) confidence += 1;
    if (result.what_this_means.length > 50) confidence += 1;
    if (result.questions_to_ask.length >= 3) confidence += 1;

    return Math.min(10, Math.max(1, Math.round(confidence)));
  }
}
