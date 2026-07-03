import type { WebsiteConfigData } from "@/lib/website/types";

type SocialConfig = Pick<
  WebsiteConfigData,
  "instagram" | "facebook" | "youtube" | "tiktok" | "linkedin" | "x"
>;

interface IconProps {
  className?: string;
}

function InstagramIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.332.014 7.052.072 2.695.272.273 2.69.073 7.052.014 8.332 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.332 23.986 8.741 24 12 24s3.668-.014 4.948-.072c4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.668-.072-4.948-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}

function FacebookIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M22 12.06C22 6.505 17.523 2 12 2S2 6.505 2 12.06c0 5.02 3.657 9.184 8.438 9.94v-7.03H7.898v-2.91h2.54V9.845c0-2.507 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562v1.878h2.773l-.443 2.91h-2.33V22c4.78-.756 8.437-4.92 8.437-9.94z" />
    </svg>
  );
}

function YoutubeIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

function TiktokIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M16.6 5.82c-1.02-1.09-1.57-2.4-1.6-3.82h-3.13v13.3c0 1.85-1.5 3.35-3.35 3.35a3.35 3.35 0 01-3.35-3.35 3.35 3.35 0 013.35-3.35c.28 0 .55.03.8.1V8.9a6.55 6.55 0 00-.8-.05A6.5 6.5 0 002.02 15.35 6.5 6.5 0 008.52 21.85a6.5 6.5 0 006.5-6.5V9.4a9.6 9.6 0 005.6 1.8V8.08a5.83 5.83 0 01-4.02-2.26z" />
    </svg>
  );
}

function LinkedinIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 110-4.124 2.062 2.062 0 010 4.124zM7.114 20.452H3.558V9h3.556v11.452z" />
    </svg>
  );
}

function XIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export interface SocialLink {
  key: string;
  label: string;
  href: string;
  Icon: (props: IconProps) => React.JSX.Element;
}

function normalizeUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

/**
 * Retorna somente as redes sociais que possuem link preenchido,
 * prontas para renderização (ícone só aparece se houver link).
 */
export function getSocialLinks(config: SocialConfig): SocialLink[] {
  const links: SocialLink[] = [];

  if (config.instagram) {
    links.push({
      key: "instagram",
      label: "Instagram",
      href: `https://instagram.com/${config.instagram.replace(/^@/, "").trim()}`,
      Icon: InstagramIcon,
    });
  }
  if (config.facebook) {
    links.push({ key: "facebook", label: "Facebook", href: normalizeUrl(config.facebook), Icon: FacebookIcon });
  }
  if (config.youtube) {
    links.push({ key: "youtube", label: "YouTube", href: normalizeUrl(config.youtube), Icon: YoutubeIcon });
  }
  if (config.tiktok) {
    links.push({ key: "tiktok", label: "TikTok", href: normalizeUrl(config.tiktok), Icon: TiktokIcon });
  }
  if (config.linkedin) {
    links.push({ key: "linkedin", label: "LinkedIn", href: normalizeUrl(config.linkedin), Icon: LinkedinIcon });
  }
  if (config.x) {
    links.push({ key: "x", label: "X (Twitter)", href: normalizeUrl(config.x), Icon: XIcon });
  }

  return links;
}

/**
 * Linha de ícones de redes sociais — só renderiza os que têm link preenchido.
 * Some silenciosamente (retorna null) quando nenhuma rede está configurada.
 */
export function SocialLinksRow({
  config,
  className = "flex items-center gap-3",
  iconClassName = "h-4 w-4",
  linkClassName = "opacity-80 hover:opacity-100 transition-opacity",
}: {
  config: SocialConfig;
  className?: string;
  iconClassName?: string;
  linkClassName?: string;
}) {
  const links = getSocialLinks(config);
  if (links.length === 0) return null;

  return (
    <div className={className}>
      {links.map(({ key, label, href, Icon }) => (
        <a
          key={key}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          title={label}
          className={linkClassName}
        >
          <Icon className={iconClassName} />
        </a>
      ))}
    </div>
  );
}
