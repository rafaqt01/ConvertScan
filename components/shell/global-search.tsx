'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';
import { createBrowserSupabase } from '@/lib/supabase/client';

export function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['global-search', query],
    queryFn: async () => {
      if (!query || query.length < 2) return { leads: [], contacts: [], deals: [], companies: [] };
      const supabase = createBrowserSupabase();
      const [leads, contacts, deals, companies] = await Promise.all([
        supabase.from('leads').select('id, status, contact:contacts(first_name, last_name)').limit(5),
        supabase.from('contacts').select('id, first_name, last_name, email').or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`).limit(5),
        supabase.from('deals').select('id, title, value').ilike('title', `%${query}%`).limit(5),
        supabase.from('companies').select('id, name, domain').ilike('name', `%${query}%`).limit(5),
      ]);
      return {
        leads: leads.data ?? [],
        contacts: contacts.data ?? [],
        deals: deals.data ?? [],
        companies: companies.data ?? [],
      };
    },
    enabled: query.length >= 2,
  });

  useEffect(() => {
    function handle(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === 'Escape') setOpen(false);
    }
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('keydown', handle);
    document.addEventListener('mousedown', handleClick);
    return () => {
      document.removeEventListener('keydown', handle);
      document.removeEventListener('mousedown', handleClick);
    };
  }, []);

  const total = (data?.leads.length ?? 0) + (data?.contacts.length ?? 0) + (data?.deals.length ?? 0) + (data?.companies.length ?? 0);

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="Buscar leads, contatos, negócios, empresas..."
          className="pl-9 pr-16 h-9"
        />
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:inline-flex">
          ⌘K
        </kbd>
      </div>

      {open && query.length >= 2 && (
        <div className="absolute z-50 mt-2 w-full rounded-lg border border-border bg-popover shadow-2xl">
          <div className="max-h-96 overflow-y-auto p-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin mr-2" /> Buscando...
              </div>
            ) : total === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Nenhum resultado para "{query}"
              </div>
            ) : (
              <>
                {data?.leads?.length ? (
                  <SearchGroup title="Leads" onClose={() => setOpen(false)} items={data.leads.map((l: any) => ({
                    id: l.id, label: `${l.contact?.first_name ?? 'Lead'} ${l.contact?.last_name ?? ''}`.trim() + ` · ${l.status}`,
                    href: `/crm/leads/${l.id}`,
                  }))} />
                ) : null}
                {data?.contacts?.length ? (
                  <SearchGroup title="Contatos" onClose={() => setOpen(false)} items={data.contacts.map((c: any) => ({
                    id: c.id, label: `${c.first_name} ${c.last_name ?? ''}`.trim() + (c.email ? ` · ${c.email}` : ''),
                    href: `/crm/contacts/${c.id}`,
                  }))} />
                ) : null}
                {data?.deals?.length ? (
                  <SearchGroup title="Negócios" onClose={() => setOpen(false)} items={data.deals.map((d: any) => ({
                    id: d.id, label: `${d.title} · R$ ${d.value?.toLocaleString('pt-BR') ?? 0}`,
                    href: `/pipeline?deal=${d.id}`,
                  }))} />
                ) : null}
                {data?.companies?.length ? (
                  <SearchGroup title="Empresas" onClose={() => setOpen(false)} items={data.companies.map((c: any) => ({
                    id: c.id, label: c.name + (c.domain ? ` · ${c.domain}` : ''),
                    href: `/crm/companies/${c.id}`,
                  }))} />
                ) : null}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SearchGroup({ title, items, onClose }: { title: string; items: { id: string; label: string; href: string }[]; onClose: () => void }) {
  return (
    <div className="mb-2">
      <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
      {items.map((item) => (
        <a
          key={item.id}
          href={item.href}
          onClick={onClose}
          className="block rounded-md px-2 py-1.5 text-sm hover:bg-accent transition-colors"
        >
          {item.label}
        </a>
      ))}
    </div>
  );
}