import './globals.css';
import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import { LangProvider } from '@/components/LangContext';

export const metadata: Metadata = {
  title: 'Rose Bazaar - Wedding Marketplace',
  description: "Egypt's premier wedding marketplace",
  icons: { icon: '/logo.png', apple: '/logo.png' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <LangProvider>
        <body>
          <Navbar />
          {children}
        </body>
      </LangProvider>
    </html>
  );
}
