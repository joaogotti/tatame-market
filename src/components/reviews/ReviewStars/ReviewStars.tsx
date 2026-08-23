import { Star } from "lucide-react";

export function ReviewStars({ value }: { value: number }) {
  const normalizedValue = Math.min(5, Math.max(0, value));

  return (
    <span
      role="img"
      aria-label={`${normalizedValue.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} de 5 estrelas`}
      className="inline-flex gap-0.5"
    >
      {[1, 2, 3, 4, 5].map((position) => {
        const fillPercentage = Math.min(
          100,
          Math.max(0, (normalizedValue - (position - 1)) * 100),
        );

        return (
          <span key={position} className="relative size-5 text-zinc-700">
            <Star aria-hidden="true" size={20} />
            <span
              aria-hidden="true"
              className="absolute inset-0 overflow-hidden text-[#58C447]"
              style={{ width: `${fillPercentage}%` }}
            >
              <Star size={20} fill="currentColor" />
            </span>
          </span>
        );
      })}
    </span>
  );
}
