import { MessageSquareText, UserRound } from "lucide-react";
import Image from "next/image";

import { ReviewStars } from "@/components/reviews/ReviewStars/ReviewStars";
import { isAvatarPublicUrl } from "@/lib/profileAvatar";
import type { PublicReview } from "@/lib/reviews";

function formatReviewDate(createdAt: string) {
  const date = new Date(createdAt);

  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function ReviewList({ reviews }: { reviews: PublicReview[] }) {
  if (reviews.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-zinc-900 px-6 py-10 text-center">
        <MessageSquareText
          aria-hidden="true"
          size={38}
          strokeWidth={1.5}
          className="mx-auto text-zinc-600"
        />
        <p className="mt-3 text-sm text-zinc-400">
          Este vendedor ainda não recebeu avaliações.
        </p>
      </div>
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  return (
    <div className="space-y-4">
      {reviews.map((review) => {
        const authorName = review.author?.name || "Usuário do Tatame Market";
        const avatarUrl = review.author?.avatarUrl;
        const safeAvatarUrl =
          avatarUrl &&
          supabaseUrl &&
          isAvatarPublicUrl(avatarUrl, supabaseUrl)
            ? avatarUrl
            : null;
        const reviewDate = formatReviewDate(review.createdAt);

        return (
          <article
            key={review.id}
            className="rounded-2xl border border-white/10 bg-zinc-900 p-5 sm:p-6"
          >
            <div className="flex items-start gap-4">
              <div className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#58C447]/25 bg-[#58C447]/10 text-[#58C447]">
                {safeAvatarUrl ? (
                  <Image
                    src={safeAvatarUrl}
                    alt={`Foto de perfil de ${authorName}`}
                    fill
                    sizes="44px"
                    className="object-cover"
                  />
                ) : (
                  <UserRound aria-hidden="true" size={20} />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-white">{authorName}</h3>
                    <div className="mt-1">
                      <ReviewStars value={review.rating} />
                    </div>
                  </div>
                  {reviewDate && (
                    <time
                      dateTime={review.createdAt}
                      className="text-xs text-zinc-500"
                    >
                      {reviewDate}
                    </time>
                  )}
                </div>

                {review.comment && (
                  <p className="mt-4 whitespace-pre-wrap leading-7 text-zinc-300">
                    {review.comment}
                  </p>
                )}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
