import { PackageOpen } from "lucide-react";
import { notFound } from "next/navigation";

import { PublicProfileHeader } from "@/components/profile/PublicProfileHeader/PublicProfileHeader";
import { ProductCard } from "@/home/ProductCard/ProductCard";
import { getFavoriteProductIds } from "@/lib/favorites";
import {
  getProductImagePublicUrl,
  sortProductImages,
  type ProductImageRecord,
} from "@/lib/productImages";
import {
  normalizeProductCategory,
  type CatalogProduct,
} from "@/lib/products";
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
  created_at: string;
};

type DatabaseProductImage = ProductImageRecord & {
  product_id: string | number;
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
  const [productsResult, authResult] = await Promise.all([
    supabase
      .from("products")
      .select(
        "id,title,category,price,condition,size,location_city,location_state,created_at",
      )
      .eq("user_id", id)
      .eq("status", "active")
      .order("created_at", { ascending: false }),
    supabase.auth.getUser(),
  ]);

  if (productsResult.error) {
    console.error("Falha ao carregar anúncios do perfil público.", {
      profileId: id,
      code: productsResult.error.code,
      message: productsResult.error.message,
    });
    throw new Error("Não foi possível carregar os anúncios deste vendedor.");
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
  const imagesByProduct = new Map<string, DatabaseProductImage[]>();
  let favoriteProductIds = new Set<string>();

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
      href: `/produto/${encodeURIComponent(String(product.id))}`,
      title: product.title,
      price,
      location: `${product.location_city}, ${product.location_state}`,
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

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <PublicProfileHeader
        name={profile.name}
        avatarUrl={profile.avatar_url}
        bio={profile.bio}
        locationCity={profile.location_city}
        locationState={profile.location_state}
        createdAt={profile.created_at}
        isOwnProfile={currentUser?.id === id}
      />

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
    </div>
  );
}
