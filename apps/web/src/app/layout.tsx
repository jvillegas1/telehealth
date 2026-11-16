import type { Metadata, Viewport } from "next";

import { AppSessionProvider } from "@/components/session-provider";

import "./globals.css";

export const metadata: Metadata = {
  title: "Telehealth",
  description:
    "Plataforma de telepsicología que conecta pacientes con psicólogos certificados.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Telehealth",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#3d4438",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="min-h-dvh bg-calm-50 text-calm-900 antialiased">
        <AppSessionProvider>{children}</AppSessionProvider>
      </body>
    </html>
  );
}