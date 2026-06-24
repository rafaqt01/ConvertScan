'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Search, Filter, Users, Building2, UserPlus, Tags, Mail, Phone, MoreHorizontal, Download, Upload, Sparkles } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { PageHeader } from '@/components/shell/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createBrowserSupabase } from '@/lib/supabase/client';
import { leadSchema, contactSchema, companySchema } from '@/lib/validations';
import { toast } from 'sonner';
import { formatDate, initials } from '@/lib/utils';

export function CRMClient() {
  const supabase = createBrowserSupabase();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('leads');
  const [createOpen, setCreateOpen] = useState(false);
  const queryClient = useQueryClient();

  const leads = useQuery({
    queryKey: ['leads', search],
    queryFn: async () => {
      let q = supabase.from('leads').select('*, contact:contacts(*), company:companies(*)').order('created_at', { ascending: false }).limit(100);
      if (search) q = q.ilike('source', `%${search}%`);
      return (await q).data ?? [];
    },
  });

  const contacts = useQuery({
    queryKey: ['contacts', search],
    queryFn: async () => {
      let q = supabase.from('contacts').select('*, company:companies(*)').order('created_at', { ascending: false }).limit(100);
      if (search) {
        q = q.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
      }
      return (await q).data ?? [];
    },
  });

  const companies = useQuery({
    queryKey: ['companies', search],
    queryFn: async () => {
      let q = supabase.from('companies').select('*').order('created_at', { ascending: false }).limit(100);
      if (search) q = q.ilike('name', `%${search}%`);
      return (await q).data ?? [];
    },
  });

  const stats = {
    leads: leads.data?.length ?? 0,
    contacts: contacts.data?.length ?? 0,
    companies: companies.data?.length ?? 0,
    qualified: leads.data?.filter((l: any) => l.score >= 70).length ?? 0,
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="CRM"
        description="Centralize leads, contatos e empresas. Busque, filtre e atue."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm"><Upload className="h-4 w-4" /> Importar</Button>
            <Button variant="outline" size="sm"><Download className="h-4 w-4" /> Exportar</Button>
            <Button size="sm" onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" /> Novo</Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatBlock label="Leads" value={stats.leads} icon={UserPlus} />
        <StatBlock label="Contatos" value={stats.contacts} icon={Users} />
        <StatBlock label="Empresas" value={stats.companies} icon={Building2} />
        <StatBlock label="Qualificados" value={stats.qualified} icon={Sparkles} accent />
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar..." className="pl-9" />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm"><Filter className="h-4 w-4" /> Filtros</Button>
            <Button variant="outline" size="sm"><Tags className="h-4 w-4" /> Tags</Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="leads"><UserPlus className="h-3.5 w-3.5 mr-1.5" /> Leads ({stats.leads})</TabsTrigger>
              <TabsTrigger value="contacts"><Users className="h-3.5 w-3.5 mr-1.5" /> Contatos ({stats.contacts})</TabsTrigger>
              <TabsTrigger value="companies"><Building2 className="h-3.5 w-3.5 mr-1.5" /> Empresas ({stats.companies})</TabsTrigger>
            </TabsList>

            <TabsContent value="leads">
              {leads.isLoading ? <SkeletonRows /> : <LeadsTable leads={leads.data ?? []} />}
            </TabsContent>

            <TabsContent value="contacts">
              {contacts.isLoading ? <SkeletonRows /> : <ContactsTable contacts={contacts.data ?? []} />}
            </TabsContent>

            <TabsContent value="companies">
              {companies.isLoading ? <SkeletonRows /> : <CompaniesTable companies={companies.data ?? []} />}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <CreateEntityDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        defaultType={activeTab as 'leads' | 'contacts' | 'companies'}
        onCreated={() => {
          queryClient.invalidateQueries({ queryKey: ['leads'] });
          queryClient.invalidateQueries({ queryKey: ['contacts'] });
          queryClient.invalidateQueries({ queryKey: ['companies'] });
          setCreateOpen(false);
        }}
      />
    </div>
  );
}

function StatBlock({ label, value, icon: Icon, accent }: { label: string; value: number; icon: any; accent?: boolean }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border bg-card p-4 card-hover">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <Icon className={`h-4 w-4 ${accent ? 'text-success' : 'text-muted-foreground'}`} />
      </div>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </motion.div>
  );
}

