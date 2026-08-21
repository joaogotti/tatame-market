"use client";

import { MessageCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { createClient } from "@/lib/supabase/client";

type ConversationIdRecord = {
  id: string;
};

type ProductOwnerRecord = {
  user_id: string;
  status: string;
};

export function StartConversationButton({ productId }: { productId: string }) {
  const router = useRouter();
  const [supabase] = useState(createClient);
  const isSubmittingRef = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function findConversation(buyerId: string) {
    return supabase
      .from("conversations")
      .select("id")
      .eq("product_id", productId)
      .eq("buyer_id", buyerId)
      .maybeSingle();
  }

  async function handleClick() {
    if (isSubmittingRef.current) return;

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError && authError.name !== "AuthSessionMissingError") {
        console.error("Falha ao validar usuário antes de iniciar conversa.", {
          productId,
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

      // O proprietário e o status são relidos da fonte confiável no momento
      // da ação; nenhum deles é recebido por props ou controlado pelo cliente.
      const { data: productData, error: productError } = await supabase
        .from("products")
        .select("user_id,status")
        .eq("id", productId)
        .eq("status", "active")
        .maybeSingle();

      if (productError) {
        console.error("Falha ao validar produto antes de iniciar conversa.", {
          productId,
          code: productError.code,
          message: productError.message,
        });
        setErrorMessage("Não foi possível validar este anúncio agora.");
        return;
      }

      const product = productData as ProductOwnerRecord | null;

      if (!product) {
        setErrorMessage("Este anúncio não está mais disponível.");
        router.refresh();
        return;
      }

      if (product.user_id === user.id) {
        setErrorMessage("Você não pode iniciar uma conversa com seu próprio anúncio.");
        router.refresh();
        return;
      }

      const { data: existingData, error: existingError } =
        await findConversation(user.id);

      if (existingError) {
        console.error("Falha ao procurar conversa existente.", {
          productId,
          buyerId: user.id,
          code: existingError.code,
          message: existingError.message,
        });
        setErrorMessage("Não foi possível abrir a conversa agora.");
        return;
      }

      const existingConversation = existingData as ConversationIdRecord | null;

      if (existingConversation) {
        router.push(`/mensagens/${encodeURIComponent(existingConversation.id)}`);
        return;
      }

      const { data: insertedData, error: insertError } = await supabase
        .from("conversations")
        .insert({
          product_id: productId,
          buyer_id: user.id,
          seller_id: product.user_id,
        })
        .select("id")
        .single();

      if (!insertError) {
        const insertedConversation = insertedData as ConversationIdRecord;
        router.push(`/mensagens/${encodeURIComponent(insertedConversation.id)}`);
        return;
      }

      if (insertError.code === "23505") {
        // Outra tentativa pode ter criado a mesma conversa entre o SELECT e o
        // INSERT. Nesse caso, a restrição UNIQUE vira o mecanismo de lock.
        const { data: concurrentData, error: concurrentError } =
          await findConversation(user.id);
        const concurrentConversation =
          concurrentData as ConversationIdRecord | null;

        if (!concurrentError && concurrentConversation) {
          router.push(
            `/mensagens/${encodeURIComponent(concurrentConversation.id)}`,
          );
          return;
        }
      }

      console.error("Falha ao criar conversa.", {
        productId,
        buyerId: user.id,
        code: insertError.code,
        message: insertError.message,
      });
      setErrorMessage("Não foi possível iniciar a conversa. Tente novamente.");
    } catch (error) {
      console.error("Falha inesperada ao iniciar conversa.", {
        productId,
        error,
      });
      setErrorMessage("Não foi possível conectar ao serviço de mensagens.");
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mt-6">
      <button
        type="button"
        disabled={isSubmitting}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#58C447] px-5 py-3 font-semibold text-[#111412] transition hover:bg-[#6AD159] disabled:cursor-not-allowed disabled:opacity-60"
        onClick={handleClick}
      >
        <MessageCircle aria-hidden="true" size={20} />
        {isSubmitting ? "Abrindo conversa..." : "Conversar com vendedor"}
      </button>

      {errorMessage && (
        <p
          role="alert"
          className="mt-3 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-300"
        >
          {errorMessage}
        </p>
      )}
    </div>
  );
}
