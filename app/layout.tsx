import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from '@/components/providers';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: {
    default: 'Conversão 360° — Sistema Operacional de Crescimento',
    template: '%s · Conversão 360°',
  },
  description: 'Plataforma inteligente de CRM, Analytics, IA e Growth para empresas que escalam.',
  applicationName: 'Conversão 360°',
  authors: [{ name: 'Conversão 360°' }],
  keywords: ['CRM', 'Analytics', 'Growth', 'IA', 'SaaS', 'Conversão', 'Funil de Vendas'],
  openGraph: {
    type: 'website',
    siteName: 'Conversão 360°',
    locale: 'pt_BR',
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#0D0D12',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className={inter.variable}>
      <body className="font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
