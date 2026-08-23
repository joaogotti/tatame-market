import { MapPin, UserRound } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { ReviewStars } from "@/components/reviews/ReviewStars/ReviewStars";
import { isAvatarPublicUrl } from "@/lib/profileAvatar";
import type { ReviewSummaryData } from "@/lib/reviews";

export type PublicSeller = {
  id: string;
  name: string;
  avatarUrl: string | null;
  locationCity: string | null;
  locationState: string | null;
  reviewSummary: ReviewSummaryData;
};

export function SellerCard({ seller }: { seller: PublicSeller }) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const safeAvatarUrl =
    seller.avatarUrl &&
    supabaseUrl &&
    isAvatarPublicUrl(seller.avatarUrl, supabaseUrl)
      ? seller.avatarUrl
      : null;
  const location =
    seller.locationCity && seller.locationState
      ? `${seller.locationCity}, ${seller.locationState}`
      : seller.locationCity || seller.locationState;

  return (
    <section className="mt-8 rounded-2xl border border-white/10 bg-zinc-900 p-6 sm:p-8">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
        Vendedor
      </h2>

      <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <div className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#58C447]/30 bg-[#58C447]/10 text-[#58C447]">
            {safeAvatarUrl ? (
              <Image
                src={safeAvatarUrl}
                alt={`Foto de perfil de ${seller.name}`}
                fill
                sizes="64px"
                className="object-cover"
              />
            ) : (
              <UserRound aria-hidden="true" size={28} />
            )}
          </div>

          <div className="min-w-0">
            <p className="truncate text-lg font-semibold text-white">
              {seller.name}
            </p>
            {location && (
              <p className="mt-1 flex items-center gap-1.5 text-sm text-zinc-400">
                <MapPin aria-hidden="true" size={15} />
                {location}
              </p>
            )}
            {seller.reviewSummary.average !== null && (
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-zinc-400">
                <ReviewStars value={seller.reviewSummary.average} />
                <span>
                  {seller.reviewSummary.average.toLocaleString("pt-BR", {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1,
                  })}{" "}
                  ({seller.reviewSummary.count})
                </span>
              </div>
            )}
          </div>
        </div>

        <Link
          href={`/perfil/${encodeURIComponent(seller.id)}`}
          className="inline-flex shrink-0 justify-center rounded-lg bg-[#58C447] px-5 py-3 text-sm font-semibold text-[#111412] transition hover:bg-[#6AD159]"
        >
          Ver perfil do vendedor
        </Link>
      </div>
    </section>
  );
}
