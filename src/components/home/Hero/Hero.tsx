import { BadgeCheck, Search, ShieldCheck, UsersRound } from "lucide-react";
import Image from "next/image";
import { productCategories } from "@/constants/mockProducts";
import styles from "./Hero.module.css";

const benefits = [
  { label: "Anúncios gratuitos", icon: BadgeCheck },
  { label: "Comunidade confiável", icon: UsersRound },
  { label: "Negociação segura", icon: ShieldCheck },
];

export function Hero() {
  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      <div className={styles.visual}>
        <div className={styles.imageFrame}>
          <Image
            src="/hero/jiujitsu-hero.png"
            alt="Praticantes de Jiu-Jitsu treinando no tatame"
            fill
            sizes="(max-width: 767px) 45vw, (max-width: 1302px) calc(45vw - 135px), (max-width: 1600px) calc(52vw - 156px), 676px"
            loading="eager"
            className={styles.image}
          />
        </div>
      </div>
      <div className={styles.content}>
        <h1 id="hero-title" className={styles.title}>
          O marketplace<br />
          do <span>Jiu-Jitsu</span>
        </h1>
        <p className={styles.subtitle}>
          Compre e venda kimonos, faixas, acessórios e muito mais.
          Conecte-se com praticantes de todo o Brasil.
        </p>

        {/* O filtro atual pertence ao catálogo. Estes controles ainda não o alteram. */}
        <fieldset disabled className={styles.search} aria-describedby="hero-search-status">
          <legend className="sr-only">Buscar produtos</legend>
          <label className={styles.query}>
            <span className="sr-only">Produto ou marca</span>
            <input type="search" placeholder="Buscar por kimonos, faixas, marcas..." />
          </label>
          <label className={styles.category}>
            <span className="sr-only">Categoria</span>
            <select defaultValue="">
              <option value="">Todas as categorias</option>
              {productCategories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </label>
          <button type="button" aria-label="Buscar produtos (em breve)" className={styles.searchButton}>
            <Search size={20} strokeWidth={2} aria-hidden="true" />
          </button>
        </fieldset>
        <p id="hero-search-status" className={styles.searchStatus}>Busca em breve.</p>

        <ul className={styles.benefits}>
          {benefits.map(({ label, icon: Icon }) => (
            <li key={label}>
              <Icon size={18} strokeWidth={1.7} aria-hidden="true" />
              <span>{label}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
