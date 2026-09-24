# Tatame Market

Marketplace para praticantes de Jiu-Jitsu anunciarem equipamentos e encontrarem produtos de outros usuários. O projeto permite gerenciar anúncios, consultar perfis de vendedores e conversar sobre os produtos de interesse.

## Projeto online

[https://tatame-market.vercel.app](https://tatame-market.vercel.app)

## Funcionalidades

- Cadastro e autenticação com e-mail e senha.
- Criação e gerenciamento de anúncios, com upload de imagens e status de disponibilidade.
- Busca, filtros por categoria, condição, tamanho e localização, além de ordenação por data ou preço.
- Lista de produtos favoritos.
- Perfis de usuários e vendedores, com foto, biografia e anúncios publicados.
- Avaliações e reputação de vendedores.
- Conversas entre comprador e vendedor, com mensagens em tempo real.

## Tecnologias

| Tecnologia | Uso |
| --- | --- |
| Next.js / React | Interface e estrutura da aplicação |
| TypeScript | Tipagem |
| Tailwind CSS / CSS Modules | Estilização |
| Supabase | Banco de dados, autenticação, Storage e Realtime |
| API do IBGE | Consulta de municípios |
| Lucide React | Ícones |
| Vercel | Deploy |

## Estrutura do projeto

```text
src/
├── app/
├── components/
├── constants/
├── lib/
└── services/
```

- `app`: páginas e rotas.
- `components`: componentes reutilizáveis organizados por funcionalidade.
- `constants`: dados compartilhados da aplicação.
- `lib`: integrações e regras compartilhadas.
- `services`: integrações externas, como a API do IBGE.

## Executando localmente

Use Node.js 24.x e npm.

1. Clone o repositório e instale as dependências:

   ```bash
   git clone https://github.com/joaogotti/tatame-market.git
   cd tatame-market
   npm ci
   ```

2. Crie um arquivo `.env.local` na raiz e configure estas variáveis:

   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

3. Inicie o projeto:

   ```bash
   npm run dev
   ```

   Acesse [http://localhost:3000](http://localhost:3000).

Algumas funcionalidades dependem de um projeto Supabase configurado.
