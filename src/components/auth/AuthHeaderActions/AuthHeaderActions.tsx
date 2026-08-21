"use client";

import type { User } from "@supabase/supabase-js";
import { LogOut, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";

type HeaderProfile = {
  userId: string;
  name: string;
};

function getDisplayName(user: User, profile: HeaderProfile | null) {
  if (profile?.userId === user.id && profile.name.trim()) {
    return profile.name.trim();
  }

  const metadataName = user.user_metadata?.name;

  if (typeof metadataName === "string" && metadataName.trim()) {
    return metadataName.trim();
  }

  if (user.email) {
    return user.email.split("@")[0];
  }

  return "Minha conta";
}

/**
 * Ações de autenticação exibidas no Header.
 * Este é o único listener global de sessão: a leitura inicial valida o usuário
 * atual e os eventos seguintes mantêm a interface sincronizada com o Supabase.
 */
export function AuthHeaderActions({
  profile,
}: {
  profile: HeaderProfile | null;
}) {
  const router = useRouter();
  const [supabase] = useState(createClient);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;

      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    supabase.auth
      .getUser()
      .then(({ data, error }) => {
        if (!isMounted) return;

        setUser(error ? null : data.user);
        setIsLoading(false);
      })
      .catch(() => {
        if (!isMounted) return;

        setUser(null);
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  async function handleSignOut() {
    setIsSigningOut(true);
    setLogoutError(null);

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        setLogoutError("Não foi possível sair. Tente novamente.");
        return;
      }

      setUser(null);
      router.replace("/");
      router.refresh();
    } catch {
      setLogoutError("Não foi possível sair. Tente novamente.");
    } finally {
      setIsSigningOut(false);
    }
  }

  if (isLoading) {
    return (
      <div
        aria-label="Verificando autenticação"
        className="ml-auto flex items-center gap-3"
      >
        <span className="h-9 w-20 animate-pulse rounded-lg bg-zinc-800 motion-reduce:animate-none" />
        <span className="h-10 w-28 animate-pulse rounded-lg bg-zinc-800 motion-reduce:animate-none" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="ml-auto flex items-center gap-3">
        <Link
          href="/login"
          className="rounded-lg px-4 py-2 font-medium text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
        >
          Entrar
        </Link>
        <Link
          href="/login"
          className="rounded-lg bg-[#F5F5F5] px-5 py-2 font-semibold text-[#111412] transition hover:bg-[#DADADA]"
        >
          + Anunciar
        </Link>
      </div>
    );
  }

  const displayName = getDisplayName(user, profile);

  return (
    <div className="relative ml-auto flex items-center gap-3">
      <Link
        href="/perfil"
        className="flex min-w-0 items-center gap-2 rounded-lg px-2 py-1 text-zinc-200 transition hover:bg-zinc-800 hover:text-white"
        title={user.email}
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-[#58C447]/30 bg-[#58C447]/10 text-[#58C447]">
          <UserRound aria-hidden="true" size={18} />
        </span>
        <span className="max-w-36 truncate text-sm font-medium">
          {displayName}
        </span>
      </Link>

      <button
        type="button"
        disabled={isSigningOut}
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-zinc-400 transition hover:bg-zinc-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
        onClick={handleSignOut}
      >
        <LogOut aria-hidden="true" size={16} />
        {isSigningOut ? "Saindo..." : "Sair"}
      </button>

      <Link
        href="/anunciar"
        className="rounded-lg bg-[#F5F5F5] px-5 py-2 font-semibold text-[#111412] transition hover:bg-[#DADADA]"
      >
        + Anunciar
      </Link>

      {logoutError && (
        <p
          role="alert"
          className="absolute right-0 top-full z-30 mt-2 w-64 rounded-lg border border-red-500/20 bg-zinc-900 px-3 py-2 text-sm text-red-300 shadow-xl"
        >
          {logoutError}
        </p>
      )}
    </div>
  );
}
