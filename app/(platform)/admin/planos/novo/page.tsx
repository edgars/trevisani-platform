import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlanoForm } from "../plano-form";

export const metadata = { title: "Novo Plano" };

export default function NovoPlanoPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon" className="h-8 w-8">
          <Link href="/admin/planos"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Novo plano</h1>
          <p className="text-sm text-muted-foreground">Configure limites e preços do novo tier.</p>
        </div>
      </div>
      <PlanoForm />
    </div>
  );
}
