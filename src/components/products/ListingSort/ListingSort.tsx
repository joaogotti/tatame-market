"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { CatalogSort } from "@/lib/productSort";

export function ListingSort({ sort }: { sort: CatalogSort }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  return (
    <div className="mb-5 flex sm:justify-end">
      <label className="flex w-full flex-col gap-2 text-sm font-medium text-zinc-300 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
        Ordenar por
        <select value={sort} className="h-12 min-w-0 rounded-lg border border-zinc-700 bg-[#181B19] px-4 text-white outline-none focus:border-[#58C447] focus:ring-1 focus:ring-[#58C447] sm:min-w-48"
          onChange={(event) => {
            const params = new URLSearchParams(searchParams.toString());
            if (event.target.value === "recentes") params.delete("ordenar");
            else params.set("ordenar", event.target.value);
            const search = params.toString();
            router.push(search ? `/anuncios?${search}` : "/anuncios");
          }}>
          <option value="recentes">Mais recentes</option>
          <option value="menor-preco">Menor preço</option>
          <option value="maior-preco">Maior preço</option>
        </select>
      </label>
    </div>
  );
}
