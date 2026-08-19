import { Hero } from "@/home/Hero/Hero";
import { ProductCatalog } from "@/home/ProductCatalog/ProductCatalog";
import { mockProducts } from "@/constants/mockProducts";
import {
  getMockProductHref,
  normalizeProductCategory,
  type CatalogProduct,
} from "@/lib/products";
import {
  getProductImagePublicUrl,
  sortProductImages,
  type ProductImageRecord,
} from "@/lib/productImages";
import { createClient } from "@/lib/supabase/server";

type DatabaseCatalogProduct = {
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

function normalizeDatabaseProduct(
  product: DatabaseCatalogProduct,
  image: string | null,
): CatalogProduct {
  const price = Number(product.price);
  const category = normalizeProductCategory(product.category);

  if (!Number.isFinite(price) || !category) {
    throw new Error("O produto possui dados inválidos para exibição na Home.");
  }

  return {
    key: `supabase:${product.id}`,
    href: `/produto/${encodeURIComponent(String(product.id))}`,
    title: product.title,
    price,
    location: `${product.location_city}, ${product.location_state}`,
    image,
    category,
    size: product.size,
    condition: product.condition,
  };
}

function normalizeMockProduct(
  product: (typeof mockProducts)[number],
): CatalogProduct {
  return {
    key: `mock:${product.id}`,
    href: getMockProductHref(product.id),
    title: product.title,
    price: product.price,
    location: product.location,
    image: product.image,
    category: product.category,
    size: product.size,
    condition: product.condition,
  };
}

async function getDatabaseProducts(): Promise<CatalogProduct[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      "id,title,category,price,condition,size,location_city,location_state,created_at",
    )
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Falha ao consultar produtos recentes no Supabase.", {
      code: error.code,
      message: error.message,
    });
    throw new Error("Não foi possível carregar os anúncios recentes.");
  }

  const products = data as DatabaseCatalogProduct[];

  if (products.length === 0) return [];

  // Uma única consulta carrega as imagens de todos os produtos, evitando N+1.
  const { data: imageData, error: imageError } = await supabase
    .from("product_images")
    .select("product_id,storage_path,sort_order,is_primary")
    .in(
      "product_id",
      products.map((product) => product.id),
    )
    .order("sort_order", { ascending: true });

  if (imageError) {
    console.error("Falha ao consultar imagens dos produtos.", {
      code: imageError.code,
      message: imageError.message,
    });
    throw new Error("Não foi possível carregar as imagens dos anúncios.");
  }

  const imagesByProduct = new Map<string, DatabaseProductImage[]>();

  for (const image of imageData as DatabaseProductImage[]) {
    const productId = String(image.product_id);
    const productImages = imagesByProduct.get(productId) ?? [];
    productImages.push(image);
    imagesByProduct.set(productId, productImages);
  }

  return products.map((product) => {
    const primaryImage = sortProductImages(
      imagesByProduct.get(String(product.id)) ?? [],
    )[0];
    const imageUrl = primaryImage
      ? getProductImagePublicUrl(supabase, primaryImage.storage_path)
      : null;

    return normalizeDatabaseProduct(product, imageUrl);
  });
}

/**
 * Home
 *
 * Página inicial do Tatame Market.
 *
 * Responsável por organizar:
 * - Hero
 * - Catálogo interativo de categorias e anúncios recentes
 *
 * Os anúncios reais são carregados no servidor e combinados temporariamente
 * com os mocks antes de chegar ao catálogo interativo.
 */
export default async function Home() {
  const databaseProducts = await getDatabaseProducts();
  const products = [
    ...databaseProducts,
    ...mockProducts.map(normalizeMockProduct),
  ];

  return (
    <div>
      {/* Área principal de apresentação do marketplace */}
      <Hero />

      {/* O estado do filtro fica isolado neste Client Component. */}
      <ProductCatalog products={products} />
    </div>
  );
}
