import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Supabase Server Client
 *
 * Cria o cliente do Supabase utilizado em:
 * - Server Components;
 * - Server Actions;
 * - Route Handlers;
 * - leitura da sessão autenticada no servidor.
 *
 * Os cookies da sessão são lidos pelo Next.js
 * e repassados ao Supabase.
 *
 * IMPORTANTE:
 * Este arquivo utiliza apenas a chave publicável.
 * A chave secreta do Supabase não deve ser usada aqui.
 */

export async function createClient() {
  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabasePublishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error(
      "As variáveis de ambiente do Supabase não estão configuradas."
    );
  }

  return createServerClient(
    supabaseUrl,
    supabasePublishableKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },

        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(
              ({ name, value, options }) => {
                cookieStore.set(name, value, options);
              }
            );
          } catch {
            /*
             * Em alguns Server Components o Next.js
             * não permite alterar cookies diretamente.
             *
             * Isso é esperado.
             * A atualização da sessão será tratada
             * posteriormente pela camada de proxy/middleware.
             */
          }
        },
      },
    }
  );
}