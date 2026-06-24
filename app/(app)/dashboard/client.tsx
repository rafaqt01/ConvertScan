'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign, Users, Target, Briefcase, TrendingUp, Repeat, Activity, Zap, ArrowRight,
  Sparkles, Calendar, Filter,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, FunnelChart, Funnel, LabelList, LineChart, Line,
} from 'recharts';
import { StatCard } from '@/components/shell/stat-card';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AIBadge, MiniMetric, ScoreGauge } from '@/components/shell/widgets';
import { formatCurrency, formatCompact, formatPercent, percentChange, formatDate } from '@/lib/utils';
import type { DashboardMetrics } from '@/lib/queries/dashboard';
import Link from 'next/link';
import { useState } from 'react';

interface Props { metrics: DashboardMetrics; organizationName: string }

const tooltipStyle = {
  contentStyle: { backgroundColor: '#14141C', border: '1px solid #25253A', borderRadius: 8, fontSize: 12 },
  labelStyle: { color: '#8A8A9E' },
  itemStyle: { color: '#FAFAFA' },
};

export function DashboardClient({ metrics, organizationName }: Props) {
  const [range, setRange] = useState('30d');

  const series = useMemo(() => {
    const len = metrics.revenue.trend.length;
    return Array.from({ length: len }, (_, i) => ({
      day: `${i + 1}`,
      receita: metrics.revenue.trend[i] ?? 0,
      leads: Math.round(metrics.leads.trend[i] ?? 0),
    }));
  }, [metrics]);

  const overallScore = Math.round(
    Math.min(100, Math.max(0,
      (Math.min(metrics.revenue.current / 10000, 1) * 25) +
      (Math.min(metrics.conversionRate / 5, 1) * 25) +
      (Math.min(metrics.ltv / Math.max(metrics.cac, 1) / 3, 1) * 25) +
      (Math.max(0, 1 - metrics.churnRate / 10) * 25)
    ))
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>Cockpit · {organizationName}</span>
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Bom dia 👋</h1>
          <p className="text-sm text-muted-foreground">Aqui está o pulso da sua operação.</p>
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={range} onValueChange={setRange}>
            <TabsList>
              <TabsTrigger value="7d">7d</TabsTrigger>
              <TabsTrigger value="30d">30d</TabsTrigger>
              <TabsTrigger value="90d">90d</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" /> Custom
          </Button>
          <Button size="sm" asChild>
            <Link href="/conversao"><Sparkles className="h-4 w-4" /> Diagnóstico IA</Link>
          </Button>
        </div>
      </div>

      {/* AI Score Strip */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-card to-success/5 p-6"
      >
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <ScoreGauge score={overallScore} label="Score 360°" size={120} />
            <div>
              <AIBadge>Atualizado em tempo real</AIBadge>
              <h2 className="mt-2 text-xl font-semibold">Saúde geral do crescimento</h2>
              <p className="text-sm text-muted-foreground mt-1 max-w-md">
                Combine aquisição, conversão, retenção e receita em um único número.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 flex-1 w-full">
            <MiniMetric label="Aquisição" value={metrics.leads.current} delta={percentChange(metrics.leads.current, metrics.leads.previous)} format="number" />
            <MiniMetric label="Conversão" value={`${metrics.conversionRate.toFixed(1)}%`} delta={2.4} />
            <MiniMetric label="Receita" value={metrics.revenue.current} format="currency" delta={metrics.monthlyGrowth} />
            <MiniMetric label="LTV / CAC" value={metrics.cac ? `${(metrics.ltv / metrics.cac).toFixed(1)}x` : '∞'} />
          </div>
          <Button variant="glass" asChild>
            <Link href="/ai"><Sparkles className="h-4 w-4" /> Conversar com IA <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>
      </motion.div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Receita" value={formatCurrency(metrics.revenue.current)} change={metrics.monthlyGrowth} icon={DollarSign} hint="vs. período anterior" delay={0.0} />
        <StatCard label="Leads" value={formatCompact(metrics.leads.current)} change={percentChange(metrics.leads.current, metrics.leads.previous)} icon={Users} hint="total no período" delay={0.05} />
        <StatCard label="Conversão" value={`${metrics.conversionRate.toFixed(2)}%`} change={2.4} icon={Target} hint="lead → cliente" delay={0.1} />
        <StatCard label="Oportunidades" value={formatCompact(metrics.opportunities.current)} change={8.1} icon={Briefcase} hint="em aberto" delay={0.15} />
        <StatCard label="CAC" value={formatCurrency(metrics.cac)} change={-12.3} icon={TrendingUp} hint="custo por aquisição" delay={0.2} />
        <StatCard label="LTV" value={formatCurrency(metrics.ltv)} change={4.2} icon={Activity} hint="lifetime value" delay={0.25} />
        <StatCard label="Churn" value={`${metrics.churnRate.toFixed(1)}%`} change={-0.4} icon={Repeat} hint="últimos 30 dias" delay={0.3} />
        <StatCard label="ROAS" value={`${metrics.roas.toFixed(2)}x`} change={metrics.monthlyGrowth} icon={Zap} hint="retorno sobre ads" delay={0.35} />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Receita ao longo do tempo</CardTitle>
              <CardDescription>Evolução diária · {range}</CardDescription>
            </div>
            <Badge variant="success">+{metrics.monthlyGrowth.toFixed(1)}%</Badge>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={series}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1A1AFF" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#1A1AFF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#25253A" />
                <XAxis dataKey="day" tickLine={false} axisLine={false} stroke="#8A8A9E" fontSize={11} />
                <YAxis tickLine={false} axisLine={false} stroke="#8A8A9E" fontSize={11} tickFormatter={(v) => formatCurrency(v as number)} />
                <RTooltip {...tooltipStyle} formatter={(v: number) => formatCurrency(v)} />
                <Area type="monotone" dataKey="receita" stroke="#1A1AFF" strokeWidth={2} fill="url(#g1)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Receita por canal</CardTitle>
            <CardDescription>Distribuição</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={metrics.revenueBySource}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                >
                  {metrics.revenueBySource.map((s, i) => (
                    <Cell key={i} fill={s.color} stroke="none" />
                  ))}
                </Pie>
                <RTooltip {...tooltipStyle} formatter={(v: number) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-3 space-y-1.5">
              {metrics.revenueBySource.map((s) => (
                <div key={s.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                    <span className="text-muted-foreground">{s.name}</span>
                  </div>
                  <span className="font-medium">{formatCompact(s.value)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Funil de Conversão</CardTitle>
            <CardDescription>Visitantes → Clientes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.funnel.map((stage, i) => {
                const max = metrics.funnel[0]?.count || 1;
                const pct = (stage.count / max) * 100;
                return (
                  <div key={stage.stage}>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-muted-foreground">{stage.stage}</span>
                      <span className="font-medium">{formatCompact(stage.count)}</span>
                    </div>
                    <div className="h-9 rounded-md bg-muted overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, delay: i * 0.1 }}
                        className="h-full bg-gradient-to-r from-primary to-[#7B61FF] flex items-center justify-end px-2"
                        style={{ width: `${pct}%` }}
                      >
                        {i === 0 && <span className="text-[10px] font-semibold text-white">{pct.toFixed(0)}%</span>}
                      </motion.div>
                    </div>
                    {stage.dropoff > 0 && i > 0 && (
                      <p className="text-[10px] text-destructive mt-1">−{stage.dropoff}% drop-off</p>
                    )}
                  </div>
                );
              })}
            </div>
            <Button asChild variant="ghost" size="sm" className="w-full mt-4">
              <Link href="/funnel">Ver funil completo <ArrowRight className="h-3 w-3" /></Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Leads vs Receita</CardTitle>
              <CardDescription>Correlação de aquisição e monetização</CardDescription>
            </div>
            <Button variant="ghost" size="sm"><Filter className="h-4 w-4" /></Button>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={series}>
                <CartesianGrid strokeDasharray="3 3" stroke="#25253A" />
                <XAxis dataKey="day" tickLine={false} axisLine={false} stroke="#8A8A9E" fontSize={11} />
                <YAxis yAxisId="left" tickLine={false} axisLine={false} stroke="#8A8A9E" fontSize={11} />
                <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false} stroke="#8A8A9E" fontSize={11} tickFormatter={(v) => formatCurrency(v as number)} />
                <RTooltip {...tooltipStyle} />
                <Line yAxisId="left" type="monotone" dataKey="leads" stroke="#00E5A0" strokeWidth={2} dot={false} name="Leads" />
                <Line yAxisId="right" type="monotone" dataKey="receita" stroke="#1A1AFF" strokeWidth={2} dot={false} name="Receita" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent deals + AI insight */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Negócios fechados recentemente</CardTitle>
            <CardDescription>Últimos deals ganhos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {metrics.recentDeals.length === 0 && (
                <div className="py-12 text-center text-sm text-muted-foreground">Nenhum deal fechado ainda. Conecte integrações e ative automações para começar.</div>
              )}
              {metrics.recentDeals.map((d) => (
                <div key={d.id} className="flex items-center justify-between rounded-md border border-border bg-background/40 p-3 hover:border-primary/30 transition-colors">
                  <div>
                    <p className="text-sm font-medium">{d.title}</p>
                    <p className="text-[11px] text-muted-foreground">{d.stage} · {formatDate(d.created_at)}</p>
                  </div>
                  <Badge variant="success">{formatCurrency(d.value)}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Insight da IA</CardTitle>
              <AIBadge>Growth Analyst</AIBadge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm">
              Detectamos que sua taxa de conversão <span className="text-success font-semibold">subiu 12%</span> na última semana,
              mas o CAC <span className="text-destructive font-semibold">aumentou 8%</span> no Meta Ads.
            </p>
            <p className="text-sm text-muted-foreground">
              Recomendação: realocar 20% do budget do Meta para o Google Ads, onde o ROAS está 2.3x maior.
            </p>
            <Button variant="success" size="sm" className="w-full" asChild>
              <Link href="/ai">Ver análise completa <ArrowRight className="h-3.5 w-3.5" /></Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
