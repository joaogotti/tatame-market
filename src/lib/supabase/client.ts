import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase Browser Client
 *
 * Cria o cliente do Supabase usado em componentes
 * executados no navegador.
 *
 * Esse cliente será utilizado futuramente em ações como:
 * - login;
 * - cadastro;
 * - logout;
 * - interações autenticadas no lado do cliente.
 *
 * As credenciais utilizadas aqui são públicas e vêm
 * das variáveis de ambiente do projeto.
 *
 * IMPORTANTE:
 * Nunca utilizar a chave secreta do Supabase neste arquivo.
 */

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabasePublishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error(
      "As variáveis de ambiente do Supabase não estão configuradas."
    );
  }

  return createBrowserClient(
    supabaseUrl,
    supabasePublishableKey
  );
}