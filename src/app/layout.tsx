import type { Metadata } from "next";
import { Pixelify_Sans } from "next/font/google";
import "./globals.css";
import MenuBar from "@/components/MenuBar";
import BootSplash from "@/components/BootSplash";
import { getLang } from "@/lib/getLang";

const pixel = Pixelify_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-pixel",
});

export const metadata: Metadata = {
  title: "Falfoul — Store Manager",
  description: "Manage products, invoices, stock, expiry and analytics.",
  appleWebApp: {
    capable: true,
    title: "Falfoul",
    statusBarStyle: "default",
  },
  icons: {
    apple: "/apple-touch-icon.png",
  },
};

export const viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const lang = await getLang();
  return (
    <html lang={lang}>
      <body className={`${pixel.variable} antialiased`}>
        <div className="flex min-h-screen flex-col">
          <BootSplash />
          <MenuBar lang={lang} />
          <main className="flex-1 overflow-x-hidden p-4 md:p-7">
            <div className="mx-auto max-w-6xl">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
