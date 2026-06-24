'use client';

import { Bell, Search, Command, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { GlobalSearch } from './global-search';

interface TopbarProps {
  user: { email: string; full_name?: string | null; avatar_url?: string | null };
  organizationName: string;
  alertCount?: number;
}

export function Topbar({ user, organizationName, alertCount = 0 }: TopbarProps) {
  return (
    <header className="flex h-16 items-center gap-4 border-b border-border bg-background/60 backdrop-blur-xl px-6">
      <div className="flex-1 max-w-2xl">
        <GlobalSearch />
      </div>

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-4 w-4" />
              {alertCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-2 w-2 rounded-full bg-destructive">
                  <span className="absolute inset-0 animate-ping rounded-full bg-destructive/60" />
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notificações</span>
              <Badge variant="muted">{alertCount} ativos</Badge>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex flex-col items-start gap-0.5 py-3">
              <span className="text-sm font-medium">Bem-vindo ao {organizationName}</span>
              <span className="text-xs text-muted-foreground">Configure suas integrações para começar.</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-primary justify-center">Ver todos os alertas</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-md p-1 hover:bg-accent transition-colors">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.avatar_url ?? undefined} alt={user.full_name ?? user.email} />
                <AvatarFallback>{(user.full_name || user.email).slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <p className="text-sm font-medium">{user.full_name || user.email}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Perfil</DropdownMenuMenuItem>
            <DropdownMenuItem>Configurações</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive">Sair</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}