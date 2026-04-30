import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Flux",
  description: "Secure and slow photo processing workspace built with Next.js.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
