'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createBrowserSupabase } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const password = String(form.get('password'));
    const supabase = createBrowserSupabase();
    const { error } = await supabase.auth.updateUser({ password });
    if (!error) {
      setDone(true);
      setTimeout(() => router.push('/dashboard'), 1500);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-[#7B61FF] mb-3">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Nova senha</h1>
        </div>

        {done ? (
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success/15 text-success">
              <Check className="h-6 w-6" />
            </div>
            <p className="text-sm text-muted-foreground">Senha atualizada! Redirecionando...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="password">Nova senha</Label>
              <Input id="password" name="password" type="password" required minLength={8} />
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Atualizar senha'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}