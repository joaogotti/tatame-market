import Image from "next/image";
import { categories } from "@/constants/categories";
import styles from "./Categories.module.css";
import type { CatalogFilters } from "@/lib/productSearch";

type CategoriesProps = {
  selectedCategory: CatalogFilters["category"];
  onSelectCategory: (category: CatalogFilters["category"]) => void;
};

const imageSizes = "(max-width: 599px) 45vw, (max-width: 767px) 30vw, (max-width: 1199px) 25vw, 200px";

/**
 * Controle visual das categorias disponíveis na Home.
 * O estado e a filtragem ficam no componente pai para manter este componente reutilizável.
 */
export function Categories({
  selectedCategory,
  onSelectCategory,
}: CategoriesProps) {
  return (
    <section className={styles.section} aria-labelledby="featured-categories-title">
      <div className={styles.header}>
        <h2 id="featured-categories-title">Categorias em destaque</h2>
        <button
          type="button"
          className={styles.viewAll}
          aria-pressed={selectedCategory === null}
          onClick={() => onSelectCategory(null)}
        >
          Ver todos
        </button>
      </div>

      <div className={styles.grid}>
        {categories.map((category) => (
          <button
            key={category.name}
            type="button"
            aria-label={category.name}
            aria-pressed={selectedCategory === category.name}
            onClick={() => onSelectCategory(category.name)}
            className={styles.card}
          >
            <span className={styles.imageArea}>
              <Image
                src={category.image}
                alt={category.alt}
                fill
                sizes={imageSizes}
                className={styles.image}
              />
            </span>
            <span className={styles.label}>{category.name}</span>
          </button>
        ))}
        <button
          type="button"
          disabled
          aria-label="Outros"
          aria-describedby="other-category-status"
          title="Categoria ainda indisponível para filtragem"
          className={styles.card}
        >
          <span className={styles.imageArea}>
            <Image
              src="/categories/outros.png"
              alt="Equipamentos variados para treino de Jiu-Jitsu"
              fill
              sizes={imageSizes}
              className={styles.image}
            />
          </span>
          <span className={styles.label}>Outros</span>
        </button>
      </div>
      <p id="other-category-status" className="sr-only">
        A categoria Outros ainda não está disponível para filtragem.
      </p>
    </section>
  );
}
