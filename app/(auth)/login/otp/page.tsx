import { Suspense } from "react";

import { OtpLoginForm } from "./otp-form";

export const metadata = { title: "Entrar com código — Volante7" };

export default function OtpLoginPage() {
  return (
    <Suspense>
      <OtpLoginForm />
    </Suspense>
  );
}
