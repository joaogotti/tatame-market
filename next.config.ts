import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseRemotePatterns: NonNullable<
  NonNullable<NextConfig["images"]>["remotePatterns"]
> = [];

if (supabaseUrl) {
  const parsedSupabaseUrl = new URL(supabaseUrl);

  if (
    parsedSupabaseUrl.protocol !== "https:" &&
    parsedSupabaseUrl.protocol !== "http:"
  ) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL possui um protocolo inválido.");
  }

  supabaseRemotePatterns.push({
    protocol: parsedSupabaseUrl.protocol === "https:" ? "https" : "http",
    hostname: parsedSupabaseUrl.hostname,
    port: parsedSupabaseUrl.port,
    pathname: "/storage/v1/object/public/product-images/**",
    search: "",
  });
}

const nextConfig: NextConfig = {
  images: {
    // Restringe o otimizador ao caminho público do bucket deste projeto.
    remotePatterns: supabaseRemotePatterns,
  },
};

export default nextConfig;
