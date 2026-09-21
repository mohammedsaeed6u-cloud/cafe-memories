import type { Metadata } from 'next';
import { Cairo, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-cairo',
  display: 'swap',
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Memories • The Loyalty & Live Wall Layer for Specialty Cafés',
  description: 'منظومة كبائن التصوير والذكريات وشاشات العرض الحية وبطاقات الولاء لكافيهات السبيشالتي',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning className={cn(cairo.variable, plusJakarta.variable)}>
      <body className="min-h-screen bg-white text-stone-900 font-cairo antialiased selection:bg-amber-500/20 selection:text-amber-900">
        {children}
      </body>
    </html>
  );
}
