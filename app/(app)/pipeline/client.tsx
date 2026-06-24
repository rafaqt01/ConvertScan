'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { DndContext, type DragEndEvent, PointerSensor, useSensor, useSensors, useDraggable, useDroppable, closestCenter } from '@dnd-kit/core';
import { motion } from 'framer-motion';
import { Plus, Briefcase, Calendar, DollarSign, User, MoreHorizontal, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { PageHeader } from '@/components/shell/page-header';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { createBrowserSupabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { dealSchema } from '@/lib/validations';
import { cn, formatCurrency, formatDate, initials } from '@/lib/utils';
import type { Deal, PipelineStage } from '@/types/database';

interface Props {
  stages: PipelineStage[];
  initialDeals: any[];
}

export function PipelineClient({ stages: initialStages, initialDeals }: Props) {
  const [stages] = useState(initialStages);
  const [deals, setDeals] = useState<Record<string, any[]>>(() => {
    const grouped: Record<string, any[]> = {};
    initialStages.forEach((s) => { grouped[s.id] = []; });
    initialDeals.forEach((d) => {
      if (!grouped[d.stage_id]) grouped[d.stage_id] = [];
      grouped[d.stage_id].push(d);
    });
    return grouped;
  });
  const [createOpen, setCreateOpen] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const supabase = createBrowserSupabase();
  const queryClient = useQueryClient();

  const updateDeal = useMutation({
    mutationFn: async ({ dealId, stageId }: { dealId: string; stageId: string }) => {
      const { error } = await supabase.from('deals').update({ stage_id: stageId }).eq('id', dealId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Erro'),
  });

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const dealId = String(active.id);
    const newStageId = String(over.id);

    let sourceStage: string | null = null;
    for (const [stageId, list] of Object.entries(deals)) {
      if (list.find((d) => d.id === dealId)) {
        sourceStage = stageId;
        break;
      }
    }
    if (!sourceStage || sourceStage === newStageId) return;

    setDeals((prev) => {
      const next = { ...prev };
      const deal = next[sourceStage!].find((d) => d.id === dealId)!;
      next[sourceStage!] = next[sourceStage!].filter((d) => d.id !== dealId);
      next[newStageId] = [{ ...deal, stage_id: newStageId }, ...next[newStageId]];
      return next;
    });

    updateDeal.mutate({ dealId, stageId: newStageId });
  }

  const totalValue = Object.values(deals).flat().reduce((s, d) => s + (d.value ?? 0), 0);

  return (
    <div className="p-6 space-y-6 h-full flex flex-col">
      <PageHeader
        title="Pipeline"
        description="Arraste os negócios entre as etapas. Atualize valores, datas e responsáveis."
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1.5"><DollarSign className="h-3 w-3" /> {formatCurrency(totalValue)}</Badge>
            <Button variant="outline" size="sm"><Filter className="h-4 w-4" /></Button>
            <Button size="sm" onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" /> Negócio</Button>
          </div>
        }
      />

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="flex-1 overflow-x-auto">
          <div className="flex gap-3 min-w-max pb-4">
            {stages.map((stage) => {
              const list = deals[stage.id] ?? [];
              const stageValue = list.reduce((s, d) => s + (d.value ?? 0), 0);
              return (
                <KanbanColumn
                  key={stage.id}
                  stage={stage}
                  deals={list}
                  stageValue={stageValue}
                />
              );
            })}
          </div>
        </div>
      </DndContext>

      <CreateDealDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        stages={stages}
        onCreated={() => {
          queryClient.invalidateQueries({ queryKey: ['deals'] });
          setCreateOpen(false);
        }}
      />
    </div>
  );
}

function KanbanColumn({ stage, deals: list, stageValue }: { stage: PipelineStage; deals: any[]; stageValue: number }) {
  const { isOver, setNodeRef } = useDroppable({ id: stage.id });

  return (
    <div className="w-80 flex-shrink-0">
      <div className="rounded-xl border border-border bg-card/40 backdrop-blur-sm flex flex-col h-[calc(100vh-200px)]">
        <div className="p-3 border-b border-border">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: stage.color }} />
              <span className="text-sm font-semibold">{stage.name}</span>
              <Badge variant="muted" className="h-4 px-1.5 text-[10px]">{list.length}</Badge>
            </div>
            <Button variant="ghost" size="icon" className="h-6 w-6"><Plus className="h-3 w-3" /></Button>
          </div>
          <p className="text-[11px] text-muted-foreground">{formatCurrency(stageValue)} · {stage.probability}% prob.</p>
        </div>

        <div
          ref={setNodeRef}
          className={cn(
            'flex-1 overflow-y-auto p-2 space-y-2 transition-colors',
            isOver && 'bg-primary/5'
          )}
        >
          {list.length === 0 && (
            <div className="h-20 rounded-md border border-dashed border-border/50 flex items-center justify-center text-xs text-muted-foreground">
              Arraste deals aqui
            </div>
          )}
          {list.map((d) => <DealCard key={d.id} deal={d} />)}
        </div>
      </div>
    </div>
  );
}

