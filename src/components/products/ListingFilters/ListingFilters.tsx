"use client";

import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { productCategories } from "@/constants/mockProducts";
import type { CatalogFilters } from "@/lib/productSearch";

export function ListingFilters({ query, category }: CatalogFilters) {
  const router = useRouter();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const params = new URLSearchParams();

    for (const name of ["q", "categoria"]) {
      const value = formData.get(name);
      if (typeof value === "string" && value.trim()) {
        params.set(name, value.trim());
      }
    }

    const search = params.toString();
    router.push(search ? `/anuncios?${search}` : "/anuncios");
  }

  const fieldClassName = "mt-2 h-12 w-full min-w-0 rounded-lg border border-zinc-700 bg-[#181B19] px-4 text-white outline-none placeholder:text-zinc-500 focus:border-[#58C447] focus:ring-1 focus:ring-[#58C447]";

  return (
    <form action="/anuncios" method="get" onSubmit={handleSubmit} role="search" aria-label="Buscar anúncios" className="mt-8 grid min-w-0 gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,14rem)_auto] sm:items-end">
      <label className="min-w-0 text-sm font-medium text-zinc-300">
        Buscar anúncios
        <input type="search" name="q" defaultValue={query} placeholder="Buscar por kimonos, faixas, marcas..." className={fieldClassName} />
      </label>
      <label className="min-w-0 text-sm font-medium text-zinc-300">
        Categoria
        <select name="categoria" defaultValue={category ?? ""} className={fieldClassName}>
          <option value="">Todas as categorias</option>
          {productCategories.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
      </label>
      <button type="submit" className="h-12 cursor-pointer rounded-lg bg-[#58C447] px-6 font-semibold text-[#111412] transition hover:bg-[#6AD159] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#58C447]">
        Buscar
      </button>
    </form>
  );
}
