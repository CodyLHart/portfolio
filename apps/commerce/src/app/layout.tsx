import type { Metadata } from "next";
import { AnnouncementBar } from "../components/layout/AnnouncementBar";
import { SiteFooter } from "../components/layout/SiteFooter";
import { SiteHeader } from "../components/layout/SiteHeader";
import { getSiteSettings } from "../sanity/lib/siteSettings";
import "./globals.css";

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
    <html lang="en">
      <body>
        <AnnouncementBar settings={siteSettings} />
        <SiteHeader settings={siteSettings} />
        {children}
        <SiteFooter settings={siteSettings} />
      </body>
    </html>
  );
}
