import { ImagePlus } from "lucide-react";

import {
  productCategories,
  type Product,
} from "@/constants/mockProducts";
import { LocationAutocomplete } from "@/components/location/LocationAutocomplete/LocationAutocomplete";

const productConditions = ["Novo", "Usado"] satisfies Product["condition"][];

const fieldClassName =
  "mt-2 w-full rounded-lg border border-zinc-700 bg-[#181B19] px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-[#58C447] focus:ring-1 focus:ring-[#58C447]";

/**
 * Formulário visual para criação de anúncios do Tatame Market.
 * Os campos já possuem nomes compatíveis com o modelo temporário de produto,
 * mas o envio será conectado ao backend/Supabase em uma etapa futura.
 */
export function CreateProductForm() {
  return (
    <form className="mt-8 space-y-8">
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
            A seleção abaixo é apenas visual. O envio e o armazenamento das
            imagens serão integrados futuramente ao backend/Supabase.
          </p>
          <input
            name="images"
            type="file"
            accept="image/*"
            multiple
            className="mt-5 block max-w-full text-sm text-zinc-400 file:mr-4 file:rounded-lg file:border-0 file:bg-zinc-800 file:px-4 file:py-2 file:font-medium file:text-white file:transition hover:file:bg-zinc-700"
          />
        </div>
      </section>

      <div className="flex justify-end">
        {/* Será convertido em envio real quando a persistência for implementada. */}
        <button
          type="button"
          className="rounded-lg bg-[#58C447] px-6 py-3 font-semibold text-[#111412] transition hover:bg-[#6AD159] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#58C447]"
        >
          Publicar anúncio
        </button>
      </div>
    </form>
  );
}
