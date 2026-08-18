import Image from "next/image";

/**
 * ProductCard
 *
 * Componente responsável por exibir um anúncio
 * na listagem de produtos do Tatame Market.
 *
 * Recebe todas as informações através de props.
 * Não possui acesso direto ao banco de dados.
 *
 * Isso permite reutilizar o mesmo componente
 * em diferentes páginas do marketplace.
 */

type ProductCardProps = {
  title: string;
  price: number;
  location: string;
  image: string;
  size: string;
  condition: string;
};

export function ProductCard({
  title,
  price,
  location,
  image,
  size,
  condition,
}: ProductCardProps) {
  return (
    <article className="w-72 overflow-hidden rounded-2xl border border-white/10 bg-zinc-900">

      {/* Imagem principal do anúncio */}
      <div className="relative h-44 w-full">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover"
        />
      </div>

      {/* Informações principais do anúncio */}
      <div className="p-4">

        {/* Estado do produto e tamanho */}
        <div className="mb-2 flex items-center gap-2 text-xs text-zinc-400">
          <span>{condition}</span>

          <span>•</span>

          <span>Tamanho {size}</span>
        </div>

        {/* Localização do vendedor */}
        <p className="text-sm text-zinc-500">
          {location}
        </p>

        {/* Nome do produto */}
        <h3 className="mt-1 text-lg font-semibold text-white">
          {title}
        </h3>

        {/* Preço do anúncio */}
        <strong className="mt-3 block text-xl text-[#58C447]">
          R$ {price}
        </strong>
      </div>
    </article>
  );
}