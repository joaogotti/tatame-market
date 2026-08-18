import { Hero } from "@/home/Hero/Hero";
import { ProductCatalog } from "@/home/ProductCatalog/ProductCatalog";

/**
 * Home
 *
 * Página inicial do Tatame Market.
 *
 * Responsável por organizar:
 * - Hero
 * - Catálogo interativo de categorias e anúncios recentes
 *
 * Os anúncios ainda usam dados temporários.
 * Futuramente mockProducts será substituído
 * por dados reais vindos do backend/Supabase.
 */
export default function Home() {
  return (
    <div>
      {/* Área principal de apresentação do marketplace */}
      <Hero />

      {/* O estado do filtro fica isolado neste Client Component. */}
      <ProductCatalog />
    </div>
  );
}
