"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { createClient } from "@/lib/supabase/client";

type RealtimeMessage = {
  conversation_id: string;
  sender_id: string;
};

type ConversationParticipants = {
  buyer_id: string;
  seller_id: string;
};

export function MessageNotificationIndicator() {
  const pathname = usePathname();
  const [supabase] = useState(createClient);
  const [userId, setUserId] = useState<string | null>(null);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const pathnameRef = useRef(pathname);

  useEffect(() => {
    pathnameRef.current = pathname;

    if (!pathname.startsWith("/mensagens")) return;

    const timeoutId = window.setTimeout(() => {
      setHasNewMessage(false);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [pathname]);

  useEffect(() => {
    let isActive = true;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isActive) return;

      setUserId(session?.user.id ?? null);

      if (!session?.user) {
        setHasNewMessage(false);
      }
    });

    supabase.auth
      .getUser()
      .then(({ data, error }) => {
        if (!isActive) return;

        setUserId(error ? null : (data.user?.id ?? null));
      })
      .catch(() => {
        if (isActive) setUserId(null);
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
            !message.conversation_id ||
            message.sender_id === userId ||
            pathnameRef.current.startsWith("/mensagens")
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

          if (!isActive) return;

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
            setHasNewMessage(true);
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

  if (!hasNewMessage) return null;

  return (
    <span
      aria-label="Novas mensagens"
      title="Novas mensagens"
      className="ml-auto size-2.5 shrink-0 rounded-full bg-[#58C447] shadow-[0_0_0_3px_rgba(88,196,71,0.15)]"
    />
  );
}
