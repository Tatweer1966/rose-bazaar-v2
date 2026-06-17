import './globals.css';
import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import { LangProvider } from '@/components/LangContext';

export const metadata: Metadata = { title: 'Rose Bazaar - Wedding Marketplace', description: "Egypt's premier wedding marketplace" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head><link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@400;500;600;700&family=Noto+Naskh+Arabic:wght@400;600;700&display=swap" rel="stylesheet"/></head>
      <body className="bg-[#FFF8F0]">
        <LangProvider>
          <Navbar/>
          <div className="pt-16">{children}</div>
        </LangProvider>
      </body>
    </html>
  );
}
