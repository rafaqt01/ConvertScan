# Conversão 360°

> **Sistema Operacional de Crescimento Empresarial baseado em IA**

Plataforma SaaS multi-tenant com CRM, Analytics, IA conversacional, Automações visuais, Diagnóstico 360° e mais de 15 integrações nativas. Stack moderna, produção-ready, escalável.

---

## 🚀 Stack

- **Frontend:** Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS · Shadcn/UI · Framer Motion · Recharts · TanStack Query · Zustand
- **Backend:** Supabase · PostgreSQL 15 · Edge Functions · Row Level Security
- **IA:** OpenAI (gpt-4o, gpt-4o-mini) — arquitetura preparada para múltiplos modelos
- **Infra:** Docker · Vercel · GitHub Actions
- **Auth:** Supabase Auth · OAuth (Google, GitHub) · Magic Link
- **Relatórios:** jsPDF · xlsx
- **Kanban:** @dnd-kit

---

## 📦 Módulos

| # | Módulo | Rota | Status |
|---|---|---|---|
| 1 | Dashboard Executivo | `/dashboard` | ✅ |
| 2 | CRM (Leads, Contatos, Empresas) | `/crm` | ✅ |
| 3 | Pipeline Kanban | `/pipeline` | ✅ |
| 4 | Gestão de Tarefas | `/tasks` | ✅ |
| 5 | Analytics | `/analytics` | ✅ |
| 6 | Conversão 360° (Diagnóstico IA) | `/conversao` | ✅ |
| 7 | Growth Analyst AI (Chat) | `/ai` | ✅ |
| 8 | Automações Visuais | `/automations` | ✅ |
| 9 | Central de Integrações | `/integrations` | ✅ |
| 10 | Funil de Conversão | `/funnel` | ✅ |
| 11 | Alertas Inteligentes | `/alerts` | ✅ |
| 12 | Relatórios (PDF/CSV/Excel) | `/reports` | ✅ |

---

## 🏗️ Arquitetura

```
src/
├── app/
│   ├── (marketing)/page.tsx         → Landing page pública
│   ├── (app)/                       → Rotas autenticadas
│   │   ├── dashboard/
│   │   ├── crm/
│   │   ├── pipeline/
│   │   ├── tasks/
│   │   ├── analytics/
│   │   ├── conversao/
│   │   ├── ai/
│   │   ├── automations/
│   │   ├── integrations/
│   │   ├── funnel/
│   │   ├── alerts/
│   │   ├── reports/
│   │   └── settings/
│   ├── api/                         → Route handlers
│   │   ├── ai/chat/                 → Streaming OpenAI
│   │   ├── diagnostic/run/          → Gera diagnóstico 360°
│   │   ├── integrations/sync/       → Dispara sync dos conectores
│   │   ├── reports/generate/        → Gera PDF/CSV/XLSX
│   │   ├── reports/[id]/download/   → Download de relatório
│   │   ├── auth/signout/
│   │   ├── cron/                    → Jobs agendados
│   │   ├── health/
│   │   └── status/
│   ├── login/
│   ├── signup/
│   ├── onboarding/
│   └── auth/callback/
├── components/
│   ├── ui/                          → Primitivos (shadcn)
│   └── shell/                       → AppShell, Sidebar, Topbar, widgets
├── lib/
│   ├── supabase/                    → Server + browser clients
│   ├── integrations/                → 15+ conectores
│   ├── queries/                     → Funções de agregação
│   ├── openai.ts                    → Cliente OpenAI + helpers
│   ├── auth.ts                      → Helpers de autenticação
│   ├── api.ts                       → Helpers de API
│   ├── rate-limit.ts                → Upstash + fallback in-memory
│   ├── audit.ts                     → Audit log
│   ├── utils.ts                     → formatCurrency, formatDate...
│   └── validations.ts               → Zod schemas
├── types/database.ts                → Tipos Supabase
└── middleware.ts                    → Auth + rate limit
```

---

## 🔐 Multi-tenant + Segurança

- **Organizations + Memberships + Workspaces**
- **RLS estrito** em todas as 25+ tabelas
- **Roles:** owner · admin · manager · sales · analyst
- **Políticas diferenciadas:** leitura para qualquer membro; escrita para admin+; delete para owner/admin
- **Middleware Next.js** com sessão Supabase
- **Rate limit** via Upstash Redis (fallback in-memory)
- **Audit log** automático em todas as ações sensíveis
- **Headers de segurança:** HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy

---

## ⚙️ Setup Local

### 1. Pré-requisitos
- Node.js 20+
- npm ou pnpm
- Docker (opcional)
- Conta Supabase
- OpenAI API key

### 2. Clone e instale
```bash
git clone <repo>
cd conversao360
npm install
```

### 3. Configure o ambiente
```bash
cp .env.example .env
```

Preencha:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `CRON_SECRET` (gere com `openssl rand -base64 32`)

### 4. Suba o Supabase local (Docker)
```bash
# Banco de dados
docker compose up -d postgres

# Ou use o Supabase CLI
npx supabase start
```

