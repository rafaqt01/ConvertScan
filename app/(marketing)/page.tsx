import Link from 'next/link';
import {
  Sparkles, BarChart3, Bot, Workflow, Users, Filter, Bell, FileText, Plug, KanbanSquare,
  ArrowRight, Check, Zap, Shield, Globe, TrendingUp, Activity, Brain,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const metadata = {
  title: 'Conversão 360° — Sistema Operacional de Crescimento Empresarial',
};

const FEATURES = [
  { icon: BarChart3, title: 'Dashboard Executivo', desc: 'Receita, leads, conversão, CAC, LTV, churn e ROI em tempo real.' },
  { icon: Users, title: 'CRM Inteligente', desc: 'Leads, contatos, empresas e negócios com campos customizáveis e busca global.' },
  { icon: KanbanSquare, title: 'Pipeline Kanban', desc: 'Funil de vendas drag-and-drop com etapas customizáveis e métricas por etapa.' },
  { icon: Brain, title: 'Diagnóstico 360°', desc: 'Score geral, aquisição, conversão, retenção, receita e automação via IA.' },
  { icon: Bot, title: 'Growth Analyst AI', desc: 'Agente interno que analisa seus dados e responde perguntas estratégicas.' },
  { icon: Workflow, title: 'Automações Visuais', desc: 'Crie fluxos sem código: lead entrou → tarefa → notificação → mover etapa.' },
  { icon: Plug, title: '+15 Integrações', desc: 'GA4, Meta Ads, Google Ads, Stripe, HubSpot, RD Station, Pipedrive, WhatsApp...' },
  { icon: Filter, title: 'Funil de Conversão', desc: 'Visualize cada etapa, perdas e oportunidades de otimização.' },
  { icon: Bell, title: 'Alertas Inteligentes', desc: 'Detecção automática de quedas de conversão, aumento de CPA e queda de receita.' },
  { icon: FileText, title: 'Relatórios', desc: 'Exporte em PDF, CSV ou Excel e compartilhe com sua equipe.' },
];

const STEPS = [
  { num: '01', title: 'Conecte', desc: 'Integre suas fontes de dados em minutos. Mais de 15 conectores nativos.' },
  { num: '02', title: 'Diagnostique', desc: 'Receba um score 360° de aquisição, conversão, retenção, receita e automação.' },
  { num: '03', title: 'Otimize', desc: 'Aplique automações, corrija gargalos e escale com IA.' },
  { num: '04', title: 'Cresça', desc: 'Acompanhe o impacto em tempo real no dashboard executivo.' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-[#7B61FF] shadow-[0_0_20px_rgba(26,26,255,0.4)]">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-semibold">Conversão 360°</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Recursos</a>
            <a href="#how" className="hover:text-foreground transition-colors">Como funciona</a>
            <a href="#integrations" className="hover:text-foreground transition-colors">Integrações</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Preço</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Entrar</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/signup">Começar grátis</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="container mx-auto px-6 py-24 md:py-32 relative">
          <div className="mx-auto max-w-4xl text-center">
            <Badge variant="outline" className="mb-6 gap-1.5 border-primary/30 bg-primary/5 text-primary">
              <Sparkles className="h-3 w-3" />
              Powered by OpenAI · Multi-tenant · Supabase
            </Badge>
            <h1 className="text-balance text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight">
              O sistema operacional
              <br />
              <span className="gradient-text">do crescimento empresarial.</span>
            </h1>
            <p className="mt-6 text-balance text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              CRM, Analytics, IA, Automações e Diagnóstico 360° em uma única plataforma.
              Onde está perdendo clientes? Qual seu maior gargalo? Quanto está deixando na mesa?
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button asChild size="xl" className="w-full sm:w-auto">
                <Link href="/signup">
                  Começar gratuitamente <ArrowRight className="ml-1" />
                </Link>
              </Button>
              <Button asChild size="xl" variant="glass" className="w-full sm:w-auto">
                <a href="#how">Ver como funciona</a>
              </Button>
            </div>
            <p className="mt-6 text-xs text-muted-foreground">
              14 dias grátis · Sem cartão · Setup em 5 minutos
            </p>
          </div>

          {/* Hero Visual */}
          <div className="mt-20 mx-auto max-w-6xl">
            <div className="relative rounded-2xl border border-border bg-card/40 backdrop-blur-xl p-1 shadow-2xl">
              <div className="rounded-xl bg-card/80 p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {[
                    { label: 'Receita (30d)', value: 'R$ 482.390', delta: '+23%' },
                    { label: 'Leads', value: '1.847', delta: '+12%' },
                    { label: 'Conversão', value: '4,2%', delta: '+0,8pp' },
                    { label: 'CAC', value: 'R$ 38', delta: '-15%' },
                  ].map((kpi, i) => (
                    <div key={i} className="rounded-lg border border-border/60 bg-background/40 p-4">
                      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{kpi.label}</p>
                      <p className="mt-1.5 text-2xl font-semibold">{kpi.value}</p>
                      <p className="text-[10px] mt-0.5 text-success">{kpi.delta}</p>
                    </div>
                  ))}
                </div>
                <div className="rounded-lg border border-border/60 bg-background/40 p-6 h-48 flex items-end gap-2">
                  {[40, 60, 35, 75, 50, 85, 65, 90, 70, 95, 80, 100].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t bg-gradient-to-t from-primary to-[#7B61FF] transition-all"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 border-t border-border/40">
        <div className="container mx-auto px-6">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <Badge variant="muted" className="mb-4">Recursos</Badge>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-balance">Tudo que sua operação de growth precisa.</h2>
            <p className="mt-4 text-muted-foreground text-balance">12 módulos integrados. IA no centro. Pronto para produção.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="group rounded-xl border border-border bg-card p-6 card-hover">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-24 border-t border-border/40 bg-card/30">
        <div className="container mx-auto px-6">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <Badge variant="muted" className="mb-4">Como funciona</Badge>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-balance">4 passos para escalar com IA.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {STEPS.map((s) => (
              <div key={s.num} className="relative rounded-xl border border-border bg-card p-6">
                <span className="absolute -top-3 -left-3 flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-bold shadow-[0_0_20px_rgba(26,26,255,0.5)]">
                  {s.num}
                </span>
                <h3 className="mt-3 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section id="integrations" className="py-24 border-t border-border/40">
        <div className="container mx-auto px-6">
          <div className="mx-auto max-w-2xl text-center mb-12">
            <Badge variant="muted" className="mb-4">Integrações</Badge>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-balance">Conecte tudo. Centralize sua operação.</h2>
            <p className="mt-4 text-muted-foreground text-balance">+15 conectores nativos. OAuth seguro. Dados normalizados.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {['Google Analytics', 'Google Ads', 'Meta Ads', 'LinkedIn Ads', 'TikTok Ads', 'Stripe', 'Mercado Pago', 'Hotmart', 'Kiwify', 'Shopify', 'HubSpot', 'RD Station', 'Pipedrive', 'WhatsApp', 'Google Sheets'].map((name) => (
              <div key={name} className="rounded-lg border border-border bg-card p-4 text-center text-sm font-medium hover:border-primary/40 transition-colors">
                {name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 border-t border-border/40 bg-card/30">
        <div className="container mx-auto px-6">
          <div className="mx-auto max-w-2xl text-center mb-12">
            <Badge variant="muted" className="mb-4">Preço</Badge>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-balance">Planos que escalam com você.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {[
              { name: 'Starter', price: 'R$ 197', desc: 'Para times de até 5 pessoas.', features: ['1 organização', 'CRM + Pipeline', '5 integrações', 'Diagnóstico 360°', 'Suporte por e-mail'] },
              { name: 'Pro', price: 'R$ 597', desc: 'Para empresas em crescimento.', features: ['Tudo do Starter', 'IA ilimitada', '15+ integrações', 'Automações', 'API completa', 'Suporte prioritário'], featured: true },
              { name: 'Enterprise', price: 'Custom', desc: 'Para operações complexas.', features: ['Tudo do Pro', 'SSO + SAML', 'White-label', 'Onboarding dedicado', 'SLA 99.9%', 'Account manager'] },
            ].map((plan) => (
              <div key={plan.name} className={`rounded-xl border p-6 ${plan.featured ? 'border-primary bg-card shadow-[0_0_40px_rgba(26,26,255,0.15)]' : 'border-border bg-card'}`}>
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{plan.desc}</p>
                <p className="mt-4 text-3xl font-bold">{plan.price}<span className="text-sm font-normal text-muted-foreground">{plan.price !== 'Custom' ? '/mês' : ''}</span></p>
                <ul className="mt-4 space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-success" /> {f}
                    </li>
                  ))}
                </ul>
                <Button asChild className="w-full mt-6" variant={plan.featured ? 'default' : 'outline'}>
                  <Link href="/signup">Começar com {plan.name}</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="mx-auto max-w-3xl rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-success/5 p-12 text-center">
            <Zap className="h-8 w-8 text-primary mx-auto" />
            <h2 className="mt-4 text-3xl md:text-4xl font-bold tracking-tight text-balance">Pare de perder clientes.</h2>
            <p className="mt-3 text-muted-foreground text-balance">Comece grátis. Veja em 5 minutos onde está seu maior gargalo.</p>
            <Button asChild size="xl" className="mt-6">
              <Link href="/signup">Criar conta gratuita <ArrowRight className="ml-1" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-12">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-gradient-to-br from-primary to-[#7B61FF]">
              <Sparkles className="h-3 w-3 text-white" />
            </div>
            <span>Conversão 360° · © 2026</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-foreground">Privacidade</Link>
            <Link href="/terms" className="hover:text-foreground">Termos</Link>
            <Link href="/security" className="hover:text-foreground">Segurança</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}