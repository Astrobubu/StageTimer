import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StageTimer - Synchronized Timer",
  description: "Synchronized timer for presentations and events",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
