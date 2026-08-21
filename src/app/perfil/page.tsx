import { redirect } from "next/navigation";

import { ProfileForm } from "@/components/profile/ProfileForm/ProfileForm";
import { createClient } from "@/lib/supabase/server";
import type { City } from "@/services/ibge/cities";

type DatabaseProfile = {
  name: string;
  bio: string | null;
  location_ibge_code: string | number | null;
  location_city: string | null;
  location_state: string | null;
};

function getInitialCity(profile: DatabaseProfile): City | undefined {
  if (
    profile.location_ibge_code === null ||
    !profile.location_city ||
    !profile.location_state
  ) {
    return undefined;
  }

  const ibgeCode = Number(profile.location_ibge_code);

  if (!Number.isInteger(ibgeCode)) return undefined;

  return {
    ibgeCode,
    city: profile.location_city,
    state: profile.location_state,
  };
}

/**
 * Página protegida do perfil. Autentica e carrega os dados no servidor; apenas
 * a edição interativa é delegada ao componente cliente.
 */
export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError && authError.name !== "AuthSessionMissingError") {
    console.error("Falha ao validar usuário na página de perfil.", {
      name: authError.name,
      message: authError.message,
    });
    throw new Error("Não foi possível validar sua sessão.");
  }

  if (!user) {
    redirect("/login");
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("name,bio,location_ibge_code,location_city,location_state")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Falha ao carregar perfil.", {
      userId: user.id,
      code: error.code,
      message: error.message,
    });
    throw new Error("Não foi possível carregar seu perfil.");
  }

  const profile = data as DatabaseProfile | null;

  if (!profile) {
    console.error("Perfil do usuário autenticado não foi encontrado.", {
      userId: user.id,
    });
    throw new Error("Seu perfil não foi encontrado.");
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-10">
      <header>
        <span className="text-sm font-medium text-[#58C447]">Sua conta</span>
        <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">
          Meu perfil
        </h1>
        <p className="mt-3 text-zinc-400">
          Gerencie suas informações públicas no Tatame Market.
        </p>
      </header>

      <ProfileForm
        initialName={profile.name}
        initialBio={profile.bio ?? ""}
        initialCity={getInitialCity(profile)}
        email={user.email ?? "E-mail indisponível"}
      />
    </div>
  );
}
