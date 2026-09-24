"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { X } from "lucide-react";
import { productCategories } from "@/constants/categories";
import { normalizeSearchText, type CatalogFilters } from "@/lib/productSearch";
import type { City } from "@/services/ibge/cities";
import { ListingLocationFilter } from "@/components/products/ListingLocationFilter/ListingLocationFilter";

type ListingFilterPanelProps = CatalogFilters & {
  id: string;
  availableSizes: string[];
  availableLocations: City[];
  onClose: () => void;
  onApply: (data: FormData) => void;
};

export function ListingFilterPanel({ id, query, category, condition = null, size = null, locationIbgeCode = null, availableSizes, availableLocations, onClose, onApply }: ListingFilterPanelProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [resetVersion, setResetVersion] = useState(0);
  const cleared = resetVersion > 0;
  const matchingSize = size === null ? undefined : availableSizes.find(
    (option) => normalizeSearchText(option) === normalizeSearchText(size),
  );
  const selectedSize = matchingSize ?? size ?? "";
  const unavailableSize = size !== null && matchingSize === undefined;

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    dialogRef.current?.close();
    onApply(new FormData(event.currentTarget));
  }

  function dismiss() {
    dialogRef.current?.close();
    onClose();
  }

  const fieldClassName = "mt-2 h-12 w-full min-w-0 rounded-lg border border-zinc-700 bg-[#181B19] px-4 text-white outline-none placeholder:text-zinc-500 focus:border-[#58C447] focus:ring-1 focus:ring-[#58C447]";

  return (
    <dialog ref={dialogRef} id={id} aria-labelledby={id + "-title"} aria-modal="true"
      className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-[#111512] p-5 text-white shadow-2xl backdrop:bg-black/60 sm:p-8"
      onCancel={(event) => { event.preventDefault(); dismiss(); }}>
      <div className="mb-6 flex items-center justify-between gap-4">
        <h2 id={id + "-title"} className="text-xl font-semibold">Filtros</h2>
        <button type="button" aria-label="Fechar filtros" onClick={dismiss} className="flex size-10 cursor-pointer items-center justify-center rounded-lg text-zinc-400 hover:bg-white/5 hover:text-white focus-visible:outline-2 focus-visible:outline-[#58C447]">
          <X size={20} aria-hidden="true" />
        </button>
      </div>
      <form action="/anuncios" method="get" onSubmit={handleSubmit}>
        <input type="hidden" name="q" value={query} />
        <div key={resetVersion} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="min-w-0 flex-[1_1_12rem] text-sm font-medium text-zinc-300">
            Categoria
            <select name="categoria" defaultValue={cleared ? "" : category ?? ""} className={fieldClassName}>
              <option value="">Todas as categorias</option>
              {productCategories.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>
          <label className="min-w-0 flex-[1_1_12rem] text-sm font-medium text-zinc-300">
            Condição
            <select name="condicao" defaultValue={cleared ? "" : condition ?? ""} className={fieldClassName}>
              <option value="">Todas as condições</option>
              <option value="Novo">Novo</option>
              <option value="Usado">Usado</option>
            </select>
          </label>
          <label className="min-w-0 flex-[1_1_12rem] text-sm font-medium text-zinc-300">
            Tamanho
            <select name="tamanho" defaultValue={cleared ? "" : selectedSize} className={fieldClassName}>
              <option value="">Todos os tamanhos</option>
              {availableSizes.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
              {unavailableSize && <option value={size}>{size} (indisponível)</option>}
            </select>
          </label>
          <div className="min-w-0"><ListingLocationFilter availableLocations={availableLocations} initialCode={cleared ? null : locationIbgeCode} fieldClassName={fieldClassName} /></div>

        </div>
        <div className="mt-8 flex flex-col-reverse gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <button type="button" onClick={() => setResetVersion((value) => value + 1)} className="h-12 cursor-pointer rounded-lg px-4 text-sm font-medium text-zinc-300 hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-[#58C447]">Limpar filtros</button>
          <button type="submit" className="h-12 cursor-pointer rounded-lg bg-[#58C447] px-6 font-semibold text-[#111412] transition hover:bg-[#6AD159] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#58C447]">Aplicar filtros</button>
        </div>
      </form>
    </dialog>
  );
}
