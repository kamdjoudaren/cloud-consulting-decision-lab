import type { Metadata } from 'next';
import AppShell from '@/components/app-shell';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Decision Lab · Cloud consulting practice', template: '%s · Decision Lab' },
  description:
    'Practice the decisions, not just the services. Business-first cloud consulting simulations with discovery, architecture decisions, and deliberate practice.',
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
