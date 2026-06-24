'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserSupabase } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';

export default function AuthCallbackPage() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') || '/dashboard';

  useEffect(() => {
    const supabase = createBrowserSupabase();
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        router.push(next);
        router.refresh();
      }
    });

    // Fallback after 5s
    const t = setTimeout(() => router.push(next), 5000);
    return () => clearTimeout(t);
  }, [router, next]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Conectando...</p>
    </div>
  );
}