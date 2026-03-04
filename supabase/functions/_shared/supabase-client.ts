import { createClient } from "jsr:@supabase/supabase-js@2";

export function createSupabaseClient(authToken?: string) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = authToken || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export function getAuthToken(req: Request): string | null {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return null;

  const match = authHeader.match(/^Bearer (.+)$/);
  return match ? match[1] : null;
}
