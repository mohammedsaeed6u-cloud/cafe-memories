import type { Metadata } from 'next';
import { Cairo, Playfair_Display, Montserrat } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-cairo',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-playfair',
  display: 'swap',
});

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-montserrat',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'memories • Café Moments. Lasting Loyalty.',
  description: 'منظومة كبائن التصوير والذكريات وشاشات العرض الحية وبطاقات الولاء لكافيهات السبيشالتي',
  verification: {
    google: 'fjoLJpquhynVk0PmXH6VssgvRRrhiuynBz8G4PDHiME',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      suppressHydrationWarning
      className={cn(cairo.variable, playfair.variable, montserrat.variable)}
    >
      <body className="min-h-screen bg-[#FAF6EE] text-[#3B2F2A] font-cairo antialiased selection:bg-[#B85C43]/20 selection:text-[#1E3A32]">
        {children}
      </body>
    </html>
  );
}
