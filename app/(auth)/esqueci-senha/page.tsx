import { Suspense } from "react";

import { EsqueciSenhaForm } from "./esqueci-form";

export const metadata = { title: "Esqueci minha senha — Volante7" };

export default function EsqueciSenhaPage() {
  return (
    <Suspense>
      <EsqueciSenhaForm />
    </Suspense>
  );
}
