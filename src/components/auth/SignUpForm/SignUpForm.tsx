"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";

import { createClient } from "@/lib/supabase/client";

const MIN_PASSWORD_LENGTH = 8;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getFriendlySignUpError(message: string) {
  if (message === "User already registered") {
    return "Já existe uma conta cadastrada com este e-mail.";
  }

  if (message.toLowerCase().includes("password")) {
    return `A senha deve possuir pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`;
  }

  if (message.toLowerCase().includes("rate limit")) {
    return "Muitas tentativas foram realizadas. Aguarde um pouco e tente novamente.";
  }

  return "Não foi possível criar sua conta agora. Tente novamente em instantes.";
}

/**
 * Formulário interativo de cadastro com Supabase Auth.
 * O nome é salvo inicialmente em user metadata; uma tabela `profiles` poderá
 * complementar esses dados quando o domínio de usuários for implementado.
 */
export function SignUpForm() {
  const [supabase] = useState(createClient);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    const normalizedName = name.trim();
    const normalizedEmail = email.trim();

    if (!normalizedName || !normalizedEmail || !password || !passwordConfirmation) {
      setErrorMessage("Preencha todos os campos para criar sua conta.");
      return;
    }

    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      setErrorMessage("Informe um endereço de e-mail válido.");
      return;
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      setErrorMessage(
        `A senha deve possuir pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`,
      );
      return;
    }

    if (password !== passwordConfirmation) {
      setErrorMessage("A senha e a confirmação precisam ser iguais.");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            name: normalizedName,
          },
        },
      });

      if (error) {
        setErrorMessage(getFriendlySignUpError(error.message));
        return;
      }

      setPassword("");
      setPasswordConfirmation("");
      setIsSuccess(true);
    } catch {
      setErrorMessage(
        "Não foi possível conectar ao serviço de autenticação. Tente novamente.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  if (isSuccess) {
    return (
      <section className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-900 p-6 text-center shadow-2xl sm:p-8">
        <span className="text-sm font-semibold text-[#58C447]">
          Tatame Market
        </span>
        <h1 className="mt-2 text-3xl font-bold text-white">Conta criada</h1>
        <div
          role="status"
          className="mt-6 rounded-xl border border-[#58C447]/30 bg-[#58C447]/10 px-5 py-4 text-sm leading-6 text-zinc-200"
        >
          Enviamos uma confirmação para <strong>{email.trim()}</strong>. Verifique
          sua caixa de entrada e confirme o e-mail antes de entrar.
        </div>
        <Link
          href="/login"
          className="mt-6 inline-flex rounded-lg bg-[#58C447] px-5 py-3 font-semibold text-[#111412] transition hover:bg-[#6AD159] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#58C447]"
        >
          Ir para o login
        </Link>
      </section>
    );
  }

  return (
    <section className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-900 p-6 shadow-2xl sm:p-8">
      <div className="mb-8 text-center">
        <span className="text-sm font-semibold text-[#58C447]">
          Tatame Market
        </span>
        <h1 className="mt-2 text-3xl font-bold text-white">Crie sua conta</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Cadastre-se para começar a usar o marketplace.
        </p>
      </div>

      <form className="space-y-5" noValidate onSubmit={handleSubmit}>
        <label className="block text-sm font-medium text-zinc-300">
          Nome
          <input
            type="text"
            name="name"
            value={name}
            required
            autoComplete="name"
            disabled={isLoading}
            placeholder="Seu nome"
            className="mt-2 w-full rounded-lg border border-zinc-700 bg-[#181B19] px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-[#58C447] focus:ring-1 focus:ring-[#58C447] disabled:cursor-not-allowed disabled:opacity-60"
            onChange={(event) => setName(event.target.value)}
          />
        </label>

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
            minLength={MIN_PASSWORD_LENGTH}
            autoComplete="new-password"
            disabled={isLoading}
            placeholder={`Mínimo de ${MIN_PASSWORD_LENGTH} caracteres`}
            className="mt-2 w-full rounded-lg border border-zinc-700 bg-[#181B19] px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-[#58C447] focus:ring-1 focus:ring-[#58C447] disabled:cursor-not-allowed disabled:opacity-60"
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>

        <label className="block text-sm font-medium text-zinc-300">
          Confirmar senha
          <input
            type="password"
            name="passwordConfirmation"
            value={passwordConfirmation}
            required
            minLength={MIN_PASSWORD_LENGTH}
            autoComplete="new-password"
            disabled={isLoading}
            placeholder="Digite a senha novamente"
            className="mt-2 w-full rounded-lg border border-zinc-700 bg-[#181B19] px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-[#58C447] focus:ring-1 focus:ring-[#58C447] disabled:cursor-not-allowed disabled:opacity-60"
            onChange={(event) => setPasswordConfirmation(event.target.value)}
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
          {isLoading ? "Criando conta..." : "Criar conta"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-400">
        Já possui uma conta?{" "}
        <Link
          href="/login"
          className="font-semibold text-[#58C447] transition hover:text-[#6AD159]"
        >
          Entrar
        </Link>
      </p>
    </section>
  );
}
