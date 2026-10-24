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
  themeColor: '#FAF5EB',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://stampy-86j.pages.dev'),
  title: 'استامبي (Stampy) • منصة كروت التصوير التفاعلية وبرامج الولاء الذكية',
  description: 'تحويل كل زيارة في منشأتك إلى شريط ذكريات يدوم — وكل ذكرى إلى دافع حقيقي للعودة. استوديو تصوير فوتوبوث تفاعلي عبر الهاتف، شاشات صالة حية، وأختام ولاء رقمية لمحفظة Apple و Google Wallet.',
  keywords: ['فوتوبوث رقمي', 'ولاء العملاء', 'استوديو تصوير للأنشطة التجارية', 'شاشات الصالة الذكية', 'بطاقات ولاء رقمية', 'تجربة العميل', 'Apple Wallet', 'Google Wallet'],
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Stampy استامبي',
  },
  openGraph: {
    title: 'استامبي (Stampy) • منصة كروت التصوير التفاعلية وبرامج الولاء الذكية',
    description: 'تحويل كل زيارة في منشأتك إلى شريط ذكريات يدوم — وكل ذكرى إلى دافع حقيقي للعودة. استوديو تصوير فوتوبوث تفاعلي عبر الهاتف، شاشات صالة حية، وأختام ولاء رقمية لمحفظة Apple و Google Wallet.',
    url: 'https://stampy-86j.pages.dev',
    siteName: 'Stampy استامبي',
    locale: 'ar_SA',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'استامبي (Stampy) • منصة كروت التصوير التفاعلية وبرامج الولاء الذكية',
    description: 'تحويل كل زيارة في منشأتك إلى شريط ذكريات يدوم — وكل ذكرى إلى دافع حقيقي للعودة. استوديو تصوير فوتوبوث تفاعلي عبر الهاتف، شاشات صالة حية، وأختام ولاء رقمية لمحفظة Apple و Google Wallet.',
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
      <body className="min-h-screen bg-[#FAF5EB] text-[#3D2314] font-sans antialiased selection:bg-[#DFAB56] selection:text-[#3D2314]">
        {children}
      </body>
    </html>
  );
}
