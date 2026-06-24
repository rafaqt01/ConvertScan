'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Building2, ArrowRight, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createBrowserSupabase } from '@/lib/supabase/client';
import { slugify } from '@/lib/utils';
import { toast } from 'sonner';

interface Props {
  defaultName: string;
  defaultFullName: string;
  email: string;
}

const STEPS = [
  { id: 'org', title: 'Sua organização' },
  { id: 'invite', title: 'Convide seu time' },
  { id: 'connect', title: 'Conecte dados' },
  { id: 'done', title: 'Pronto!' },
];

export function OnboardingForm({ defaultName, defaultFullName, email }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(defaultName);
  const [slug, setSlug] = useState(slugify(defaultName));
  const [industry, setIndustry] = useState('');
  const [size, setSize] = useState('');
  const [invites, setInvites] = useState<string[]>(['']);
  const [connectors, setConnectors] = useState<string[]>([]);

  async function createOrg() {
    setLoading(true);
    try {
      const supabase = createBrowserSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      const { data: org, error: orgErr } = await supabase
        .from('organizations')
        .insert({ name, slug, industry: industry || null, size: size || null })
        .select()
        .single();
      if (orgErr) throw orgErr;

      const { error: memberErr } = await supabase
        .from('memberships')
        .insert({ user_id: user.id, organization_id: org.id, role: 'owner' });
      if (memberErr) throw memberErr;

      if (name && !defaultFullName) {
        await supabase.from('profiles').update({ full_name: defaultFullName || name }).eq('id', user.id);
      }

      setStep(1);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao criar organização');
    } finally {
      setLoading(false);
    }
  }

  async function inviteTeam() {
    setLoading(true);
    try {
      const supabase = createBrowserSupabase();
      const validEmails = invites.filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
      for (const inviteEmail of validEmails) {
        await supabase.auth.signInWithOtp({
          email: inviteEmail,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: { invitation: true, invited_by: email },
          },
        }).catch(() => null);
      }
      toast.success(`${validEmails.length} convite(s) enviado(s).`);
      setStep(2);
    } finally {
      setLoading(false);
    }
  }

  function finish() {
    router.push('/dashboard');
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg space-y-8"
      >
        <div className="flex flex-col items-center text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-[#7B61FF] shadow-[0_0_20px_rgba(26,26,255,0.4)]">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight">Bem-vindo ao Conversão 360°</h1>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-between">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                i <= step ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <span className={`text-xs hidden sm:inline ${i <= step ? 'text-foreground' : 'text-muted-foreground'}`}>
                {s.title}
              </span>
              {i < STEPS.length - 1 && <div className="w-8 h-px bg-border mx-1" />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="org" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Nome da empresa</Label>
                <Input value={name} onChange={(e) => { setName(e.target.value); setSlug(slugify(e.target.value)); }} />
              </div>
              <div className="space-y-1.5">
                <Label>URL pública</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">conversao360.com/app/</span>
                  <Input value={slug} onChange={(e) => setSlug(slugify(e.target.value))} className="flex-1" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Setor</Label>
                  <Input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="SaaS, E-commerce..." />
                </div>
                <div className="space-y-1.5">
                  <Label>Tamanho</Label>
                  <Input value={size} onChange={(e) => setSize(e.target.value)} placeholder="1-10, 11-50..." />
                </div>
              </div>
              <Button onClick={createOrg} disabled={!name || !slug || loading} className="w-full" size="lg">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Continuar <ArrowRight className="h-4 w-4" /></>}
              </Button>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="invite" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <p className="text-sm text-muted-foreground">Convide colegas para colaborar (opcional):</p>
              {invites.map((email, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setInvites((arr) => arr.map((v, idx) => idx === i ? e.target.value : v))}
                    placeholder="colega@empresa.com"
                  />
                  {invites.length > 1 && (
                    <Button variant="ghost" size="icon" onClick={() => setInvites((arr) => arr.filter((_, idx) => idx !== i))}>×</Button>
                  )}
                </div>
              ))}
              <Button variant="ghost" size="sm" onClick={() => setInvites((arr) => [...arr, ''])}>+ Adicionar e-mail</Button>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1">Pular</Button>
                <Button onClick={inviteTeam} disabled={loading} className="flex-1">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enviar convites'}
                </Button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="connect" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <p className="text-sm text-muted-foreground">Quais fontes você quer conectar? (opcional, você pode conectar depois)</p>
              <div className="grid grid-cols-2 gap-2">
                {['Google Analytics', 'Meta Ads', 'Google Ads', 'Stripe', 'HubSpot', 'RD Station', 'WhatsApp', 'Pipedrive'].map((c) => {
                  const selected = connectors.includes(c);
                  return (
                    <button
                      key={c}
                      onClick={() => setConnectors((arr) => selected ? arr.filter((x) => x !== c) : [...arr, c])}
                      className={`flex items-center justify-between rounded-md border px-3 py-2 text-sm transition-all ${
                        selected ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/40'
                      }`}
                    >
                      <span>{c}</span>
                      {selected && <Check className="h-4 w-4" />}
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => setStep(3)} className="flex-1">Pular</Button>
                <Button onClick={() => { setStep(3); }} className="flex-1">Continuar <ArrowRight className="h-4 w-4" /></Button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/15 text-success">
                <Check className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Tudo pronto!</h2>
                <p className="text-sm text-muted-foreground mt-1">Sua organização foi criada. Vamos para o cockpit.</p>
              </div>
              <Button onClick={finish} size="lg" className="w-full">
                Ir para o Dashboard <ArrowRight className="h-4 w-4" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}