import type { Metadata, Viewport } from 'next';
import { Cairo, Playfair_Display, Plus_Jakarta_Sans, Caveat, Lobster, Barlow_Condensed } from 'next/font/google';
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

const caveat = Caveat({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-caveat',
  display: 'swap',
});

const lobster = Lobster({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-script',
  display: 'swap',
});

const barlowCondensed = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-head',
  display: 'swap',
});

export const viewport: Viewport = {
  themeColor: '#FAF5EB',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://stampy.app'),
  title: 'Stampy • منصة بطاقات الولاء ومحافظ Apple & Google للمتاجر والمقاهي',
  description: 'تحويل كل زيارة في نشاطك التجاري إلى ذكرى تدوم — وكل ذكرى إلى دافع حقيقي للعودة. استوديو تصوير فوري عبر الهاتف بدون تطبيق، شاشات عرض تفاعلية للصالة، وكروت ولاء رقمية في محفظة Apple و Google Wallet للمطاعم، الكافيهات، المتاجر، الصالونات، والفعاليات.',
  keywords: ['فوتوبوث رقمي', 'ولاء العملاء', 'استوديو تصوير للأنشطة التجارية', 'شاشات الصالة الذكية', 'بطاقات ولاء رقمية', 'تجربة العميل', 'Apple Wallet', 'Google Wallet'],
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/brand/stampy-app-icon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/brand/06-stampy-app-icon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/brand/stampy-app-icon-32.png',
    apple: [
      { url: '/brand/stampy-app-icon-180.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Stampy',
  },
  openGraph: {
    title: 'Stampy • بطاقات الولاء ومحافظ الهواتف الذكية',
    description: 'تحويل كل زيارة في نشاطك التجاري إلى ذكرى تدوم — وكل ذكرى إلى دافع حقيقي للعودة.',
    url: 'https://stampy.app',
    siteName: 'Stampy',
    locale: 'ar_SA',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Stampy • منصة بطاقات الولاء ومحافظ Apple & Google الذكية',
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
      className={cn(
        cairo.variable,
        playfair.variable,
        jakarta.variable,
        caveat.variable,
        lobster.variable,
        barlowCondensed.variable
      )}
    >
      <body className="min-h-screen bg-[#FAF5EB] text-[#1B1B1E] font-sans antialiased selection:bg-[#682025] selection:text-white">
        {children}
      </body>
    </html>
  );
}
