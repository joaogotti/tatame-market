import { notFound } from "next/navigation";

import { FavoriteButton } from "@/components/products/FavoriteButton/FavoriteButton";
import { ProductImageGallery } from "@/components/products/ProductImageGallery/ProductImageGallery";
import { mockProducts } from "@/constants/mockProducts";
import {
  formatProductPrice,
  getMockProductIdFromRoute,
} from "@/lib/products";
import {
  toProductGalleryImages,
  type ProductGalleryImage,
  type ProductImageRecord,
} from "@/lib/productImages";
import { createClient } from "@/lib/supabase/server";
import { getFavoriteProductIds } from "@/lib/favorites";

type ProductDetailsBase = {
  id: string;
  title: string;
  price: number;
  location: string;
  images: ProductGalleryImage[];
  category: string;
  size: string;
  condition: string;
  description: string;
};

type ProductDetails = ProductDetailsBase &
  (
    | {
        source: "supabase";
        favoriteProductId: string;
        isFavorite: boolean;
      }
    | {
        source: "mock";
        favoriteProductId: null;
        isFavorite: false;
      }
  );

type DatabaseProduct = {
  id: string | number;
  title: string;
  category: string;
  price: string | number;
  condition: string;
  size: string;
  location_city: string;
  location_state: string;
  description: string;
};

function normalizeDatabaseProduct(
  product: DatabaseProduct,
  images: ProductGalleryImage[],
  isFavorite: boolean,
): ProductDetails {
  const price = Number(product.price);

  if (!Number.isFinite(price)) {
    throw new Error("O produto possui um preço inválido no banco de dados.");
  }

  return {
    id: String(product.id),
    source: "supabase",
    title: product.title,
    price,
    location: `${product.location_city}, ${product.location_state}`,
    images,
    category: product.category,
    size: product.size,
    condition: product.condition,
    description: product.description,
    favoriteProductId: String(product.id),
    isFavorite,
  };
}

function normalizeMockProduct(
  product: (typeof mockProducts)[number],
): ProductDetails {
  return {
    id: String(product.id),
    source: "mock",
    title: product.title,
    price: product.price,
    location: product.location,
    images: [
      {
        url: product.image,
        sortOrder: 0,
        isPrimary: true,
      },
    ],
    category: product.category,
    size: product.size,
    condition: product.condition,
    description: product.description,
    favoriteProductId: null,
    isFavorite: false,
  };
}

async function getProduct(id: string): Promise<ProductDetails | null> {
  const mockId = getMockProductIdFromRoute(id);

  // O prefixo explicita a origem e evita que um ID mock abra um produto real
  // com o mesmo identificador no Supabase.
  if (mockId) {
    const mockProduct = mockProducts.find(
      (item) => String(item.id) === mockId,
    );

    return mockProduct ? normalizeMockProduct(mockProduct) : null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      "id,title,category,price,condition,size,location_city,location_state,description",
    )
    .eq("id", id)
    .maybeSingle();

  if (error && error.code !== "22P02") {
    console.error("Falha ao consultar produto no Supabase.", {
      id,
      code: error.code,
      message: error.message,
    });
    throw new Error("Não foi possível carregar o produto.");
  }

  if (data) {
    const { data: imageData, error: imageError } = await supabase
      .from("product_images")
      .select("storage_path,sort_order,is_primary")
      .eq("product_id", data.id)
      .order("sort_order", { ascending: true });

    if (imageError) {
      console.error("Falha ao consultar imagens do produto.", {
        id,
        code: imageError.code,
        message: imageError.message,
      });
      throw new Error("Não foi possível carregar as imagens do produto.");
    }

    const images = toProductGalleryImages(
      supabase,
      imageData as ProductImageRecord[],
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError && authError.name !== "AuthSessionMissingError") {
      console.error("Falha ao validar usuário nos detalhes do produto.", {
        id,
        name: authError.name,
        message: authError.message,
      });
      throw new Error("Não foi possível validar sua sessão.");
    }

    const favoriteProductIds = user
      ? await getFavoriteProductIds(supabase, user.id, [data.id])
      : new Set<string>();

    return normalizeDatabaseProduct(
      data as DatabaseProduct,
      images,
      favoriteProductIds.has(String(data.id)),
    );
  }

  // Enquanto a Home usar dados locais, IDs ausentes no banco continuam
  // resolvendo para os anúncios existentes em mockProducts.
  const mockProduct = mockProducts.find((item) => String(item.id) === id);

  return mockProduct ? normalizeMockProduct(mockProduct) : null;
}

/**
 * Gera antecipadamente as páginas dos anúncios disponíveis nos mocks enquanto
 * os demais IDs continuam sendo resolvidos dinamicamente pelo Supabase.
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
  const product = await getProduct(id);

  // Apenas a ausência nas duas fontes segue o fluxo 404 nativo do App Router.
  if (!product) {
    notFound();
  }

  return (
    <article className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="grid overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 lg:grid-cols-2">
        <ProductImageGallery images={product.images} title={product.title} />

        <div className="flex flex-col justify-center p-6 sm:p-10">
          <span className="mb-3 text-sm font-medium text-[#58C447]">
            {product.category}
          </span>

          <h1 className="text-3xl font-bold text-white sm:text-4xl">
            {product.title}
          </h1>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
            <strong className="text-3xl text-[#58C447]">
              {formatProductPrice(product.price)}
            </strong>
            {product.source === "supabase" && (
              <FavoriteButton
                key={`${product.favoriteProductId}:${product.isFavorite}`}
                productId={product.favoriteProductId}
                initialIsFavorite={product.isFavorite}
              />
            )}
          </div>

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
