'use client';

import { motion } from 'framer-motion';
import { Filter, TrendingDown, Users, Briefcase, CheckCircle2, ArrowDown, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/shell/page-header';
import { formatCompact, formatPercent } from '@/lib/utils';

interface Props {
  visitors: number;
  leads: number;
  opportunities: number;
  customers: number;
  stageBreakdown: Array<{ name: string; count: number }>;
}

const STAGE_COLORS = ['#8A8A9E', '#1A1AFF', '#7B61FF', '#FFB800', '#00C2FF', '#00E5A0'];

export function FunnelClient({ visitors, leads, opportunities, customers, stageBreakdown }: Props) {
  const stages = [
    { name: 'Visitantes', count: visitors, icon: Users, color: '#1A1AFF' },
    { name: 'Leads', count: leads, icon: Users, color: '#7B61FF' },
    { name: 'Oportunidades', count: opportunities, icon: Briefcase, color: '#FFB800' },
    { name: 'Clientes', count: customers, icon: CheckCircle2, color: '#00E5A0' },
  ];

  const maxCount = stages[0]?.count || 1;

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Funil de Conversão"
        description="Visualize cada etapa, perdas e oportunidades de otimização."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Funil principal</CardTitle>
            <CardDescription>Visitantes → Leads → Oportunidades → Clientes · últimos 30 dias</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stages.map((stage, i) => {
                const pct = (stage.count / maxCount) * 100;
                const prev = i > 0 ? stages[i - 1].count : null;
                const conv = prev && prev > 0 ? (stage.count / prev) * 100 : null;
                const drop = prev && prev > 0 ? 100 - (conv ?? 0) : null;
                const Icon = stage.icon;
                return (
                  <motion.div
                    key={stage.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <div className="flex items-center justify-between text-sm mb-2">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-md" style={{ background: `${stage.color}20`, color: stage.color }}>
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <span className="font-medium">{stage.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold">{formatCompact(stage.count)}</span>
                        {conv !== null && (
                          <Badge variant={conv > 30 ? 'success' : conv > 10 ? 'default' : 'destructive'}>
                            {conv.toFixed(1)}%
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="relative h-14 rounded-lg overflow-hidden bg-muted/40">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, delay: i * 0.1, ease: 'easeOut' }}
                        className="h-full flex items-center justify-end px-3"
                        style={{ background: `linear-gradient(90deg, ${stage.color}40, ${stage.color})`, width: `${pct}%` }}
                      >
                        <span className="text-xs font-semibold text-white">{pct.toFixed(0)}%</span>
                      </motion.div>
                    </div>
                    {drop !== null && drop > 0 && (
                      <div className="flex items-center gap-1.5 mt-1.5 text-xs text-destructive">
                        <TrendingDown className="h-3 w-3" /> −{drop.toFixed(1)}% de perda vs etapa anterior
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Conversões-chave</CardTitle>
            <CardDescription>Taxa de etapa</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <ConvRow label="Visitante → Lead" value={visitors > 0 ? (leads / visitors) * 100 : 0} />
            <ConvRow label="Lead → Oportunidade" value={leads > 0 ? (opportunities / leads) * 100 : 0} />
            <ConvRow label="Oportunidade → Cliente" value={opportunities > 0 ? (customers / opportunities) * 100 : 0} />
            <ConvRow label="Geral (V→C)" value={visitors > 0 ? (customers / visitors) * 100 : 0} highlight />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Distribuição por etapa do pipeline</CardTitle>
          <CardDescription>Negócios abertos atualmente</CardDescription>
        </CardHeader>
        <CardContent>
          {stageBreakdown.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              <Target className="h-8 w-8 mx-auto mb-3 opacity-50" />
              Nenhum negócio em aberto.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {stageBreakdown.map((s, i) => (
                <div key={s.name} className="rounded-md border border-border bg-background/40 p-3 text-center">
                  <div className="h-2 w-2 rounded-full mx-auto mb-2" style={{ background: STAGE_COLORS[i % STAGE_COLORS.length] }} />
                  <p className="text-2xl font-semibold">{s.count}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.name}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recomendações</CardTitle>
          <CardDescription>Onde focar para melhorar o funil</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Reco title="Capture mais leads qualificados" desc="Aumente a taxa de visitante→lead com ofertas de conteúdo e CTAs otimizados." icon={Users} />
            <Reco title="Reduza drop-off no meio" desc="O estágio intermediário tem a maior perda. Invista em nutrição e follow-up." icon={Filter} />
            <Reco title="Aumente taxa de fechamento" desc="Implemente playbooks de vendas e automações para o estágio final." icon={Target} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ConvRow({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={`rounded-md p-3 ${highlight ? 'bg-primary/10 border border-primary/30' : 'border border-border bg-background/40'}`}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-xl font-bold mt-1 ${highlight ? 'text-primary' : ''}`}>{value.toFixed(2)}%</p>
    </div>
  );
}

function Reco({ title, desc, icon: Icon }: { title: string; desc: string; icon: any }) {
  return (
    <div className="rounded-md border border-border bg-background/40 p-4">
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary mb-2">
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-sm font-semibold">{title}</p>
      <p className="text-xs text-muted-foreground mt-1">{desc}</p>
    </div>
  );
}