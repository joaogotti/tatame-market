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

export const productCategories = [
  "Kimonos",
  "Faixas",
  "Rashguards",
  "Shorts",
  "Acessórios",
] as const;

export type ProductCategory = (typeof productCategories)[number];

type MockProduct = {
  id: number;
  title: string;
  price: number;
  location: string;
  image: string;
  category: ProductCategory;
  size: string;
  condition: string;
};

// A tipagem mantém as categorias dos anúncios alinhadas aos filtros da Home.
export const mockProducts: MockProduct[] = [
  {
    id: 1,
    title: "Kimono Atama Mundial A2",
    price: 450,
    location: "Vitória, ES",
    image: "/products/kimono-atama.jpg",
    category: "Kimonos",
    size: "A2",
    condition: "Usado",
  },
  {
    id: 2,
    title: "Faixa Preta Jiu-Jitsu",
    price: 120,
    location: "Vila Velha, ES",
    image: "/products/faixa-preta.jpg",
    category: "Faixas",
    size: "A2",
    condition: "Usado",
  },
  {
    id: 3,
    title: "Rashguard Manga Longa",
    price: 180,
    location: "Serra, ES",
    image: "/products/rashguard.jpg",
    category: "Rashguards",
    size: "M",
    condition: "Novo",
  },
  {
    id: 4,
    title: "Kimono Kingz Comp V6 A1",
    price: 550,
    location: "Cariacica, ES",
    image: "/products/kimono-kingz.jpg",
    category: "Kimonos",
    size: "A1",
    condition: "Usado",
  },
];
