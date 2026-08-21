"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useRef, useState } from "react";

import { createClient } from "@/lib/supabase/client";

const MAX_MESSAGE_LENGTH = 2000;

export function MessageForm({ conversationId }: { conversationId: string }) {
  const router = useRouter();
  const [supabase] = useState(createClient);
  const isSubmittingRef = useRef(false);
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmittingRef.current) return;

    const trimmedContent = content.trim();

    if (!trimmedContent) {
      setErrorMessage("Digite uma mensagem antes de enviar.");
      return;
    }

    if (trimmedContent.length > MAX_MESSAGE_LENGTH) {
      setErrorMessage(`A mensagem deve ter no máximo ${MAX_MESSAGE_LENGTH} caracteres.`);
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError && authError.name !== "AuthSessionMissingError") {
        console.error("Falha ao validar usuário antes do envio.", {
          conversationId,
          name: authError.name,
          message: authError.message,
        });
        setErrorMessage("Não foi possível validar sua sessão. Tente novamente.");
        return;
      }

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: conversation, error: conversationError } = await supabase
        .from("conversations")
        .select("id,buyer_id,seller_id")
        .eq("id", conversationId)
        .maybeSingle();

      if (
        conversationError ||
        !conversation ||
        (conversation.buyer_id !== user.id && conversation.seller_id !== user.id)
      ) {
        console.error("Conversa inválida ou inacessível durante o envio.", {
          conversationId,
          userId: user.id,
          code: conversationError?.code,
          message: conversationError?.message,
        });
        setErrorMessage("Esta conversa não está mais disponível.");
        router.refresh();
        return;
      }

      const { error } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: trimmedContent,
      });

      if (error) {
        console.error("Falha ao enviar mensagem.", {
          conversationId,
          senderId: user.id,
          code: error.code,
          message: error.message,
        });
        setErrorMessage("Não foi possível enviar sua mensagem. Tente novamente.");
        return;
      }

      setContent("");
      router.refresh();
    } catch (error) {
      console.error("Falha inesperada ao enviar mensagem.", {
        conversationId,
        error,
      });
      setErrorMessage("Não foi possível conectar ao serviço de mensagens.");
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <form
      className="border-t border-white/10 bg-zinc-900 p-4 sm:p-6"
      aria-busy={isSubmitting}
      onSubmit={handleSubmit}
    >
      <label htmlFor="message-content" className="sr-only">
        Mensagem
      </label>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <textarea
          id="message-content"
          value={content}
          rows={3}
          maxLength={MAX_MESSAGE_LENGTH}
          disabled={isSubmitting}
          placeholder="Digite sua mensagem..."
          className="min-h-24 flex-1 resize-y rounded-lg border border-zinc-700 bg-[#181B19] px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-[#58C447] focus:ring-1 focus:ring-[#58C447] disabled:opacity-60"
          onChange={(event) => setContent(event.target.value)}
        />
        <button
          type="submit"
          disabled={isSubmitting || !content.trim()}
          className="rounded-lg bg-[#58C447] px-6 py-3 font-semibold text-[#111412] transition hover:bg-[#6AD159] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Enviando..." : "Enviar"}
        </button>
      </div>
      <div className="mt-2 flex items-start justify-between gap-4 text-xs">
        <span className="text-red-300" role={errorMessage ? "alert" : undefined}>
          {errorMessage}
        </span>
        <span className="shrink-0 text-zinc-500">
          {content.length}/{MAX_MESSAGE_LENGTH}
        </span>
      </div>
    </form>
  );
}
