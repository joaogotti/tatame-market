"use client";

import { UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useRef, useState } from "react";

import { LocationAutocomplete } from "@/components/location/LocationAutocomplete/LocationAutocomplete";
import { createClient } from "@/lib/supabase/client";
import type { City } from "@/services/ibge/cities";

const MAX_NAME_LENGTH = 100;
const MAX_BIO_LENGTH = 1000;

function getFormValue(formData: FormData, name: string) {
  const value = formData.get(name);

  return typeof value === "string" ? value.trim() : "";
}

/**
 * Formulário interativo do perfil. A página fornece apenas os valores iniciais;
 * a identidade usada no UPDATE é sempre relida do Supabase Auth no envio.
 */
export function ProfileForm({
  initialName,
  initialBio,
  initialCity,
  email,
}: {
  initialName: string;
  initialBio: string;
  initialCity?: City;
  email: string;
}) {
  const router = useRouter();
  const [supabase] = useState(createClient);
  const isSubmittingRef = useRef(false);
  const [name, setName] = useState(initialName);
  const [bio, setBio] = useState(initialBio);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmittingRef.current) return;

    const formData = new FormData(event.currentTarget);
    const normalizedName = name.trim();
    const normalizedBio = bio.trim();
    const locationIbgeCodeValue = getFormValue(
      formData,
      "locationIbgeCode",
    );
    const locationCity = getFormValue(formData, "locationCity");
    const locationState = getFormValue(formData, "locationState");
    const hasLocation = Boolean(
      locationIbgeCodeValue || locationCity || locationState,
    );
    const locationIbgeCode = hasLocation
      ? Number(locationIbgeCodeValue)
      : null;

    setErrorMessage(null);
    setSuccessMessage(null);

    if (!normalizedName) {
      setErrorMessage("Informe seu nome público.");
      return;
    }

    if (normalizedName.length > MAX_NAME_LENGTH) {
      setErrorMessage(
        `O nome deve ter no máximo ${MAX_NAME_LENGTH} caracteres.`,
      );
      return;
    }

    if (normalizedBio.length > MAX_BIO_LENGTH) {
      setErrorMessage(
        `A bio deve ter no máximo ${MAX_BIO_LENGTH} caracteres.`,
      );
      return;
    }

    if (
      hasLocation &&
      (!locationIbgeCodeValue ||
        !Number.isInteger(locationIbgeCode) ||
        !locationCity ||
        !locationState)
    ) {
      setErrorMessage("Selecione uma cidade válida na lista do IBGE.");
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
        console.error("Falha ao validar usuário ao atualizar perfil.", {
          name: authError.name,
          message: authError.message,
        });
        setErrorMessage("Não foi possível validar sua sessão. Tente novamente.");
        return;
      }

      if (!user) {
        router.push("/login");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .update({
          name: normalizedName,
          bio: normalizedBio || null,
          location_ibge_code: locationIbgeCode,
          location_city: hasLocation ? locationCity : null,
          location_state: hasLocation ? locationState : null,
        })
        .eq("id", user.id)
        .select("id")
        .maybeSingle();

      if (error) {
        console.error("Falha ao atualizar perfil.", {
          userId: user.id,
          code: error.code,
          message: error.message,
        });
        setErrorMessage(
          "Não foi possível salvar seu perfil. Tente novamente em instantes.",
        );
        return;
      }

      if (!data) {
        console.error("Nenhum perfil foi atualizado.", { userId: user.id });
        setErrorMessage(
          "Seu perfil não foi encontrado. Atualize a página e tente novamente.",
        );
        return;
      }

      setName(normalizedName);
      setBio(normalizedBio);
      setSuccessMessage("Perfil atualizado com sucesso.");
      router.refresh();
    } catch (error) {
      console.error("Falha inesperada ao atualizar perfil.", error);
      setErrorMessage(
        "Não foi possível conectar ao serviço de perfis. Tente novamente.",
      );
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  }

  const fieldClassName =
    "mt-2 w-full rounded-lg border border-zinc-700 bg-[#181B19] px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-[#58C447] focus:ring-1 focus:ring-[#58C447] disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <form
      className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-zinc-900"
      aria-busy={isSubmitting}
      onSubmit={handleSubmit}
    >
      <div className="flex items-center gap-4 border-b border-white/10 p-6 sm:p-8">
        <span className="flex size-16 shrink-0 items-center justify-center rounded-full border border-[#58C447]/30 bg-[#58C447]/10 text-[#58C447]">
          <UserRound aria-hidden="true" size={30} />
        </span>
        <div>
          <h2 className="text-xl font-semibold text-white">
            Informações públicas
          </h2>
          <p className="mt-1 text-sm text-zinc-400">
            Estes dados ajudam outros praticantes a identificar você.
          </p>
        </div>
      </div>

      <div className="grid gap-6 p-6 sm:grid-cols-2 sm:p-8">
        <label className="text-sm font-medium text-zinc-300">
          Nome
          <input
            name="name"
            type="text"
            value={name}
            required
            maxLength={MAX_NAME_LENGTH}
            autoComplete="name"
            disabled={isSubmitting}
            placeholder="Seu nome público"
            className={fieldClassName}
            onChange={(event) => setName(event.target.value)}
          />
        </label>

        <label className="text-sm font-medium text-zinc-300">
          E-mail
          <input
            type="email"
            value={email}
            readOnly
            aria-readonly="true"
            className={`${fieldClassName} cursor-not-allowed text-zinc-500`}
          />
        </label>

        <LocationAutocomplete
          initialCity={initialCity}
          required={false}
          disabled={isSubmitting}
        />

        <label className="sm:col-span-2 text-sm font-medium text-zinc-300">
          Bio
          <textarea
            name="bio"
            value={bio}
            rows={6}
            maxLength={MAX_BIO_LENGTH}
            disabled={isSubmitting}
            placeholder="Conte um pouco sobre sua experiência no Jiu-Jitsu."
            className={`${fieldClassName} resize-y`}
            onChange={(event) => setBio(event.target.value)}
          />
          <span className="mt-2 block text-right text-xs text-zinc-500">
            {bio.length}/{MAX_BIO_LENGTH}
          </span>
        </label>

        {errorMessage && (
          <p
            role="alert"
            aria-live="polite"
            className="sm:col-span-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300"
          >
            {errorMessage}
          </p>
        )}

        {successMessage && (
          <p
            role="status"
            aria-live="polite"
            className="sm:col-span-2 rounded-lg border border-[#58C447]/30 bg-[#58C447]/10 px-4 py-3 text-sm text-zinc-200"
          >
            {successMessage}
          </p>
        )}

        <div className="sm:col-span-2 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-[#58C447] px-6 py-3 font-semibold text-[#111412] transition hover:bg-[#6AD159] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#58C447] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Salvando..." : "Salvar alterações"}
          </button>
        </div>
      </div>
    </form>
  );
}
