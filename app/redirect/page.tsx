/**
 * /redirect — lightweight server component that reads the JWT cookie directly
 * (no extra HTTP call) and bounces the user to the right destination.
 *
 * Used as the landing page after a successful signIn() with redirect:false,
 * replacing the client-side getSession() + router.refresh() combo that cost
 * an extra ~200-400ms per login.
 */

import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function RedirectPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { callbackUrl } = await searchParams;

  // Validate callbackUrl — only allow same-origin paths
  if (callbackUrl) {
    try {
      const url = new URL(callbackUrl, "http://localhost");
      const safePath = url.pathname + url.search;
      // Only redirect to internal paths (no protocol, no external host)
      if (safePath.startsWith("/") && !safePath.startsWith("//")) {
        redirect(safePath);
      }
    } catch {
      // invalid URL — fall through to default
    }
  }

  // Default: admin for super-admins, tenant portal for everyone else
  if (session.user.tenantSlug) {
    redirect(`/t/${session.user.tenantSlug}`);
  }
  redirect("/admin");
}
