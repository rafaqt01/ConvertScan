'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, ListChecks, CheckCircle2, Clock, AlertCircle, TrendingUp, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { PageHeader } from '@/components/shell/page-header';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { createBrowserSupabase } from '@/lib/supabase/client';
import { taskSchema } from '@/lib/validations';
import { toast } from 'sonner';
import { cn, formatDate, initials } from '@/lib/utils';

const COLUMNS = [
  { id: 'todo', label: 'A fazer', color: '#8A8A9E' },
  { id: 'in_progress', label: 'Em andamento', color: '#1A1AFF' },
  { id: 'review', label: 'Revisão', color: '#FFB800' },
  { id: 'done', label: 'Concluído', color: '#00E5A0' },
] as const;

export function TasksClient() {
  const supabase = createBrowserSupabase();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const { data } = await supabase
        .from('tasks')
        .select('*, assignee:profiles!tasks_assignee_id_fkey(full_name, avatar_url), creator:profiles!tasks_creator_id_fkey(full_name)')
        .order('created_at', { ascending: false })
        .limit(200);
      return data ?? [];
    },
  });

  const updateTask = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from('tasks').update({
        status,
        completed_at: status === 'done' ? new Date().toISOString() : null,
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const stats = {
    total: tasks.length,
    done: tasks.filter((t: any) => t.status === 'done').length,
    overdue: tasks.filter((t: any) => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done').length,
    productivity: tasks.length ? Math.round((tasks.filter((t: any) => t.status === 'done').length / tasks.length) * 100) : 0,
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Tarefas"
        description="Produtividade da equipe em um só lugar."
        actions={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" /> Nova tarefa
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPIBlock label="Total" value={stats.total} icon={ListChecks} />
        <KPIBlock label="Concluídas" value={stats.done} icon={CheckCircle2} />
        <KPIBlock label="Atrasadas" value={stats.overdue} icon={AlertCircle} danger={stats.overdue > 0} />
        <KPIBlock label="Produtividade" value={`${stats.productivity}%`} icon={TrendingUp} accent />
      </div>

      <Tabs defaultValue="board">
        <TabsList>
          <TabsTrigger value="board">Board</TabsTrigger>
          <TabsTrigger value="list">Lista</TabsTrigger>
        </TabsList>

        <TabsContent value="board">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {COLUMNS.map((col) => {
              const list = tasks.filter((t: any) => t.status === col.id);
              return (
                <Card key={col.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full" style={{ background: col.color }} />
                        <CardTitle className="text-sm">{col.label}</CardTitle>
                      </div>
                      <Badge variant="muted">{list.length}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {list.slice(0, 10).map((t: any) => (
                      <TaskCard key={t.id} task={t} onStatusChange={(s) => updateTask.mutate({ id: t.id, status: s })} />
                    ))}
                    {list.length === 0 && (
                      <div className="py-8 text-center text-xs text-muted-foreground">Vazio</div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="list">
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="p-3 font-medium">Status</th>
                    <th className="p-3 font-medium">Tarefa</th>
                    <th className="p-3 font-medium">Prioridade</th>
                    <th className="p-3 font-medium">Responsável</th>
                    <th className="p-3 font-medium">Prazo</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((t: any) => (
                    <tr key={t.id} className="border-b border-border/40 hover:bg-muted/30">
                      <td className="p-3">
                        <button
                          onClick={() => updateTask.mutate({ id: t.id, status: t.status === 'done' ? 'todo' : 'done' })}
                          className="flex items-center gap-2"
                        >
                          {t.status === 'done' ? (
                            <CheckCircle2 className="h-4 w-4 text-success" />
                          ) : (
                            <div className="h-4 w-4 rounded-full border-2 border-border" />
                          )}
                        </button>
                      </td>
                      <td className="p-3">
                        <p className={cn('font-medium', t.status === 'done' && 'line-through text-muted-foreground')}>{t.title}</p>
                        {t.description && <p className="text-xs text-muted-foreground">{t.description}</p>}
                      </td>
                      <td className="p-3"><PriorityBadge priority={t.priority} /></td>
                      <td className="p-3">
                        {t.assignee && (
                          <div className="flex items-center gap-1.5">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-[9px]">{initials(t.assignee.full_name ?? '?')}</AvatarFallback>
                            </Avatar>
                            <span className="text-xs">{t.assignee.full_name}</span>
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-xs text-muted-foreground">{t.due_date ? formatDate(t.due_date) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <CreateTaskDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={() => { queryClient.invalidateQueries({ queryKey: ['tasks'] }); setCreateOpen(false); }} />
    </div>
  );
}

function KPIBlock({ label, value, icon: Icon, danger, accent }: { label: string; value: number | string; icon: any; danger?: boolean; accent?: boolean }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <Icon className={cn('h-4 w-4', danger ? 'text-destructive' : accent ? 'text-success' : 'text-muted-foreground')} />
      </div>
      <p className={cn('mt-2 text-2xl font-semibold', danger && 'text-destructive')}>{value}</p>
    </motion.div>
  );
}

function TaskCard({ task, onStatusChange }: { task: any; onStatusChange: (s: string) => void }) {
  const overdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';
  return (
    <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-md border border-border bg-background/40 p-3 card-hover">
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <p className="text-sm font-medium leading-snug">{task.title}</p>
        <button
          onClick={() => onStatusChange(task.status === 'done' ? 'todo' : 'done')}
          className="text-muted-foreground hover:text-success"
        >
          {task.status === 'done' ? <CheckCircle2 className="h-4 w-4 text-success" /> : <div className="h-4 w-4 rounded-full border-2 border-border" />}
        </button>
      </div>
      {task.description && <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{task.description}</p>}
      <div className="flex items-center justify-between">
        <PriorityBadge priority={task.priority} />
        {task.due_date && (
          <span className={cn('text-[10px] flex items-center gap-1', overdue ? 'text-destructive' : 'text-muted-foreground')}>
            <Clock className="h-3 w-3" />{formatDate(task.due_date)}
          </span>
        )}
      </div>
    </motion.div>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const map: any = { urgent: 'destructive', high: 'warning', medium: 'default', low: 'muted' };
  return <Badge variant={map[priority] ?? 'muted'} className="text-[10px]">{priority}</Badge>;
}

function CreateTaskDialog({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (o: boolean) => void; onCreated: () => void }) {
  const [loading, setLoading] = useState(false);
  const supabase = createBrowserSupabase();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      const form = new FormData(e.currentTarget);
      const data: any = {
        title: String(form.get('title')),
        description: String(form.get('description') ?? '') || null,
        priority: String(form.get('priority')),
        due_date: String(form.get('due_date') ?? '') || null,
        status: 'todo',
      };
      taskSchema.parse(data);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) data.creator_id = user.id;
      const { error } = await supabase.from('tasks').insert(data);
      if (error) throw error;
      toast.success('Tarefa criada!');
      onCreated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Nova tarefa</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div><Label>Título *</Label><Input name="title" required /></div>
          <div><Label>Descrição</Label><Textarea name="description" rows={3} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Prioridade</Label>
              <Select name="priority" defaultValue="medium">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Prazo</Label><Input name="due_date" type="date" /></div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Salvando...' : 'Criar'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}