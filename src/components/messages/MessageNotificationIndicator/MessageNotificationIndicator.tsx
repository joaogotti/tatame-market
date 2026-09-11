"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { loadUnreadConversations } from "@/lib/messageReads";

type NotificationState = {
  userId: string | null;
  hasNewMessage: boolean;
  markRead: (userId: string, conversationId: string, messageId: string) => Promise<boolean>;
};
const MessageNotificationContext = createContext<NotificationState>({
  userId: null,
  hasNewMessage: false,
  markRead: async () => false,
});
export const useMessageNotifications = () => useContext(MessageNotificationContext);

export function MessageNotificationProvider({ children }: { children: ReactNode }) {
  const [supabase] = useState(createClient);
  const [userId, setUserId] = useState<string | null>(null);
  const [unreadConversationIds, setUnreadConversationIds] = useState<string[]>([]);
  const userIdRef = useRef<string | null>(null);
  const sessionVersion = useRef(0);
  const revision = useRef(0);
  const refreshRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    let active = true;
    let authVersion = 0;
    function updateUser(id: string | null) {
      if (userIdRef.current !== id) {
        userIdRef.current = id;
        sessionVersion.current += 1;
        revision.current += 1;
        setUnreadConversationIds([]);
      }
      setUserId(id);
    }
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      authVersion += 1;
      updateUser(session?.user.id ?? null);
    });
    const initialVersion = authVersion;
    void supabase.auth.getUser().then(({ data, error }) => {
      if (active && authVersion === initialVersion) updateUser(error ? null : data.user?.id ?? null);
    }).catch(() => {
      if (active && authVersion === initialVersion) updateUser(null);
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (!userId) return;
    const currentUserId = userId;
    let active = true;
    let running = false;
    let requested = false;
    const session = sessionVersion.current;
    const isCurrent = () => active && sessionVersion.current === session && userIdRef.current === currentUserId;
    async function reconcile() {
      requested = true;
      if (running) return;
      running = true;
      try {
        while (requested && isCurrent()) {
          requested = false;
          const version = revision.current;
          try {
            const ids = await loadUnreadConversations(supabase, currentUserId);
            if (!isCurrent()) return;
            if (version === revision.current) setUnreadConversationIds(ids);
            else requested = true;
          } catch (error) {
            // Uma falha de rede não significa que todas as mensagens foram lidas.
            if (isCurrent()) console.error("Falha ao consultar mensagens não lidas.", error);
          }
        }
      } finally {
        running = false;
      }
    }
    const refresh = () => { void reconcile(); };
    refreshRef.current = refresh;
    const onVisible = () => { if (document.visibilityState === "visible") refresh(); };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", refresh);
    const channel = supabase.channel(`message-notifications-${userId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, async (payload) => {
        const message = payload.new as { conversation_id: string; sender_id: string };
        if (!isCurrent() || !message.conversation_id || message.sender_id === userId) return;
        revision.current += 1;
        try {
          const { data, error } = await supabase.from("conversations")
            .select("buyer_id,seller_id").eq("id", message.conversation_id).maybeSingle();
          if (!isCurrent()) return;
          if (error) throw error;
          if (data && (data.buyer_id === userId || data.seller_id === userId)) {
            revision.current += 1;
            setUnreadConversationIds((ids) => ids.includes(message.conversation_id) ? ids : [...ids, message.conversation_id]);
          }
        } catch (error) {
          if (isCurrent()) console.error("Falha ao validar notificação de mensagem.", error);
        }
        if (isCurrent()) refresh();
      })
      .subscribe((status, error) => {
        if (!isCurrent()) return;
        if (status === "SUBSCRIBED") refresh();
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.error("Falha na subscription global de mensagens.", { status, error });
        }
      });
    refresh();
    return () => {
      active = false;
      if (refreshRef.current === refresh) refreshRef.current = null;
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", refresh);
      void supabase.removeChannel(channel);
    };
  }, [supabase, userId]);

  const markRead = useCallback(async (expectedUserId: string, conversationId: string, messageId: string) => {
    if (userIdRef.current !== expectedUserId) return false;
    const session = sessionVersion.current;
    try {
      const { data, error } = await supabase.rpc("mark_conversation_read", {
        p_conversation_id: conversationId,
        p_last_read_message_id: messageId,
      });
      if (userIdRef.current !== expectedUserId || sessionVersion.current !== session) return false;
      if (error) throw error;
      const read = Array.isArray(data) ? data[0] : data;
      if (!read || read.user_id !== expectedUserId || read.conversation_id !== conversationId || !read.last_read_message_id) {
        throw new Error("A confirmação de leitura não retornou um marcador válido.");
      }
      // Reconsulta antes de limpar: uma mensagem pode ter chegado durante a RPC.
      revision.current += 1;
      refreshRef.current?.();
      return true;
    } catch (error) {
      if (sessionVersion.current === session) console.error("Falha ao confirmar leitura da conversa.", error);
      return false;
    }
  }, [supabase]);

  return (
    <MessageNotificationContext.Provider value={{
      userId,
      hasNewMessage: !!userId && unreadConversationIds.length > 0,
      markRead,
    }}>
      {children}
    </MessageNotificationContext.Provider>
  );
}

export function MessageNotificationIndicator() {
  const { hasNewMessage } = useMessageNotifications();
  if (!hasNewMessage) return null;
  return (
    <span
      aria-label="Novas mensagens"
      title="Novas mensagens"
      className="ml-auto size-2.5 shrink-0 rounded-full bg-[#58C447] shadow-[0_0_0_3px_rgba(88,196,71,0.15)]"
    />
  );
}
