import type { Metadata, Viewport } from 'next';
import { Cairo, Playfair_Display, Plus_Jakarta_Sans } from 'next/font/google';
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

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-jakarta',
  display: 'swap',
});

export const viewport: Viewport = {
  themeColor: '#141313',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://memories-c9w.pages.dev'),
  title: 'memories • منصة استوديو الذكريات وتجربة العملاء لجميع الأنشطة التجارية',
  description: 'تحويل كل زيارة في نشاطك التجاري إلى ذكرى تدوم — وكل ذكرى إلى دافع حقيقي للعودة. استوديو تصوير فوري عبر الهاتف بدون تطبيق، شاشات عرض تفاعلية للصالة، وكروت ولاء رقمية في محفظة Apple و Google Wallet للمطاعم، الكافيهات، المتاجر، الصالونات، والفعاليات.',
  keywords: ['فوتوبوث رقمي', 'ولاء العملاء', 'استوديو تصوير للأنشطة التجارية', 'شاشات الصالة الذكية', 'بطاقات ولاء رقمية', 'تجربة العميل', 'Apple Wallet', 'Google Wallet'],
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Memories',
  },
  openGraph: {
    title: 'memories • منصة استوديو الذكريات وتجربة العملاء لجميع الأنشطة التجارية',
    description: 'تحويل كل زيارة في نشاطك التجاري إلى ذكرى تدوم — وكل ذكرى إلى دافع حقيقي للعودة.',
    url: 'https://memories-c9w.pages.dev',
    siteName: 'memories',
    locale: 'ar_SA',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'memories • منصة استوديو الذكريات وتجربة العملاء لجميع الأنشطة التجارية',
    description: 'تحويل كل زيارة في نشاطك التجاري إلى ذكرى تدوم — وكل ذكرى إلى دافع حقيقي للعودة.',
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
      className={cn(cairo.variable, playfair.variable, jakarta.variable)}
    >
      <body className="min-h-screen bg-[#141313] text-[#e6e1e1] font-sans antialiased selection:bg-[#DD0200] selection:text-white">
        {children}
      </body>
    </html>
  );
}
