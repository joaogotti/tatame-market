import { PackageOpen } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PublicProfileHeader } from "@/components/profile/PublicProfileHeader/PublicProfileHeader";
import { ReviewForm } from "@/components/reviews/ReviewForm/ReviewForm";
import { ReviewList } from "@/components/reviews/ReviewList/ReviewList";
import { ReviewSummary } from "@/components/reviews/ReviewSummary/ReviewSummary";
import { ProductCard } from "@/components/products/ProductCard/ProductCard";
import { getFavoriteProductIds } from "@/lib/favorites";
import {
  getProductImagePublicUrl,
  sortProductImages,
  type ProductImageRecord,
} from "@/lib/productImages";
import {
  normalizeProductCategory,
  normalizeProductCreatedAt,
  normalizeLocationIbgeCode,
  type CatalogProduct,
} from "@/lib/products";
import {
  getReviewSummary,
  type EditableReview,
  type PublicReview,
} from "@/lib/reviews";
import { createClient } from "@/lib/supabase/server";

type DatabasePublicProfile = {
  name: string;
  avatar_url: string | null;
  bio: string | null;
  location_city: string | null;
  location_state: string | null;
  created_at: string;
};

type DatabaseSellerProduct = {
  id: string | number;
  title: string;
  category: string;
  price: string | number;
  condition: "Novo" | "Usado";
  size: string;
  location_city: string;
  location_state: string;
  location_ibge_code?: string | number | null;
  created_at?: string | null;
};

type DatabaseProductImage = ProductImageRecord & {
  product_id: string | number;
};

type DatabaseReview = {
  id: string;
  reviewer_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
};

