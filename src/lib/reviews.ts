import type { SupabaseClient } from "@supabase/supabase-js";

export const MAX_REVIEW_COMMENT_LENGTH = 1000;

export type ReviewSummaryData = {
  average: number | null;
  count: number;
};

export type EditableReview = {
  id: string;
  rating: number;
  comment: string | null;
};

export type PublicReview = EditableReview & {
  reviewerId: string;
  createdAt: string;
  updatedAt: string;
  author: {
    name: string;
    avatarUrl: string | null;
  } | null;
};

/** Busca a reputação agregada no banco, independentemente da lista exibida. */
export async function getReviewSummary(
  supabase: SupabaseClient,
  sellerId: string,
): Promise<ReviewSummaryData> {
  try {
    const { data, error } = await supabase.rpc("get_review_summary", {
      target_seller_id: sellerId,
    });

    if (error) throw error;

    // Funções que retornam tabela entregam um array; JSON/composite pode ser objeto.
    const result: unknown = Array.isArray(data)
      ? (data.length === 1 ? data[0] : null)
      : data;

    if (!result || typeof result !== "object" || Array.isArray(result)) {
      throw new Error("Resumo de avaliações ausente ou inválido.");
    }

    const { average: rawAverage, count: rawCount } = result as Record<
      string,
      unknown
    >;
    const average = rawAverage === null
      ? null
      : typeof rawAverage === "number" ||
          (typeof rawAverage === "string" &&
            /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(rawAverage.trim()))
        ? Number(rawAverage)
        : NaN;
    const count =
      typeof rawCount === "number" || typeof rawCount === "bigint" ||
      (typeof rawCount === "string" && /^\d+$/.test(rawCount.trim()))
        ? Number(rawCount)
        : NaN;

    if (
      !Number.isSafeInteger(count) ||
      count < 0 ||
      (count === 0
        ? average !== null
        : average === null || !Number.isFinite(average) || average < 1 || average > 5)
    ) {
      throw new Error("Média ou quantidade de avaliações inválida.");
    }

    return { average, count };
  } catch (error) {
    console.error("Falha ao consultar reputação do vendedor.", { sellerId, error });
    throw new Error("Não foi possível carregar a reputação do vendedor.", {
      cause: error,
    });
  }
}
