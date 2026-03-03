import { detectUnsafeIntent, validateResponse, getSafeFallbackResponse } from './safety-validators';

describe('Bloodwork AI Safety Validators', () => {
  describe('detectUnsafeIntent', () => {
    test('detects diagnosis requests', () => {
      const testCases = [
        'What disease do I have?',
        'Do I have cancer?',
        'Am I sick?',
        'What\'s wrong with me?',
      ];

      testCases.forEach(message => {
        const result = detectUnsafeIntent(message);
        expect(result.detected).toBe(true);
        expect(result.intentType).toBe('diagnosis_request');
        expect(result.deflection).toBeDefined();
      });
    });

    test('detects treatment requests', () => {
      const testCases = [
        'Should I take iron supplements?',
        'What medication should I use?',
        'Can I take vitamin D?',
        'What if I took zinc?',
      ];

      testCases.forEach(message => {
        const result = detectUnsafeIntent(message);
        expect(result.detected).toBe(true);
        expect(result.intentType).toBe('treatment_request');
        expect(result.deflection).toBeDefined();
      });
    });

    test('detects outcome prediction requests', () => {
      const testCases = [
        'Will I get better?',
        'Am I going to die?',
        'What will happen to me?',
        'Is this serious?',
      ];

      testCases.forEach(message => {
        const result = detectUnsafeIntent(message);
        expect(result.detected).toBe(true);
        expect(result.intentType).toBe('outcome_prediction');
        expect(result.deflection).toBeDefined();
      });
    });

    test('detects comparison requests', () => {
      const testCases = [
        'Is this normal?',
        'Am I normal?',
        'Compared to healthy people, how am I?',
        'What should my WBC be?',
      ];

      testCases.forEach(message => {
        const result = detectUnsafeIntent(message);
        expect(result.detected).toBe(true);
        expect(result.intentType).toBe('comparison_request');
        expect(result.deflection).toBeDefined();
      });
    });

    test('detects alert expectations', () => {
      const testCases = [
        'Is this dangerous?',
        'Should I worry?',
        'Do I need to see a doctor?',
        'Is this urgent?',
      ];

      testCases.forEach(message => {
        const result = detectUnsafeIntent(message);
        expect(result.detected).toBe(true);
        expect(result.intentType).toBe('alert_expectation');
        expect(result.deflection).toBeDefined();
      });
    });

    test('allows safe questions', () => {
      const testCases = [
        'What is my WBC trend?',
        'Show me my hemoglobin over time',
        'What does WBC stand for?',
        'Can you help me prepare questions for my doctor?',
      ];

      testCases.forEach(message => {
        const result = detectUnsafeIntent(message);
        expect(result.detected).toBe(false);
      });
    });
  });

  describe('validateResponse', () => {
    test('detects banned phrases', () => {
      const unsafeResponses = [
        'Your values are in the normal range',
        'This is abnormal',
        'This is concerning',
        'This is worrying',
        'This is dangerous',
        'You should take supplements',
        'You need to see a doctor',
        'I recommend iron supplements',
        'This means you have anemia',
        'This indicates a problem',
        'This suggests disease',
        'This is a red flag',
        'This is a warning sign',
        'You are at risk',
        'Compared to healthy individuals',
        'Compared to others',
      ];

      unsafeResponses.forEach(response => {
        const result = validateResponse(response);
        expect(result.detected).toBe(true);
        expect(result.violations.length).toBeGreaterThan(0);
      });
    });

    test('detects diagnosis patterns', () => {
      const unsafeResponses = [
        'You may have a disease',
        'You could have anemia',
        'You have been diagnosed with cancer',
      ];

      unsafeResponses.forEach(response => {
        const result = validateResponse(response);
        expect(result.detected).toBe(true);
        expect(result.violations.length).toBeGreaterThan(0);
      });
    });

    test('detects treatment patterns', () => {
      const unsafeResponses = [
        'Consider taking a supplement',
        'I recommend starting medication',
        'Try this medicine',
      ];

      unsafeResponses.forEach(response => {
        const result = validateResponse(response);
        expect(result.detected).toBe(true);
        expect(result.violations.length).toBeGreaterThan(0);
      });
    });

    test('allows safe responses', () => {
      const safeResponses = [
        'Your WBC is 5.2 ×10⁹/L, and the reference range shown is 4.0-11.0',
        'Your hemoglobin moved from 14.1 to 13.8, a change of -0.3',
        'I can\'t interpret what this means medically',
        'That\'s a question for your clinician',
        'Here are some questions you might ask your doctor',
        'WBC stands for white blood cell count',
      ];

      safeResponses.forEach(response => {
        const result = validateResponse(response);
        expect(result.detected).toBe(false);
        expect(result.violations.length).toBe(0);
      });
    });
  });

  describe('getSafeFallbackResponse', () => {
    test('returns a safe fallback response', () => {
      const fallback = getSafeFallbackResponse();
      expect(fallback).toBeDefined();
      expect(typeof fallback).toBe('string');
      expect(fallback.length).toBeGreaterThan(0);

      const validation = validateResponse(fallback);
      expect(validation.detected).toBe(false);
    });
  });
});
