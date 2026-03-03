const MIN_MESSAGE_LENGTH = 1;
const MAX_MESSAGE_LENGTH = 1000;

export interface ValidationResult {
  valid: boolean;
  normalized?: string;
  error?: string;
  code?: string;
}

export function normalizeMessage(message: string): string {
  return message
    .replace(/\s+/g, " ")
    .trim();
}

export function validateUserMessage(message: unknown): ValidationResult {
  if (typeof message !== "string") {
    return {
      valid: false,
      error: "user_message must be a string",
      code: "INVALID_MESSAGE_TYPE",
    };
  }

  const normalized = normalizeMessage(message);

  if (normalized.length === 0) {
    return {
      valid: false,
      error: "user_message cannot be empty or whitespace only",
      code: "EMPTY_MESSAGE",
    };
  }

  if (normalized.length < MIN_MESSAGE_LENGTH) {
    return {
      valid: false,
      error: `user_message must be at least ${MIN_MESSAGE_LENGTH} character`,
      code: "MESSAGE_TOO_SHORT",
    };
  }

  if (normalized.length > MAX_MESSAGE_LENGTH) {
    return {
      valid: false,
      error: `user_message must not exceed ${MAX_MESSAGE_LENGTH} characters (got ${normalized.length})`,
      code: "MESSAGE_TOO_LONG",
    };
  }

  return {
    valid: true,
    normalized,
  };
}
