"use client";

import { useState } from "react";
import { Hero } from "@/components/home/Hero/Hero";
import { Categories } from "@/components/home/Categories/Categories";
import { ProductCatalog } from "@/components/home/ProductCatalog/ProductCatalog";
import type { CatalogProduct } from "@/lib/products";
import { filterCatalogProducts, type CatalogFilters } from "@/lib/productSearch";

export function HomeCatalog({ products }: { products: CatalogProduct[] }) {
  const [draftQuery, setDraftQuery] = useState("");
  const [draftCategory, setDraftCategory] = useState<CatalogFilters["category"]>(null);
  const [appliedQuery, setAppliedQuery] = useState("");
  const [appliedCategory, setAppliedCategory] = useState<CatalogFilters["category"]>(null);

  function applySearch() {
    setAppliedQuery(draftQuery);
    setAppliedCategory(draftCategory);
  }

  function clearFilters() {
    setDraftQuery("");
    setDraftCategory(null);
    setAppliedQuery("");
    setAppliedCategory(null);
  }

  function selectCategory(category: CatalogFilters["category"]) {
    setDraftCategory(category);
    setAppliedCategory(category);
  }

  const filteredProducts = filterCatalogProducts(products, {
    query: appliedQuery,
    category: appliedCategory,
  });

  return (
    <>
      <Hero
        query={draftQuery}
        category={draftCategory}
        onQueryChange={setDraftQuery}
        onCategoryChange={setDraftCategory}
        onSearch={applySearch}
      />
      <Categories selectedCategory={appliedCategory} onSelectCategory={selectCategory} />
      <ProductCatalog
        products={filteredProducts}
        isCatalogEmpty={products.length === 0}
        clearFiltersAction={
          <button type="button" onClick={clearFilters} className="cursor-pointer underline underline-offset-4">
            Limpar busca e filtros
          </button>
        }
      />
    </>
  );
}
