import Link from "next/link";
import { Car } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
        <Car className="h-6 w-6" />
      </div>
      <h1 className="text-3xl font-bold tracking-tight">Página não encontrada</h1>
      <p className="max-w-sm text-muted-foreground">
        O endereço acessado não existe ou o tenant informado não está ativo.
      </p>
      <Button asChild>
        <Link href="/">Voltar ao início</Link>
      </Button>
    </div>
  );
}
