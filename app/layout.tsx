import type { Metadata } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
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
    <html lang="pt-BR" suppressHydrationWarning className={bricolage.variable}>
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
