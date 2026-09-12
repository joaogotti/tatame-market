import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import type { Category } from "@/constants/categories";
import styles from "./CategoryCard.module.css";

export function CategoryCard({ category }: { category: Category }) {
  const query = new URLSearchParams({ categoria: category.name });

  return (
    <article className={styles.card}>
      <div className={styles.media}>
        <Image
          src={category.exploreImage}
          alt={category.exploreAlt}
          fill
          sizes="(max-width: 639px) calc(100vw - 48px), (max-width: 767px) calc((100vw - 64px) / 2), (max-width: 1003px) calc((100vw - 300px) / 2), (max-width: 1363px) calc((100vw - 316px) / 3), calc((100vw - 348px) / 5)"
          className={styles.image}
        />
      </div>
      <div className={styles.content}>
        <h2 className={styles.title}>{category.name}</h2>
        <p className={styles.description}>{category.description}</p>
        <Link
          href={`/anuncios?${query.toString()}`}
          className={styles.explore}
          aria-label={`Explorar ${category.name}`}
        >
          Explorar <ArrowUpRight size={18} aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
