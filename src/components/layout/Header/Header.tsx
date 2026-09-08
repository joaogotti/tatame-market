import { AuthHeaderActions } from "@/components/auth/AuthHeaderActions/AuthHeaderActions";
import { isAvatarPublicUrl } from "@/lib/profileAvatar";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Suspense } from "react";
import { Navigation } from "@/components/layout/Navigation/Navigation";

type HeaderProfile = {
  userId: string;
  name: string;
  avatarUrl: string | null;
};

/**
 * Estrutura visual principal do Header.
 * As ações que dependem da sessão ficam isoladas em um Client Component para
 * preservar o restante deste componente como apresentação estática.
 */

export async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  let profile: HeaderProfile | null = null;

  if (authError && authError.name !== "AuthSessionMissingError") {
    console.error("Falha ao validar usuário no Header.", {
      name: authError.name,
      message: authError.message,
    });
  }

  if (user) {
    const { data, error } = await supabase
      .from("profiles")
      .select("name,avatar_url")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      // O Header continua utilizável com o fallback do Auth mesmo se a leitura
      // do perfil falhar temporariamente.
      console.error("Falha ao carregar nome público no Header.", {
        userId: user.id,
        code: error.code,
        message: error.message,
      });
    } else if (data && typeof data.name === "string" && data.name.trim()) {
      const avatarUrl =
        typeof data.avatar_url === "string" ? data.avatar_url.trim() : "";
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

      profile = {
        userId: user.id,
        name: data.name.trim(),
        avatarUrl:
          avatarUrl && supabaseUrl && isAvatarPublicUrl(avatarUrl, supabaseUrl)
            ? avatarUrl
            : null,
      };
    }
  }

  return (
    <header className="market-header">
      <div className="market-header-inner">
        <Link href="/" aria-label="Tatame Market — início" className="market-brand">
          <span>Tatame<span className="text-[#58C447]">.</span></span>
          <span className="market-brand-subtitle">Market</span>
        </Link>
        <Suspense fallback={null}><Navigation variant="header" /></Suspense>
        <AuthHeaderActions profile={profile} />
      </div>
    </header>
  );
}
