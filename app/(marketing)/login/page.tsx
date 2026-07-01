import Link from "next/link";
import { Car } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "./login-form";

export const metadata = { title: "Entrar" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ tenant?: string; erro?: string }>;
}) {
  const { tenant, erro } = await searchParams;
  return (
    <div className="container flex min-h-[calc(100vh-4rem)] max-w-md items-center py-12">
      <Card className="w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Car className="h-5 w-5" />
          </div>
          <CardTitle>Entrar no AutoGestão</CardTitle>
          <CardDescription>
            {tenant
              ? `Acessando tenant: ${tenant}`
              : "Informe o slug da loja ou deixe em branco para acesso da plataforma."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm defaultTenant={tenant} erro={erro} />
          <div className="mt-6 text-center text-sm text-muted-foreground">
            Ainda não tem conta?{" "}
            <Link href="/planos" className="font-medium text-primary hover:underline">
              Ver planos
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
