import type { Metadata, Viewport } from "next";
import "@fontsource/cairo/arabic-400.css";
import "@fontsource/cairo/arabic-700.css";
import "@fontsource/cairo/latin-400.css";
import "@fontsource/cairo/latin-700.css";
import "@fontsource/plus-jakarta-sans/latin-400.css";
import "@fontsource/plus-jakarta-sans/latin-700.css";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#183a32",
  width: "device-width",
  initialScale: 1,
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.includes(
  "YOUR_DEPLOYED_DOMAIN",
)
  ? undefined
  : process.env.NEXT_PUBLIC_SITE_URL;

export const metadata: Metadata = {
  ...(siteUrl?.startsWith("https://")
    ? { metadataBase: new URL(siteUrl) }
    : {}),
  title: "Café Memories • ذكريات الضيوف وولاء الزيارات",
  description:
    "سجّل منشأتك وأنشئ رموز QR للفروع. يحفظ الضيف ذكرياته الخاصة ويختار ما يُعرض على شاشة الصالة، ويؤكد الموظف الزيارة بعد الشراء.",
  keywords: ["ذكريات الضيوف", "ولاء العملاء", "زيارات موثقة", "شاشات الصالة"],
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Memories",
  },
  openGraph: {
    title: "Café Memories • ذكريات الضيوف وولاء الزيارات",
    description:
      "صور خاصة بإذن الضيف، وشاشة صالة تحتاج الموافقة، وزيارات يؤكدها الموظف.",
    ...(siteUrl?.startsWith("https://") ? { url: siteUrl } : {}),
    siteName: "Café Memories",
    locale: "ar_EG",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Café Memories • ذكريات الضيوف وولاء الزيارات",
    description:
      "صور خاصة بإذن الضيف، وشاشة صالة تحتاج الموافقة، وزيارات يؤكدها الموظف.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className="min-h-screen bg-paper text-ink font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
