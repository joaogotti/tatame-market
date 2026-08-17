import Link from "next/link";

export function Header() {
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

      <Link
        href="/anunciar"
        className="ml-auto rounded-lg bg-[#F5F5F5] px-5 py-2 font-semibold text-[#111412] transition hover:bg-[#DADADA]"
      >
        + Anunciar
      </Link>
    </header>
  );
}