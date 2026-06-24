'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Plug, Check, Loader2, ExternalLink, Search, BarChart3, Megaphone, CreditCard,
  ShoppingCart, Users, MessageCircle, FileSpreadsheet, RefreshCw, X,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/shell/page-header';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { createBrowserSupabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { formatDateTime } from '@/lib/utils';

const PROVIDERS = [
  // Analytics
  { id: 'google_analytics', name: 'Google Analytics 4', category: 'Analytics', icon: BarChart3, color: '#F9AB00', description: 'Sessões, fontes, conversões.' },
  { id: 'search_console', name: 'Google Search Console', category: 'Analytics', icon: Search, color: '#458FF6', description: 'Performance orgânica, indexação.' },
  // Ads
  { id: 'google_ads', name: 'Google Ads', category: 'Ads', icon: Megaphone, color: '#4285F4', description: 'Campanhas de search e display.' },
  { id: 'meta_ads', name: 'Meta Ads', category: 'Ads', icon: Megaphone, color: '#0866FF', description: 'Facebook e Instagram Ads.' },
  { id: 'linkedin_ads', name: 'LinkedIn Ads', category: 'Ads', icon: Megaphone, color: '#0A66C2', description: 'B2B e geração de leads.' },
  { id: 'tiktok_ads', name: 'TikTok Ads', category: 'Ads', icon: Megaphone, color: '#000000', description: 'Alcance jovem.' },
  // Payments
  { id: 'stripe', name: 'Stripe', category: 'Pagamentos', icon: CreditCard, color: '#635BFF', description: 'Pagamentos globais.' },
  { id: 'mercadopago', name: 'Mercado Pago', category: 'Pagamentos', icon: CreditCard, color: '#00B1EA', description: 'Pagamentos LATAM.' },
  { id: 'hotmart', name: 'Hotmart', category: 'Pagamentos', icon: ShoppingCart, color: '#F04E23', description: 'Infoprodutos.' },
  { id: 'kiwify', name: 'Kiwify', category: 'Pagamentos', icon: ShoppingCart, color: '#22C55E', description: 'Infoprodutos BR.' },
  { id: 'shopify', name: 'Shopify', category: 'Pagamentos', icon: ShoppingCart, color: '#96BF48', description: 'E-commerce.' },
  // CRM
  { id: 'hubspot', name: 'HubSpot', category: 'CRM', icon: Users, color: '#FF7A59', description: 'CRM + marketing.' },
  { id: 'rd_station', name: 'RD Station', category: 'CRM', icon: Users, color: '#19B4FF', description: 'Marketing automation.' },
  { id: 'pipedrive', name: 'Pipedrive', category: 'CRM', icon: Users, color: '#017737', description: 'CRM de vendas.' },
  // Communication
  { id: 'whatsapp', name: 'WhatsApp Business', category: 'Comunicação', icon: MessageCircle, color: '#25D366', description: 'Mensagens e atendimento.' },
  // Other
  { id: 'google_sheets', name: 'Google Sheets', category: 'Outros', icon: FileSpreadsheet, color: '#34A853', description: 'Importação via planilha.' },
];

interface Props { integrations: any[] }

