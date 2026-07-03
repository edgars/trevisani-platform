import { Suspense } from "react";

import { RedefinirSenhaForm } from "./redefinir-form";

export const metadata = { title: "Redefinir senha — Volante7" };

export default function RedefinirSenhaPage() {
  return (
    <Suspense>
      <RedefinirSenhaForm />
    </Suspense>
  );
}
