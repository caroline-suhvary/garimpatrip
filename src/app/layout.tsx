import React from "react";
import type { Metadata, Viewport } from "next";
import { Navbar } from "@/components/layout/Navbar";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "GarimpaTrip | Planejador Inteligente de Viagens",
  description:
    "Garimpe a viagem perfeita sem 30 abas abertas. Agregador inteligente e transparente de viagens.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#F5B731",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
