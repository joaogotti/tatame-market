import type { SupabaseClient } from "@supabase/supabase-js";

export async function hasUnreadMessages(supabase: SupabaseClient, userId: string, conversationId: string) {
  const { data: read, error: readError } = await supabase
    .from("conversation_reads").select("last_read_message_id")
    .eq("user_id", userId).eq("conversation_id", conversationId).maybeSingle();
  if (readError) throw readError;

  let marker: { id: string; created_at: string } | null = null;
  if (read?.last_read_message_id) {
    const { data, error } = await supabase.from("messages").select("id,created_at")
      .eq("conversation_id", conversationId).eq("id", read.last_read_message_id).maybeSingle();
    if (error) throw error;
    marker = data;
  }
  let query = supabase.from("messages").select("id")
    .eq("conversation_id", conversationId).neq("sender_id", userId);
  if (marker) {
    // Compara no Postgres, sem perder microssegundos ao converter para Date.
    // UUIDs canônicos têm a mesma ordem por valor e por representação textual.
    query = query.or(`created_at.gt.${marker.created_at},and(created_at.eq.${marker.created_at},id.gt.${marker.id})`);
  }
  const { data, error } = await query.limit(1);
  if (error) throw error;
  return !!data?.length;
}

export async function loadUnreadConversations(supabase: SupabaseClient, userId: string) {
  const unread: string[] = [];
  const pageSize = 100;
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabase.from("conversations").select("id")
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`).order("id")
      .range(offset, offset + pageSize - 1);
    if (error) throw error;
    const conversations = data ?? [];
    // No máximo seis consultas de existência simultâneas, sem baixar o histórico.
    for (let index = 0; index < conversations.length; index += 6) {
      const results = await Promise.all(conversations.slice(index, index + 6).map(async ({ id }) =>
        (await hasUnreadMessages(supabase, userId, id)) ? id as string : null,
      ));
      unread.push(...results.filter((id): id is string => id !== null));
    }
    if (conversations.length < pageSize) return unread;
  }
}
