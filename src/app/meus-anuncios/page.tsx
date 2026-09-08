import Link from "next/link";
import { redirect } from "next/navigation";

import { MyProductCard } from "@/components/products/MyProductCard/MyProductCard";
import {
  getProductImagePublicUrl,
  sortProductImages,
  type ProductImageRecord,
} from "@/lib/productImages";
import { isProductStatus, type UserProduct } from "@/lib/products";
import { createClient } from "@/lib/supabase/server";

type DatabaseUserProduct = {
  id: string | number;
  title: string;
  price: string | number;
  condition: "Novo" | "Usado";
  location_city: string;
  location_state: string;
  status: string;
  created_at: string;
};

type DatabaseProductImage = ProductImageRecord & {
  product_id: string | number;
};

export default async function MyProductsPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError && authError.name !== "AuthSessionMissingError") {
    console.error("Falha ao validar usuário em Meus anúncios.", {
      name: authError.name,
      message: authError.message,
    });
    throw new Error("Não foi possível validar sua sessão.");
  }

  if (!user) {
    redirect("/login");
  }

  const { data, error } = await supabase
    .from("products")
    .select(
      "id,title,price,condition,location_city,location_state,status,created_at",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Falha ao consultar anúncios do usuário.", {
      userId: user.id,
      code: error.code,
      message: error.message,
    });
    throw new Error("Não foi possível carregar seus anúncios.");
  }

  const databaseProducts = data as DatabaseUserProduct[];
  const imagesByProduct = new Map<string, DatabaseProductImage[]>();

  if (databaseProducts.length > 0) {
    // As imagens de todos os anúncios são carregadas juntas para evitar N+1.
    const { data: imageData, error: imageError } = await supabase
      .from("product_images")
      .select("product_id,storage_path,sort_order,is_primary")
      .in(
        "product_id",
        databaseProducts.map((product) => product.id),
      )
      .order("sort_order", { ascending: true });

    if (imageError) {
      console.error("Falha ao consultar imagens dos anúncios do usuário.", {
        userId: user.id,
        code: imageError.code,
        message: imageError.message,
      });
      throw new Error("Não foi possível carregar as imagens dos seus anúncios.");
    }

    for (const image of imageData as DatabaseProductImage[]) {
      const productId = String(image.product_id);
      const productImages = imagesByProduct.get(productId) ?? [];
      productImages.push(image);
      imagesByProduct.set(productId, productImages);
    }
  }

  const products: UserProduct[] = databaseProducts.map((product) => {
    const price = Number(product.price);

    if (!Number.isFinite(price) || !isProductStatus(product.status)) {
      console.error("Anúncio possui dados inválidos no banco de dados.", {
        productId: product.id,
        price: product.price,
        status: product.status,
      });
      throw new Error("Não foi possível preparar um dos seus anúncios.");
    }

    const primaryImage = sortProductImages(
      imagesByProduct.get(String(product.id)) ?? [],
    )[0];

    return {
      id: String(product.id),
      title: product.title,
      price,
      location: `${product.location_city}, ${product.location_state}`,
      condition: product.condition,
      status: product.status,
      image: primaryImage
        ? getProductImagePublicUrl(supabase, primaryImage.storage_path)
        : null,
    };
  });

  return (
    <div className="w-full px-6 py-10">
      <header>
        <span className="text-sm font-medium text-[#58C447]">Sua conta</span>
        <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">
          Meus anúncios
        </h1>
        <p className="mt-3 text-zinc-400">
          Gerencie os produtos que você publicou.
        </p>
      </header>

      {products.length === 0 ? (
        <section className="mt-8 rounded-2xl border border-white/10 bg-zinc-900 px-6 py-12 text-center sm:px-8">
          <h2 className="text-xl font-semibold text-white">
            Você ainda não publicou nenhum anúncio.
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            Crie seu primeiro anúncio para começar a vender no Tatame Market.
          </p>
          <Link
            href="/anunciar"
            className="mt-6 inline-flex rounded-lg bg-[#58C447] px-5 py-3 font-semibold text-[#111412] transition hover:bg-[#6AD159]"
          >
            Criar anúncio
          </Link>
        </section>
      ) : (
        <section className="mt-8 grid gap-5 lg:grid-cols-2">
          {products.map((product) => (
            <MyProductCard key={product.id} product={product} />
          ))}
        </section>
      )}
    </div>
  );
}
