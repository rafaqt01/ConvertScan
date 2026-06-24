import type { ReactNode } from 'react';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';

interface AppShellProps {
  children: ReactNode;
  organization: { name: string; slug: string; logo_url?: string | null };
  user: { email: string; full_name?: string | null; avatar_url?: string | null };
  alertCount?: number;
}

export function AppShell({ children, organization, user, alertCount = 0 }: AppShellProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar organization={organization} user={user} alertCount={alertCount} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar user={user} organizationName={organization.name} alertCount={alertCount} />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}