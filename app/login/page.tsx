'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Sparkles, Mail, Lock, Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createBrowserSupabase } from '@/lib/supabase/client';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') || '/dashboard';
  const [loading, setLoading] = useState(false);
  const [magicLoading, setMagicLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const email = String(form.get('email'));
    const password = String(form.get('password'));

    try {
      const supabase = createBrowserSupabase();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
        return;
      }
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao entrar');
    } finally {
      setLoading(false);
    }
  }

  async function handleMagicLink() {
    const email = (document.getElementById('email') as HTMLInputElement)?.value;
    if (!email) {
      setError('Informe seu e-mail primeiro');
      return;
    }
    setMagicLoading(true);
    setError(null);
    try {
      const supabase = createBrowserSupabase();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${next}` },
      });
      if (error) {
        setError(error.message);
      } else {
        toast.success('Link mágico enviado! Verifique seu e-mail.');
      }
    } finally {
      setMagicLoading(false);
    }
  }

  async function handleOAuth(provider: 'google' | 'github') {
    const supabase = createBrowserSupabase();
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${next}` },
    });
  }

  return (
    <div className="min-h-screen flex">
      {/* Left visual */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-card border-r border-border">
        <div className="absolute inset-0 grid-bg opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-success/5" />
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-[#7B61FF] shadow-[0_0_20px_rgba(26,26,255,0.4)]">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold">Conversão 360°</span>
          </Link>

          <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight text-balance">
              Onde está seu <span className="gradient-text">maior gargalo</span> hoje?
            </h2>
            <p className="text-muted-foreground text-balance max-w-md">
              CRM, analytics, IA e automações em um só lugar. Diagnostique, otimize e escale.
            </p>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              {['Diagnóstico 360° em 5 minutos', '+15 integrações nativas', 'IA com seus próprios dados'].map((t) => (
                <div key={t} className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" /> {t}
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-muted-foreground">© 2026 Conversão 360°</p>
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm space-y-6"
        >
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">Bem-vindo de volta</h1>
            <p className="text-sm text-muted-foreground">Entre para acessar seu cockpit de growth.</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button variant="glass" onClick={() => handleOAuth('google')}>Google</Button>
            <Button variant="glass" onClick={() => handleOAuth('github')}>GitHub</Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">ou</span>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="email" name="email" type="email" required placeholder="voce@empresa.com" className="pl-9" />
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
                <Link href="/forgot-password" className="text-xs text-primary hover:underline">Esqueci minha senha</Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="password" name="password" type="password" required minLength={8} className="pl-9" />
              </div>
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Entrar <ArrowRight className="h-4 w-4" /></>}
            </Button>
            <Button type="button" variant="ghost" className="w-full" onClick={handleMagicLink} disabled={magicLoading}>
              {magicLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enviar link mágico'}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Não tem conta? <Link href="/signup" className="text-primary hover:underline">Criar conta gratuita</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}