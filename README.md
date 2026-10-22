# ⚽ Passe — Gestão da liga, do mercado à classificação

Solução do estudo de caso **SENAI/PE – CÓD. 237 Desenvolvedor I (Fullstack)**: uma aplicação web para administrar uma liga de futebol fictícia — jogadores com valor de mercado, clubes com caixa e elenco, compra e venda com contrato de fidelidade, histórico em CSV, escalação, partidas pelos atributos e classificação.

- **Frontend:** React + TypeScript (Vite), Tailwind CSS e componentes no estilo shadcn/ui.
- **Backend:** Node.js + TypeScript (Express), Prisma e PostgreSQL.
- Sem login: quem usa administra a liga inteira.

## Sumário

1. [Pré-requisitos](#1-pré-requisitos)
2. [Banco de dados (criar e recriar do zero)](#2-banco-de-dados-criar-e-recriar-do-zero)
3. [Instalar e executar](#3-instalar-e-executar)
4. [Variáveis de ambiente](#4-variáveis-de-ambiente)
5. [Estrutura de pastas e bibliotecas](#5-estrutura-de-pastas-e-bibliotecas)
6. [Decisões e premissas](#6-decisões-e-premissas)
7. [Funcionalidades não implementadas](#7-funcionalidades-não-implementadas)
8. [Uso de inteligência artificial](#8-uso-de-inteligência-artificial)
9. [Testes, lint, documentação da API e Docker](#9-testes-lint-documentação-da-api-e-docker)

---

## 1. Pré-requisitos

| Ferramenta | Versão | Para quê |
| --- | --- | --- |
| Node.js (com npm) | **22 LTS** (22.x; também funciona com 20 LTS) | Backend e frontend |
| Docker Engine com Docker Compose v2 | Docker 24 ou superior | Sobe o PostgreSQL 16 (imagem pública `postgres:16`) |
| PostgreSQL | **16** (via Docker, não precisa instalar) | Banco de dados |
| Git | qualquer | Controle de versão |

A API é `http://localhost:3000` (os caminhos ficam sob `/api/v1`) e a interface é `http://localhost:5173`.

---

## 2. Banco de dados (criar e recriar do zero)

O esquema é criado por **migrations versionadas** (`backend/prisma/migrations`), com as 7 tabelas obrigatórias, chaves, `CHECK`s e as unicidades garantidas no banco (nome do clube, sigla e `escalacoes.jogador_id`). O banco criado por estes passos **começa vazio**.

```bash
# Criar o banco (na raiz do repositório); --wait espera o PostgreSQL ficar pronto
docker compose up -d --wait db

# Criar as tabelas (na pasta backend)
cd backend
cp .env.example .env
npm ci
npx prisma migrate deploy
```

**Recriar o banco do zero** (apaga tudo e aplica as migrations de novo; na pasta `backend`):

```bash
npm run db:reset
```

**Dados de exemplo (opcional, comando separado):** 6 clubes, 23 jogadores (7 livres) e 2 partidas, como no mockup. Só funciona em banco vazio.

```bash
npm run db:seed
```

---

## 3. Instalar e executar

Todos os comandos podem ser copiados e executados no Ubuntu 24.04 (com Docker disponível). Os arquivos de trava (`package-lock.json`) estão versionados; use `npm ci`.

```bash
# 1) Banco de dados (na raiz do repositório)
docker compose up -d --wait db

# 2) Backend (na pasta backend)
cd backend
cp .env.example .env
npm ci
npx prisma migrate deploy
npm run build
npm start
# API em http://localhost:3000  (o roteiro da banca acrescenta /api/v1)
# Documentação interativa em http://localhost:3000/docs
```

```bash
# 3) Frontend (em outro terminal, a partir da raiz do repositório)
cd frontend
cp .env.example .env
npm ci
npm run dev
# Interface em http://localhost:5173
```

Para desenvolver com recarga automática no backend, troque `npm run build` + `npm start` por `npm run dev`.

### Tudo com um único comando (Docker Compose)

Sobe banco, API (aplica as migrations ao iniciar) e interface:

```bash
docker compose up --build
# Interface em http://localhost:5173 · API em http://localhost:3000
```

Para parar: `docker compose down` (acrescente `-v` para apagar também os dados do banco).

---

## 4. Variáveis de ambiente

**Backend** — arquivo `backend/.env` (modelo em `backend/.env.example`):

| Variável | Obrigatória | Exemplo | Descrição |
| --- | --- | --- | --- |
| `DATABASE_URL` | sim | `postgresql://passe:passe@localhost:5432/passe?schema=public` | Conexão com o PostgreSQL. As credenciais são as do banco local do `docker-compose.yml` (só para desenvolvimento) |
| `FRONTEND_ORIGIN` | sim | `http://localhost:5173` | Origem liberada no **CORS** (aceita várias, separadas por vírgula; `*` é recusado) |
| `PORT` | não (3000) | `3000` | Porta da API |
| `LOG_LEVEL` | não (`info`) | `info` | Nível dos logs (`silent` desliga) |

Para os testes de integração do backend: `TEST_DATABASE_URL` (opcional, ver [seção 9](#9-testes-lint-documentação-da-api-e-docker)).

**Frontend** — arquivo `frontend/.env` (modelo em `frontend/.env.example`):

| Variável | Obrigatória | Padrão | Descrição |
| --- | --- | --- | --- |
| `VITE_API_BASE_URL` | não | `http://localhost:3000/api/v1` | URL base da API, incluindo `/api/v1` |

---

## 5. Estrutura de pastas e bibliotecas

```text
.
├── docker-compose.yml          # PostgreSQL, API e interface
├── backend/
│   ├── prisma/                 # schema, migrations versionadas e seed opcional
│   ├── src/
│   │   ├── domain/             # regras de negócio puras (valor de mercado, overall, taxa, multa, comissão, partida…)
│   │   ├── modules/            # players, clubs, market, lineup, matches, standings
│   │   │                       #   cada módulo: schemas (validação) → routes → controller → service → repository
│   │   ├── middlewares/        # tratamento central de erros e log de requisições
│   │   ├── shared/             # erros, validação, schemas comuns, relógio, formatação
│   │   ├── docs/               # documentação OpenAPI (Swagger UI em /docs)
│   │   ├── config/ · infra/    # variáveis de ambiente, Prisma e logger
│   │   ├── app.ts              # monta o Express
│   │   └── server.ts           # sobe o servidor
│   └── tests/                  # unit (regras puras) e integration (API + PostgreSQL)
└── frontend/
    └── src/
        ├── api/                # cliente HTTP e funções de cada endpoint (única camada que chama a API)
        ├── hooks/              # hooks de dados (React Query) e proteção contra clique duplo
        ├── components/         # ui (estilo shadcn), shared (tabela, formulário, confirmação…) e layout
        ├── features/           # telas: players, clubs, matches, standings, home
        ├── lib/                # formatação, datas de Brasília, constantes de domínio
        └── test/               # configuração dos testes
```

### Bibliotecas do backend

| Biblioteca | Motivo |
| --- | --- |
| `express` (v5) | Framework HTTP da API REST |
| `@prisma/client` + `prisma` | ORM, migrations versionadas e transações (`$transaction`) |
| `zod` | Validação declarativa de corpo, parâmetros e query params, com mensagens em português |
| `cors` | CORS restrito à origem do frontend |
| `pino` + `pino-pretty` | Log de cada requisição (data e hora, método, caminho e status) |
| `swagger-ui-express` | Documentação interativa da API (OpenAPI) |
| `dotenv` | Leitura do arquivo `.env` |
| `typescript`, `tsx` | Tipagem e execução em desenvolvimento |
| `vitest` + `supertest` | Testes unitários e de integração |
| `eslint`, `typescript-eslint`, `prettier`, `eslint-config-prettier` | Lint e formatação |

### Bibliotecas do frontend

| Biblioteca | Motivo |
| --- | --- |
| `react`, `react-dom`, `vite` | Base do projeto (template oficial `react-ts`) |
| `react-router` (modo biblioteca) | Rotas das telas |
| `@tanstack/react-query` | Carregamento, erro, cache e atualização dos dados depois de cada ação |
| `react-hook-form` + `@hookform/resolvers` + `zod` | Formulários com validação antes do envio e mensagem junto ao campo |
| `tailwindcss` + `@tailwindcss/vite` | Estilo; os tokens de cor do Figma são variáveis CSS semânticas |
| `@radix-ui/react-dialog`, `react-alert-dialog`, `react-tabs` | Diálogos, confirmações e abas acessíveis (base do shadcn/ui) |
| `class-variance-authority`, `clsx`, `tailwind-merge` | Variantes e composição de classes dos componentes |
| `lucide-react` | Ícones |
| `sonner` | Mensagens de sucesso e erro (toasts) |
| `@fontsource-variable/geist` | Fonte Geist |
| `vitest`, `jsdom`, `@testing-library/*` | Testes de componentes e de lógica |
| `eslint`, `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `prettier` | Lint e formatação |

---

## 6. Decisões e premissas

Pontos que o enunciado deixa em aberto ou que merecem registro:

**Backend**

- **Dinheiro em centavos inteiros** nos cálculos, com arredondamento "meio para longe do zero" feito **uma única vez** no resultado final; no banco, `DECIMAL`. Isso evita erros de ponto flutuante (ex.: 130,575 do limite de 50% do caixa).
- **Valor de mercado, overall, valor do elenco, patrimônio, dias restantes e % de multa nunca são gravados**: são calculados a cada consulta, em módulos únicos de `src/domain`. O valor base é gravado uma vez, no cadastro.
- **Listagem de jogadores:** filtros simples (posição, condição, clube, livres e idade) são aplicados no banco; busca sem acento, faixa de valor, ordenação (por valor de mercado calculado) e paginação são aplicadas em memória, **depois** de buscar e filtrar, para ter uma única fórmula de valor de mercado. Adequado ao volume do estudo de caso.
- **Nome único do clube (RN10):** coluna `nome_normalizado` (minúsculas, mantendo acentos) com índice único, calculada pela aplicação. Sigla única por índice. Limite de 20 clubes controlado dentro de uma transação com *advisory lock*.
- **Sigla:** 3 letras A–Z maiúsculas que aparecem no nome, na ordem, ignorando acentos e caixa, a primeira sendo a inicial do nome; não pode ter as 3 letras iguais (400).
- **Concorrência:** compra, venda, escalação e alteração de condição usam transação e bloqueio de linha (`SELECT … FOR UPDATE`), sempre na ordem jogador → clube.
- **Operações atômicas:** compra, venda, partida (com os 6 duelos), escalação e alteração de condição que tira o titular rodam numa única transação.
- **Corpo da requisição:** só é lido nas rotas que o usam; nos pedidos sem corpo (consultas, exclusão e venda), um corpo enviado é ignorado. Corpo ausente, array ou valor simples → 400.
- **Ordem das validações:** id da URL (404) → corpo e query (400) → existência dos recursos (404) → regras de negócio (409).
- **Datas:** o fim da fidelidade é guardado com precisão de minuto; os instantes são gravados em UTC (`timestamp`) e sempre devolvidos em `-03:00`.
- **Exclusão lógica:** `excluido_em` preenchido; o jogador excluído some das listagens e vira 404 nos endpoints, mas continua nas transações e nas partidas antigas.
- **Recompra:** "o clube já vendeu o jogador" é verificado pelo histórico de transações `VENDA` do clube e do jogador.
- **Escalação incompleta:** a formação é mantida e os titulares que sobram continuam escalados (`complete=false`).
- **CSV:** sem separador de milhar, UTF-8 sem BOM, linhas terminadas em `\n`; nome com `;` ou aspas vai entre aspas duplas.
- **Logs:** uma linha por requisição, gerada com `pino` (ex.: `[2026-10-22 12:03:31] INFO: GET /api/v1/players 200 17.1ms`).

**Frontend**

- Componentes de interface escritos no estilo do shadcn/ui, com os tokens semânticos de cor do mockup (tema claro; as variáveis do tema escuro também estão definidas).
- **Filtros de jogadores:** a busca só é enviada com 2 ou mais caracteres (a tela avisa); faixas inválidas (mínimo maior que máximo, valores fora do limite) são avisadas e não são enviadas; "só livres" e filtro por clube são mutuamente exclusivos na tela.
- **Recusas previsíveis impedidas na tela, com o motivo:** de `DOENTE` direto para `APTO`, mudança de posição de jogador com clube e idade menor que a atual. As demais (`409`/`404`) são enviadas e a tela mostra o `message` da API.
- **Escalação:** cada vaga lista só os jogadores do elenco compatíveis com o setor, sem `DOENTE` e ainda não escolhidos; ao trocar de formação, os titulares que cabem são mantidos.
- **Atualização depois de cada ação:** toda ação bem-sucedida (ou recusada) invalida as consultas e a tela mostra os dados devolvidos pela API, sem recarregar a página. Nenhum valor devolvido pela API é recalculado na tela (somar valor e taxa para o custo total é a única conta).
- **Clique duplo:** cada ação desabilita o botão durante o envio e ignora um segundo envio enquanto o primeiro não termina.
- **Datas digitadas:** o campo de data e hora é interpretado como horário de Brasília e enviado com `-03:00`.
- **Exportar CSV:** a tela pede o arquivo à API com os filtros aplicados e o baixa.
- O frontend usa a variável `VITE_API_BASE_URL` (opcional).

---

## 7. Funcionalidades não implementadas

Nenhuma. Os quatro módulos (jogadores, clubes, mercado e liga) e todas as telas descritas no enunciado estão implementados.

---

## 8. Uso de inteligência artificial

**Ferramenta:** GitHub Copilot (assistente de IA no VS Code).

**Onde foi usada:** em todo o projeto — estrutura do monorepo; regras de negócio e testes do backend (`backend/src/domain`, `backend/tests`); API (`backend/src/modules`), esquema e migration do banco, documentação OpenAPI e seed; e todas as telas, componentes, hooks e testes do frontend (`frontend/src`); além do `docker-compose.yml`, dos Dockerfiles e deste README.

**Como e por quê:** o assistente leu o enunciado, o barema e o glossário e gerou o código a partir das regras, para acelerar a escrita e a conferência dos casos-limite. Os exemplos numéricos do enunciado (valor de mercado, overall, valor base, taxa, multa, comissão, o jogo Águias FC × Delta FC e a classificação) viraram testes automatizados, e a interface foi exercitada no navegador.

**O que foi aceito, alterado ou descartado:**

- Aceito: a arquitetura em camadas, os módulos de domínio puros e a validação com Zod.
- Alterado depois de testar: o `pg_advisory_xact_lock` passou de `$queryRaw` para `$executeRaw` (o Prisma não lê colunas `void`); a troca de formação na escalação foi corrigida (os titulares que não cabem agora voltam ao reverter a formação); o grid das páginas ganhou `grid-cols-1` para a tabela rolar dentro do quadro em telas de 375 px; o `useAction` passou a repassar só o input ao `mutationFn`.
- Descartado: o `oxlint` do template do Vite (trocado por ESLint + Prettier) e a biblioteca `pino-http` (substituída por um middleware próprio de log, mais simples e com o formato pedido).

---

## 9. Testes, lint, documentação da API e Docker

**Backend** (na pasta `backend`):

```bash
npm test                  # testes unitários das regras de negócio (inclui o valor de mercado); termina sozinho, sem banco
npm run lint              # ESLint
npm run format:check      # Prettier (só verifica, não altera arquivos)
```

Testes de integração (API + PostgreSQL; criam as tabelas no banco de teste e limpam os dados a cada teste):

```bash
docker compose exec db createdb -U passe passe_test          # na raiz do repositório, uma vez
cd backend
TEST_DATABASE_URL="postgresql://passe:passe@localhost:5432/passe_test?schema=public" npm run test:integration
```

**Frontend** (na pasta `frontend`):

```bash
npm test                  # testes de componentes e de lógica (Vitest + Testing Library); termina sozinho
npm run lint              # ESLint
npm run format:check      # Prettier (só verifica)
npm run build             # build de produção
```

**Documentação interativa da API (Swagger/OpenAPI):** `http://localhost:3000/docs` (JSON em `/docs/openapi.json`), com todos os endpoints do enunciado.

**Logs:** cada requisição gera uma linha com data e hora, método, caminho, status e duração na saída da API.

**Docker e Docker Compose:** `docker compose up --build` sobe banco, API e interface (veja a [seção 3](#3-instalar-e-executar)).

**Responsividade:** as telas de jogadores, clube e histórico funcionam com 375 px de largura, sem rolagem horizontal da página (as tabelas rolam dentro do próprio quadro).