function SkeletonRows() {
  return (
    <div className="space-y-2 mt-4">
      {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
    </div>
  );
}

function LeadsTable({ leads }: { leads: any[] }) {
  if (!leads.length) return <EmptyState message="Nenhum lead ainda. Crie o primeiro." />;
  return (
    <div className="overflow-x-auto mt-4">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs text-muted-foreground">
            <th className="py-2 font-medium">Lead</th>
            <th className="py-2 font-medium">Origem</th>
            <th className="py-2 font-medium">Score</th>
            <th className="py-2 font-medium">Status</th>
            <th className="py-2 font-medium">Criado</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((l) => (
            <tr key={l.id} className="border-b border-border/40 hover:bg-muted/30 transition-colors">
              <td className="py-2.5">
                <div className="flex items-center gap-2">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback>{initials(l.contact?.first_name ?? 'L')}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{l.contact?.first_name} {l.contact?.last_name ?? ''}</p>
                    <p className="text-xs text-muted-foreground">{l.contact?.email ?? '—'}</p>
                  </div>
                </div>
              </td>
              <td className="py-2.5 text-muted-foreground">{l.source ?? '—'}</td>
              <td className="py-2.5">
                <ScorePill score={l.score} />
              </td>
              <td className="py-2.5"><Badge variant="muted">{l.status}</Badge></td>
              <td className="py-2.5 text-muted-foreground">{formatDate(l.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ContactsTable({ contacts }: { contacts: any[] }) {
  if (!contacts.length) return <EmptyState message="Nenhum contato ainda." />;
  return (
    <div className="overflow-x-auto mt-4">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs text-muted-foreground">
            <th className="py-2 font-medium">Contato</th>
            <th className="py-2 font-medium">Empresa</th>
            <th className="py-2 font-medium">Email</th>
            <th className="py-2 font-medium">Telefone</th>
          </tr>
        </thead>
        <tbody>
          {contacts.map((c) => (
            <tr key={c.id} className="border-b border-border/40 hover:bg-muted/30">
              <td className="py-2.5">
                <div className="flex items-center gap-2">
                  <Avatar className="h-7 w-7"><AvatarFallback>{initials(c.first_name)}</AvatarFallback></Avatar>
                  <span className="font-medium">{c.first_name} {c.last_name ?? ''}</span>
                </div>
              </td>
              <td className="py-2.5 text-muted-foreground">{c.company?.name ?? '—'}</td>
              <td className="py-2.5 text-muted-foreground flex items-center gap-1.5"><Mail className="h-3 w-3" />{c.email ?? '—'}</td>
              <td className="py-2.5 text-muted-foreground flex items-center gap-1.5"><Phone className="h-3 w-3" />{c.phone ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CompaniesTable({ companies }: { companies: any[] }) {
  if (!companies.length) return <EmptyState message="Nenhuma empresa ainda." />;
  return (
    <div className="overflow-x-auto mt-4">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs text-muted-foreground">
            <th className="py-2 font-medium">Empresa</th>
            <th className="py-2 font-medium">Domínio</th>
            <th className="py-2 font-medium">Setor</th>
            <th className="py-2 font-medium">Tamanho</th>
          </tr>
        </thead>
        <tbody>
          {companies.map((c) => (
            <tr key={c.id} className="border-b border-border/40 hover:bg-muted/30">
              <td className="py-2.5">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded bg-primary/15 text-primary flex items-center justify-center text-xs font-bold">
                    {c.name.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="font-medium">{c.name}</span>
                </div>
              </td>
              <td className="py-2.5 text-muted-foreground">{c.domain ?? '—'}</td>
              <td className="py-2.5"><Badge variant="outline">{c.industry ?? '—'}</Badge></td>
              <td className="py-2.5 text-muted-foreground">{c.size ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ScorePill({ score }: { score: number }) {
  const variant = score >= 70 ? 'success' : score >= 40 ? 'warning' : 'muted';
  return <Badge variant={variant as any}>{score}</Badge>;
}

function EmptyState({ message }: { message: string }) {
  return <div className="py-12 text-center text-sm text-muted-foreground">{message}</div>;
}

function CreateEntityDialog({ open, onOpenChange, defaultType, onCreated }: { open: boolean; onOpenChange: (o: boolean) => void; defaultType: 'leads' | 'contacts' | 'companies'; onCreated: () => void }) {
  const [type, setType] = useState<'leads' | 'contacts' | 'companies'>(defaultType);
  const [loading, setLoading] = useState(false);
  const supabase = createBrowserSupabase();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      const form = new FormData(e.currentTarget);
      const data: any = {};
      form.forEach((v, k) => {
        if (k === 'tags') {
          data.tags = String(v).split(',').map((t) => t.trim()).filter(Boolean);
        } else {
          data[k] = String(v) || null;
        }
      });
      if (type === 'leads') {
        leadSchema.parse({ ...data, score: Number(data.score ?? 0) });
      } else if (type === 'contacts') {
        contactSchema.parse(data);
      } else {
        companySchema.parse({ ...data, revenue: data.revenue ? Number(data.revenue) : null });
      }
      const { error } = await supabase.from(type).insert(data);
      if (error) throw error;
      toast.success('Criado com sucesso!');
      onCreated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao criar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo registro</DialogTitle>
        </DialogHeader>
        <Tabs value={type} onValueChange={(v) => setType(v as any)}>
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="leads">Lead</TabsTrigger>
            <TabsTrigger value="contacts">Contato</TabsTrigger>
            <TabsTrigger value="companies">Empresa</TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit} className="space-y-3 mt-4">
            {type === 'leads' && (
              <>
                <div><Label>Fonte</Label><Input name="source" placeholder="Meta Ads, Google..." /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>Score</Label><Input name="score" type="number" min={0} max={100} defaultValue={50} /></div>
                  <div><Label>Status</Label><Input name="status" defaultValue="new" /></div>
                </div>
              </>
            )}
            {type === 'contacts' && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>Nome *</Label><Input name="first_name" required /></div>
                  <div><Label>Sobrenome</Label><Input name="last_name" /></div>
                </div>
                <div><Label>Email</Label><Input name="email" type="email" /></div>
                <div><Label>Telefone</Label><Input name="phone" /></div>
              </>
            )}
            {type === 'companies' && (
              <>
                <div><Label>Nome *</Label><Input name="name" required /></div>
                <div><Label>Domínio</Label><Input name="domain" placeholder="empresa.com" /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>Setor</Label><Input name="industry" /></div>
                  <div><Label>Tamanho</Label><Input name="size" /></div>
                </div>
              </>
            )}
            <div><Label>Observações</Label><Textarea name="notes" rows={2} /></div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" disabled={loading}>{loading ? 'Salvando...' : 'Criar'}</Button>
            </DialogFooter>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}