'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Globe, Instagram, Target, Loader2, CheckCircle2, AlertTriangle, TrendingUp, RefreshCw, ArrowRight, Lightbulb } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScoreGauge, AIBadge, MiniMetric } from '@/components/shell/widgets';
import { PageHeader } from '@/components/shell/page-header';
import { createBrowserSupabase } from '@/lib/supabase/client';
import { diagnosticSchema } from '@/lib/validations';
import { toast } from 'sonner';
import { formatDateTime } from '@/lib/utils';

interface Props { diagnostics: any[]; organizationName: string }

const NICHES = [
  'E-commerce', 'SaaS', 'Infoprodutos', 'Agência', 'Consultoria',
  'Educação Online', 'Serviços B2B', 'Saúde e Bem-estar', 'Imobiliário',
  'Financeiro', 'Restaurantes', 'Outro',
];

export function ConversaoClient({ diagnostics, organizationName }: Props) {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [website, setWebsite] = useState('');
  const [instagram, setInstagram] = useState('');
  const [niche, setNiche] = useState('');
  const [objective, setObjective] = useState('');
  const [activeResult, setActiveResult] = useState<any>(diagnostics[0] ?? null);
  const supabase = createBrowserSupabase();

  async function runDiagnostic(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setRunning(true);
    try {
      const data = { website, instagram, niche, objective };
      diagnosticSchema.parse(data);

      const res = await fetch('/api/diagnostic/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? 'Erro');

      toast.success('Diagnóstico concluído!');
      setActiveResult(json.data);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro');
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Conversão 360°"
        description="Diagnóstico inteligente do seu funil completo. Identifique gargalos e oportunidades em segundos."
        actions={
          <Badge variant="outline" className="gap-1.5"><Sparkles className="h-3 w-3 text-primary" /> Powered by OpenAI</Badge>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Rodar diagnóstico</CardTitle>
            <CardDescription>Informe o básico. A IA cuida do resto.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={runDiagnostic} className="space-y-3">
              <div className="space-y-1.5">
                <Label>Website</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://suaempresa.com" className="pl-9" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Instagram</Label>
                <div className="relative">
                  <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@suaempresa" className="pl-9" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Nicho *</Label>
                <select
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background/60 px-3 py-2 text-sm"
                >
                  <option value="">Selecione...</option>
                  {NICHES.map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Objetivo principal *</Label>
                <Textarea
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  required
                  rows={3}
                  placeholder="Ex: Aumentar receita em 40% nos próximos 6 meses, melhorar retenção..."
                />
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={running}>
                {running ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analisando com IA...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Rodar diagnóstico
                  </>
                )}
              </Button>
              <p className="text-[11px] text-muted-foreground text-center">
                Análise via IA. Resultados ficam salvos no histórico.
              </p>
            </form>
          </CardContent>
        </Card>

        {/* Result */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Resultado</CardTitle>
              <CardDescription>
                {activeResult ? `Última análise: ${formatDateTime(activeResult.created_at)}` : 'Aguardando primeira análise...'}
              </CardDescription>
            </div>
            {activeResult && (
              <Button variant="ghost" size="sm">
                <RefreshCw className="h-4 w-4" /> Atualizar
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {!activeResult ? (
              <div className="py-16 text-center text-sm text-muted-foreground">
                <Sparkles className="h-8 w-8 mx-auto mb-3 text-primary opacity-50" />
                <p>Rode seu primeiro diagnóstico para ver os scores.</p>
              </div>
            ) : (
              <ResultView result={activeResult} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* History */}
      {diagnostics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Histórico de diagnósticos</CardTitle>
            <CardDescription>Compare evolução ao longo do tempo.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {diagnostics.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setActiveResult(d)}
                  className={`text-left rounded-md border p-3 transition-colors ${
                    activeResult?.id === d.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{d.niche}</span>
                    <Badge variant={d.overall_score >= 70 ? 'success' : d.overall_score >= 40 ? 'default' : 'warning'}>
                      {d.overall_score}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1">{d.objective}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{formatDateTime(d.created_at)}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ResultView({ result }: { result: any }) {
  const scores = [
    { key: 'acquisition', label: 'Aquisição', value: result.acquisition_score ?? 0, color: '#1A1AFF' },
    { key: 'conversion', label: 'Conversão', value: result.conversion_score ?? 0, color: '#00E5A0' },
    { key: 'retention', label: 'Retenção', value: result.retention_score ?? 0, color: '#7B61FF' },
    { key: 'revenue', label: 'Receita', value: result.revenue_score ?? 0, color: '#FFB800' },
    { key: 'automation', label: 'Automação', value: result.automation_score ?? 0, color: '#00C2FF' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center gap-6 pb-6 border-b border-border">
        <ScoreGauge score={result.overall_score ?? 0} label="Score 360°" size={140} />
        <div className="flex-1 space-y-2">
          <AIBadge>Diagnóstico gerado por IA</AIBadge>
          <h3 className="text-xl font-semibold">Saúde geral: {result.overall_score}/100</h3>
          <p className="text-sm text-muted-foreground text-balance">
            {result.overall_score >= 70 ? 'Operação saudável. Pequenos ajustes podem acelerar.' :
             result.overall_score >= 40 ? 'Há oportunidades significativas de otimização.' :
             'Diversos gargalos identificados. Priorize o que está abaixo.'}
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {scores.map((s) => (
              <Badge key={s.key} variant="outline" style={{ borderColor: s.color, color: s.color }}>
                {s.label}: {s.value}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {scores.map((s) => (
          <div key={s.key} className="rounded-md border border-border bg-background/40 p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.label}</p>
            <p className="mt-1 text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${s.value}%`, background: s.color }} />
            </div>
          </div>
        ))}
      </div>

      {result.bottlenecks?.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-warning" /> Gargalos identificados</h4>
          <div className="space-y-2">
            {result.bottlenecks.map((b: any, i: number) => (
              <div key={i} className="rounded-md border border-warning/30 bg-warning/5 p-3">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="text-sm font-medium">{b.area}</span>
                  <Badge variant={b.severity === 'high' ? 'destructive' : b.severity === 'medium' ? 'warning' : 'muted'}>
                    {b.severity}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{b.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {result.opportunities?.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold flex items-center gap-2"><TrendingUp className="h-4 w-4 text-success" /> Oportunidades</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {result.opportunities.map((o: any, i: number) => (
              <div key={i} className="rounded-md border border-success/30 bg-success/5 p-3">
                <p className="text-sm font-medium">{o.area}</p>
                <p className="text-xs text-muted-foreground mt-1">{o.description}</p>
                <Badge variant="success" className="mt-2">{o.potential}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {result.priorities?.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold flex items-center gap-2"><Lightbulb className="h-4 w-4 text-primary" /> Prioridades de ação</h4>
          <div className="space-y-2">
            {result.priorities.map((p: any, i: number) => (
              <div key={i} className="flex items-start gap-3 rounded-md border border-border bg-background/40 p-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-bold">{p.order}</div>
                <div>
                  <p className="text-sm font-medium">{p.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{p.rationale}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}