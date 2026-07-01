import { Rocket } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/**
 * Placeholder para módulos ainda não implementados. Mostra a fase do roadmap.
 */
export function PhaseStub({
  title,
  description,
  phase,
}: {
  title: string;
  description: string;
  phase: string;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <Card className="border-dashed">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Rocket className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Em construção</CardTitle>
              <Badge variant="secondary" className="mt-1">
                {phase}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>
            A fundação (Fase 0) está pronta: rota, auth, tenant resolver, layout e o
            schema Prisma já contemplam este módulo. As telas serão implementadas
            seguindo o roadmap do PRD.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
