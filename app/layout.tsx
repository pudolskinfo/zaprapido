import "@/styles/globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "ZapRápido",
  description: "SaaS multi-tenant para automação de WhatsApp"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
