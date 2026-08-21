"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { createClient } from "@/lib/supabase/client";

type RealtimeMessage = {
  id: string;
  sender_id: string;
};

export function MessageRealtimeListener({
  conversationId,
  visibleMessageIds,
}: {
  conversationId: string;
  visibleMessageIds: string[];
}) {
  const router = useRouter();
  const [supabase] = useState(createClient);
  const visibleMessageIdsRef = useRef(new Set(visibleMessageIds));

  useEffect(() => {
    visibleMessageIdsRef.current = new Set(visibleMessageIds);
  }, [conversationId, visibleMessageIds]);

  useEffect(() => {
    let isActive = true;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function subscribe() {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (!isActive) return;

      if (authError && authError.name !== "AuthSessionMissingError") {
        console.error("Falha ao autenticar listener da conversa.", {
          conversationId,
          name: authError.name,
          message: authError.message,
        });
        return;
      }

      if (!user) return;

      channel = supabase
        .channel(`conversation-messages-${conversationId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `conversation_id=eq.${conversationId}`,
          },
          (payload) => {
            const message = payload.new as RealtimeMessage;

            // O envio local já atualiza a página pelo MessageForm. Ignorá-lo
            // aqui evita um segundo refresh para o mesmo INSERT.
            if (
              !message.id ||
              message.sender_id === user.id ||
              visibleMessageIdsRef.current.has(message.id)
            ) {
              return;
            }

            visibleMessageIdsRef.current.add(message.id);
            router.refresh();
          },
        )
        .subscribe((status, error) => {
          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            console.error("Falha na subscription da conversa.", {
              conversationId,
              status,
              error,
            });
          }
        });
    }

    void subscribe();

    return () => {
      isActive = false;

      if (channel) {
        void supabase.removeChannel(channel);
      }
    };
  }, [conversationId, router, supabase]);

  return null;
}
