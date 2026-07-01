import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "AutoGestão — Plataforma multi-tenant de gestão de veículos",
    template: "%s · AutoGestão",
  },
  description:
    "Do primeiro contato do fornecedor à assinatura do contrato: ofertas, compras, estoque, vendas, financeiro e documentos em um só lugar.",
  applicationName: "AutoGestão",
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className={inter.variable}>
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
