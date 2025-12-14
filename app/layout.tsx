import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FinEntry - Internal Finance",
  description: "Finance Tracking for Priventry",
};

// Root Layout: Layout utama aplikasi Next.js
// Membungkus seluruh aplikasi dengan <html>, <body>, dan Provider global
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased bg-slate-50`}>
        {/* Providers: Mengelola context global seperti Auth Session dan Toast Notifikasi */}
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
