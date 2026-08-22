import { AuthHeaderActions } from "@/components/auth/AuthHeaderActions/AuthHeaderActions";
import { isAvatarPublicUrl } from "@/lib/profileAvatar";
import { createClient } from "@/lib/supabase/server";

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
    <header className="h-16 border-b border-zinc-800 bg-[#111412] px-6 flex items-center gap-8">
      <h1 className="text-xl font-bold text-[#F5F5F5] whitespace-nowrap">
        Tatame Market
      </h1>

      <div className="flex-1 max-w-xl">
        <input
          type="text"
          placeholder="Buscar no Tatame Market..."
          className="w-full rounded-lg border border-zinc-700 bg-[#181B19] px-4 py-2 text-[#F5F5F5] outline-none placeholder:text-[#777A78] focus:border-zinc-500"
        />
      </div>

      <AuthHeaderActions profile={profile} />
    </header>
  );
}
