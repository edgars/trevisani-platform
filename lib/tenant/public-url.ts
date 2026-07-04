/** Monta a URL pública (vitrine) de um tenant a partir do slug. */
export function getTenantPublicUrl(slug: string): string {
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost:3000";
  const isLocal = rootDomain.includes("localhost");
  if (isLocal) {
    return `http://${slug}.${rootDomain}`;
  }
  // Domínios *.vercel.app não suportam subdomínio de tenant: usamos o path /site/[slug].
  if (rootDomain.includes("vercel.app")) {
    return `https://${rootDomain}/site/${slug}`;
  }
  return `https://${slug}.${rootDomain}`;
}
