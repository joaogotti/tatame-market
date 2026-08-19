import { ImageOff } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { DeleteProductButton } from "@/components/products/DeleteProductButton/DeleteProductButton";
import { formatProductPrice, type UserProduct } from "@/lib/products";

function getStatusLabel(status: string) {
  return status === "active" ? "Ativo" : status;
}

/** Card de gestão com acesso às ações disponíveis para o proprietário. */
export function MyProductCard({ product }: { product: UserProduct }) {
  return (
    <article className="grid overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 sm:grid-cols-[12rem_1fr]">
      <div className="relative min-h-48 bg-zinc-950">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.title}
            fill
            sizes="(max-width: 640px) 100vw, 192px"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-zinc-600">
            <ImageOff aria-hidden="true" size={32} strokeWidth={1.5} />
            <span className="text-xs font-medium">Imagem indisponível</span>
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-col p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm text-zinc-500">{product.location}</p>
            <h2 className="mt-1 text-xl font-semibold text-white">
              {product.title}
            </h2>
          </div>

          <span className="rounded-full border border-[#58C447]/30 bg-[#58C447]/10 px-3 py-1 text-xs font-semibold text-[#58C447]">
            {getStatusLabel(product.status)}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <strong className="text-xl text-[#58C447]">
            {formatProductPrice(product.price)}
          </strong>
          <span className="text-zinc-700">•</span>
          <span className="text-sm text-zinc-400">{product.condition}</span>
        </div>

        <div className="mt-auto flex flex-wrap items-center justify-end gap-3 border-t border-white/10 pt-5">
          <Link
            href={`/meus-anuncios/${encodeURIComponent(product.id)}/editar`}
            className="rounded-lg border border-[#58C447]/30 px-4 py-2 text-sm font-medium text-[#58C447] transition hover:border-[#58C447]/60 hover:text-[#6AD159]"
          >
            Editar
          </Link>
          <Link
            href={`/produto/${encodeURIComponent(product.id)}`}
            className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:border-[#58C447]/40 hover:text-white"
          >
            Ver anúncio
          </Link>
          <DeleteProductButton productId={product.id} />
        </div>
      </div>
    </article>
  );
}
