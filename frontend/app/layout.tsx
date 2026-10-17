
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MIME'D Studio",
  description: "Creator campaign management platform"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
