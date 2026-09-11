import { createClient } from "@supabase/supabase-js";

function json(body: { ok: boolean; error?: string }, status: number) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return json({ ok: false, error: "Serviço não configurado." }, 503);
  }

  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return json({ ok: false, error: "Não autorizado." }, 401);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    return json({ ok: false, error: "Serviço não configurado." }, 503);
  }

  try {
    const supabase = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      global: {
        fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
      },
    });
    const { error } = await supabase
      .from("products")
      .select("id")
      .eq("status", "active")
      .limit(1)
      .abortSignal(AbortSignal.timeout(10000));

    if (error) {
      return json({ ok: false, error: "Serviço temporariamente indisponível." }, 503);
    }

    return json({ ok: true }, 200);
  } catch {
    return json({ ok: false, error: "Serviço temporariamente indisponível." }, 503);
  }
}
