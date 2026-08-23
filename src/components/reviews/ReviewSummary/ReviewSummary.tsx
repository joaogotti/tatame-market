import { ReviewStars } from "@/components/reviews/ReviewStars/ReviewStars";
import type { ReviewSummaryData } from "@/lib/reviews";

export function ReviewSummary({ summary }: { summary: ReviewSummaryData }) {
  if (summary.average === null) {
    return (
      <section className="mt-6 rounded-xl border border-white/10 bg-zinc-950/40 px-5 py-4">
        <p className="text-sm font-medium text-zinc-400">
          Nenhuma avaliação ainda
        </p>
      </section>
    );
  }

  return (
    <section className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-[#58C447]/20 bg-[#58C447]/5 px-5 py-4">
      <strong className="text-3xl text-white">
        {summary.average.toLocaleString("pt-BR", {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        })}
      </strong>
      <div>
        <ReviewStars value={summary.average} />
        <p className="mt-1 text-sm text-zinc-400">
          {summary.count} {summary.count === 1 ? "avaliação" : "avaliações"}
        </p>
      </div>
    </section>
  );
}
