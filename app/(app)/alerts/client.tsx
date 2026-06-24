'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Bell, AlertTriangle, AlertCircle, CheckCircle2, Clock, Filter, TrendingDown, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/shell/page-header';
import { createBrowserSupabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { formatDateTime, cn } from '@/lib/utils';

interface Props { alerts: any[] }

export function AlertsClient({ alerts }: Props) {
  const supabase = createBrowserSupabase();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('active');

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('alerts')
        .update({ status, resolved_at: status === 'resolved' ? new Date().toISOString() : null })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alerts'] }),
  });

  const filtered = alerts.filter((a) => filter === 'all' || a.status === filter);
  const stats = {
    active: alerts.filter((a) => a.status === 'active').length,
    critical: alerts.filter((a) => a.severity === 'critical' && a.status === 'active').length,
    acknowledged: alerts.filter((a) => a.status === 'acknowledged').length,
    resolved: alerts.filter((a) => a.status === 'resolved').length,
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Alertas Inteligentes"
        description="Detecção automática de anomalias e oportunidades. Sempre atualizado."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Ativos" value={stats.active} icon={Bell} />
        <Stat label="Críticos" value={stats.critical} icon={AlertCircle} danger={stats.critical > 0} />
        <Stat label="Reconhecidos" value={stats.acknowledged} icon={Clock} />
        <Stat label="Resolvidos" value={stats.resolved} icon={CheckCircle2} accent />
      </div>

      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList>
          <TabsTrigger value="active">Ativos ({stats.active})</TabsTrigger>
          <TabsTrigger value="acknowledged">Reconhecidos ({stats.acknowledged})</TabsTrigger>
          <TabsTrigger value="resolved">Resolvidos ({stats.resolved})</TabsTrigger>
          <TabsTrigger value="all">Todos</TabsTrigger>
        </TabsList>
      </Tabs>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Bell className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" />
            <h3 className="font-semibold">Nenhum alerta</h3>
            <p className="text-sm text-muted-foreground mt-1">Tudo operando dentro do esperado. Continue monitorando.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((alert, i) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Card className={cn(
                'card-hover',
                alert.severity === 'critical' && 'border-destructive/40',
                alert.severity === 'warning' && 'border-warning/40',
                alert.status === 'resolved' && 'opacity-60'
              )}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-md shrink-0',
                      alert.severity === 'critical' ? 'bg-destructive/15 text-destructive' :
                      alert.severity === 'warning' ? 'bg-warning/15 text-warning' :
                      'bg-primary/15 text-primary'
                    )}>
                      {alert.severity === 'critical' ? <AlertCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold">{alert.title}</p>
                          {alert.description && <p className="text-xs text-muted-foreground mt-0.5">{alert.description}</p>}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {alert.change_percent !== null && (
                            <Badge variant={alert.change_percent > 0 ? 'success' : 'destructive'} className="gap-1">
                              {alert.change_percent > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                              {Math.abs(alert.change_percent).toFixed(1)}%
                            </Badge>
                          )}
                          <Badge variant={alert.severity === 'critical' ? 'destructive' : alert.severity === 'warning' ? 'warning' : 'muted'}>
                            {alert.severity}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                          <Clock className="h-3 w-3" />{formatDateTime(alert.created_at)}
                        </p>
                        {alert.status === 'active' && (
                          <div className="flex items-center gap-1">
                            <Button size="sm" variant="ghost" onClick={() => updateStatus.mutate({ id: alert.id, status: 'acknowledged' })}>
                              Reconhecer
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ id: alert.id, status: 'resolved' })}>
                              <CheckCircle2 className="h-3 w-3" /> Resolver
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, icon: Icon, danger, accent }: { label: string; value: number; icon: any; danger?: boolean; accent?: boolean }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <Icon className={cn('h-4 w-4', danger ? 'text-destructive' : accent ? 'text-success' : 'text-muted-foreground')} />
      </div>
      <p className={cn('mt-2 text-2xl font-semibold', danger && 'text-destructive', accent && 'text-success')}>{value}</p>
    </motion.div>
  );
}