# Guia de Deploy — Conversão 360°

## Passo 1: Provisionar Supabase

1. Crie conta em https://supabase.com
2. New Project → escolha região São Paulo (gru1)
3. Defina uma senha forte para o DB
4. Aguarde provisionamento (~2 min)

### Pegue as credenciais

Em **Project Settings → API**:
- `NEXT_PUBLIC_SUPABASE_URL` → Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` → anon public
- `SUPABASE_SERVICE_ROLE_KEY` → service_role (NUNCA exponha ao client)

### Aplique as migrations

```bash
# Instale CLI
npm install -g supabase

# Login
npx supabase login

# Link ao projeto
npx supabase link --project-ref <your-project-ref>

# Aplique as migrations
npx supabase db push

# Ou conecte via psql
psql "postgresql://postgres:<password>@db.<ref>.supabase.co:5432/postgres" -f supabase/migrations/0001_init_schema.sql
psql ... -f supabase/migrations/0002_seed_pipeline.sql
psql ... -f supabase/migrations/0003_views_and_functions.sql
psql ... -f supabase/migrations/0004_rls_policies.sql
psql ... -f supabase/migrations/0005_realtime.sql
```

### Configure Auth providers

Em **Authentication → Providers**:
- Email: ON (padrão)
- Google: habilite e adicione OAuth credentials
- GitHub: idem (opcional)

### Crie bucket de Storage

Em **Storage**, crie um bucket chamado `reports` (privado).

---

## Passo 2: OpenAI

1. Crie conta em https://platform.openai.com
2. API Keys → Create new secret key
3. Copie para `OPENAI_API_KEY`
4. Configure billing (recomendo limite de uso)

---

## Passo 3: Deploy na Vercel

### Via Dashboard

1. Acesse https://vercel.com/new
2. Importe o repositório
3. Configure:
   - Framework: Next.js (auto-detectado)
   - Build Command: `next build` (padrão)
   - Output Directory: `.next` (padrão)

### Variáveis de ambiente na Vercel

Em **Settings → Environment Variables**, adicione TODAS:

| Nome | Ambiente |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | Production (server only) |
| `OPENAI_API_KEY` | Production |
| `CRON_SECRET` | Production |
| `NEXT_PUBLIC_APP_URL` | Production |

### Deploy

```bash
vercel --prod
```

---

## Passo 4: Configurar Cron Jobs

Os cron jobs já estão definidos em `vercel.json`:

| Path | Schedule | Função |
|---|---|---|
| `/api/cron/sync-integrations` | `0 */2 * * *` | A cada 2h, sincroniza todas as integrações conectadas |
| `/api/cron/run-automations` | `*/15 * * * *` | A cada 15min, executa automações |
| `/api/cron/evaluate-alerts` | `0 * * * *` | A cada hora, detecta anomalias |
| `/api/cron/ai-insights` | `0 8 * * *` | Diariamente às 8h, gera insights |

Após o deploy, a Vercel já agenda automaticamente. Verifique em **Settings → Cron Jobs**.

---

## Passo 5: Configurar OAuth (Google, GitHub)

### Google OAuth

1. https://console.cloud.google.com
2. APIs & Services → Credentials → Create OAuth Client
3. Authorized redirect URIs:
   ```
   https://<your-project-ref>.supabase.co/auth/v1/callback
   ```
4. No Supabase: Authentication → Providers → Google → cole Client ID e Secret

### Custom Domain (opcional)

Em Vercel → Settings → Domains → Add

---

## Passo 6: Verificações Pós-Deploy

1. ✅ Homepage carrega em https://seu-dominio.com
2. ✅ Cadastro funciona (verifique email em produção)
3. ✅ Login funciona
4. ✅ Dashboard renderiza
5. ✅ AI chat responde
6. ✅ Diagnóstico roda
7. ✅ `/api/health` retorna 200
8. ✅ Cron jobs executam (verifique logs em Vercel → Functions)

---

## Passo 7: Monitoramento

### Health checks

A Vercel monitora automaticamente. Configure custom em:
- UptimeRobot: faça ping em `/api/health` a cada 5min
- Better Stack / Datadog: para APM completo

### Logs

Em **Vercel → Logs** você vê:
- Edge function invocations
- Server action executions
- Erros e warnings

### Sentry (recomendado)

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

Adicione `SENTRY_DSN` em Environment Variables.

---

## Troubleshooting

### Erro: "Invalid API key"
→ Verifique `OPENAI_API_KEY` e se tem créditos

### Erro: "permission denied for table X"
→ RLS não está configurado. Rode `0004_rls_policies.sql`

### Cron jobs não executam
→ Verifique `CRON_SECRET` configurado e se o path retorna 200

### Email não chega
→ Configure SMTP customizado em Supabase → Auth → SMTP Settings (recomendado: Resend, SendGrid)

### Imagens não carregam
→ Adicione o domínio em `next.config.js → images.remotePatterns`

---

## Custos Estimados (Tier Inicial)

| Serviço | Custo |
|---|---|
| Vercel Hobby | Grátis (até 100GB bandwidth) |
| Supabase Free | Grátis (até 500MB DB, 1GB storage) |
| OpenAI GPT-4o-mini | ~$0.15 por 1M tokens input |
| Upstash Redis | Grátis (até 10k requests/dia) |
| **Total** | **~$10-50/mês** para early adopters |

Para escala: Pro Vercel ($20/mês) + Supabase Pro ($25/mês).

---

Pronto. Sistema operacional. 🚀
