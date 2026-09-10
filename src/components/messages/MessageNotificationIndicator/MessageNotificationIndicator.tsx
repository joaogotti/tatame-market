"use client";

import { usePathname } from "next/navigation";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { createClient } from "@/lib/supabase/client";

type RealtimeMessage = {
  conversation_id: string;
  sender_id: string;
};

type ConversationParticipants = {
  buyer_id: string;
  seller_id: string;
};

const MessageNotificationContext = createContext(false);

export function MessageNotificationProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [supabase] = useState(createClient);
  const [userId, setUserId] = useState<string | null>(null);
  const [unreadConversationIds, setUnreadConversationIds] = useState<string[]>([]);
  const userIdRef = useRef<string | null>(null);
  const pathnameRef = useRef(pathname);

  useEffect(() => {
    pathnameRef.current = pathname;

    if (!pathname.startsWith("/mensagens/")) return;

    const timeoutId = window.setTimeout(() => {
      setUnreadConversationIds((ids) =>
        ids.filter((id) => pathname !== `/mensagens/${id}`),
      );
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [pathname]);

  useEffect(() => {
    let isActive = true;
    let authVersion = 0;

    function updateUser(nextUserId: string | null) {
      if (userIdRef.current !== nextUserId) {
        userIdRef.current = nextUserId;
        setUnreadConversationIds([]);
      }
      setUserId(nextUserId);
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isActive) return;

      authVersion += 1;
      updateUser(session?.user.id ?? null);
    });

    const initialAuthVersion = authVersion;
    supabase.auth
      .getUser()
      .then(({ data, error }) => {
        if (!isActive || authVersion !== initialAuthVersion) return;

        updateUser(error ? null : (data.user?.id ?? null));
      })
      .catch(() => {
        if (isActive && authVersion === initialAuthVersion) updateUser(null);
      });

    return () => {
      isActive = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (!userId) return;

    let isActive = true;
    const channel = supabase
      .channel(`message-notifications-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        async (payload) => {
          const message = payload.new as RealtimeMessage;

          if (
            !isActive ||
            userIdRef.current !== userId ||
            !message.conversation_id ||
            message.sender_id === userId ||
            pathnameRef.current === `/mensagens/${message.conversation_id}`
          ) {
            return;
          }

          // A mensagem não carrega os participantes. A conversa é consultada
          // com o cliente autenticado e continua protegida pelas policies RLS.
          const { data, error } = await supabase
            .from("conversations")
            .select("buyer_id,seller_id")
            .eq("id", message.conversation_id)
            .maybeSingle();

          // A rota e a sessão podem mudar enquanto a consulta está em andamento.
          if (
            !isActive ||
            userIdRef.current !== userId ||
            pathnameRef.current === `/mensagens/${message.conversation_id}`
          ) {
            return;
          }

          if (error) {
            console.error("Falha ao validar notificação de mensagem.", {
              conversationId: message.conversation_id,
              userId,
              code: error.code,
              message: error.message,
            });
            return;
          }

          const conversation = data as ConversationParticipants | null;

          if (
            conversation &&
            (conversation.buyer_id === userId ||
              conversation.seller_id === userId)
          ) {
            setUnreadConversationIds((ids) =>
              ids.includes(message.conversation_id)
                ? ids
                : [...ids, message.conversation_id],
            );
          }
        },
      )
      .subscribe((status, error) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.error("Falha na subscription global de mensagens.", {
            userId,
            status,
            error,
          });
        }
      });

    return () => {
      isActive = false;
      void supabase.removeChannel(channel);
    };
  }, [supabase, userId]);

  const hasNewMessage =
    !!userId && unreadConversationIds.some((id) => pathname !== `/mensagens/${id}`);

  return (
    <MessageNotificationContext.Provider value={hasNewMessage}>
      {children}
    </MessageNotificationContext.Provider>
  );
}

export function MessageNotificationIndicator() {
  const hasNewMessage = useContext(MessageNotificationContext);

  if (!hasNewMessage) return null;

  return (
    <span
      aria-label="Novas mensagens"
      title="Novas mensagens"
      className="ml-auto size-2.5 shrink-0 rounded-full bg-[#58C447] shadow-[0_0_0_3px_rgba(88,196,71,0.15)]"
    />
  );
}
