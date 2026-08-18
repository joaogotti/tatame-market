import {
  productCategories,
  type ProductCategory,
} from "@/constants/mockProducts";

export type SelectedCategory = "Todos" | ProductCategory;

type CategoriesProps = {
  selectedCategory: SelectedCategory;
  onSelectCategory: (category: SelectedCategory) => void;
};

const categories: SelectedCategory[] = ["Todos", ...productCategories];

/**
 * Controle visual das categorias disponíveis na Home.
 * O estado e a filtragem ficam no componente pai para manter este componente reutilizável.
 */
export function Categories({
  selectedCategory,
  onSelectCategory,
}: CategoriesProps) {
  return (
    <section className="mx-6 mt-8">
      <h2 className="mb-4 text-2xl font-bold text-white">
        Categorias
      </h2>

      <div className="flex flex-wrap gap-3">
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            aria-pressed={selectedCategory === category}
            onClick={() => onSelectCategory(category)}
            className={`rounded-xl border px-5 py-3 transition ${
              selectedCategory === category
                ? "border-[#58C447]/50 bg-[#58C447]/10 text-[#58C447]"
                : "border-white/10 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white"
            }`}
          >
            {category}
          </button>
        ))}
      </div>
    </section>
  );
}
