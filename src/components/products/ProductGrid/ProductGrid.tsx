import Link from "next/link";
import type { ReactNode } from "react";
import { ProductCard } from "@/components/products/ProductCard/ProductCard";
import type { CatalogProduct } from "@/lib/products";
import styles from "./ProductGrid.module.css";

export type ProductGridProps = {
  products: CatalogProduct[];
  isCatalogEmpty: boolean;
  clearFiltersAction: ReactNode;
};

export function ProductGrid({ products, isCatalogEmpty, clearFiltersAction }: ProductGridProps) {
  return (
    <div className={styles.container}>
      {products.length === 0 ? (
        <div role="status" className="rounded-2xl border border-white/10 bg-zinc-900 px-6 py-12 text-center">
          <h3 className="text-xl font-semibold text-white">
            {isCatalogEmpty ? "Ainda não há anúncios disponíveis." : "Nenhum anúncio corresponde à sua busca."}
          </h3>
          <div className="mt-6 text-sm font-semibold text-[#58C447]">
            {isCatalogEmpty ? <Link href="/anunciar" className="underline underline-offset-4">Criar anúncio</Link> : clearFiltersAction}
          </div>
        </div>
      ) : (
        <div className={styles.grid}>
          {products.map((product) => (
            <ProductCard key={product.key} product={product} variant="compact" />
          ))}
        </div>
      )}
    </div>
  );
}
