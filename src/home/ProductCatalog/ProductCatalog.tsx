"use client";

import { useState } from "react";

import { mockProducts } from "@/constants/mockProducts";
import {
  Categories,
  type SelectedCategory,
} from "@/home/Categories/Categories";
import { ProductCard } from "@/home/ProductCard/ProductCard";

/**
 * Área interativa da Home responsável por coordenar a categoria selecionada
 * e a lista de anúncios. Este limite mantém a página e o Hero no servidor.
 */
export function ProductCatalog() {
  const [selectedCategory, setSelectedCategory] =
    useState<SelectedCategory>("Todos");

  // "Todos" ignora o filtro; as demais opções correspondem às categorias dos mocks.
  const filteredProducts =
    selectedCategory === "Todos"
      ? mockProducts
      : mockProducts.filter(
          (product) => product.category === selectedCategory,
        );

  return (
    <>
      <Categories
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      <section className="mx-6 mt-10">
        <h2 className="mb-5 text-2xl font-bold text-white">
          Anúncios recentes
        </h2>

        <div className="flex flex-wrap gap-5">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              id={product.id}
              title={product.title}
              price={product.price}
              location={product.location}
              image={product.image}
              size={product.size}
              condition={product.condition}
            />
          ))}
        </div>
      </section>
    </>
  );
}
