import { createClient } from "jsr:@supabase/supabase-js@2";

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface ConversationHistory {
  messages: ConversationMessage[];
  context_metadata: Record<string, any>;
}

const MAX_CONVERSATION_LENGTH = 20;

export async function getConversationHistory(
  userId: string
): Promise<ConversationHistory> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn("Supabase credentials not found, returning empty history");
    return { messages: [], context_metadata: {} };
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data, error } = await supabase
    .from("gemma_conversations")
    .select("messages, context_metadata")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching conversation history:", error);
    return { messages: [], context_metadata: {} };
  }

  if (!data) {
    return { messages: [], context_metadata: {} };
  }

  return {
    messages: data.messages || [],
    context_metadata: data.context_metadata || {},
  };
}

export async function saveConversationHistory(
  userId: string,
  userMessage: string,
  assistantResponse: string,
  contextMetadata?: Record<string, any>
): Promise<void> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn("Supabase credentials not found, skipping history save");
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const currentHistory = await getConversationHistory(userId);

  const newMessages: ConversationMessage[] = [
    ...currentHistory.messages,
    {
      role: "user",
      content: userMessage,
      timestamp: new Date().toISOString(),
    },
    {
      role: "assistant",
      content: assistantResponse,
      timestamp: new Date().toISOString(),
    },
  ];

  const trimmedMessages = newMessages.slice(-MAX_CONVERSATION_LENGTH);

  const updatedMetadata = {
    ...currentHistory.context_metadata,
    ...contextMetadata,
    last_updated: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("gemma_conversations")
    .upsert(
      {
        user_id: userId,
        messages: trimmedMessages,
        context_metadata: updatedMetadata,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

  if (error) {
    console.error("Error saving conversation history:", error);
  }
}

export function formatConversationForLLM(
  history: ConversationHistory,
  currentMessage: string
): Array<{ role: "user" | "assistant"; content: string }> {
  const messages = history.messages.map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));

  messages.push({
    role: "user",
    content: currentMessage,
  });

  return messages;
}

export async function clearConversationHistory(userId: string): Promise<void> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseServiceKey) {
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  await supabase
    .from("gemma_conversations")
    .delete()
    .eq("user_id", userId);
}
