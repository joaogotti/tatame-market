"use client";

import { useEffect } from "react";
import { useMessageNotifications } from "@/components/messages/MessageNotificationIndicator/MessageNotificationIndicator";

export function MessageReadReceipt({ userId, conversationId, lastMessageId }: {
  userId: string;
  conversationId: string;
  lastMessageId: string | null;
}) {
  const { userId: sessionUserId, markRead } = useMessageNotifications();

  useEffect(() => {
    if (!lastMessageId || userId !== sessionUserId) return;
    const messageId = lastMessageId;
    let active = true;
    let pending = false;
    let confirmed = false;
    let retryDelay = 2000;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function acknowledge() {
      if (!active || pending || confirmed || document.visibilityState !== "visible") return;
      clearTimeout(timer);
      pending = true;
      const success = await markRead(userId, conversationId, messageId);
      pending = false;
      if (!active) return;
      confirmed = success;
      if (!success) {
        timer = setTimeout(() => { void acknowledge(); }, retryDelay);
        retryDelay = Math.min(retryDelay * 2, 30000);
      }
    }
    const onVisible = () => { void acknowledge(); };
    // Executa no cliente após montar o histórico, nunca durante SSR/prefetch.
    timer = setTimeout(onVisible, 0);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", onVisible);
    return () => {
      active = false;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", onVisible);
    };
  }, [userId, sessionUserId, conversationId, lastMessageId, markRead]);

  return null;
}
