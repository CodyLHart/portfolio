import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import { AnnouncementBar } from "../components/layout/AnnouncementBar";
import { SiteFooter } from "../components/layout/SiteFooter";
import { SiteHeader } from "../components/layout/SiteHeader";
import { getSiteSettings } from "../sanity/lib/siteSettings";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Cody Hart Store",
    template: "%s | Cody Hart Store",
  },
  description:
    "Shop music, apparel, artwork, and creative projects from Cody Hart and collaborators.",
  openGraph: {
    type: "website",
    siteName: "Cody Hart Store",
    title: "Cody Hart Store",
    description:
      "Shop music, apparel, artwork, and creative projects from Cody Hart and collaborators.",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const siteSettings = await getSiteSettings();

  return (
    <html lang="en" className={montserrat.variable}>
      <body className={montserrat.className}>
        <AnnouncementBar settings={siteSettings} />
        <SiteHeader settings={siteSettings} />
        {children}
        <SiteFooter settings={siteSettings} />
      </body>
    </html>
  );
}
