'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Workflow, Zap, ArrowRight, Play, Pause, Trash2, Mail, Bell, UserCheck, CheckCircle2, GitBranch, Settings, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { PageHeader } from '@/components/shell/page-header';
import { createBrowserSupabase } from '@/lib/supabase/client';
import { automationSchema } from '@/lib/validations';
import { toast } from 'sonner';
import { formatDateTime, cn } from '@/lib/utils';

const TRIGGERS = [
  { type: 'lead.created', label: 'Lead criado', icon: UserCheck },
  { type: 'lead.qualified', label: 'Lead qualificado (score > 70)', icon: UserCheck },
  { type: 'deal.stage_changed', label: 'Negócio mudou de etapa', icon: GitBranch },
  { type: 'deal.won', label: 'Negócio fechado (won)', icon: CheckCircle2 },
  { type: 'task.overdue', label: 'Tarefa atrasada', icon: Zap },
  { type: 'metric.drop', label: 'Métrica caiu > 15%', icon: Zap },
];

const ACTIONS = [
  { type: 'create_task', label: 'Criar tarefa', icon: CheckCircle2, color: 'primary' },
  { type: 'send_email', label: 'Enviar e-mail', icon: Mail, color: 'blue' },
  { type: 'send_notification', label: 'Enviar notificação', icon: Bell, color: 'yellow' },
  { type: 'move_deal_stage', label: 'Mover etapa do negócio', icon: GitBranch, color: 'green' },
  { type: 'assign_user', label: 'Atribuir a usuário', icon: UserCheck, color: 'purple' },
  { type: 'ai_analyze', label: 'Analisar com IA', icon: Sparkles, color: 'primary' },
];

export function AutomationsClient() {
  const supabase = createBrowserSupabase();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);

  const { data: automations = [], isLoading } = useQuery({
    queryKey: ['automations'],
    queryFn: async () => {
      const { data } = await supabase
        .from('automations')
        .select('*')
        .order('updated_at', { ascending: false });
      return data ?? [];
    },
  });

  const toggleStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from('automations').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['automations'] }),
  });

  const deleteAuto = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('automations').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automations'] });
      toast.success('Automação removida');
    },
  });

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Automações"
        description="Crie fluxos sem código. Trigger → Ação → Tempo → Resultado."
        actions={
          <Button size="sm" onClick={() => { setEditing(null); setCreateOpen(true); }}>
            <Plus className="h-4 w-4" /> Nova automação
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPI label="Total" value={automations.length} icon={Workflow} />
        <KPI label="Ativas" value={automations.filter((a: any) => a.status === 'active').length} icon={Play} accent />
        <KPI label="Pausadas" value={automations.filter((a: any) => a.status === 'paused').length} icon={Pause} />
      </div>

      {isLoading ? (
        <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">Carregando...</CardContent></Card>
      ) : automations.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Workflow className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" />
            <h3 className="font-semibold">Crie sua primeira automação</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">Conecte eventos a ações e elimine trabalho manual.</p>
            <Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" /> Criar automação</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {automations.map((a: any) => (
            <Card key={a.id} className="card-hover">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle>{a.name}</CardTitle>
                    <CardDescription className="mt-1">{a.description ?? 'Sem descrição'}</CardDescription>
                  </div>
                  <Badge variant={a.status === 'active' ? 'success' : a.status === 'paused' ? 'muted' : 'warning'}>
                    {a.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="outline" className="gap-1">
                    <Zap className="h-3 w-3" />
                    {TRIGGERS.find((t) => t.type === a.trigger?.type)?.label ?? a.trigger?.type}
                  </Badge>
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  <Badge variant="default" className="gap-1">
                    <Sparkles className="h-3 w-3" />
                    {a.steps?.length ?? 0} ações
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">Atualizada {formatDateTime(a.updated_at)}</p>
                <div className="flex items-center gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleStatus.mutate({ id: a.id, status: a.status === 'active' ? 'paused' : 'active' })}
                  >
                    {a.status === 'active' ? <><Pause className="h-3 w-3" /> Pausar</> : <><Play className="h-3 w-3" /> Ativar</>}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => { setEditing(a); setCreateOpen(true); }}>
                    <Settings className="h-3 w-3" /> Editar
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteAuto.mutate(a.id)}>
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AutomationDialog
        open={createOpen}
        onOpenChange={(o) => { setCreateOpen(o); if (!o) setEditing(null); }}
        editing={editing}
        onSaved={() => { queryClient.invalidateQueries({ queryKey: ['automations'] }); setCreateOpen(false); setEditing(null); }}
      />
    </div>
  );
}

function KPI({ label, value, icon: Icon, accent }: { label: string; value: number; icon: any; accent?: boolean }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <Icon className={cn('h-4 w-4', accent ? 'text-success' : 'text-muted-foreground')} />
      </div>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </motion.div>
  );
}

function AutomationDialog({ open, onOpenChange, editing, onSaved }: { open: boolean; onOpenChange: (o: boolean) => void; editing: any | null; onSaved: () => void }) {
  const [loading, setLoading] = useState(false);
  const [trigger, setTrigger] = useState(editing?.trigger?.type ?? 'lead.created');
  const [steps, setSteps] = useState<any[]>(editing?.steps ?? [{ type: 'create_task', config: {}, delay_minutes: 0 }]);
  const supabase = createBrowserSupabase();

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      const form = new FormData(e.currentTarget);
      const data: any = {
        name: String(form.get('name')),
        description: String(form.get('description') ?? '') || null,
        status: 'draft',
        trigger: { type: trigger, config: {} },
        steps,
      };
      automationSchema.parse(data);

      if (editing) {
        const { error } = await supabase.from('automations').update(data).eq('id', editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('automations').insert(data);
        if (error) throw error;
      }
      toast.success('Automação salva!');
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? 'Editar' : 'Nova'} automação</DialogTitle>
        </DialogHeader>
        <form onSubmit={save} className="space-y-4">
          <div>
            <Label>Nome *</Label>
            <Input name="name" required defaultValue={editing?.name ?? ''} placeholder="Ex: Qualificar lead quente" />
          </div>
          <div>
            <Label>Descrição</Label>
            <Textarea name="description" rows={2} defaultValue={editing?.description ?? ''} />
          </div>

          <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
            <Label className="mb-2">Trigger (quando)</Label>
            <Select value={trigger} onValueChange={setTrigger}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TRIGGERS.map((t) => (
                  <SelectItem key={t.type} value={t.type}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg border border-success/30 bg-success/5 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <Label>Ações</Label>
              <Button type="button" variant="outline" size="sm" onClick={() => setSteps((s) => [...s, { type: 'send_notification', config: {}, delay_minutes: 0 }])}>
                <Plus className="h-3 w-3" /> Adicionar
              </Button>
            </div>
            <AnimatePresence>
              {steps.map((step, i) => (
                <motion.div key={i} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex items-center gap-2 rounded-md border border-border bg-background/50 p-2">
                  <Select value={step.type} onValueChange={(v) => setSteps((arr) => arr.map((s, idx) => idx === i ? { ...s, type: v } : s))}>
                    <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ACTIONS.map((a) => <SelectItem key={a.type} value={a.type}>{a.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    min={0}
                    value={step.delay_minutes}
                    onChange={(e) => setSteps((arr) => arr.map((s, idx) => idx === i ? { ...s, delay_minutes: Number(e.target.value) } : s))}
                    className="w-20"
                    placeholder="min"
                  />
                  <Button type="button" variant="ghost" size="icon" onClick={() => setSteps((arr) => arr.filter((_, idx) => idx !== i))}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

