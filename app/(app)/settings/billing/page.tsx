import { redirect } from 'next/navigation';
import { getCurrentOrganization } from '@/lib/auth';
import { PageHeader } from '@/components/shell/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';

export const dynamic = 'force-dynamic';

const PLANS = [
  { id: 'starter', name: 'Starter', price: 'R$ 197', features: ['1 organização', 'CRM + Pipeline', '5 integrações', 'Diagnóstico 360°', 'Suporte por e-mail'] },
  { id: 'pro', name: 'Pro', price: 'R$ 597', features: ['Tudo do Starter', 'IA ilimitada', '15+ integrações', 'Automações', 'API completa', 'Suporte prioritário'], featured: true },
  { id: 'enterprise', name: 'Enterprise', price: 'Custom', features: ['Tudo do Pro', 'SSO + SAML', 'White-label', 'Onboarding dedicado', 'SLA 99.9%'] },
];

export default async function BillingPage() {
  const org = await getCurrentOrganization();
  if (!org) redirect('/onboarding');

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <PageHeader title="Plano e Cobrança" description="Gerencie sua assinatura e histórico de pagamentos." />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Plano atual</CardTitle>
            <CardDescription>Você está no plano <strong>{org.plan}</strong>.</CardDescription>
          </div>
          <Badge variant={org.subscription_status === 'active' ? 'success' : 'warning'}>
            {org.subscription_status}
          </Badge>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PLANS.map((p) => (
          <Card key={p.id} className={p.featured ? 'border-primary shadow-[0_0_30px_rgba(26,26,255,0.15)]' : ''}>
            <CardContent className="p-6 space-y-4">
              <div>
                <h3 className="text-lg font-semibold">{p.name}</h3>
                <p className="text-2xl font-bold mt-2">{p.price}{p.price !== 'Custom' && <span className="text-sm font-normal text-muted-foreground">/mês</span>}</p>
              </div>
              <ul className="space-y-2 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-success" /> {f}
                  </li>
                ))}
              </ul>
              <Button className="w-full" variant={org.plan === p.id ? 'outline' : p.featured ? 'default' : 'outline'}>
                {org.plan === p.id ? 'Plano atual' : 'Mudar'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}