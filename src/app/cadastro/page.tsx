import { SignUpForm } from "@/components/auth/SignUpForm/SignUpForm";

/**
 * Página de composição do cadastro.
 * Reutiliza a camada visual do login sem alterar o layout global ou as demais
 * rotas do marketplace.
 */
export default function SignUpPage() {
  return (
    <div className="fixed inset-0 z-50 flex min-h-svh items-center justify-center overflow-y-auto bg-[#0A0A0A] px-6 py-10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute h-72 w-72 rounded-full bg-[#58C447]/10 blur-3xl"
      />

      <div className="relative z-10 flex w-full justify-center">
        <SignUpForm />
      </div>
    </div>
  );
}
