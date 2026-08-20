import type { Metadata } from "next";

import { QueryProvider } from "@/shared/providers/QueryProvider";

import "./globals.css";

export const metadata: Metadata = {
  title: "CurtinSphere",
  description: "Campus life platform for Curtin University students",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
