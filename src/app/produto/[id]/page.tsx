import { notFound } from "next/navigation";

import { FavoriteButton } from "@/components/products/FavoriteButton/FavoriteButton";
import { ProductImageGallery } from "@/components/products/ProductImageGallery/ProductImageGallery";
import { StartConversationButton } from "@/components/products/StartConversationButton/StartConversationButton";
import {
  SellerCard,
  type PublicSeller,
} from "@/components/profile/SellerCard/SellerCard";
import { formatProductPrice } from "@/lib/products";
import { getReviewSummary } from "@/lib/reviews";
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

type ProductDetails = ProductDetailsBase & {
  favoriteProductId: string;
  isFavorite: boolean;
  sellerId: string;
  seller: PublicSeller | null;
  status: string;
  currentUserId: string | null;
};

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
  user_id: string;
  status: string;
};

type DatabaseSellerProfile = {
  name: string;
  avatar_url: string | null;
  location_city: string | null;
  location_state: string | null;
};

function normalizeDatabaseProduct(
  product: DatabaseProduct,
  images: ProductGalleryImage[],
  isFavorite: boolean,
  currentUserId: string | null,
  seller: PublicSeller | null,
): ProductDetails {
  const price = Number(product.price);

  if (!Number.isFinite(price)) {
    throw new Error("O produto possui um preço inválido no banco de dados.");
  }

  return {
    id: String(product.id),
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
    sellerId: product.user_id,
    seller,
    status: product.status,
    currentUserId,
  };
}

async function getProduct(id: string): Promise<ProductDetails | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      "id,title,category,price,condition,size,location_city,location_state,description,user_id,status",
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
    const [imagesResult, sellerResult, reviewSummary, authResult] =
      await Promise.all([
        supabase
          .from("product_images")
          .select("storage_path,sort_order,is_primary")
          .eq("product_id", data.id)
          .order("sort_order", { ascending: true }),
        supabase
          .from("profiles")
          .select("name,avatar_url,location_city,location_state")
          .eq("id", data.user_id)
          .maybeSingle(),
        getReviewSummary(supabase, data.user_id),
        supabase.auth.getUser(),
      ]);

    if (imagesResult.error) {
      console.error("Falha ao consultar imagens do produto.", {
        id,
        code: imagesResult.error.code,
        message: imagesResult.error.message,
      });
      throw new Error("Não foi possível carregar as imagens do produto.");
    }

    if (sellerResult.error) {
      console.error("Falha ao consultar vendedor do produto.", {
        id,
        sellerId: data.user_id,
        code: sellerResult.error.code,
        message: sellerResult.error.message,
      });
      throw new Error("Não foi possível carregar o vendedor do produto.");
    }

    const images = toProductGalleryImages(
      supabase,
      imagesResult.data as ProductImageRecord[],
    );

    const {
      data: { user },
      error: authError,
    } = authResult;

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
    const sellerProfile = sellerResult.data as DatabaseSellerProfile | null;
    const seller =
      sellerProfile && sellerProfile.name.trim()
        ? {
            id: data.user_id,
            name: sellerProfile.name.trim(),
            avatarUrl: sellerProfile.avatar_url,
            locationCity: sellerProfile.location_city,
            locationState: sellerProfile.location_state,
            reviewSummary,
          }
        : null;

    if (!seller) {
      console.error("Perfil público do vendedor não foi encontrado.", {
        id,
        sellerId: data.user_id,
      });
    }

    return normalizeDatabaseProduct(
      data as DatabaseProduct,
      images,
      favoriteProductIds.has(String(data.id)),
      user?.id ?? null,
      seller,
    );
  }

  return null;
}

export default async function ProductPage({
  params,
}: PageProps<"/produto/[id]">) {
  const { id } = await params;
  const product = await getProduct(id);

  // Produtos ausentes no Supabase seguem o fluxo de notFound().
  if (!product) {
    notFound();
  }

  return (
    <article className="w-full px-6 py-10">
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
            <FavoriteButton
              key={`${product.favoriteProductId}:${product.isFavorite}`}
              productId={product.favoriteProductId}
              initialIsFavorite={product.isFavorite}
            />
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-2 text-zinc-300">
            <span>{product.condition}</span>
            <span className="text-zinc-600">•</span>
            <span>Tamanho {product.size}</span>
          </div>

          <p className="mt-3 text-zinc-400">{product.location}</p>

          {product.status === "active" &&
            product.currentUserId !== product.sellerId && (
              <StartConversationButton productId={product.id} />
            )}
        </div>
      </div>

      {product.seller && (
        <SellerCard seller={product.seller} />
      )}

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