export function IntegrationsClient({ integrations: initial }: Props) {
  const supabase = createBrowserSupabase();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [connectTarget, setConnectTarget] = useState<string | null>(null);

  const integrationMap = new Map(initial.map((i) => [i.provider, i]));

  const filtered = PROVIDERS.filter((p) => {
    if (category !== 'all' && p.category !== category) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const categories = Array.from(new Set(PROVIDERS.map((p) => p.category)));

  const connect = useMutation({
    mutationFn: async (provider: string) => {
      const { error } = await supabase.from('integrations').upsert({
        provider,
        status: 'connected',
        config: {},
      }, { onConflict: 'organization_id,provider' });
      if (error) throw error;
    },
    onSuccess: (_, provider) => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      toast.success(`${PROVIDERS.find((p) => p.id === provider)?.name} conectado!`);
      setConnectTarget(null);
    },
  });

  const disconnect = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('integrations').update({ status: 'disconnected' }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      toast.success('Desconectado');
    },
  });

  const sync = useMutation({
    mutationFn: async (provider: string) => {
      const res = await fetch('/api/integrations/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      });
      if (!res.ok) throw new Error('Falha no sync');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      toast.success('Sincronização iniciada!');
    },
  });

  const stats = {
    total: PROVIDERS.length,
    connected: initial.filter((i) => i.status === 'connected').length,
    errors: initial.filter((i) => i.last_sync_status === 'error').length,
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Central de Integrações"
        description="Conecte suas fontes de dados. Normalização automática."
        actions={
          <Button variant="outline" size="sm" onClick={() => initial.filter((i) => i.status === 'connected').forEach((i) => sync.mutate(i.provider))}>
            <RefreshCw className="h-4 w-4" /> Sincronizar tudo
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Stat label="Total de conectores" value={stats.total} />
        <Stat label="Conectados" value={stats.connected} accent />
        <Stat label="Com erro" value={stats.errors} danger={stats.errors > 0} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={category} onValueChange={setCategory}>
          <TabsList>
            <TabsTrigger value="all">Todos</TabsTrigger>
            {categories.map((c) => <TabsTrigger key={c} value={c}>{c}</TabsTrigger>)}
          </TabsList>
        </Tabs>
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar integração..." className="pl-9" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((p) => {
          const integration = integrationMap.get(p.id);
          const connected = integration?.status === 'connected';
          const error = integration?.last_sync_status === 'error';
          const Icon = p.icon;
          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-border bg-card p-4 card-hover"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: `${p.color}20`, color: p.color }}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{p.name}</p>
                    <Badge variant="muted" className="text-[10px] mt-0.5">{p.category}</Badge>
                  </div>
                </div>
                {connected ? (
                  <Badge variant="success" className="gap-1"><Check className="h-3 w-3" /> Conectado</Badge>
                ) : (
                  <Badge variant="muted">Desconectado</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mb-3">{p.description}</p>
              {connected && integration?.last_sync_at && (
                <p className="text-[10px] text-muted-foreground mb-3">
                  Última sync: {formatDateTime(integration.last_sync_at)}
                  {error && <span className="text-destructive ml-1">· erro</span>}
                </p>
              )}
              <div className="flex items-center gap-2">
                {connected ? (
                  <>
                    <Button variant="outline" size="sm" onClick={() => sync.mutate(p.id)} className="flex-1">
                      <RefreshCw className="h-3 w-3" /> Sincronizar
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => disconnect.mutate(integration.id)}>
                      <X className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </>
                ) : (
                  <Button size="sm" onClick={() => setConnectTarget(p.id)} className="w-full">
                    <Plug className="h-3.5 w-3.5" /> Conectar
                  </Button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      <ConnectDialog
        provider={connectTarget}
        onClose={() => setConnectTarget(null)}
        onConnect={() => connectTarget && connect.mutate(connectTarget)}
        loading={connect.isPending}
      />
    </div>
  );
}

function Stat({ label, value, accent, danger }: { label: string; value: number; accent?: boolean; danger?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${accent ? 'text-success' : danger ? 'text-destructive' : ''}`}>{value}</p>
    </div>
  );
}

function ConnectDialog({ provider, onClose, onConnect, loading }: { provider: string | null; onClose: () => void; onConnect: () => void; loading: boolean }) {
  const p = PROVIDERS.find((x) => x.id === provider);
  const [step, setStep] = useState<'auth' | 'config'>('auth');

  return (
    <Dialog open={!!provider} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Conectar {p?.name}</DialogTitle>
        </DialogHeader>
        {step === 'auth' && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Você será redirecionado para autorizar a conexão via OAuth. Após autorizar, volte aqui para configurar.
            </p>
            <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 p-3">
              <p.icon className="h-5 w-5" style={{ color: p?.color }} />
              <div className="flex-1">
                <p className="text-sm font-medium">{p?.name}</p>
                <p className="text-xs text-muted-foreground">{p?.description}</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={onClose}>Cancelar</Button>
              <Button variant="outline" onClick={() => window.open(`https://oauth.conversao360.com/${provider}`, '_blank')}>
                <ExternalLink className="h-4 w-4" /> Autorizar OAuth
              </Button>
              <Button onClick={() => setStep('config')}>Já autorizei</Button>
            </DialogFooter>
          </div>
        )}
        {step === 'config' && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Conta</Label>
              <Input placeholder="default" />
            </div>
            <div className="space-y-1.5">
              <Label>Frequência de sync</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background/60 px-3 py-2 text-sm">
                <option value="hourly">A cada hora</option>
                <option value="daily">Diário</option>
                <option value="realtime">Tempo real</option>
              </select>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setStep('auth')}>
                Voltar
              </Button>
              <Button onClick={onConnect} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Finalizar'}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
