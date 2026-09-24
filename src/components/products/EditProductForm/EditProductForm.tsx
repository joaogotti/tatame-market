"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useRef, useState } from "react";

import { LocationAutocomplete } from "@/components/location/LocationAutocomplete/LocationAutocomplete";
import { productCategories } from "@/constants/categories";
import type { ProductCondition } from "@/lib/products";
import { createClient } from "@/lib/supabase/client";

const productConditions = ["Novo", "Usado"] satisfies ProductCondition[];

const fieldClassName =
  "mt-2 w-full rounded-lg border border-zinc-700 bg-[#181B19] px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-[#58C447] focus:ring-1 focus:ring-[#58C447]";

export type EditableProduct = {
  id: string;
  title: string;
  category: string;
  price: number;
  condition: string;
  size: string;
  locationIbgeCode: number;
  locationCity: string;
  locationState: string;
  description: string;
};

function getRequiredValue(formData: FormData, name: string) {
  const value = formData.get(name);

  return typeof value === "string" ? value.trim() : "";
}

/** Atualiza somente os dados editáveis; imagens e propriedade ficam intactas. */
export function EditProductForm({ product }: { product: EditableProduct }) {
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
        "Preencha corretamente todos os campos obrigatórios antes de salvar.",
      );
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    let keepSubmissionLocked = false;

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        console.error("Falha ao validar usuário durante a edição.", {
          name: authError.name,
          message: authError.message,
        });
      }

      if (!user) {
        setErrorMessage(
          "Sua sessão expirou. Entre novamente para editar o anúncio.",
        );
        router.push("/login");
        return;
      }

      // Os filtros reforçam a propriedade no cliente, além da proteção da RLS.
      const { data, error } = await supabase
        .from("products")
        .update({
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
        .eq("id", product.id)
        .eq("user_id", user.id)
        .select("id")
        .maybeSingle();

      if (error) {
        console.error("Falha ao atualizar produto no Supabase.", {
          productId: product.id,
          userId: user.id,
          code: error.code,
          message: error.message,
        });
        setErrorMessage(
          "Não foi possível salvar as alterações agora. Tente novamente em instantes.",
        );
        return;
      }

      if (!data) {
        console.error("Nenhum produto foi atualizado.", {
          productId: product.id,
          userId: user.id,
        });
        setErrorMessage(
          "Não foi possível localizar este anúncio para edição. Atualize a página e tente novamente.",
        );
        return;
      }

      keepSubmissionLocked = true;
      setSuccessMessage("Alterações salvas com sucesso. Redirecionando...");

      window.setTimeout(() => {
        router.push(`/produto/${encodeURIComponent(product.id)}`);
        router.refresh();
      }, 800);
    } catch (error) {
      console.error("Falha inesperada ao editar produto.", error);
      setErrorMessage(
        "Não foi possível conectar ao serviço de edição. Tente novamente.",
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
          Atualize os principais detalhes do equipamento anunciado.
        </p>

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <label className="text-sm font-medium text-zinc-300 sm:col-span-2">
            Título do anúncio
            <input
              name="title"
              type="text"
              required
              defaultValue={product.title}
              className={fieldClassName}
            />
          </label>

          <label className="text-sm font-medium text-zinc-300">
            Categoria
            <select
              name="category"
              required
              defaultValue={product.category}
              className={fieldClassName}
            >
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
              defaultValue={product.price}
              className={fieldClassName}
            />
          </label>

          <label className="text-sm font-medium text-zinc-300">
            Condição
            <select
              name="condition"
              required
              defaultValue={product.condition}
              className={fieldClassName}
            >
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
              defaultValue={product.size}
              className={fieldClassName}
            />
          </label>

          <LocationAutocomplete
            initialCity={{
              ibgeCode: product.locationIbgeCode,
              city: product.locationCity,
              state: product.locationState,
            }}
          />

          <label className="text-sm font-medium text-zinc-300 sm:col-span-2">
            Descrição
            <textarea
              name="description"
              required
              rows={6}
              defaultValue={product.description}
              className={`${fieldClassName} resize-y`}
            />
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-zinc-900 p-6 sm:p-8">
        <h2 className="text-xl font-bold text-white">Fotos do produto</h2>
        <p className="mt-2 text-sm text-zinc-400">
          As imagens deste anúncio serão gerenciadas em uma próxima etapa.
        </p>
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

      <div className="flex flex-wrap justify-end gap-3">
        <Link
          href="/meus-anuncios"
          className="rounded-lg border border-white/10 px-6 py-3 font-semibold text-zinc-300 transition hover:border-white/20 hover:text-white"
        >
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-[#58C447] px-6 py-3 font-semibold text-[#111412] transition hover:bg-[#6AD159] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#58C447] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Salvando..." : "Salvar alterações"}
        </button>
      </div>
    </form>
  );
}
