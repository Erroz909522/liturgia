import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Liturgia",
  description: "Monte a liturgia do culto e projete no telão",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
