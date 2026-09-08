"use client";

import type { User } from "@supabase/supabase-js";
import { Bell, LogOut, UserRound } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { MessageNotificationIndicator } from "@/components/messages/MessageNotificationIndicator/MessageNotificationIndicator";

import { createClient } from "@/lib/supabase/client";

type HeaderProfile = {
  userId: string;
  name: string;
  avatarUrl: string | null;
};

function HeaderNotifications() {
  return (
    <Link href="/mensagens" aria-label="Notificações de mensagens" className="market-notifications">
      <Bell size={19} strokeWidth={1.7} aria-hidden="true" />
      <span className="market-notification-dot">
        <Suspense fallback={null}><MessageNotificationIndicator /></Suspense>
      </span>
    </Link>
  );
}

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
        className="market-auth"
      >
        <span className="h-9 w-16 animate-pulse rounded-lg bg-zinc-800 motion-reduce:animate-none sm:w-28" />
        <HeaderNotifications />
        <span className="h-9 w-9 animate-pulse rounded-lg bg-zinc-800 motion-reduce:animate-none sm:w-20" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="market-auth">
        <Link
          href="/login"
          className="market-login"
        >
          Entrar
        </Link>
        <Link
          href="/login"
          className="market-create market-header-create"
        >
          + <span className="market-create-label">Criar anúncio</span><span className="market-create-short">Anunciar</span>
        </Link>
        <HeaderNotifications />
      </div>
    );
  }

  const displayName = getDisplayName(user, profile);
  const avatarUrl = profile?.userId === user.id ? profile.avatarUrl : null;

  return (
    <div className="market-auth">
      <Link href="/anunciar" className="market-create market-header-create">
        + <span className="market-create-label">Criar anúncio</span><span className="market-create-short">Anunciar</span>
      </Link>
      <HeaderNotifications />
      <div className="market-account">
        <Link
          href="/perfil"
          className="market-profile"
          aria-label={`Meu perfil: ${displayName}`}
          title={user.email}
        >
          <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#58C447]/30 bg-[#58C447]/10 text-[#58C447]">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt=""
                width={36}
                height={36}
                sizes="36px"
                className="size-9 object-cover"
              />
            ) : (
              <UserRound aria-hidden="true" size={18} />
            )}
          </span>
          <span className="market-profile-name">
            {displayName}
          </span>
        </Link>

        <button
          type="button"
          disabled={isSigningOut}
          className="market-logout"
          aria-label={isSigningOut ? "Saindo..." : "Sair"}
          onClick={handleSignOut}
        >
          <LogOut aria-hidden="true" size={16} />
          <span>{isSigningOut ? "Saindo..." : "Sair"}</span>
        </button>
      </div>

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
