/**
 * mockProducts
 *
 * Dados temporários dos anúncios utilizados durante
 * o desenvolvimento do Tatame Market.
 *
 * Futuramente estes dados serão substituídos pelos
 * produtos carregados do backend.
 *
 * Cada produto possui informações que poderão ser
 * utilizadas posteriormente para filtros e pesquisas.
 */

import type { ProductCategory } from "@/constants/categories";

export { productCategories, type ProductCategory } from "@/constants/categories";

/**
 * Contrato temporário de produto compartilhado pela listagem e pelos detalhes.
 * Ele pode ser reaproveitado quando os mocks forem substituídos pelo backend.
 */
export type Product = {
  id: number;
  title: string;
  price: number;
  location: string;
  locationCity: string;
  locationState: string;
  locationIbgeCode: number | null;
  image: string;
  category: ProductCategory;
  size: string;
  condition: "Novo" | "Usado";
  description: string;
};

// A tipagem mantém as categorias dos anúncios alinhadas aos filtros da Home.
export const mockProducts: Product[] = [
  {
    id: 1,
    title: "Kimono Atama Mundial A2",
    price: 450,
    location: "Vitória, ES",
    locationCity: "Vitória",
    locationState: "ES",
    locationIbgeCode: 3205309,
    image: "/products/kimono-atama.jpg",
    category: "Kimonos",
    size: "A2",
    condition: "Usado",
    description:
      "Kimono Atama Mundial em ótimo estado de conservação, ideal para treinos e competições. Possui reforços nas principais áreas de contato.",
  },
  {
    id: 2,
    title: "Faixa Preta Jiu-Jitsu",
    price: 120,
    location: "Vila Velha, ES",
    locationCity: "Vila Velha",
    locationState: "ES",
    locationIbgeCode: 3205200,
    image: "/products/faixa-preta.jpg",
    category: "Faixas",
    size: "A2",
    condition: "Usado",
    description:
      "Faixa preta para Jiu-Jitsu com boa estrutura e costuras resistentes. Apresenta sinais leves de uso, sem comprometer sua utilização.",
  },
  {
    id: 3,
    title: "Rashguard Manga Longa",
    price: 180,
    location: "Serra, ES",
    locationCity: "Serra",
    locationState: "ES",
    locationIbgeCode: 3205002,
    image: "/products/rashguard.jpg",
    category: "Rashguards",
    size: "M",
    condition: "Novo",
    description:
      "Rashguard de manga longa com tecido elástico e respirável, indicada para treinos com ou sem kimono. Produto novo e sem uso.",
  },
  {
    id: 4,
    title: "Kimono Kingz Comp V6 A1",
    price: 550,
    location: "Cariacica, ES",
    locationCity: "Cariacica",
    locationState: "ES",
    locationIbgeCode: 3201308,
    image: "/products/kimono-kingz.jpg",
    category: "Kimonos",
    size: "A1",
    condition: "Usado",
    description:
      "Kimono Kingz Comp V6 leve e resistente, adequado para atletas que buscam mobilidade. Conservado e pronto para novos treinos.",
  },
];
