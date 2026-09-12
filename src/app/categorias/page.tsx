import type { Metadata } from "next";

import { CategoryCard } from "@/components/categories/CategoryCard/CategoryCard";
import { categories } from "@/constants/categories";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Explore por categoria | Tatame Market",
  description: "Encontre equipamentos de Jiu-Jitsu por tipo e explore os anúncios da comunidade.",
};

export default function CategoriesPage() {
  return (
    <div className="w-full px-6 py-10">
      <header>
        <span className="text-sm font-medium text-[#58C447]">Categorias</span>
        <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">
          Explore por categoria
        </h1>
        <p className="mt-3 max-w-2xl leading-7 text-zinc-400">
          Encontre equipamentos de Jiu-Jitsu por tipo e explore os anúncios da comunidade.
        </p>
      </header>

      <section aria-label="Categorias de equipamentos" className={styles.categories}>
        <div className={styles.grid}>
          {categories.map((category) => (
            <CategoryCard key={category.name} category={category} />
          ))}
        </div>
      </section>

      <p className="mt-10 text-center text-sm text-zinc-500">
        Mais que um marketplace, uma comunidade.
      </p>
    </div>
  );
}
