"use client";

import { Camera, UserRound } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { type ChangeEvent, useEffect, useRef, useState } from "react";

import {
  AVATARS_BUCKET,
  createAvatarStoragePath,
  getOwnedAvatarStoragePath,
  isAvatarPublicUrl,
  validateAvatarFile,
} from "@/lib/profileAvatar";
import { createClient } from "@/lib/supabase/client";

export function ProfileAvatar({
  initialAvatarUrl,
  name,
}: {
  initialAvatarUrl: string | null;
  name: string;
}) {
  const router = useRouter();
  const [supabase] = useState(createClient);
  const inputRef = useRef<HTMLInputElement>(null);
  const isOperatingRef = useRef(false);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isOperating, setIsOperating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function clearSelection() {
    setSelectedFile(null);
    setPreviewUrl(null);

    if (inputRef.current) inputRef.current.value = "";
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    setErrorMessage(null);
    setStatusMessage(null);

    if (!file) {
      clearSelection();
      return;
    }

    const validationError = validateAvatarFile(file);

    if (validationError) {
      clearSelection();
      setErrorMessage(validationError);
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  async function getAuthenticatedUser() {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error && error.name !== "AuthSessionMissingError") {
      console.error("Falha ao validar usuário na operação de avatar.", {
        name: error.name,
        message: error.message,
      });
      throw new Error("Não foi possível validar sua sessão. Tente novamente.");
    }

    if (!user) {
      router.push("/login");
      return null;
    }

    return user;
  }

  async function handleUpload() {
    if (!selectedFile || isOperatingRef.current) return;

    const validationError = validateAvatarFile(selectedFile);

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    isOperatingRef.current = true;
    setIsOperating(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const user = await getAuthenticatedUser();
      if (!user) return;

      const storagePath = createAvatarStoragePath(user.id, selectedFile);
      const { error: uploadError } = await supabase.storage
        .from(AVATARS_BUCKET)
        .upload(storagePath, selectedFile, {
          cacheControl: "3600",
          contentType: selectedFile.type,
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const publicUrl = supabase.storage
        .from(AVATARS_BUCKET)
        .getPublicUrl(storagePath).data.publicUrl;
      const { data, error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id)
        .select("id")
        .maybeSingle();

      if (updateError || !data) {
        const { error: rollbackError } = await supabase.storage
          .from(AVATARS_BUCKET)
          .remove([storagePath]);

        if (rollbackError) {
          console.error("Falha ao remover novo avatar após erro no perfil.", {
            path: storagePath,
            message: rollbackError.message,
          });
        }

        throw updateError ?? new Error("Nenhum perfil foi atualizado.");
      }

      const previousAvatarUrl = avatarUrl;
      setAvatarUrl(publicUrl);
      clearSelection();
      setStatusMessage(
        previousAvatarUrl
          ? "Foto de perfil trocada com sucesso."
          : "Foto de perfil adicionada com sucesso.",
      );
      router.refresh();

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const previousPath =
        previousAvatarUrl && supabaseUrl
          ? getOwnedAvatarStoragePath(previousAvatarUrl, user.id, supabaseUrl)
          : null;

      if (previousPath && previousPath !== storagePath) {
        const { error: cleanupError } = await supabase.storage
          .from(AVATARS_BUCKET)
          .remove([previousPath]);

        if (cleanupError) {
          console.error("Falha ao remover o avatar anterior.", {
            path: previousPath,
            message: cleanupError.message,
          });
        }
      }
    } catch (error) {
      console.error("Falha ao salvar avatar.", error);
      setErrorMessage(
        "Não foi possível salvar sua foto. Tente novamente em instantes.",
      );
    } finally {
      isOperatingRef.current = false;
      setIsOperating(false);
    }
  }

  async function handleRemove() {
    if (!avatarUrl || isOperatingRef.current) return;

    if (!window.confirm("Deseja remover sua foto de perfil?")) return;

    isOperatingRef.current = true;
    setIsOperating(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const user = await getAuthenticatedUser();
      if (!user) return;

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const storagePath = supabaseUrl
        ? getOwnedAvatarStoragePath(avatarUrl, user.id, supabaseUrl)
        : null;
      const { data, error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: null })
        .eq("id", user.id)
        .select("id")
        .maybeSingle();

      if (updateError) throw updateError;
      if (!data) throw new Error("Nenhum perfil foi atualizado.");

      setAvatarUrl(null);
      clearSelection();
      setStatusMessage("Foto de perfil removida com sucesso.");
      router.refresh();

      if (storagePath) {
        const { error: removeError } = await supabase.storage
          .from(AVATARS_BUCKET)
          .remove([storagePath]);

        if (removeError) {
          console.error("Falha ao remover o arquivo do avatar.", {
            path: storagePath,
            message: removeError.message,
          });
        }
      } else {
        console.warn(
          "Avatar removido do perfil sem excluir arquivo: URL não pertence com segurança ao usuário autenticado.",
        );
      }
    } catch (error) {
      console.error("Falha ao remover avatar.", error);
      setErrorMessage(
        "Não foi possível remover sua foto. Tente novamente em instantes.",
      );
    } finally {
      isOperatingRef.current = false;
      setIsOperating(false);
    }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const currentAvatarUrl =
    avatarUrl && supabaseUrl && isAvatarPublicUrl(avatarUrl, supabaseUrl)
      ? avatarUrl
      : null;
  const displayedAvatarUrl = previewUrl ?? currentAvatarUrl;
  const avatarAlt = previewUrl
    ? "Prévia da nova foto de perfil"
    : `Foto de perfil de ${name}`;

  return (
    <section
      className="mt-8 rounded-2xl border border-white/10 bg-zinc-900 p-6 sm:p-8"
      aria-busy={isOperating}
    >
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <div className="relative flex size-28 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#58C447]/30 bg-[#58C447]/10 text-[#58C447]">
          {displayedAvatarUrl ? (
            <Image
              src={displayedAvatarUrl}
              alt={avatarAlt}
              fill
              sizes="112px"
              className="object-cover"
              unoptimized={Boolean(previewUrl)}
            />
          ) : (
            <UserRound aria-hidden="true" size={48} />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-semibold text-white">Foto de perfil</h2>
          <p className="mt-1 text-sm text-zinc-400">
            JPG, PNG ou WebP. Máximo 5 MB.
          </p>

          <div className="mt-4 flex flex-wrap gap-3">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-800 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[#58C447] has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60">
              <Camera aria-hidden="true" size={17} />
              {avatarUrl ? "Trocar foto" : "Escolher foto"}
              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={isOperating}
                className="sr-only"
                onChange={handleFileChange}
              />
            </label>

            {selectedFile && (
              <button
                type="button"
                disabled={isOperating}
                className="rounded-lg bg-[#58C447] px-4 py-2 text-sm font-semibold text-[#111412] transition hover:bg-[#6AD159] disabled:cursor-not-allowed disabled:opacity-60"
                onClick={handleUpload}
              >
                {isOperating ? "Enviando..." : "Salvar foto"}
              </button>
            )}

            {avatarUrl && !selectedFile && (
              <button
                type="button"
                disabled={isOperating}
                className="rounded-lg px-4 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={handleRemove}
              >
                {isOperating ? "Removendo..." : "Remover foto"}
              </button>
            )}

            {selectedFile && !isOperating && (
              <button
                type="button"
                className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
                onClick={clearSelection}
              >
                Cancelar
              </button>
            )}
          </div>
        </div>
      </div>

      {errorMessage && (
        <p
          role="alert"
          aria-live="polite"
          className="mt-5 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300"
        >
          {errorMessage}
        </p>
      )}

      {statusMessage && (
        <p
          role="status"
          aria-live="polite"
          className="mt-5 rounded-lg border border-[#58C447]/30 bg-[#58C447]/10 px-4 py-3 text-sm text-zinc-200"
        >
          {statusMessage}
        </p>
      )}
    </section>
  );
}
