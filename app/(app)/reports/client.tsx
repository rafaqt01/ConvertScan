'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { FileText, Download, Share2, Trash2, Loader2, FileSpreadsheet, FileCode, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { PageHeader } from '@/components/shell/page-header';
import { createBrowserSupabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { formatDateTime, formatCompact } from '@/lib/utils';

const TYPES = [
  { id: 'executive', label: 'Executivo', desc: 'Visão geral para C-level' },
  { id: 'marketing', label: 'Marketing', desc: 'Performance de canais e campanhas' },
  { id: 'sales', label: 'Vendas', desc: 'Pipeline, conversão e deals' },
  { id: 'finance', label: 'Financeiro', desc: 'Receita, churn, LTV' },
];

const FORMATS = [
  { id: 'pdf', label: 'PDF', icon: FileText },
  { id: 'csv', label: 'CSV', icon: FileSpreadsheet },
  { id: 'xlsx', label: 'Excel', icon: FileSpreadsheet },
];

interface Props { reports: any[] }

export function ReportsClient({ reports }: Props) {
  const supabase = createBrowserSupabase();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState('executive');
  const [format, setFormat] = useState('pdf');
  const [range, setRange] = useState('30d');

  const create = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Erro ao gerar');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      toast.success('Relatório gerado!');
      setCreateOpen(false);
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('reports').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      toast.success('Removido');
    },
  });

  async function handleGenerate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      const form = new FormData(e.currentTarget);
      await create.mutateAsync({
        name: String(form.get('name')),
        type,
        format,
        range,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Relatórios"
        description="Gere relatórios executivos em PDF, CSV ou Excel. Compartilhe com a equipe."
        actions={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" /> Novo relatório
          </Button>
        }
      />

      {reports.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" />
            <h3 className="font-semibold">Nenhum relatório ainda</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">Gere seu primeiro relatório executivo.</p>
            <Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" /> Gerar relatório</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {reports.map((r, i) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Card className="card-hover">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <FileText className="h-4 w-4" />
                    </div>
                    <Badge variant="outline">{r.format.toUpperCase()}</Badge>
                  </div>
                  <p className="text-sm font-semibold line-clamp-1">{r.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{formatDateTime(r.created_at)}</p>
                  {r.file_size && <p className="text-[10px] text-muted-foreground">{formatCompact(r.file_size / 1024)} KB</p>}
                  <div className="flex items-center gap-1.5 mt-3">
                    <Button size="sm" variant="outline" className="flex-1" asChild>
                      <a href={`/api/reports/${r.id}/download`}>
                        <Download className="h-3 w-3" /> Baixar
                      </a>
                    </Button>
                    <Button size="sm" variant="ghost">
                      <Share2 className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => remove.mutate(r.id)}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gerar relatório</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleGenerate} className="space-y-3">
            <div><Label>Nome</Label><Input name="name" required placeholder="Ex: Relatório executivo Q3" /></div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label>Tipo</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TYPES.map((t) => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Formato</Label>
                <Select value={format} onValueChange={setFormat}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FORMATS.map((f) => <SelectItem key={f.id} value={f.id}>{f.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Período</Label>
                <Select value={range} onValueChange={setRange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">7 dias</SelectItem>
                    <SelectItem value="30d">30 dias</SelectItem>
                    <SelectItem value="90d">90 dias</SelectItem>
                    <SelectItem value="ytd">YTD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="rounded-md border border-border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">
                <strong>{TYPES.find((t) => t.id === type)?.label}:</strong> {TYPES.find((t) => t.id === type)?.desc}
              </p>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Gerar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}