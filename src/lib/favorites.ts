import type { SupabaseClient } from "@supabase/supabase-js";

type FavoriteProductRecord = {
  product_id: string | number;
};

/** Carrega favoritos do usuário em uma única consulta, opcionalmente filtrada. */
export async function getFavoriteProductIds(
  supabase: SupabaseClient,
  userId: string,
  productIds?: readonly (string | number)[],
) {
  if (productIds?.length === 0) {
    return new Set<string>();
  }

  let query = supabase
    .from("favorites")
    .select("product_id")
    .eq("user_id", userId);

  if (productIds) {
    query = query.in("product_id", [...productIds]);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Falha ao consultar favoritos do usuário.", {
      userId,
      code: error.code,
      message: error.message,
    });
    throw new Error("Não foi possível carregar seus favoritos.");
  }

  return new Set(
    ((data ?? []) as FavoriteProductRecord[]).map((favorite) =>
      String(favorite.product_id),
    ),
  );
}
