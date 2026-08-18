"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { createClient } from "@/lib/supabase/client";

function getFriendlyAuthError(message: string) {
  if (message === "Invalid login credentials") {
    return "E-mail ou senha incorretos.";
  }

  if (message === "Email not confirmed") {
    return "Confirme seu e-mail antes de entrar.";
  }

  return "Não foi possível entrar agora. Tente novamente em instantes.";
}

/**
 * Formulário interativo responsável pelo login com e-mail e senha.
 * A sessão é criada pelo cliente compartilhado do Supabase e, após o sucesso,
 * a Home é atualizada para que Server Components possam ler os novos cookies.
 */
export function LoginForm() {
  const router = useRouter();
  const [supabase] = useState(createClient);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    const normalizedEmail = email.trim();

    if (!normalizedEmail || !password) {
      setErrorMessage("Preencha o e-mail e a senha para continuar.");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error) {
        setErrorMessage(getFriendlyAuthError(error.message));
        return;
      }

      router.replace("/");
      router.refresh();
    } catch {
      setErrorMessage(
        "Não foi possível conectar ao serviço de autenticação. Tente novamente.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-900 p-6 shadow-2xl sm:p-8">
      <div className="mb-8 text-center">
        <span className="text-sm font-semibold text-[#58C447]">
          Tatame Market
        </span>
        <h1 className="mt-2 text-3xl font-bold text-white">Entre na sua conta</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Acesse sua conta para continuar no marketplace.
        </p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <label className="block text-sm font-medium text-zinc-300">
          E-mail
          <input
            type="email"
            name="email"
            value={email}
            required
            autoComplete="email"
            disabled={isLoading}
            placeholder="seu@email.com"
            className="mt-2 w-full rounded-lg border border-zinc-700 bg-[#181B19] px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-[#58C447] focus:ring-1 focus:ring-[#58C447] disabled:cursor-not-allowed disabled:opacity-60"
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>

        <label className="block text-sm font-medium text-zinc-300">
          Senha
          <input
            type="password"
            name="password"
            value={password}
            required
            autoComplete="current-password"
            disabled={isLoading}
            placeholder="Digite sua senha"
            className="mt-2 w-full rounded-lg border border-zinc-700 bg-[#181B19] px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-[#58C447] focus:ring-1 focus:ring-[#58C447] disabled:cursor-not-allowed disabled:opacity-60"
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>

        {errorMessage && (
          <p
            role="alert"
            aria-live="polite"
            className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300"
          >
            {errorMessage}
          </p>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-lg bg-[#58C447] px-5 py-3 font-semibold text-[#111412] transition hover:bg-[#6AD159] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#58C447] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-400">
        Ainda não tem uma conta?{" "}
        <Link
          href="/cadastro"
          className="font-semibold text-[#58C447] transition hover:text-[#6AD159]"
        >
          Cadastre-se
        </Link>
      </p>
    </section>
  );
}
