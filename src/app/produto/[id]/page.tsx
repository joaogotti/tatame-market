import Image from "next/image";
import { notFound } from "next/navigation";

import { mockProducts } from "@/constants/mockProducts";

/**
 * Gera antecipadamente as páginas dos anúncios disponíveis nos mocks.
 * Quando a fonte migrar para o backend, esta função poderá usar os IDs reais.
 */
export function generateStaticParams() {
  return mockProducts.map((product) => ({
    id: String(product.id),
  }));
}

/**
 * Página individual de um anúncio. A busca permanece neste Server Component,
 * sem adicionar JavaScript ao cliente para uma tela que não possui interação.
 */
export default async function ProductPage({
  params,
}: PageProps<"/produto/[id]">) {
  const { id } = await params;
  const product = mockProducts.find((item) => String(item.id) === id);

  // IDs fora da fonte de dados seguem o fluxo 404 nativo do App Router.
  if (!product) {
    notFound();
  }

  return (
    <article className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="grid overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 lg:grid-cols-2">
        <div className="relative min-h-80 bg-zinc-950 lg:min-h-[32rem]">
          <Image
            src={product.image}
            alt={product.title}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
        </div>

        <div className="flex flex-col justify-center p-6 sm:p-10">
          <span className="mb-3 text-sm font-medium text-[#58C447]">
            {product.category}
          </span>

          <h1 className="text-3xl font-bold text-white sm:text-4xl">
            {product.title}
          </h1>

          <strong className="mt-6 text-3xl text-[#58C447]">
            R$ {product.price}
          </strong>

          <div className="mt-8 flex flex-wrap items-center gap-2 text-zinc-300">
            <span>{product.condition}</span>
            <span className="text-zinc-600">•</span>
            <span>Tamanho {product.size}</span>
          </div>

          <p className="mt-3 text-zinc-400">{product.location}</p>
        </div>
      </div>

      <section className="mt-8 rounded-2xl border border-white/10 bg-zinc-900 p-6 sm:p-8">
        <h2 className="text-2xl font-bold text-white">Descrição</h2>
        <p className="mt-4 leading-7 text-zinc-300">{product.description}</p>

        <h2 className="mt-8 text-2xl font-bold text-white">
          Informações do produto
        </h2>
        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-zinc-500">Categoria</dt>
            <dd className="mt-1 text-zinc-200">{product.category}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Condição</dt>
            <dd className="mt-1 text-zinc-200">{product.condition}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Tamanho</dt>
            <dd className="mt-1 text-zinc-200">{product.size}</dd>
          </div>
        </dl>
      </section>
    </article>
  );
}
