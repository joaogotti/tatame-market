export const categories = [
  {
    name: "Kimonos",
    image: "/categories/kimonos.png",
    exploreImage: "/categories/explore/kimonos.png",
    exploreAlt: "Detalhe de um kimono branco com faixa preta em ambiente de treino",
    alt: "Kimono branco de Jiu-Jitsu",
    description: "Encontre o kimono para acompanhar seus treinos e competições.",
  },
  {
    name: "Faixas",
    image: "/categories/faixas.png",
    exploreImage: "/categories/explore/faixas.png",
    exploreAlt: "Faixas de Jiu-Jitsu empilhadas, da branca à preta",
    alt: "Faixas de Jiu-Jitsu de diferentes graduações",
    description: "Faixas para cada etapa da sua jornada no tatame.",
  },
  {
    name: "Rashguards",
    image: "/categories/rashguards.png",
    exploreImage: "/categories/explore/rashguards.png",
    exploreAlt: "Rashguard preta de manga longa ao lado de peças dobradas",
    alt: "Rashguard preta de manga longa",
    description: "Conforto e liberdade de movimento para treinar com ou sem kimono.",
  },
  {
    name: "Shorts",
    image: "/categories/shorts.png",
    exploreImage: "/categories/explore/shorts.png",
    exploreAlt: "Shorts pretos de treino em exposição com equipamentos de Jiu-Jitsu",
    alt: "Shorts pretos para treino",
    description: "Shorts para acompanhar seu ritmo nos treinos de No-Gi.",
  },
  {
    name: "Acessórios",
    image: "/categories/acessorios.png",
    exploreImage: "/categories/explore/acessorios.png",
    exploreAlt: "Bolsa de treino, garrafa, protetor bucal e fitas para os dedos",
    alt: "Mochila para equipamentos de Jiu-Jitsu",
    description: "Complete seu equipamento com os itens que fazem parte da rotina.",
  },
] as const;

export type Category = (typeof categories)[number];
export type ProductCategory = Category["name"];
export const productCategories = categories.map((category) => category.name);
