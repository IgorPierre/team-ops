import type { Metadata } from "next";
import { Geist_Mono, Instrument_Serif } from "next/font/google";

import "./globals.css";

const serif = Instrument_Serif({
  subsets: ["latin"],
  variable: "--font-display-face",
  weight: "400",
  style: ["normal", "italic"],
});
const mono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono-face",
});

export const metadata: Metadata = {
  title: "Team-Ops — the board for humans and agents",
  description:
    "Self-hosted engineering Kanban. Humans use the board. Agents use the API and MCP. PostgreSQL you control.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${serif.className} ${serif.variable} ${mono.variable} font-sans antialiased`}>
        <div
          className="pointer-events-none fixed inset-0 z-[70] mix-blend-multiply opacity-[0.04]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
          }}
          aria-hidden="true"
        />
        {children}
      </body>
    </html>
  );
}
