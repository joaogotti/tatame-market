import Link from "next/link";
import { Suspense } from "react";
import { Shirt, Minus, ShoppingBag, Plus } from "lucide-react";
import { productCategories } from "@/constants/mockProducts";
import { Navigation } from "@/components/layout/Navigation/Navigation";

export function Sidebar() {
  return (
    <aside className="market-sidebar" aria-label="Explorar o Tatame Market">
      <div className="market-sidebar-inner">
        <Suspense fallback={null}><Navigation variant="sidebar" /></Suspense>
        <section className="market-sidebar-categories" aria-labelledby="sidebar-categories">
          <h2 id="sidebar-categories" className="market-section-label">Categorias</h2>
          <ul>
            {productCategories.map((category) => {
              const Icon = category === "Faixas" ? Minus : category === "Acessórios" ? ShoppingBag : Shirt;
              return <li key={category}><Icon size={18} strokeWidth={1.7} aria-hidden="true" /><span>{category}</span></li>;
            })}
          </ul>
        </section>
        <div className="market-sidebar-promo">
          <div className="market-sell-card">
            <span className="market-sell-icon"><ShoppingBag size={20} aria-hidden="true" /></span>
            <h2>Venda seu equipamento</h2>
            <p>É rápido, fácil e gratuito.</p>
            <Link href="/anunciar" className="market-create"><Plus size={16} aria-hidden="true" />Criar anúncio</Link>
          </div>
        </div>
      </div>
    </aside>
  );
}