### 5. Rode as migrations
```bash
npx supabase db reset
# ou
psql $DATABASE_URL -f supabase/migrations/0001_init_schema.sql
psql $DATABASE_URL -f supabase/migrations/0002_seed_pipeline.sql
psql $DATABASE_URL -f supabase/migrations/0003_views_and_functions.sql
psql $DATABASE_URL -f supabase/migrations/0004_rls_policies.sql
psql $DATABASE_URL -f supabase/migrations/0005_realtime.sql
```

### 6. Inicie o servidor de desenvolvimento
```bash
npm run dev
```

Acesse:
- **App:** http://localhost:3000
- **Supabase Studio:** http://localhost:54323
- **Email testing (Inbucket):** http://localhost:54324

---

## 🚢 Deploy em Produção

### Vercel (Recomendado)

1. **Conecte o repositório ao Vercel**
2. **Configure as variáveis de ambiente** no painel (todas as do `.env.example`)
3. **Conecte o Supabase de produção:**
   - Crie projeto em https://supabase.com
   - Rode as migrations via `npx supabase db push`
4. **Deploy:**
   ```bash
   vercel --prod
   ```
5. **Cron jobs:** já configurados no `vercel.json`

### Docker standalone

```bash
docker build -t conversao360 .
docker run -p 3000:3000 --env-file .env conversao360
```

### CI/CD

`.github/workflows/ci.yml` está pronto para:
- Lint + typecheck em todo PR
- Testes automatizados
- Build de produção
- Deploy automático na Vercel em merge na main

---

## 🔌 Integrações Suportadas

### Analytics & SEO
- Google Analytics 4 ✅ (implementado)
- Google Search Console 🔌 (placeholder)

### Ads
- Google Ads 🔌
- Meta Ads ✅ (implementado)
- LinkedIn Ads 🔌
- TikTok Ads 🔌

### Pagamentos
- Stripe ✅ (implementado)
- Mercado Pago 🔌
- Hotmart 🔌
- Kiwify 🔌
- Shopify 🔌

### CRM
- HubSpot 🔌
- RD Station 🔌
- Pipedrive 🔌

### Comunicação
- WhatsApp Business 🔌

### Outros
- Google Sheets 🔌

Para adicionar nova integração:
1. Crie `src/lib/integrations/<provider>.ts` com `export async function sync(ctx)`.
2. Adicione entry no array `PROVIDERS` em `src/app/(app)/integrations/client.tsx`.
3. Adicione ao enum `integration_provider` em `0001_init_schema.sql`.

---

## 🤖 IA — Como funciona

### Diagnóstico 360° (Módulo 6)
- Usuário informa website, instagram, nicho e objetivo
- Prompt estruturado enviado ao GPT-4o com saída JSON
- Score geral + scores por dimensão (aquisição, conversão, retenção, receita, automação)
- Lista de gargalos, oportunidades e prioridades
- Salvo em `diagnostics` com histórico

### Growth Analyst AI (Módulo 7)
- Chat streaming com GPT-4o
- Contexto automático carregado: métricas, deals, alertas, insights
- Memória persistente por conversa (ai_messages)
- Temperatura 0.5 para equilíbrio entre criatividade e precisão

### Insights Diários (Cron)
- Todo dia às 8h (vercel.json)
- Para cada org, gera 1 insight baseado nos últimos 30 dias
- Salvo em `ai_insights` com recomendações

---

## 📊 Banco de Dados

### Schema principal
- `organizations`, `workspaces`, `profiles`, `memberships`
- `pipeline_stages`, `companies`, `contacts`, `leads`, `deals`
- `tasks`, `activities`, `notes`
- `integrations`, `sources`, `campaigns`
- `events`, `metrics_daily`, `customers`, `revenue_entries`
- `automations`, `automation_runs`
- `alerts`, `ai_insights`, `ai_conversations`, `ai_messages`
- `diagnostics`, `reports`, `audit_logs`

### Triggers automáticos
- `set_updated_at` em todas as tabelas com timestamp
- `handle_new_user` cria profile ao signup
- `seed_default_pipeline` cria etapas e workspace ao criar organização

### Views materializadas
- `v_funnel_summary` — agregado diário por org

---

## 🛡️ Segurança

| Camada | Implementação |
|---|---|
| Autenticação | Supabase Auth + JWT |
| Autorização | RLS em todas as tabelas |
| Middleware | Next.js middleware.ts valida sessão |
| Rate limiting | Upstash Redis + in-memory fallback |
| Headers | HSTS, CSP, X-Frame-Options, etc |
| Auditoria | audit_logs em ações sensíveis |
| Storage | Variáveis sensíveis só server-side |
| CORS | Restrito a domínios permitidos |

---

## 📈 Roadmap

- [ ] Webhooks de entrada para integrações
- [ ] Worker queue (BullMQ + Redis) para automações
- [ ] White-label / multi-theme
- [ ] Marketplace de integrações
- [ ] Mobile app (React Native)
- [ ] Voice agent integrado

---

## 📄 Licença

Proprietary © 2026 Conversão 360°

---

## 🤝 Suporte

- Documentação: este README
- Issues: GitHub Issues
- Email: suporte@conversao360.com
- Status: `/api/status`

**Bom crescimento. 📈**
