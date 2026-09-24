"use client";

import { ImagePlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useRef, useState } from "react";

import { productCategories } from "@/constants/categories";
import type { ProductCondition } from "@/lib/products";
import { LocationAutocomplete } from "@/components/location/LocationAutocomplete/LocationAutocomplete";
import {
  PRODUCT_IMAGE_MIME_TYPES,
  uploadProductImages,
  validateProductImages,
} from "@/lib/productImages";
import { createClient } from "@/lib/supabase/client";

const productConditions = ["Novo", "Usado"] satisfies ProductCondition[];

const fieldClassName =
  "mt-2 w-full rounded-lg border border-zinc-700 bg-[#181B19] px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-[#58C447] focus:ring-1 focus:ring-[#58C447]";

function getRequiredValue(formData: FormData, name: string) {
  const value = formData.get(name);

  return typeof value === "string" ? value.trim() : "";
}

/**
 * Formulário para criação de anúncios do Tatame Market.
 * Os dados e as imagens são associados ao usuário autenticado e persistidos
 * no Supabase antes do redirecionamento para a página do produto.
 */
export function CreateProductForm() {
  const router = useRouter();
  const [supabase] = useState(createClient);
  const isSubmittingRef = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmittingRef.current) return;

    const formData = new FormData(event.currentTarget);
    const title = getRequiredValue(formData, "title");
    const category = getRequiredValue(formData, "category");
    const priceValue = getRequiredValue(formData, "price");
    const condition = getRequiredValue(formData, "condition");
    const size = getRequiredValue(formData, "size");
    const locationIbgeCodeValue = getRequiredValue(
      formData,
      "locationIbgeCode",
    );
    const locationCity = getRequiredValue(formData, "locationCity");
    const locationState = getRequiredValue(formData, "locationState");
    const description = getRequiredValue(formData, "description");
    const imageFiles = formData
      .getAll("images")
      .filter(
        (value): value is File => value instanceof File && value.size > 0,
      );
    const price = Number(priceValue);
    const locationIbgeCode = Number(locationIbgeCodeValue);

    setErrorMessage(null);
    setSuccessMessage(null);

    if (
      !title ||
      !productCategories.some((item) => item === category) ||
      !priceValue ||
      !Number.isFinite(price) ||
      price < 0 ||
      !productConditions.some((item) => item === condition) ||
      !size ||
      !locationIbgeCodeValue ||
      !Number.isInteger(locationIbgeCode) ||
      !locationCity ||
      !locationState ||
      !description
    ) {
      setErrorMessage(
        "Preencha corretamente todos os campos obrigatórios antes de publicar.",
      );
      return;
    }

    const imageValidationError = validateProductImages(imageFiles);

    if (imageValidationError) {
      setErrorMessage(imageValidationError);
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    let keepSubmissionLocked = false;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setErrorMessage(
          "Sua sessão expirou. Entre novamente para publicar o anúncio.",
        );
        router.push("/login");
        return;
      }

      const { data, error } = await supabase
        .from("products")
        .insert({
          user_id: user.id,
          title,
          category,
          price,
          condition,
          size,
          location_ibge_code: locationIbgeCode,
          location_city: locationCity,
          location_state: locationState,
          description,
        })
        .select("id")
        .single();

      if (error) {
        setErrorMessage(
          "Não foi possível publicar o anúncio agora. Tente novamente em instantes.",
        );
        return;
      }

      const productId = String(data.id);

      if (imageFiles.length > 0) {
        try {
          await uploadProductImages({
            supabase,
            userId: user.id,
            productId,
            files: imageFiles,
          });
        } catch (imageError) {
          console.error("Falha ao publicar imagens do produto.", imageError);
          keepSubmissionLocked = true;
          setErrorMessage(
            "O anúncio foi criado, mas houve um problema ao salvar as imagens. Redirecionando para o anúncio...",
          );

          window.setTimeout(() => {
            router.push(`/produto/${encodeURIComponent(productId)}`);
          }, 2500);
          return;
        }
      }

      keepSubmissionLocked = true;
      setSuccessMessage("Anúncio publicado com sucesso. Redirecionando...");

      window.setTimeout(() => {
        router.push(`/produto/${encodeURIComponent(productId)}`);
      }, 800);
    } catch {
      setErrorMessage(
        "Não foi possível conectar ao serviço de publicação. Tente novamente.",
      );
    } finally {
      if (!keepSubmissionLocked) {
        isSubmittingRef.current = false;
        setIsSubmitting(false);
      }
    }
  }

  return (
    <form
      className="mt-8 space-y-8"
      aria-busy={isSubmitting}
      onSubmit={handleSubmit}
    >
      <section className="rounded-2xl border border-white/10 bg-zinc-900 p-6 sm:p-8">
        <h2 className="text-xl font-bold text-white">Dados do anúncio</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Informe os principais detalhes do equipamento que você deseja vender.
        </p>

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <label className="sm:col-span-2 text-sm font-medium text-zinc-300">
            Título do anúncio
            <input
              name="title"
              type="text"
              required
              placeholder="Ex.: Kimono Atama Mundial A2"
              className={fieldClassName}
            />
          </label>

          <label className="text-sm font-medium text-zinc-300">
            Categoria
            <select
              name="category"
              required
              defaultValue=""
              className={fieldClassName}
            >
              <option value="" disabled>
                Selecione uma categoria
              </option>
              {productCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-medium text-zinc-300">
            Preço
            <input
              name="price"
              type="number"
              min="0"
              step="0.01"
              required
              placeholder="0,00"
              className={fieldClassName}
            />
          </label>

          <label className="text-sm font-medium text-zinc-300">
            Condição
            <select
              name="condition"
              required
              defaultValue=""
              className={fieldClassName}
            >
              <option value="" disabled>
                Selecione a condição
              </option>
              {productConditions.map((condition) => (
                <option key={condition} value={condition}>
                  {condition}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-medium text-zinc-300">
            Tamanho
            <input
              name="size"
              type="text"
              required
              placeholder="Ex.: A2, M ou único"
              className={fieldClassName}
            />
          </label>

          <LocationAutocomplete />

          <label className="sm:col-span-2 text-sm font-medium text-zinc-300">
            Descrição
            <textarea
              name="description"
              required
              rows={6}
              placeholder="Descreva o estado, características e detalhes importantes do produto."
              className={`${fieldClassName} resize-y`}
            />
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-zinc-900 p-6 sm:p-8">
        <h2 className="text-xl font-bold text-white">Fotos do produto</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Adicione imagens claras que mostrem o equipamento e seu estado atual.
        </p>

        <div className="mt-6 flex flex-col items-center rounded-xl border border-dashed border-zinc-700 bg-zinc-950/50 px-6 py-10 text-center">
          <ImagePlus
            aria-hidden="true"
            size={36}
            className="text-[#58C447]"
          />
          <strong className="mt-4 text-white">Adicionar fotos</strong>
          <p className="mt-2 max-w-lg text-sm text-zinc-500">
            Selecione até 6 imagens JPEG, PNG ou WebP, com no máximo 5 MB cada.
          </p>
          <input
            name="images"
            type="file"
            accept={PRODUCT_IMAGE_MIME_TYPES.join(",")}
            multiple
            className="mt-5 block max-w-full text-sm text-zinc-400 file:mr-4 file:rounded-lg file:border-0 file:bg-zinc-800 file:px-4 file:py-2 file:font-medium file:text-white file:transition hover:file:bg-zinc-700"
          />
        </div>
      </section>

      {errorMessage && (
        <p
          role="alert"
          aria-live="polite"
          className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300"
        >
          {errorMessage}
        </p>
      )}

      {successMessage && (
        <p
          role="status"
          aria-live="polite"
          className="rounded-lg border border-[#58C447]/30 bg-[#58C447]/10 px-4 py-3 text-sm text-zinc-200"
        >
          {successMessage}
        </p>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-[#58C447] px-6 py-3 font-semibold text-[#111412] transition hover:bg-[#6AD159] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#58C447] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Publicando..." : "Publicar anúncio"}
        </button>
      </div>
    </form>
  );
}
