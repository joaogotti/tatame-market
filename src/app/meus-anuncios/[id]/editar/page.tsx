import { notFound, redirect } from "next/navigation";

import {
  EditProductForm,
  type EditableProduct,
} from "@/components/products/EditProductForm/EditProductForm";
import { createClient } from "@/lib/supabase/server";

type DatabaseEditableProduct = {
  id: string | number;
  title: string;
  category: string;
  price: string | number;
  condition: string;
  size: string;
  location_ibge_code: string | number;
  location_city: string;
  location_state: string;
  description: string;
};

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError && authError.name !== "AuthSessionMissingError") {
    console.error("Falha ao validar usuário na edição do anúncio.", {
      name: authError.name,
      message: authError.message,
    });
    throw new Error("Não foi possível validar sua sessão.");
  }

  if (!user) {
    redirect("/login");
  }

  // A propriedade faz parte da própria consulta e nunca é delegada ao cliente.
  const { data, error } = await supabase
    .from("products")
    .select(
      "id,title,category,price,condition,size,location_ibge_code,location_city,location_state,description",
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    if (error.code === "22P02") {
      notFound();
    }

    console.error("Falha ao carregar produto para edição.", {
      productId: id,
      userId: user.id,
      code: error.code,
      message: error.message,
    });
    throw new Error("Não foi possível carregar o anúncio para edição.");
  }

  if (!data) {
    notFound();
  }

  const databaseProduct = data as DatabaseEditableProduct;
  const price = Number(databaseProduct.price);
  const locationIbgeCode = Number(databaseProduct.location_ibge_code);

  if (!Number.isFinite(price) || !Number.isInteger(locationIbgeCode)) {
    console.error("Produto possui dados inválidos para edição.", {
      productId: id,
      price: databaseProduct.price,
      locationIbgeCode: databaseProduct.location_ibge_code,
    });
    throw new Error("Não foi possível preparar o anúncio para edição.");
  }

  const product: EditableProduct = {
    id: String(databaseProduct.id),
    title: databaseProduct.title,
    category: databaseProduct.category,
    price,
    condition: databaseProduct.condition,
    size: databaseProduct.size,
    locationIbgeCode,
    locationCity: databaseProduct.location_city,
    locationState: databaseProduct.location_state,
    description: databaseProduct.description,
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-10">
      <header>
        <span className="text-sm font-medium text-[#58C447]">
          Gerenciar anúncio
        </span>
        <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">
          Editar anúncio
        </h1>
        <p className="mt-3 max-w-2xl text-zinc-400">
          Revise as informações abaixo e salve as alterações do seu produto.
        </p>
      </header>

      <EditProductForm product={product} />
    </div>
  );
}
