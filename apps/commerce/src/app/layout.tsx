import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Commerce",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <nav className="site-nav" aria-label="Main navigation">
            <Link href="/">Home</Link>
            <Link href="/store">Store</Link>
            <Link href="/cart">Cart</Link>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
