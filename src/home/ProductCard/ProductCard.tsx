import Image from "next/image";
import Link from "next/link";
import { ImageOff } from "lucide-react";

import { FavoriteButton } from "@/components/products/FavoriteButton/FavoriteButton";
import {
  formatProductPrice,
  type CatalogProduct,
} from "@/lib/products";

/**
 * ProductCard
 *
 * Componente responsável por exibir um anúncio
 * na listagem de produtos do Tatame Market.
 *
 * Recebe todas as informações através de props e oferece navegação
 * para a página individual do anúncio.
 * Não possui acesso direto ao banco de dados.
 *
 * Isso permite reutilizar o mesmo componente
 * em diferentes páginas do marketplace.
 */

export function ProductCard({ product }: { product: CatalogProduct }) {
  return (
    <article className="relative w-72 rounded-2xl border border-white/10 bg-zinc-900 transition hover:border-[#58C447]/40">
      <Link
        href={product.href}
        className="block h-full overflow-hidden rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#58C447]"
      >

        {/* Imagem principal do anúncio */}
        <div className="relative h-44 w-full bg-zinc-950">
          {product.image ? (
            <Image
              src={product.image}
              alt={product.title}
              fill
              className="object-cover"
            />
          ) : (
            // Produtos reais permanecem sem imagem até a integração do Storage.
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-zinc-600">
              <ImageOff aria-hidden="true" size={32} strokeWidth={1.5} />
              <span className="text-xs font-medium">Imagem indisponível</span>
            </div>
          )}
        </div>

        {/* Informações principais do anúncio */}
        <div className="p-4">

          {/* Estado do produto e tamanho */}
          <div className="mb-2 flex items-center gap-2 text-xs text-zinc-400">
            <span>{product.condition}</span>

            <span>•</span>

            <span>Tamanho {product.size}</span>
          </div>

          {/* Localização do vendedor */}
          <p className="text-sm text-zinc-500">
            {product.location}
          </p>

          {/* Nome do produto */}
          <h3 className="mt-1 text-lg font-semibold text-white">
            {product.title}
          </h3>

          {/* Preço do anúncio */}
          <strong className="mt-3 block text-xl text-[#58C447]">
            {formatProductPrice(product.price)}
          </strong>
        </div>
      </Link>

      {product.source === "supabase" && (
        <FavoriteButton
          key={`${product.favoriteProductId}:${product.isFavorite}`}
          productId={product.favoriteProductId}
          initialIsFavorite={product.isFavorite}
          className="absolute right-3 top-3 z-10"
        />
      )}
    </article>
  );
}
