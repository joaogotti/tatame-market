"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import {
  canTransitionProductStatus,
  isProductStatus,
  type ProductStatus,
} from "@/lib/products";
import { createClient } from "@/lib/supabase/client";

type OwnedProductStatus = {
  id: string | number;
  status: string;
};

export function ProductStatusActions({
  productId,
  status,
}: {
  productId: string;
  status: ProductStatus;
}) {
  const router = useRouter();
  const [supabase] = useState(createClient);
  const isUpdatingRef = useRef(false);
  const [currentStatus, setCurrentStatus] = useState(status);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isConfirmingSold, setIsConfirmingSold] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function updateStatus(nextStatus: ProductStatus) {
    if (isUpdatingRef.current || !isProductStatus(nextStatus)) return;

    isUpdatingRef.current = true;
    setIsUpdating(true);
    setErrorMessage(null);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        console.error("Falha ao validar usuário na alteração de status.", {
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
        setErrorMessage(
          "Sua sessão expirou. Entre novamente para atualizar o anúncio.",
        );
        router.push("/login");
        return;
      }

      // A propriedade e o estado atual são confirmados antes da atualização.
      const { data: ownedProductData, error: productError } = await supabase
        .from("products")
        .select("id,status")
        .eq("id", productId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (productError) {
        console.error("Falha ao validar anúncio antes de alterar status.", {
          productId,
          userId: user.id,
          code: productError.code,
          message: productError.message,
        });
        setErrorMessage(
          "Não foi possível validar este anúncio agora. Tente novamente em instantes.",
        );
        return;
      }

      if (!ownedProductData) {
        setErrorMessage(
          "Este anúncio não foi encontrado ou não está disponível para atualização.",
        );
        return;
      }

      const ownedProduct = ownedProductData as OwnedProductStatus;

      if (
        !isProductStatus(ownedProduct.status) ||
        !canTransitionProductStatus(ownedProduct.status, nextStatus)
      ) {
        console.error("Transição de status rejeitada.", {
          productId,
          userId: user.id,
          currentStatus: ownedProduct.status,
          nextStatus,
        });
        setErrorMessage(
          "O status deste anúncio mudou. Atualize a página e tente novamente.",
        );
        return;
      }

      const { data: updatedProduct, error: updateError } = await supabase
        .from("products")
        .update({ status: nextStatus })
        .eq("id", productId)
        .eq("user_id", user.id)
        .eq("status", ownedProduct.status)
        .select("id")
        .maybeSingle();

      if (updateError) {
        console.error("Falha ao atualizar status do anúncio.", {
          productId,
          userId: user.id,
          currentStatus: ownedProduct.status,
          nextStatus,
          code: updateError.code,
          message: updateError.message,
        });
        setErrorMessage(
          "Não foi possível atualizar o status agora. Tente novamente em instantes.",
        );
        return;
      }

      if (!updatedProduct) {
        console.error("Nenhuma linha foi atualizada ao alterar status.", {
          productId,
          userId: user.id,
          currentStatus: ownedProduct.status,
          nextStatus,
        });
        setErrorMessage(
          "Não foi possível concluir a atualização. Atualize a página e tente novamente.",
        );
        return;
      }

      setCurrentStatus(nextStatus);
      setIsConfirmingSold(false);
      router.refresh();
    } catch (error) {
      console.error("Falha inesperada ao alterar status do anúncio.", {
        productId,
        error,
      });
      setErrorMessage(
        "Não foi possível conectar ao serviço de atualização. Tente novamente.",
      );
    } finally {
      isUpdatingRef.current = false;
      setIsUpdating(false);
    }
  }

  const primaryAction =
    currentStatus === "active"
      ? { label: "Pausar", nextStatus: "paused" as const }
      : { label: "Reativar", nextStatus: "active" as const };

  return (
    <div className="mt-5 flex flex-wrap items-center gap-2 rounded-xl border border-white/5 bg-zinc-950/40 p-3">
      <span className="mr-auto text-xs font-medium text-zinc-500">
        Status do anúncio
      </span>

      <button
        type="button"
        disabled={isUpdating || isConfirmingSold}
        className="rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-zinc-300 transition hover:border-[#58C447]/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
        onClick={() => updateStatus(primaryAction.nextStatus)}
      >
        {isUpdating ? "Atualizando..." : primaryAction.label}
      </button>

      {currentStatus !== "sold" && (
        <button
          type="button"
          disabled={isUpdating || isConfirmingSold}
          className="rounded-lg border border-sky-400/30 px-3 py-2 text-xs font-medium text-sky-300 transition hover:border-sky-300/60 hover:text-sky-200 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={() => {
            setErrorMessage(null);
            setIsConfirmingSold(true);
          }}
        >
          Marcar como vendido
        </button>
      )}

      {isConfirmingSold && currentStatus !== "sold" && (
        <div className="order-last basis-full border-t border-white/5 pt-3">
          <p className="text-sm text-zinc-300">
            Tem certeza que deseja marcar este anúncio como vendido?
          </p>
          <div className="mt-3 flex flex-wrap justify-end gap-2">
            <button
              type="button"
              disabled={isUpdating}
              className="rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-zinc-300 transition hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              onClick={() => setIsConfirmingSold(false)}
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={isUpdating}
              className="rounded-lg bg-sky-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={() => updateStatus("sold")}
            >
              {isUpdating ? "Atualizando..." : "Confirmar venda"}
            </button>
          </div>
        </div>
      )}

      {errorMessage && (
        <p
          role="alert"
          aria-live="polite"
          className="order-last basis-full border-t border-white/5 pt-3 text-sm text-red-300"
        >
          {errorMessage}
        </p>
      )}
    </div>
  );
}
