'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Sparkles, Mail, Lock, User, Building2, Loader2, ArrowRight, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createBrowserSupabase } from '@/lib/supabase/client';
import { toast } from 'sonner';

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const email = String(form.get('email'));
    const password = String(form.get('password'));
    const fullName = String(form.get('fullName'));
    const orgName = String(form.get('orgName'));

    try {
      const supabase = createBrowserSupabase();
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: { full_name: fullName, org_name: orgName },
        },
      });
      if (error) {
        setError(error.message);
        return;
      }

      const result = await supabase.auth.signUp({
  email,
  password,
  options: {
    emailRedirectTo: `${window.location.origin}/auth/callback`,
    data: {
      full_name: fullName,
      org_name: orgName,
    },
  },
});

console.log('SIGNUP RESULT:', result);

if (result.error) {
  console.error(result.error);
  setError(result.error.message);
  return;
}
      toast.success('Conta criada! Configure sua organização para começar.');
      router.push('/onboarding');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm space-y-6"
      >
        <div className="flex flex-col items-center text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-[#7B61FF] shadow-[0_0_20px_rgba(26,26,255,0.4)] mb-3">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Crie sua conta</h1>
          <p className="text-sm text-muted-foreground mt-1">14 dias grátis. Sem cartão.</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          {error && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="fullName">Seu nome</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="fullName" name="fullName" required className="pl-9" placeholder="Maria Silva" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="orgName">Nome da empresa</Label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="orgName" name="orgName" required className="pl-9" placeholder="Acme Inc." />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">E-mail corporativo</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="email" name="email" type="email" required className="pl-9" placeholder="voce@empresa.com" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Senha</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="password" name="password" type="password" required minLength={8} className="pl-9" />
            </div>
            <p className="text-[11px] text-muted-foreground">Mínimo 8 caracteres.</p>
          </div>
          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Criar conta <ArrowRight className="h-4 w-4" /></>}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Já tem conta? <Link href="/login" className="text-primary hover:underline">Entrar</Link>
        </p>

        <p className="text-center text-[11px] text-muted-foreground">
          Ao criar conta, você concorda com nossos <Link href="/terms" className="underline">Termos</Link> e <Link href="/privacy" className="underline">Privacidade</Link>.
        </p>
      </motion.div>
    </div>
  );
}
