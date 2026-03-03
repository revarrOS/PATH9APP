import { createClient } from "npm:@supabase/supabase-js@2";

export interface RequestEnvelope {
  user_id: string;
  journey_state: Record<string, unknown>;
  consent_flags: {
    data_processing: boolean;
    analytics: boolean;
    third_party_sharing: boolean;
  };
  request_id: string;
}

export interface PolicyViolation {
  code: string;
  message: string;
  field?: string;
}

export interface PolicyCheckResult {
  valid: boolean;
  violations: PolicyViolation[];
  user_id?: string;
}

const RATE_LIMIT_WINDOW_MS = 60000;
const MAX_REQUESTS_PER_WINDOW = 100;

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export async function validateEnvelope(
  envelope: unknown
): Promise<PolicyCheckResult> {
  const violations: PolicyViolation[] = [];

  if (!envelope || typeof envelope !== "object") {
    violations.push({
      code: "MISSING_ENVELOPE",
      message: "Request envelope is required",
    });
    return { valid: false, violations };
  }

  const env = envelope as Partial<RequestEnvelope>;

  if (!env.user_id || typeof env.user_id !== "string") {
    violations.push({
      code: "MISSING_USER_ID",
      message: "user_id is required in request envelope",
      field: "user_id",
    });
  }

  if (!env.journey_state || typeof env.journey_state !== "object") {
    violations.push({
      code: "MISSING_JOURNEY_STATE",
      message: "journey_state is required in request envelope",
      field: "journey_state",
    });
  }

  if (!env.consent_flags || typeof env.consent_flags !== "object") {
    violations.push({
      code: "MISSING_CONSENT_FLAGS",
      message: "consent_flags is required in request envelope",
      field: "consent_flags",
    });
  } else {
    const flags = env.consent_flags as Record<string, unknown>;
    if (typeof flags.data_processing !== "boolean") {
      violations.push({
        code: "INVALID_CONSENT_FLAG",
        message: "consent_flags.data_processing must be a boolean",
        field: "consent_flags.data_processing",
      });
    }
    if (typeof flags.analytics !== "boolean") {
      violations.push({
        code: "INVALID_CONSENT_FLAG",
        message: "consent_flags.analytics must be a boolean",
        field: "consent_flags.analytics",
      });
    }
    if (typeof flags.third_party_sharing !== "boolean") {
      violations.push({
        code: "INVALID_CONSENT_FLAG",
        message: "consent_flags.third_party_sharing must be a boolean",
        field: "consent_flags.third_party_sharing",
      });
    }
  }

  if (!env.request_id || typeof env.request_id !== "string") {
    violations.push({
      code: "MISSING_REQUEST_ID",
      message: "request_id is required in request envelope",
      field: "request_id",
    });
  }

  if (violations.length > 0) {
    return { valid: false, violations };
  }

  return { valid: true, violations: [], user_id: env.user_id };
}

export async function validateAuth(
  req: Request
): Promise<{ valid: boolean; user_id?: string; error?: string }> {
  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return { valid: false, error: "Authentication required" };
    }

    return { valid: true, user_id: user.id };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Authentication failed",
    };
  }
}

export function checkRateLimit(user_id: string): {
  allowed: boolean;
  remaining: number;
} {
  const now = Date.now();
  const userLimit = rateLimitStore.get(user_id);

  if (!userLimit || now > userLimit.resetAt) {
    rateLimitStore.set(user_id, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - 1 };
  }

  if (userLimit.count >= MAX_REQUESTS_PER_WINDOW) {
    return { allowed: false, remaining: 0 };
  }

  userLimit.count++;
  return {
    allowed: true,
    remaining: MAX_REQUESTS_PER_WINDOW - userLimit.count,
  };
}

export async function validateUserIdMatch(
  envelope_user_id: string,
  auth_user_id: string
): Promise<PolicyCheckResult> {
  if (envelope_user_id !== auth_user_id) {
    return {
      valid: false,
      violations: [
        {
          code: "USER_ID_MISMATCH",
          message: "Envelope user_id must match authenticated user",
          field: "user_id",
        },
      ],
    };
  }

  return { valid: true, violations: [] };
}

export async function logAuditEvent(
  user_id: string,
  event_type: string,
  request_id: string,
  metadata?: Record<string, unknown>
) {
  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    await supabaseClient.from("audit_events").insert({
      user_id,
      event_type,
      metadata: {
        request_id,
        timestamp: new Date().toISOString(),
        ...metadata,
      },
    });
  } catch (error) {
    console.error("Failed to log audit event:", error);
  }
}
