import React from "react";
import type { Metadata, Viewport } from "next";
import { Navbar } from "@/components/layout/Navbar";
import "@/styles/globals.css";
import Script from "next/script";

export const metadata: Metadata = {
  title: "GarimpaTrip | Planejador Inteligente de Viagens",
  description:
    "Garimpe a viagem perfeita sem 30 abas abertas. Agregador inteligente e transparente de viagens.",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
  },
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
      <Script
        id="travelpayouts-verification"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function () {
                var script = document.createElement("script");
                script.async = 1;
                script.setAttribute("data-cmp-ab","2");
                script.src = 'https://tp-em.com/NTk2MzMw.js?t=596330';
                document.head.appendChild(script);
            })();
          `,
        }}
      />

      <body suppressHydrationWarning>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
