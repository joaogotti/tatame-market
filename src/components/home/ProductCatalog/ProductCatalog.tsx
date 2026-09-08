"use client";

import { useState } from "react";

import {
  Categories,
  type SelectedCategory,
} from "@/components/home/Categories/Categories";
import { ProductCard } from "@/components/products/ProductCard/ProductCard";
import type { CatalogProduct } from "@/lib/products";
import styles from "./ProductCatalog.module.css";

type ProductCatalogProps = {
  products: CatalogProduct[];
};

/**
 * Área interativa da Home responsável por coordenar a categoria selecionada
 * e a lista de anúncios. Este limite mantém a página e o Hero no servidor.
 */
export function ProductCatalog({ products }: ProductCatalogProps) {
  const [selectedCategory, setSelectedCategory] =
    useState<SelectedCategory>("Todos");

  // "Todos" ignora o filtro; as demais opções usam a categoria normalizada na Home.
  const filteredProducts =
    selectedCategory === "Todos"
      ? products
      : products.filter(
          (product) => product.category === selectedCategory,
        );

  return (
    <>
      <Categories
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      <section className={styles.section}>
        <h2 className="mb-5 text-2xl font-bold text-white">
          Anúncios recentes
        </h2>

        <div className={styles.grid}>
          {filteredProducts.map((product) => (
            <ProductCard key={product.key} product={product} variant="compact" />
          ))}
        </div>
      </section>
    </>
  );
}
