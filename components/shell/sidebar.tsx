'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, KanbanSquare, ListChecks, BarChart3, Sparkles, Bot,
  Workflow, Plug, Filter, Bell, FileText, Settings, ChevronLeft, ChevronRight,
  Building2, LogOut, CreditCard, HelpCircle, Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

const NAV = [
  { group: 'Geral', items: [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  ]},
  { group: 'Vendas', items: [
    { href: '/crm', label: 'CRM', icon: Users },
    { href: '/pipeline', label: 'Pipeline', icon: KanbanSquare },
    { href: '/tasks', label: 'Tarefas', icon: ListChecks },
  ]},
  { group: 'Inteligência', items: [
    { href: '/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/conversao', label: 'Conversão 360°', icon: Sparkles, badge: 'AI' },
    { href: '/ai', label: 'Growth Analyst', icon: Bot, badge: 'AI' },
    { href: '/funnel', label: 'Funil', icon: Filter },
  ]},
  { group: 'Operação', items: [
    { href: '/automations', label: 'Automações', icon: Workflow },
    { href: '/integrations', label: 'Integrações', icon: Plug },
    { href: '/alerts', label: 'Alertas', icon: Bell },
    { href: '/reports', label: 'Relatórios', icon: FileText },
  ]},
  { group: 'Conta', items: [
    { href: '/settings/organization', label: 'Organização', icon: Building2 },
    { href: '/settings/billing', label: 'Plano', icon: CreditCard },
    { href: '/settings/audit', label: 'Auditoria', icon: Activity },
  ]},
];

interface SidebarProps {
  organization: { name: string; slug: string; logo_url?: string | null };
  user: { email: string; full_name?: string | null; avatar_url?: string | null };
  alertCount?: number;
}

export function Sidebar({ organization, user, alertCount = 0 }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'flex flex-col border-r border-border bg-card/40 backdrop-blur-xl transition-all duration-300',
        collapsed ? 'w-[68px]' : 'w-[248px]'
      )}
    >
      {/* Brand */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-border">
        <Link href="/dashboard" className="flex items-center gap-2 overflow-hidden">
          <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-[#7B61FF] shadow-[0_0_20px_rgba(26,26,255,0.4)]">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                className="flex flex-col leading-none"
              >
                <span className="text-sm font-semibold">Conversão 360°</span>
                <span className="text-[10px] text-muted-foreground mt-0.5">Growth OS</span>
              </motion.div>
            )}
          </AnimatePresence>
        </Link>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted"
          aria-label="Recolher sidebar"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Org */}
      {!collapsed && (
        <div className="px-3 py-3 border-b border-border">
          <div className="flex items-center gap-2 rounded-md bg-muted/50 px-2.5 py-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-primary/20 text-primary text-[10px] font-bold">
              {organization.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{organization.name}</p>
              <p className="text-[10px] text-muted-foreground truncate">/{organization.slug}</p>
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {NAV.map((section) => (
          <div key={section.group} className="mb-4">
            {!collapsed && (
              <p className="px-2 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {section.group}
              </p>
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                const Icon = item.icon;
                const link = (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'group relative flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-all',
                      isActive
                        ? 'bg-primary/15 text-primary shadow-[inset_0_0_0_1px_rgba(26,26,255,0.3)]'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="active-indicator"
                        className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-primary"
                      />
                    )}
                    <Icon className="h-4 w-4 shrink-0" />
                    {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
                    {!collapsed && item.badge && (
                      <Badge variant="default" className="h-4 px-1.5 text-[9px]">
                        {item.badge}
                      </Badge>
                    )}
                    {!collapsed && item.href === '/alerts' && alertCount > 0 && (
                      <Badge variant="destructive" className="h-4 px-1.5 text-[9px]">
                        {alertCount}
                      </Badge>
                    )}
                  </Link>
                );
                return (
                  <li key={item.href}>
                    {collapsed ? (
                      <Tooltip delayDuration={0}>
                        <TooltipTrigger asChild>{link}</TooltipTrigger>
                        <TooltipContent side="right">{item.label}</TooltipContent>
                      </Tooltip>
                    ) : (
                      link
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="border-t border-border p-3">
        <div className={cn('flex items-center gap-2', collapsed ? 'justify-center' : '')}>
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.avatar_url ?? undefined} alt={user.full_name ?? user.email} />
            <AvatarFallback>{(user.full_name || user.email).slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{user.full_name || user.email}</p>
              <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
            </div>
          )}
          {!collapsed && (
            <form action="/api/auth/signout" method="POST">
              <button className="text-muted-foreground hover:text-destructive transition-colors p-1.5 rounded-md hover:bg-muted" aria-label="Sair">
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </form>
          )}
        </div>
        {!collapsed && (
          <a
            href="https://docs.conversao360.com"
            target="_blank"
            rel="noopener"
            className="mt-2 flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <HelpCircle className="h-3 w-3" />
            Ajuda & Docs
          </a>
        )}
      </div>
    </aside>
  );
}