"use client";

import { useRouter } from "next/navigation";
import { useId, useRef, useState } from "react";

import { PRODUCT_IMAGES_BUCKET } from "@/lib/productImages";
import { createClient } from "@/lib/supabase/client";

type ProductImageForDeletion = {
  id: string | number;
  storage_path: string;
};

export function DeleteProductButton({ productId }: { productId: string }) {
  const router = useRouter();
  const confirmationTitleId = useId();
  const confirmationDescriptionId = useId();
  const [supabase] = useState(createClient);
  const isDeletingRef = useRef(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function closeConfirmation() {
    if (isDeletingRef.current) return;

    setIsConfirming(false);
    setErrorMessage(null);
  }

  async function handleDelete() {
    if (isDeletingRef.current) return;

    isDeletingRef.current = true;
    setIsDeleting(true);
    setErrorMessage(null);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        console.error("Falha ao validar usuário durante a exclusão.", {
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
          "Sua sessão expirou. Entre novamente para excluir o anúncio.",
        );
        router.push("/login");
        return;
      }

      // A propriedade é confirmada antes de consultar ou remover imagens.
      const { data: ownedProduct, error: productError } = await supabase
        .from("products")
        .select("id")
        .eq("id", productId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (productError) {
        console.error("Falha ao validar propriedade antes da exclusão.", {
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

      if (!ownedProduct) {
        setErrorMessage(
          "Este anúncio não foi encontrado ou não está disponível para exclusão.",
        );
        return;
      }

      const { data: imageData, error: imageQueryError } = await supabase
        .from("product_images")
        .select("id,storage_path")
        .eq("product_id", ownedProduct.id);

      if (imageQueryError) {
        console.error("Falha ao buscar imagens antes da exclusão.", {
          productId,
          userId: user.id,
          code: imageQueryError.code,
          message: imageQueryError.message,
        });
        setErrorMessage(
          "Não foi possível preparar a exclusão das imagens. Tente novamente.",
        );
        return;
      }

      const images = (imageData ?? []) as ProductImageForDeletion[];
      const storagePaths = [
        ...new Set(images.map((image) => image.storage_path)),
      ];

      if (storagePaths.length > 0) {
        const { error: storageError } = await supabase.storage
          .from(PRODUCT_IMAGES_BUCKET)
          .remove(storagePaths);

        if (storageError) {
          // O produto e sua metadata permanecem para permitir nova tentativa.
          console.error("Falha ao remover arquivos do anúncio no Storage.", {
            productId,
            userId: user.id,
            storagePaths,
            message: storageError.message,
          });
          setErrorMessage(
            "Não foi possível remover as imagens do anúncio. Nada foi excluído; tente novamente.",
          );
          return;
        }
      }

      const { data: deletedProduct, error: deleteError } = await supabase
        .from("products")
        .delete()
        .eq("id", productId)
        .eq("user_id", user.id)
        .select("id")
        .maybeSingle();

      if (deleteError) {
        console.error(
          "Arquivos removidos, mas houve falha ao excluir o produto.",
          {
            productId,
            userId: user.id,
            storagePaths,
            code: deleteError.code,
            message: deleteError.message,
          },
        );
        setErrorMessage(
          "As imagens foram removidas, mas não foi possível excluir o anúncio. Tente novamente.",
        );
        return;
      }

      if (!deletedProduct) {
        console.error("Nenhuma linha de produto foi excluída.", {
          productId,
          userId: user.id,
          storagePaths,
        });
        setErrorMessage(
          "Não foi possível concluir a exclusão do anúncio. Atualize a página e tente novamente.",
        );
        return;
      }

      setIsConfirming(false);
      router.refresh();
    } catch (error) {
      console.error("Falha inesperada ao excluir anúncio.", {
        productId,
        error,
      });
      setErrorMessage(
        "Não foi possível conectar ao serviço de exclusão. Tente novamente.",
      );
    } finally {
      isDeletingRef.current = false;
      setIsDeleting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        aria-expanded={isConfirming}
        disabled={isDeleting}
        className="rounded-lg border border-red-500/40 px-4 py-2 text-sm font-medium text-red-400 transition hover:border-red-400 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-60"
        onClick={() => {
          setErrorMessage(null);
          setIsConfirming(true);
        }}
      >
        Excluir
      </button>

      {isConfirming && (
        <div
          role="alertdialog"
          aria-labelledby={confirmationTitleId}
          aria-describedby={confirmationDescriptionId}
          className="order-last basis-full rounded-xl border border-red-500/20 bg-red-500/5 p-4"
        >
          <strong id={confirmationTitleId} className="text-sm text-white">
            Excluir anúncio?
          </strong>
          <p
            id={confirmationDescriptionId}
            className="mt-2 text-sm leading-6 text-zinc-400"
          >
            Tem certeza que deseja excluir este anúncio? Esta ação não pode ser
            desfeita.
          </p>

          {errorMessage && (
            <p
              role="alert"
              aria-live="polite"
              className="mt-3 text-sm text-red-300"
            >
              {errorMessage}
            </p>
          )}

          <div className="mt-4 flex flex-wrap justify-end gap-3">
            <button
              type="button"
              disabled={isDeleting}
              className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              onClick={closeConfirmation}
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={isDeleting}
              className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={handleDelete}
            >
              {isDeleting ? "Excluindo..." : "Excluir anúncio"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
