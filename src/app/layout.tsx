import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sam TODO Agent",
  description: "AI-driven TODO app inspired by Sam Altman - tasks auto-create GitHub Issues",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#0a0a0a] min-h-screen`}
      >
        {children}
        <Toaster
          theme="dark"
          toastOptions={{
            style: {
              background: "#111111",
              border: "1px solid #222",
              color: "#e4e4e7",
            },
          }}
        />
      </body>
    </html>
  );
}
