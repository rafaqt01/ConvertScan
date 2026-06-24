'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Sparkles, Mail, Loader2, ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createBrowserSupabase } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createBrowserSupabase();
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSent(true);
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-[#7B61FF] mb-3">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          {sent ? (
            <>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success/15 text-success mb-2">
                <Check className="h-6 w-6" />
              </div>
              <h1 className="text-2xl font-semibold tracking-tight">Verifique seu e-mail</h1>
              <p className="text-sm text-muted-foreground mt-1">Enviamos um link de recuperação para <strong>{email}</strong></p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-semibold tracking-tight">Recuperar senha</h1>
              <p className="text-sm text-muted-foreground mt-1">Enviaremos um link para redefinir.</p>
            </>
          )}
        </div>

        {!sent && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9" />
              </div>
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Enviar link <ArrowRight className="h-4 w-4" /></>}
            </Button>
          </form>
        )}

        <p className="text-center text-sm text-muted-foreground">
          Lembrou? <Link href="/login" className="text-primary hover:underline">Voltar para o login</Link>
        </p>
      </div>
    </div>
  );
}