# GarimpaTrip 🧭 (Travel Planning & Discovery Application)

O **GarimpaTrip** é um "super garimpador" e planejador inteligente de viagens multisserviço. Ele resolve o desgaste de navegar por dezenas de abas abertas (passagens, hospedagens, passeios, seguros e controle financeiro) sob o modelo transparente de **"Search, Look and Redirect"**: o site pesquisa, você compara e a reserva é feita sempre no site oficial do parceiro.

---

## 🛠️ Stack Tecnológica

- **Frontend & Rotas**: Next.js 16 (App Router), React 19, TypeScript, **CSS Puro** (`globals.css` + `*.module.css`). Sem Tailwind.
- **Design System**: Fusão entre **Layout 1** (fundo areia, banner mostarda) e **Layout 3** (Bento Grid com cores por categoria).
- **Backend & Banco**: PostgreSQL no **Supabase** com Row Level Security (RLS) e colunas `JSONB`.
- **Autenticação**: Login com Google via Supabase Auth.
- **APIs (só no servidor, chaves nunca vão ao navegador)**: Travelpayouts (voos), Geoapify (mapa, hospedagens e deslocamento), OpenTripMap (atrações), Brave Search (ideias da web), AwesomeAPI (câmbio, sem chave), BrasilAPI (feriados, sem chave).
- **Engenharia de Dados**: robô em **Python** no **GitHub Actions** (06h UTC) com histórico de preços de 2 anos.
- **Visualização**: página do Radar (interna) + link para o **Google Looker Studio**.

---

## 📄 Páginas

| Endereço | O que faz |
|---|---|
| `/` | Banner de busca e as 10 áreas do pacote |
| `/discover` | Busca em 5 fontes ao mesmo tempo; botão **+ Caixa** guarda o achado na viagem |
| `/box` | Caixa de Descobertas: triagem, anotações manuais e envio para o Pacote |
| `/package` | As 10 áreas: itens com status e custos, câmbio do dia, cronograma diário e orçamento |
| `/radar` | Radar de preços por rota, gráfico de feriados e até 3 alertas de preço |
| `/trips` | Criar, editar, arquivar e excluir viagens (até 5 ativas) |

---

## 🚀 Como Rodar Localmente no seu VS Code

Pré-requisito: **Node.js 20.9 ou mais novo** (recomendado: 22 LTS).

### 1. Instalar as dependências
```bash
npm install
```

### 2. Configurar as Variáveis de Ambiente
```bash
cp .env.example .env.local
```
(No Windows/PowerShell: `copy .env.example .env.local`.) Preencha com as suas chaves — veja o passo a passo abaixo.
O site abre mesmo sem chaves: cada seção mostra qual chave falta.

### 3. Criar o Banco de Dados no Supabase
No painel do Supabase abra **SQL Editor → New query**, cole todo o conteúdo de `sql/01_schema.sql` e clique em **Run**.

### 4. Iniciar o Servidor de Desenvolvimento
```bash
npm run dev
```
Acesse: `http://localhost:3000`

### 5. (Opcional) Conferências
```bash
npm test          # testes das regras (orçamento, radar, valores em reais)
npm run typecheck # verificação de tipos
npm run build     # build de produção
```

---

## 🔑 Onde conseguir cada chave

### Supabase (banco + login)
1. Crie um projeto em https://supabase.com.
2. **Project Settings → API**: copie `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`, `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY` e `service_role` → `SUPABASE_SERVICE_ROLE_KEY` (esta última só para o robô do GitHub; nunca coloque na Vercel como `NEXT_PUBLIC`).

### Login com Google
1. Em https://console.cloud.google.com crie um projeto → **APIs e serviços → Tela de consentimento OAuth** (tipo Externo).
2. **Credenciais → Criar credenciais → ID do cliente OAuth → Aplicativo da Web**.
3. Em **URIs de redirecionamento autorizados** cole: `https://SEU-PROJETO.supabase.co/auth/v1/callback`.
4. No Supabase: **Authentication → Sign In / Providers → Google**: ative e cole o Client ID e o Client Secret.
5. No Supabase: **Authentication → URL Configuration**:
   - **Site URL**: `http://localhost:3000` (depois troque pelo endereço da Vercel)
   - **Redirect URLs**: adicione `http://localhost:3000/auth/callback` e `https://SEU-SITE.vercel.app/auth/callback`

### APIs externas
| Variável | Onde |
|---|---|
| `TRAVELPAYOUTS_API_KEY` e `TRAVELPAYOUTS_MARKER` | https://www.travelpayouts.com → Perfil → **API token**; o *marker* é o seu ID de afiliado |
| `GEOAPIFY_API_KEY` | https://myprojects.geoapify.com → criar projeto → API key |
| `OPENTRIPMAP_API_KEY` | https://dev.opentripmap.org → Get API key |
| `BRAVE_SEARCH_API_KEY` | https://api-dashboard.search.brave.com → plano Free → API Keys |
| `NEXT_PUBLIC_LOOKER_STUDIO_URL` | Link de compartilhamento do seu relatório no Looker Studio |

---

## ☁️ Publicar (GitHub + Vercel)

1. Crie um repositório no GitHub e envie esta pasta (o `.gitignore` já impede o envio de `.env.local` e `node_modules`).
2. Na Vercel: **Add New → Project → Import** do repositório. Framework: Next.js (detectado sozinho).
3. Em **Settings → Environment Variables** cadastre as mesmas variáveis do `.env.local`, **exceto** `SUPABASE_SERVICE_ROLE_KEY` (o site não usa).
4. Depois do primeiro deploy, adicione o endereço da Vercel no Supabase (Site URL e Redirect URLs) e no Google, se pedir.

## 🤖 Robô diário do Radar (GitHub Actions)

1. No GitHub: **Settings → Secrets and variables → Actions → New repository secret** e crie:
   `TRAVELPAYOUTS_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
2. Aba **Actions → GarimpaTrip Daily Radar Pipeline → Run workflow** para rodar a primeira vez.
3. A partir daí ele roda sozinho todo dia às 06h UTC: cadastra as 15 rotas base, atualiza o calendário de feriados, grava os preços, desativa alertas de quem não entra há 90 dias e apaga preços com mais de 2 anos.

---

## 📏 Regras de negócio (garantidas no banco)

- Até **5 viagens ativas** por pessoa (`profiles.max_trips`); viagens arquivadas não contam.
- Até **3 alertas de preço ativos** por pessoa (`profiles.max_active_alerts`).
- Cada pessoa só vê e altera as próprias viagens, descobertas, pacote, cronograma e alertas.
- Rotas iguais são monitoradas uma única vez, não importa quantas pessoas as acompanhem.
- Alertas de quem não entra há mais de **90 dias** são desativados automaticamente.
- O histórico de preços guarda **2 anos**.

## 📁 Estrutura do Projeto

- `src/app/` — Páginas e rotas de API (`/api/discover/*`, `/api/currency`, `/auth/callback`).
- `src/components/` — Navbar e componentes de cada tela.
- `src/lib/` — Integrações com APIs (`providers.ts`), Supabase, cálculos de orçamento e radar.
- `src/styles/` — Folhas de estilo em **CSS Puro**.
- `src/proxy.ts` — Mantém o login ativo (no Next.js 16 o antigo `middleware.ts` se chama `proxy.ts`).
- `sql/01_schema.sql` — Tabelas, índices, regras de segurança (RLS), limites e funções.
- `data-pipeline/` + `.github/workflows/` — Robô diário em Python.
