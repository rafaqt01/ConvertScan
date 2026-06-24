'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer, AreaChart, Area, Cell, PieChart, Pie } from 'recharts';
import { BarChart3, Globe, MousePointerClick, DollarSign, TrendingUp, Filter, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shell/page-header';
import { StatCard } from '@/components/shell/stat-card';
import { formatCompact, formatCurrency, percentChange } from '@/lib/utils';

interface Props { metrics: any[]; sources: any[] }

const COLORS = ['#1A1AFF', '#00E5A0', '#FFB800', '#FF4D6D', '#7B61FF', '#00C2FF'];
const tooltipStyle = {
  contentStyle: { backgroundColor: '#14141C', border: '1px solid #25253A', borderRadius: 8, fontSize: 12 },
  labelStyle: { color: '#8A8A9E' },
  itemStyle: { color: '#FAFAFA' },
};

export function AnalyticsClient({ metrics, sources }: Props) {
  const [range, setRange] = useState('30d');

  const series = useMemo(() => {
    return metrics.map((m) => ({
      date: m.date.slice(5),
      sessoes: m.sessions ?? 0,
      leads: m.leads_count ?? 0,
      receita: m.revenue ?? 0,
      gasto: m.spend ?? 0,
    }));
  }, [metrics]);

  const total = useMemo(() => ({
    sessions: metrics.reduce((s, m) => s + (m.sessions ?? 0), 0),
    leads: metrics.reduce((s, m) => s + (m.leads_count ?? 0), 0),
    revenue: metrics.reduce((s, m) => s + (m.revenue ?? 0), 0),
    spend: metrics.reduce((s, m) => s + (m.spend ?? 0), 0),
    deals: metrics.reduce((s, m) => s + (m.deals_won_count ?? 0), 0),
  }), [metrics]);

  const channelData = useMemo(() => {
    return sources.slice(0, 6).map((s, i) => ({
      name: s.name,
      value: (s.campaigns ?? []).reduce((sum: number, c: any) => sum + (c.spend ?? 0), 0) || 1000 * (i + 1),
      color: COLORS[i % COLORS.length],
    }));
  }, [sources]);

  const conversion = total.sessions > 0 ? (total.deals / total.sessions) * 100 : 0;

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Analytics"
        description="Sessões, conversões, receita e performance por canal."
        actions={
          <div className="flex items-center gap-2">
            <Tabs value={range} onValueChange={setRange}>
              <TabsList>
                <TabsTrigger value="7d">7d</TabsTrigger>
                <TabsTrigger value="30d">30d</TabsTrigger>
                <TabsTrigger value="90d">90d</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button variant="outline" size="sm"><Calendar className="h-4 w-4" /></Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Sessões" value={formatCompact(total.sessions)} icon={Globe} change={12.4} hint="total no período" />
        <StatCard label="Conversões" value={formatCompact(total.deals)} icon={MousePointerClick} change={8.2} hint="leads convertidos" />
        <StatCard label="Receita" value={formatCurrency(total.revenue)} icon={DollarSign} change={18.9} />
        <StatCard label="Taxa de conversão" value={`${conversion.toFixed(2)}%`} icon={TrendingUp} change={-1.1} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Sessões e receita ao longo do tempo</CardTitle>
            <CardDescription>Correlação entre tráfego e monetização</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={series}>
                <defs>
                  <linearGradient id="a1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1A1AFF" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#1A1AFF" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="a2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00E5A0" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#00E5A0" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#25253A" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} stroke="#8A8A9E" fontSize={11} />
                <YAxis tickLine={false} axisLine={false} stroke="#8A8A9E" fontSize={11} />
                <RTooltip {...tooltipStyle} />
                <Area type="monotone" dataKey="sessoes" stroke="#1A1AFF" fill="url(#a1)" strokeWidth={2} />
                <Area type="monotone" dataKey="leads" stroke="#00E5A0" fill="url(#a2)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Investimento por canal</CardTitle>
            <CardDescription>Distribuição de gasto</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={channelData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
                  {channelData.map((c, i) => <Cell key={i} fill={c.color} stroke="none" />)}
                </Pie>
                <RTooltip {...tooltipStyle} formatter={(v: number) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-3 space-y-1.5">
              {channelData.map((c) => (
                <div key={c.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full" style={{ background: c.color }} />
                    <span className="text-muted-foreground">{c.name}</span>
                  </div>
                  <span className="font-medium">{formatCurrency(c.value)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Conversão por canal</CardTitle>
            <CardDescription>Performance por origem</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={channelData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#25253A" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} stroke="#8A8A9E" fontSize={11} />
                <YAxis tickLine={false} axisLine={false} stroke="#8A8A9E" fontSize={11} tickFormatter={(v) => formatCurrency(v as number)} />
                <RTooltip {...tooltipStyle} formatter={(v: number) => formatCurrency(v)} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {channelData.map((c, i) => <Cell key={i} fill={c.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top páginas</CardTitle>
            <CardDescription>Mais acessadas no período</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[
                { path: '/', views: 4820, conv: 4.2 },
                { path: '/preços', views: 2910, conv: 8.7 },
                { path: '/blog/como-aumentar-conversao', views: 1840, conv: 2.1 },
                { path: '/produto', views: 1290, conv: 6.4 },
                { path: '/contato', views: 820, conv: 12.3 },
              ].map((p) => (
                <div key={p.path} className="flex items-center justify-between rounded-md border border-border bg-background/40 p-3">
                  <div>
                    <p className="text-sm font-medium">{p.path}</p>
                    <p className="text-xs text-muted-foreground">{formatCompact(p.views)} views</p>
                  </div>
                  <Badge variant="success">{p.conv}% conv.</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}