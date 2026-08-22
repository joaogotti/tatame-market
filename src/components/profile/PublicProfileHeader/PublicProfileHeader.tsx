import { CalendarDays, MapPin, UserRound } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { isAvatarPublicUrl } from "@/lib/profileAvatar";

function formatMemberSince(createdAt: string) {
  const date = new Date(createdAt);

  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function PublicProfileHeader({
  name,
  avatarUrl,
  bio,
  locationCity,
  locationState,
  createdAt,
  isOwnProfile,
}: {
  name: string;
  avatarUrl: string | null;
  bio: string | null;
  locationCity: string | null;
  locationState: string | null;
  createdAt: string;
  isOwnProfile: boolean;
}) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const safeAvatarUrl =
    avatarUrl && supabaseUrl && isAvatarPublicUrl(avatarUrl, supabaseUrl)
      ? avatarUrl
      : null;
  const location =
    locationCity && locationState
      ? `${locationCity}, ${locationState}`
      : locationCity || locationState;
  const memberSince = formatMemberSince(createdAt);

  return (
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900">
      <div className="h-24 bg-gradient-to-r from-[#58C447]/25 via-[#58C447]/10 to-transparent sm:h-32" />

      <div className="px-6 pb-7 sm:px-8 sm:pb-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-end">
            <div className="relative -mt-12 flex size-28 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-zinc-900 bg-[#182119] text-[#58C447] shadow-xl sm:-mt-14 sm:size-32">
              {safeAvatarUrl ? (
                <Image
                  src={safeAvatarUrl}
                  alt={`Foto de perfil de ${name}`}
                  fill
                  sizes="128px"
                  className="object-cover"
                />
              ) : (
                <UserRound aria-hidden="true" size={52} strokeWidth={1.5} />
              )}
            </div>

            <div className="min-w-0 pb-1">
              <p className="text-sm font-medium text-[#58C447]">
                Perfil do vendedor
              </p>
              <h1 className="mt-1 truncate text-3xl font-bold text-white sm:text-4xl">
                {name}
              </h1>

              {(location || memberSince) && (
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-zinc-400">
                  {location && (
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin aria-hidden="true" size={16} />
                      {location}
                    </span>
                  )}
                  {memberSince && (
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays aria-hidden="true" size={16} />
                      Membro desde {memberSince}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {isOwnProfile && (
            <Link
              href="/perfil"
              className="inline-flex shrink-0 self-start rounded-lg border border-[#58C447]/30 px-4 py-2 text-sm font-medium text-[#58C447] transition hover:border-[#58C447]/60 hover:text-[#6AD159] sm:self-auto"
            >
              Editar meu perfil
            </Link>
          )}
        </div>

        {bio && (
          <div className="mt-7 border-t border-white/10 pt-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
              Sobre
            </h2>
            <p className="mt-3 max-w-3xl whitespace-pre-wrap leading-7 text-zinc-300">
              {bio}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