type DatabaseReviewAuthor = {
  id: string;
  name: string;
  avatar_url: string | null;
};

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select(
      "name,avatar_url,bio,location_city,location_state,created_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (profileError) {
    if (profileError.code === "22P02") notFound();

    console.error("Falha ao carregar perfil público.", {
      profileId: id,
      code: profileError.code,
      message: profileError.message,
    });
    throw new Error("Não foi possível carregar este perfil.");
  }

  if (!profileData) notFound();

  const profile = profileData as DatabasePublicProfile;
  const [productsResult, reviewsResult, authResult, reviewSummary] = await Promise.all([
    supabase
      .from("products")
      .select(
        "id,title,category,price,condition,size,location_city,location_state,location_ibge_code,created_at",
      )
      .eq("user_id", id)
      .eq("status", "active")
      .order("created_at", { ascending: false }),
    supabase
      .from("reviews")
      .select(
        "id,reviewer_id,rating,comment,created_at,updated_at",
      )
      .eq("seller_id", id)
      .order("created_at", { ascending: false }),
    supabase.auth.getUser(),
    getReviewSummary(supabase, id),
  ]);

  if (productsResult.error) {
    console.error("Falha ao carregar anúncios do perfil público.", {
      profileId: id,
      code: productsResult.error.code,
      message: productsResult.error.message,
    });
    throw new Error("Não foi possível carregar os anúncios deste vendedor.");
  }

  if (reviewsResult.error) {
    console.error("Falha ao carregar avaliações do perfil público.", {
      profileId: id,
      code: reviewsResult.error.code,
      message: reviewsResult.error.message,
    });
    throw new Error("Não foi possível carregar as avaliações deste vendedor.");
  }

  if (
    authResult.error &&
    authResult.error.name !== "AuthSessionMissingError"
  ) {
    // A sessão é opcional nesta rota: uma falha de Auth não impede a leitura
    // pública, apenas desativa o estado personalizado de edição e favoritos.
    console.error("Falha ao validar sessão no perfil público.", {
      profileId: id,
      name: authResult.error.name,
      message: authResult.error.message,
    });
  }

  const currentUser = authResult.error ? null : authResult.data.user;
  const databaseProducts = productsResult.data as DatabaseSellerProduct[];
  const databaseReviews = reviewsResult.data as DatabaseReview[];
  const imagesByProduct = new Map<string, DatabaseProductImage[]>();
  let favoriteProductIds = new Set<string>();

  const reviewerIds = [
    ...new Set(databaseReviews.map((review) => review.reviewer_id)),
  ];
  const reviewAuthorsById = new Map<string, DatabaseReviewAuthor>();

  if (reviewerIds.length > 0) {
    const { data: authorData, error: authorError } = await supabase
      .from("profiles")
      .select("id,name,avatar_url")
      .in("id", reviewerIds);

    if (authorError) {
      console.error("Falha ao carregar autores das avaliações.", {
        profileId: id,
        code: authorError.code,
        message: authorError.message,
      });
      throw new Error("Não foi possível carregar os autores das avaliações.");
    }

    for (const author of authorData as DatabaseReviewAuthor[]) {
      reviewAuthorsById.set(author.id, author);
    }
  }

  if (databaseProducts.length > 0) {
    const productIds = databaseProducts.map((product) => product.id);
    const [imagesResult, favorites] = await Promise.all([
      supabase
        .from("product_images")
        .select("product_id,storage_path,sort_order,is_primary")
        .in("product_id", productIds)
        .order("sort_order", { ascending: true }),
      currentUser
        ? getFavoriteProductIds(supabase, currentUser.id, productIds)
        : Promise.resolve(new Set<string>()),
    ]);

    if (imagesResult.error) {
      console.error("Falha ao carregar imagens do perfil público.", {
        profileId: id,
        code: imagesResult.error.code,
        message: imagesResult.error.message,
      });
      throw new Error("Não foi possível carregar as imagens dos anúncios.");
    }

    for (const image of imagesResult.data as DatabaseProductImage[]) {
      const productId = String(image.product_id);
      const productImages = imagesByProduct.get(productId) ?? [];
      productImages.push(image);
      imagesByProduct.set(productId, productImages);
    }

    favoriteProductIds = favorites;
  }

  const products: CatalogProduct[] = databaseProducts.map((product) => {
    const price = Number(product.price);
    const category = normalizeProductCategory(product.category);

    if (!Number.isFinite(price) || !category) {
      console.error("Anúncio público possui dados inválidos.", {
        profileId: id,
        productId: product.id,
        price: product.price,
        category: product.category,
      });
      throw new Error("Não foi possível preparar um dos anúncios.");
    }

    const primaryImage = sortProductImages(
      imagesByProduct.get(String(product.id)) ?? [],
    )[0];

    return {
      key: `seller:${product.id}`,
      source: "supabase",
      createdAt: normalizeProductCreatedAt(product.created_at),
      href: `/produto/${encodeURIComponent(String(product.id))}`,
      title: product.title,
      price,
      location: `${product.location_city}, ${product.location_state}`,
      locationCity: product.location_city,
      locationState: product.location_state,
      locationIbgeCode: normalizeLocationIbgeCode(product.location_ibge_code),
      image: primaryImage
        ? getProductImagePublicUrl(supabase, primaryImage.storage_path)
        : null,
      category,
      size: product.size,
      condition: product.condition,
      favoriteProductId: String(product.id),
      isFavorite: favoriteProductIds.has(String(product.id)),
    };
  });

  const reviews: PublicReview[] = databaseReviews.map((review) => {
    const author = reviewAuthorsById.get(review.reviewer_id);

    return {
      id: review.id,
      reviewerId: review.reviewer_id,
      rating: Number(review.rating),
      comment: review.comment,
      createdAt: review.created_at,
      updatedAt: review.updated_at,
      author: author
        ? {
            name: author.name,
            avatarUrl: author.avatar_url,
          }
        : null,
    };
  });
  const currentUserReviewData = currentUser
    ? databaseReviews.find((review) => review.reviewer_id === currentUser.id)
    : null;
  const currentUserReview: EditableReview | null = currentUserReviewData
    ? {
        id: currentUserReviewData.id,
        rating: Number(currentUserReviewData.rating),
        comment: currentUserReviewData.comment,
      }
    : null;
  const isOwnProfile = currentUser?.id === id;

  return (
    <div className="w-full px-6 py-10">
      <PublicProfileHeader
        name={profile.name}
        avatarUrl={profile.avatar_url}
        bio={profile.bio}
        locationCity={profile.location_city}
        locationState={profile.location_state}
        createdAt={profile.created_at}
        isOwnProfile={isOwnProfile}
      />

      <ReviewSummary summary={reviewSummary} />

      <section className="mt-10">
        <div>
          <span className="text-sm font-medium text-[#58C447]">
            Marketplace
          </span>
          <h2 className="mt-1 text-2xl font-bold text-white sm:text-3xl">
            Anúncios deste vendedor
          </h2>
        </div>

        {products.length > 0 ? (
          <div className="mt-6 flex flex-wrap gap-5">
            {products.map((product) => (
              <ProductCard key={product.key} product={product} />
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-white/10 bg-zinc-900 px-6 py-12 text-center">
            <PackageOpen
              aria-hidden="true"
              size={42}
              strokeWidth={1.5}
              className="mx-auto text-zinc-600"
            />
            <h3 className="mt-4 text-xl font-semibold text-white">
              Nenhum anúncio ativo no momento
            </h3>
            <p className="mt-2 text-sm text-zinc-400">
              Este vendedor ainda não possui produtos disponíveis.
            </p>
          </div>
        )}
      </section>

      <section className="mt-12 border-t border-white/10 pt-10">
        <div>
          <span className="text-sm font-medium text-[#58C447]">
            Reputação
          </span>
          <h2 className="mt-1 text-2xl font-bold text-white sm:text-3xl">
            Avaliações
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            Experiências compartilhadas por outros usuários do Tatame Market.
          </p>
        </div>

        <div className="mt-6">
          {isOwnProfile ? (
            <div className="rounded-xl border border-white/10 bg-zinc-900 px-5 py-4 text-sm text-zinc-400">
              Este é o seu perfil público.
            </div>
          ) : currentUser ? (
            <ReviewForm
              key={currentUserReview?.id ?? "new-review"}
              sellerId={id}
              initialReview={currentUserReview}
            />
          ) : (
            <div className="rounded-xl border border-white/10 bg-zinc-900 px-5 py-4 text-sm text-zinc-400">
              <Link
                href="/login"
                className="font-semibold text-[#58C447] hover:text-[#6AD159]"
              >
                Entre
              </Link>{" "}
              para avaliar este vendedor.
            </div>
          )}
        </div>

        <div className="mt-6">
          <ReviewList reviews={reviews} />
        </div>
      </section>
    </div>
  );
}
