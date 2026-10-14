import type { Metadata, Viewport } from "next";
import "@fontsource/cairo/arabic-400.css";
import "@fontsource/cairo/arabic-700.css";
import "@fontsource/cairo/latin-400.css";
import "@fontsource/cairo/latin-700.css";
import "@fontsource/plus-jakarta-sans/latin-400.css";
import "@fontsource/plus-jakarta-sans/latin-700.css";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#DFAB56",
  width: "device-width",
  initialScale: 1,
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.includes(
  "YOUR_DEPLOYED_DOMAIN",
)
  ? undefined
  : process.env.NEXT_PUBLIC_SITE_URL;

const description =
  "stampy. توثق الزيارة بعد تأكيد الفريق، وتتيح للضيف صورة اختيارية خاصة لكل ختم؛ ثم كارت ذكريات رقمي وقابل للطباعة مع المكافأة. لكل مكان يصنع لحظات تستحق البقاء.";

export const metadata: Metadata = {
  ...(siteUrl?.startsWith("https://")
    ? { metadataBase: new URL(siteUrl) }
    : {}),
  title: "stampy. • كل لحظة تترك أثرًا",
  description,
  keywords: ["stampy", "ذكريات الضيوف", "ولاء العملاء", "زيارات موثقة", "تذكار مطبوع", "كارت فوتوبوث"],
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/brand/stampy-app-icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/brand/stampy-app-icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/brand/stampy-app-icon-180.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "stampy.",
  },
  openGraph: {
    title: "stampy. • كل لحظة تترك أثرًا",
    description,
    ...(siteUrl?.startsWith("https://") ? { url: siteUrl } : {}),
    siteName: "stampy.",
    locale: "ar_EG",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "stampy. • كل لحظة تترك أثرًا",
    description,
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className="min-h-screen bg-paper text-ink font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
