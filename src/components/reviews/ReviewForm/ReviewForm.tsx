"use client";

import { Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useRef, useState } from "react";

import { ReviewStars } from "@/components/reviews/ReviewStars/ReviewStars";
import {
  MAX_REVIEW_COMMENT_LENGTH,
  type EditableReview,
} from "@/lib/reviews";
import { createClient } from "@/lib/supabase/client";

const ratingOptions = [1, 2, 3, 4, 5] as const;

export function ReviewForm({
  sellerId,
  initialReview,
}: {
  sellerId: string;
  initialReview: EditableReview | null;
}) {
  const router = useRouter();
  const [supabase] = useState(createClient);
  const isSubmittingRef = useRef(false);
  const [currentReview, setCurrentReview] =
    useState<EditableReview | null>(initialReview);
  const [isEditing, setIsEditing] = useState(!initialReview);
  const [rating, setRating] = useState(initialReview?.rating ?? 0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState(initialReview?.comment ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  function startEditing() {
    if (!currentReview) return;

    setRating(currentReview.rating);
    setComment(currentReview.comment ?? "");
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsEditing(true);
  }

  function cancelEditing() {
    if (!currentReview) return;

    setRating(currentReview.rating);
    setComment(currentReview.comment ?? "");
    setErrorMessage(null);
    setIsEditing(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmittingRef.current) return;

    const normalizedComment = comment.trim();

    setErrorMessage(null);
    setSuccessMessage(null);

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      setErrorMessage("Selecione uma nota de 1 a 5 estrelas.");
      return;
    }

    if (normalizedComment.length > MAX_REVIEW_COMMENT_LENGTH) {
      setErrorMessage(
        `O comentário deve ter no máximo ${MAX_REVIEW_COMMENT_LENGTH} caracteres.`,
      );
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError && authError.name !== "AuthSessionMissingError") {
        console.error("Falha ao validar usuário ao salvar avaliação.", {
          sellerId,
          name: authError.name,
          message: authError.message,
        });
        setErrorMessage(
          "Não foi possível validar sua sessão. Entre novamente e tente de novo.",
        );
        return;
      }

      if (!user) {
        router.push("/login");
        return;
      }

      if (user.id === sellerId) {
        setErrorMessage("Você não pode avaliar o próprio perfil.");
        router.refresh();
        return;
      }

      let savedReview: EditableReview;

      if (currentReview) {
        const { data, error } = await supabase
          .from("reviews")
          .update({
            rating,
            comment: normalizedComment || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", currentReview.id)
          .eq("reviewer_id", user.id)
          .eq("seller_id", sellerId)
          .select("id,rating,comment")
          .maybeSingle();

        if (error) {
          console.error("Falha ao atualizar avaliação.", {
            reviewId: currentReview.id,
            sellerId,
            reviewerId: user.id,
            code: error.code,
            message: error.message,
          });
          setErrorMessage(
            "Não foi possível atualizar sua avaliação. Tente novamente.",
          );
          return;
        }

        if (!data) {
          setErrorMessage(
            "Sua avaliação não foi encontrada. Atualize a página e tente novamente.",
          );
          router.refresh();
          return;
        }

        savedReview = {
          id: String(data.id),
          rating: Number(data.rating),
          comment: typeof data.comment === "string" ? data.comment : null,
        };
      } else {
        const { data, error } = await supabase
          .from("reviews")
          .insert({
            reviewer_id: user.id,
            seller_id: sellerId,
            rating,
            comment: normalizedComment || null,
          })
          .select("id,rating,comment")
          .single();

        if (error) {
          if (error.code === "23505") {
            const { data: existingReview, error: existingReviewError } =
              await supabase
                .from("reviews")
                .select("id,rating,comment")
                .eq("reviewer_id", user.id)
                .eq("seller_id", sellerId)
                .maybeSingle();

            if (existingReviewError || !existingReview) {
              console.error(
                "Falha ao carregar avaliação após conflito de duplicidade.",
                {
                  sellerId,
                  reviewerId: user.id,
                  code: existingReviewError?.code,
                  message: existingReviewError?.message,
                },
              );
              setErrorMessage(
                "Você já avaliou este vendedor. Atualize a página para editar sua avaliação.",
              );
              router.refresh();
              return;
            }

            const loadedReview = {
              id: String(existingReview.id),
              rating: Number(existingReview.rating),
              comment:
                typeof existingReview.comment === "string"
                  ? existingReview.comment
                  : null,
            };

            setCurrentReview(loadedReview);
            setRating(loadedReview.rating);
            setComment(loadedReview.comment ?? "");
            setIsEditing(false);
            setSuccessMessage(
              "Você já havia avaliado este vendedor. A avaliação existente foi carregada.",
            );
            router.refresh();
            return;
          }

          console.error("Falha ao criar avaliação.", {
            sellerId,
            reviewerId: user.id,
            code: error.code,
            message: error.message,
          });
          setErrorMessage(
            "Não foi possível enviar sua avaliação. Tente novamente.",
          );
          return;
        }

        savedReview = {
          id: String(data.id),
          rating: Number(data.rating),
          comment: typeof data.comment === "string" ? data.comment : null,
        };
      }

      setCurrentReview(savedReview);
      setRating(savedReview.rating);
      setComment(savedReview.comment ?? "");
      setIsEditing(false);
      setSuccessMessage(
        currentReview
          ? "Avaliação atualizada com sucesso."
          : "Avaliação enviada com sucesso.",
      );
      router.refresh();
    } catch (error) {
      console.error("Falha inesperada ao salvar avaliação.", error);
      setErrorMessage(
        "Não foi possível conectar ao serviço de avaliações. Tente novamente.",
      );
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  }

  if (currentReview && !isEditing) {
    return (
      <section className="rounded-2xl border border-[#58C447]/20 bg-[#58C447]/5 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="font-semibold text-white">Sua avaliação</h3>
            <div className="mt-2">
              <ReviewStars value={currentReview.rating} />
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-zinc-300">
              {currentReview.comment || "Sem comentário."}
            </p>
          </div>

          <button
            type="button"
            className="rounded-lg border border-[#58C447]/30 px-4 py-2 text-sm font-medium text-[#58C447] transition hover:border-[#58C447]/60 hover:text-[#6AD159]"
            onClick={startEditing}
          >
            Editar minha avaliação
          </button>
        </div>

        {successMessage && (
          <p
            role="status"
            aria-live="polite"
            className="mt-4 text-sm text-[#58C447]"
          >
            {successMessage}
          </p>
        )}
      </section>
    );
  }

  const displayedRating = hoveredRating || rating;

  return (
    <form
      className="rounded-2xl border border-white/10 bg-zinc-900 p-5 sm:p-6"
      aria-busy={isSubmitting}
      onSubmit={handleSubmit}
    >
      <h3 className="text-lg font-semibold text-white">
        {currentReview ? "Editar minha avaliação" : "Avaliar vendedor"}
      </h3>

      <fieldset className="mt-5" disabled={isSubmitting}>
        <legend className="text-sm font-medium text-zinc-300">
          Nota <span className="text-red-300">*</span>
        </legend>
        <div className="mt-2 flex w-fit gap-1" onMouseLeave={() => setHoveredRating(0)}>
          {ratingOptions.map((value) => {
            const isFilled = value <= displayedRating;

            return (
              <button
                key={value}
                type="button"
                aria-label={`${value} ${value === 1 ? "estrela" : "estrelas"}`}
                aria-pressed={rating === value}
                className={`rounded-md p-1.5 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#58C447] ${
                  isFilled
                    ? "scale-105 text-[#58C447]"
                    : "text-zinc-600 hover:text-zinc-400"
                }`}
                onClick={() => setRating(value)}
                onFocus={() => setHoveredRating(value)}
                onBlur={() => setHoveredRating(0)}
                onMouseEnter={() => setHoveredRating(value)}
              >
                <Star
                  aria-hidden="true"
                  size={28}
                  fill={isFilled ? "currentColor" : "none"}
                />
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-zinc-500">
          {rating > 0
            ? `${rating} ${rating === 1 ? "estrela selecionada" : "estrelas selecionadas"}`
            : "Selecione de 1 a 5 estrelas"}
        </p>
      </fieldset>

      <label className="mt-5 block text-sm font-medium text-zinc-300">
        Comentário <span className="font-normal text-zinc-500">(opcional)</span>
        <textarea
          value={comment}
          rows={5}
          maxLength={MAX_REVIEW_COMMENT_LENGTH}
          disabled={isSubmitting}
          placeholder="Conte como foi sua experiência com este vendedor."
          className="mt-2 w-full resize-y rounded-lg border border-zinc-700 bg-[#181B19] px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-[#58C447] focus:ring-1 focus:ring-[#58C447] disabled:cursor-not-allowed disabled:opacity-60"
          onChange={(event) => setComment(event.target.value)}
        />
        <span className="mt-2 block text-right text-xs text-zinc-500">
          {comment.length}/{MAX_REVIEW_COMMENT_LENGTH}
        </span>
      </label>

      {errorMessage && (
        <p
          role="alert"
          aria-live="polite"
          className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300"
        >
          {errorMessage}
        </p>
      )}

      <div className="mt-5 flex flex-wrap justify-end gap-3">
        {currentReview && (
          <button
            type="button"
            disabled={isSubmitting}
            className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-400 transition hover:bg-zinc-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            onClick={cancelEditing}
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-[#58C447] px-5 py-2.5 text-sm font-semibold text-[#111412] transition hover:bg-[#6AD159] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting
            ? currentReview
              ? "Salvando..."
              : "Enviando..."
            : currentReview
              ? "Salvar avaliação"
              : "Enviar avaliação"}
        </button>
      </div>
    </form>
  );
}