function DealCard({ deal }: { deal: any }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: deal.id });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        'rounded-md border border-border bg-card p-3 cursor-grab active:cursor-grabbing card-hover select-none',
        isDragging && 'opacity-40 shadow-2xl'
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-sm font-medium leading-tight flex-1">{deal.title}</h4>
        <button className="text-muted-foreground hover:text-foreground">
          <MoreHorizontal className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-primary">{formatCurrency(deal.value ?? 0)}</span>
        {deal.expected_close_date && (
          <span className="text-muted-foreground flex items-center gap-1">
            <Calendar className="h-3 w-3" />{formatDate(deal.expected_close_date)}
          </span>
        )}
      </div>
      {(deal.contact || deal.owner) && (
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
          <div className="flex items-center gap-1.5 min-w-0">
            {deal.contact && (
              <>
                <Avatar className="h-5 w-5">
                  <AvatarFallback className="text-[9px]">{initials(deal.contact.first_name)}</AvatarFallback>
                </Avatar>
                <span className="text-[11px] text-muted-foreground truncate">{deal.contact.first_name}</span>
              </>
            )}
          </div>
          {deal.owner && (
            <Avatar className="h-5 w-5">
              <AvatarFallback className="text-[9px]">{initials(deal.owner.full_name ?? 'V')}</AvatarFallback>
            </Avatar>
          )}
        </div>
      )}
    </motion.div>
  );
}

function CreateDealDialog({ open, onOpenChange, stages, onCreated }: { open: boolean; onOpenChange: (o: boolean) => void; stages: PipelineStage[]; onCreated: () => void }) {
  const [loading, setLoading] = useState(false);
  const supabase = createBrowserSupabase();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      const form = new FormData(e.currentTarget);
      const data: any = {
        title: String(form.get('title')),
        value: Number(form.get('value') ?? 0),
        stage_id: String(form.get('stage_id')),
        expected_close_date: String(form.get('expected_close_date') ?? '') || null,
      };
      dealSchema.parse(data);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) data.owner_id = user.id;

      const { error } = await supabase.from('deals').insert(data);
      if (error) throw error;
      toast.success('Negócio criado!');
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
        <DialogHeader>
          <DialogTitle>Novo negócio</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div><Label>Título *</Label><Input name="title" required placeholder="Ex: Contrato ACME Q3" /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Valor</Label><Input name="value" type="number" min={0} step={0.01} defaultValue={0} /></div>
            <div><Label>Previsão</Label><Input name="expected_close_date" type="date" /></div>
          </div>
          <div>
            <Label>Etapa</Label>
            <Select name="stage_id" defaultValue={stages[0]?.id}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {stages.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div><Label>Observações</Label><Textarea name="notes" rows={2} /></div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Salvando...' : 'Criar'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}