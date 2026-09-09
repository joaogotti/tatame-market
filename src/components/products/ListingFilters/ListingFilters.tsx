"use client";

import { useRouter } from "next/navigation";
import { useId, useRef, useState, type FormEvent } from "react";
import { SlidersHorizontal } from "lucide-react";
import type { CatalogFilters } from "@/lib/productSearch";
import type { City } from "@/services/ibge/cities";
import { ListingFilterPanel } from "@/components/products/ListingFilterPanel/ListingFilterPanel";

type ListingFiltersProps = CatalogFilters & { availableSizes: string[]; availableLocations: City[] };

export function ListingFilters({ query, category, condition = null, size = null, locationIbgeCode = null, availableSizes, availableLocations }: ListingFiltersProps) {
  const router = useRouter();
  const panelId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [draftQuery, setDraftQuery] = useState(query);
  const activeCount = [category, condition, size, locationIbgeCode].filter((value) => value !== null).length;

  function closePanel() {
    setPanelOpen(false);
    triggerRef.current?.focus();
  }

  function navigate(formData: FormData) {
    const params = new URLSearchParams();

    for (const name of ["q", "categoria", "condicao", "tamanho", "localizacao"]) {
      const value = formData.get(name);
      if (typeof value === "string" && value.trim()) {
        params.set(name, value.trim());
      }
    }

    const search = params.toString();
    closePanel();
    router.push(search ? `/anuncios?${search}` : "/anuncios");
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    navigate(new FormData(event.currentTarget));
  }

  const fieldClassName = "mt-2 h-12 w-full min-w-0 rounded-lg border border-zinc-700 bg-[#181B19] px-4 text-white outline-none placeholder:text-zinc-500 focus:border-[#58C447] focus:ring-1 focus:ring-[#58C447]";

  return (
    <>
      <form action="/anuncios" method="get" onSubmit={handleSearch} role="search" aria-label="Buscar anúncios" className="mt-8 flex min-w-0 flex-wrap items-end gap-3">
        <label className="min-w-0 flex-[2_1_20rem] text-sm font-medium text-zinc-300">
          Buscar anúncios
          <input type="search" name="q" value={draftQuery} onChange={(event) => setDraftQuery(event.target.value)} placeholder="Buscar por kimonos, faixas, marcas..." className={fieldClassName} />
        </label>

        <input type="hidden" name="categoria" value={category ?? ""} />
        <input type="hidden" name="condicao" value={condition ?? ""} />
        <input type="hidden" name="tamanho" value={size ?? ""} />
        <input type="hidden" name="localizacao" value={locationIbgeCode ?? ""} />
        <button ref={triggerRef} type="button" aria-expanded={panelOpen} aria-controls={panelId} aria-haspopup="dialog" onClick={() => setPanelOpen(true)} className="inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-[#181B19] px-5 font-medium text-zinc-200 hover:border-[#58C447] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#58C447]">
          <SlidersHorizontal size={18} aria-hidden="true" />
          {activeCount ? `Filtros (${activeCount})` : "Filtros"}
        </button>
        <button type="submit" className="h-12 cursor-pointer rounded-lg bg-[#58C447] px-6 font-semibold text-[#111412] transition hover:bg-[#6AD159] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#58C447]">
          Buscar
        </button>
      </form>
      {panelOpen && (
        <ListingFilterPanel id={panelId} query={draftQuery} category={category} condition={condition} size={size} locationIbgeCode={locationIbgeCode} availableSizes={availableSizes} availableLocations={availableLocations} onClose={closePanel} onApply={navigate} />
      )}
    </>
  );
}
