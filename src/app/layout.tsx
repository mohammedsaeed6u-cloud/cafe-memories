import type { Metadata, Viewport } from 'next';
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

export const viewport: Viewport = {
  themeColor: '#FAF6EE',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://memories-c9w.pages.dev'),
  title: 'memories • منصة تجربة عملاء وولاء المقاهي المختصة',
  description: 'تحويل كل زيارة في مقهاك إلى ذكرى تدوم — وكل ذكرى إلى دافع حقيقي للعودة. استوديو تصوير عبر الهاتف بدون تطبيق، شاشات صالة حية، وكروت ولاء في محفظة Apple و Google Wallet.',
  keywords: ['كافيهات', 'ولاء العملاء', 'فوتوبوث كافيه', 'شاشات الصالة الحية', 'قهوة مختصة', 'بطاقات ولاء رقمية'],
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Memories',
  },
  openGraph: {
    title: 'memories • منصة تجربة عملاء وولاء المقاهي المختصة',
    description: 'تحويل كل زيارة في مقهاك إلى ذكرى تدوم — وكل ذكرى إلى دافع حقيقي للعودة.',
    url: 'https://memories-c9w.pages.dev',
    siteName: 'memories',
    locale: 'ar_SA',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'memories • منصة تجربة عملاء وولاء المقاهي المختصة',
    description: 'تحويل كل زيارة في مقهاك إلى ذكرى تدوم — وكل ذكرى إلى دافع حقيقي للعودة.',
  },
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
