import { CreateProductForm } from "@/components/products/CreateProductForm/CreateProductForm";

/**
 * Página de composição da criação de anúncios.
 * Permanece como Server Component; a persistência será adicionada ao formulário
 * quando o projeto estiver conectado ao backend/Supabase.
 */
export default function CreateProductPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-10">
      <header>
        <span className="text-sm font-medium text-[#58C447]">
          Novo anúncio
        </span>
        <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">
          Anuncie seu equipamento
        </h1>
        <p className="mt-3 max-w-2xl text-zinc-400">
          Preencha as informações abaixo para preparar seu anúncio no Tatame
          Market.
        </p>
      </header>

      <CreateProductForm />
    </div>
  );
}
