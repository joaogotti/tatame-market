import Link from "next/link";

type ReviewPaginationProps = {
  sellerId: string;
  page: number;
  totalPages: number;
};

export function ReviewPagination({
  sellerId,
  page,
  totalPages,
}: ReviewPaginationProps) {
  if (totalPages <= 1) return null;

  const firstPage = Math.max(1, Math.min(page - 2, totalPages - 4));
  const pages = Array.from(
    { length: Math.min(5, totalPages) },
    (_, index) => firstPage + index,
  );
  const href = (targetPage: number) =>
    `/perfil/${encodeURIComponent(sellerId)}?reviewsPage=${targetPage}#avaliacoes`;
  const linkClass =
    "rounded-lg border border-white/10 px-3 py-2 text-sm text-zinc-300 transition hover:border-[#58C447]/40 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#58C447]";
  const disabledClass =
    "rounded-lg border border-white/5 px-3 py-2 text-sm text-zinc-600";

  return (
    <nav aria-label="Paginação das avaliações" className="mt-6 flex flex-wrap items-center justify-center gap-2">
      {page > 1 ? (
        <Link href={href(page - 1)} className={linkClass}>Anterior</Link>
      ) : (
        <span aria-disabled="true" className={disabledClass}>Anterior</span>
      )}

      {pages.map((pageNumber) => (
        <Link
          key={pageNumber}
          href={href(pageNumber)}
          aria-label={`Página ${pageNumber}`}
          aria-current={pageNumber === page ? "page" : undefined}
          className={pageNumber === page
            ? `${linkClass} border-[#58C447]/40 bg-[#58C447]/10 text-[#58C447]`
            : linkClass}
        >
          {pageNumber}
        </Link>
      ))}

      {page < totalPages ? (
        <Link href={href(page + 1)} className={linkClass}>Próxima</Link>
      ) : (
        <span aria-disabled="true" className={disabledClass}>Próxima</span>
      )}
    </nav>
  );
}
