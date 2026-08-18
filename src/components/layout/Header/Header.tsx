import { AuthHeaderActions } from "@/components/auth/AuthHeaderActions/AuthHeaderActions";

/**
 * Estrutura visual principal do Header.
 * As ações que dependem da sessão ficam isoladas em um Client Component para
 * preservar o restante deste componente como apresentação estática.
 */

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

      <AuthHeaderActions />
    </header>
  );
}
