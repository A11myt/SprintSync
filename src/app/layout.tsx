import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";

export const metadata: Metadata = {
  title: "VaultBoard",
  description: "Project management for the vault",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="bg-background">
      <body className="bg-background text-ink font-mono antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
