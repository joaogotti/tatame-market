import Link from "next/link";
import { redirect } from "next/navigation";

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

type DatabaseFavoriteProduct = {
  id: string | number;
  title: string;
  category: string;
  price: string | number;
  condition: "Novo" | "Usado";
  size: string;
  location_city: string;
  location_state: string;
};

type DatabaseProductImage = ProductImageRecord & {
  product_id: string | number;
};

export default async function FavoritesPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError && authError.name !== "AuthSessionMissingError") {
    console.error("Falha ao validar usuário na página de favoritos.", {
      name: authError.name,
      message: authError.message,
    });
    throw new Error("Não foi possível validar sua sessão.");
  }

  if (!user) {
    redirect("/login");
  }

  const favoriteProductIds = await getFavoriteProductIds(supabase, user.id);
  const productIds = [...favoriteProductIds];
  let products: CatalogProduct[] = [];

  if (productIds.length > 0) {
    const { data, error } = await supabase
      .from("products")
      .select(
        "id,title,category,price,condition,size,location_city,location_state",
      )
      .in("id", productIds)
      .eq("status", "active");

    if (error) {
      console.error("Falha ao consultar produtos favoritos.", {
        userId: user.id,
        code: error.code,
        message: error.message,
      });
      throw new Error("Não foi possível carregar os produtos favoritos.");
    }

    const databaseProducts = data as DatabaseFavoriteProduct[];
    const imagesByProduct = new Map<string, DatabaseProductImage[]>();

    if (databaseProducts.length > 0) {
      // Uma única consulta preserva o padrão de imagens e evita N+1.
      const { data: imageData, error: imageError } = await supabase
        .from("product_images")
        .select("product_id,storage_path,sort_order,is_primary")
        .in(
          "product_id",
          databaseProducts.map((product) => product.id),
        )
        .order("sort_order", { ascending: true });

      if (imageError) {
        console.error("Falha ao consultar imagens dos favoritos.", {
          userId: user.id,
          code: imageError.code,
          message: imageError.message,
        });
        throw new Error("Não foi possível carregar as imagens dos favoritos.");
      }

      for (const image of imageData as DatabaseProductImage[]) {
        const productId = String(image.product_id);
        const productImages = imagesByProduct.get(productId) ?? [];
        productImages.push(image);
        imagesByProduct.set(productId, productImages);
      }
    }

    products = databaseProducts.map((product) => {
      const price = Number(product.price);
      const category = normalizeProductCategory(product.category);

      if (!Number.isFinite(price) || !category) {
        console.error("Favorito possui dados inválidos.", {
          productId: product.id,
          price: product.price,
          category: product.category,
        });
        throw new Error("Não foi possível preparar um produto favorito.");
      }

      const primaryImage = sortProductImages(
        imagesByProduct.get(String(product.id)) ?? [],
      )[0];

      return {
        key: `favorite:${product.id}`,
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
        isFavorite: true,
      };
    });
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <header>
        <span className="text-sm font-medium text-[#58C447]">Sua conta</span>
        <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">
          Favoritos
        </h1>
        <p className="mt-3 text-zinc-400">
          Acompanhe os anúncios que você deseja consultar novamente.
        </p>
      </header>

      {products.length === 0 ? (
        <section className="mt-8 rounded-2xl border border-white/10 bg-zinc-900 px-6 py-12 text-center sm:px-8">
          <h2 className="text-xl font-semibold text-white">
            Você ainda não possui anúncios favoritos.
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            Explore os anúncios e use o coração para salvar seus produtos
            preferidos.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex rounded-lg bg-[#58C447] px-5 py-3 font-semibold text-[#111412] transition hover:bg-[#6AD159]"
          >
            Explorar anúncios
          </Link>
        </section>
      ) : (
        <section className="mt-8 flex flex-wrap gap-5">
          {products.map((product) => (
            <ProductCard key={product.key} product={product} />
          ))}
        </section>
      )}
    </div>
  );
}
