"use client";

import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { createClient } from "@/lib/supabase/client";

export function FavoriteButton({
  productId,
  initialIsFavorite,
  className = "relative",
}: {
  productId: string;
  initialIsFavorite: boolean;
  className?: string;
}) {
  const router = useRouter();
  const [supabase] = useState(createClient);
  const isSubmittingRef = useRef(false);
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function toggleFavorite() {
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
        console.error("Falha ao validar usuário ao alterar favorito.", {
          productId,
          name: authError.name,
          message: authError.message,
        });
        setErrorMessage(
          "Não foi possível validar sua sessão. Entre novamente e tente de novo.",
        );
        return;
      }

      if (!user) {
        router.push("/login");
        return;
      }

      if (isFavorite) {
        const { data, error } = await supabase
          .from("favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("product_id", productId)
          .select("product_id")
          .maybeSingle();

        if (error) {
          console.error("Falha ao remover produto dos favoritos.", {
            productId,
            userId: user.id,
            code: error.code,
            message: error.message,
          });
          setErrorMessage(
            "Não foi possível remover este favorito. Tente novamente.",
          );
          return;
        }

        if (!data) {
          console.error("Nenhum favorito foi removido.", {
            productId,
            userId: user.id,
          });
          setErrorMessage(
            "Não foi possível localizar este favorito. Atualize a página e tente novamente.",
          );
          return;
        }

        setIsFavorite(false);
      } else {
        const { error } = await supabase.from("favorites").insert({
          user_id: user.id,
          product_id: productId,
        });

        if (error) {
          console.error("Falha ao adicionar produto aos favoritos.", {
            productId,
            userId: user.id,
            code: error.code,
            message: error.message,
          });
          setErrorMessage(
            "Não foi possível adicionar este favorito. Tente novamente.",
          );
          return;
        }

        setIsFavorite(true);
      }

      router.refresh();
    } catch (error) {
      console.error("Falha inesperada ao alterar favorito.", {
        productId,
        error,
      });
      setErrorMessage(
        "Não foi possível conectar ao serviço de favoritos. Tente novamente.",
      );
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <div className={className}>
      <button
        type="button"
        aria-label={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
        aria-pressed={isFavorite}
        disabled={isSubmitting}
        className={`flex size-10 items-center justify-center rounded-full border shadow-lg backdrop-blur transition disabled:cursor-not-allowed disabled:opacity-60 ${
          isFavorite
            ? "border-[#58C447]/50 bg-[#58C447] text-[#111412]"
            : "border-white/15 bg-zinc-950/80 text-zinc-200 hover:border-[#58C447]/50 hover:text-[#58C447]"
        }`}
        onClick={toggleFavorite}
      >
        <Heart
          aria-hidden="true"
          size={20}
          fill={isFavorite ? "currentColor" : "none"}
        />
      </button>

      {errorMessage && (
        <p
          role="alert"
          className="absolute right-0 top-full z-30 mt-2 w-64 rounded-lg border border-red-500/20 bg-zinc-900 px-3 py-2 text-left text-xs text-red-300 shadow-xl"
        >
          {errorMessage}
        </p>
      )}
    </div>
  );
}
