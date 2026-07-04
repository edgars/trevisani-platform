"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn, getSession } from "next-auth/react";
import { AlertCircle, Lock, Mail } from "lucide-react";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { reenviarConfirmacaoAction } from "@/app/(auth)/cadastro/actions";

// ─── Car SVG ──────────────────────────────────────────────────────────────────

function CarSvg({ color }: { color: string }) {
  return (
    <svg
      viewBox="0 0 80 36"
      width="80"
      height="36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      {/* body */}
      <path
        d="M4 26 L4 20 C4 20 8 12 12 10 L18 6 L44 6 L50 10 L66 12 L74 18 L76 20 L76 26 Z"
        fill={color}
      />
      {/* roof */}
      <path
        d="M18 6 L20 2 L46 2 L50 6 Z"
        fill={color}
        opacity="0.85"
      />
      {/* windshield */}
      <path
        d="M22 6 L20.5 10 L46 10 L48 6 Z"
        fill="rgba(180,230,255,0.55)"
      />
      {/* rear window */}
      <path
        d="M20 6 L18.5 2.5 L21 2 L22.5 6 Z"
        fill="rgba(180,230,255,0.4)"
      />
      {/* door line */}
      <line x1="40" y1="10" x2="39" y2="25" stroke="rgba(0,0,0,0.2)" strokeWidth="1" />
      {/* headlight */}
      <ellipse cx="74" cy="21" rx="3" ry="2" fill="#fef08a" opacity="0.9" />
      {/* tail light */}
      <rect x="4" y="20" width="3" height="4" rx="1" fill="#fca5a5" />
      {/* under body / skirt */}
      <rect x="8" y="25" width="60" height="3" rx="1" fill={color} opacity="0.6" />
      {/* front wheel */}
      <circle cx="60" cy="28" r="7" fill="#1e1e1e" />
      <circle cx="60" cy="28" r="4" fill="#555" />
      <circle cx="60" cy="28" r="2" fill="#aaa" />
      {/* rear wheel */}
      <circle cx="20" cy="28" r="7" fill="#1e1e1e" />
      <circle cx="20" cy="28" r="4" fill="#555" />
      <circle cx="20" cy="28" r="2" fill="#aaa" />
      {/* exhaust */}
      <rect x="2" y="23" width="5" height="2" rx="1" fill="#888" />
    </svg>
  );
}

// ─── Racing overlay ───────────────────────────────────────────────────────────

type Direction = "lr" | "rl" | "tb" | "bt";

interface CarConfig {
  id: number;
  dir: Direction;
  pos: number;     // % along the perpendicular axis
  dur: number;     // animation duration in seconds
  delay: number;   // animation delay in seconds
  scale: number;
  color: string;
}

const COLORS = [
  "#e11d48", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#3b82f6", // blue
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#14b8a6", // teal
];

function makeCars(): CarConfig[] {
  const dirs: Direction[] = ["lr", "rl", "tb", "bt"];
  return Array.from({ length: 14 }, (_, i) => ({
    id: i,
    dir: dirs[i % 4] as Direction,
    pos: 5 + ((i * 37 + 13) % 85),   // deterministic spread, no Math.random on server
    dur: 2.2 + (i % 5) * 0.6,
    delay: -(i * 0.7),               // negative delay = pre-start (no initial gap)
    scale: 0.55 + (i % 4) * 0.18,
    color: COLORS[i % COLORS.length],
  }));
}

function RacingCarsOverlay({ visible }: { visible: boolean }) {
  // Generate on client only to avoid hydration mismatch with random values
  const [cars, setCars] = useState<CarConfig[]>([]);
  useEffect(() => { setCars(makeCars()); }, []);

  if (!visible || cars.length === 0) return null;

  return (
    <>
      {/* Global keyframes injected once */}
      <style>{`
        @keyframes race-lr {
          from { transform: translateX(-180px) }
          to   { transform: translateX(calc(100vw + 180px)) }
        }
        @keyframes race-rl {
          from { transform: translateX(calc(100vw + 180px)) scaleX(-1) }
          to   { transform: translateX(-180px) scaleX(-1) }
        }
        @keyframes race-tb {
          from { transform: translateY(-120px) rotate(90deg) }
          to   { transform: translateY(calc(100vh + 120px)) rotate(90deg) }
        }
        @keyframes race-bt {
          from { transform: translateY(calc(100vh + 120px)) rotate(-90deg) }
          to   { transform: translateY(-120px) rotate(-90deg) }
        }
      `}</style>

      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-[#0a0e1a]/90 backdrop-blur-sm"
        aria-label="Autenticando…"
      >
        {/* Status text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 pointer-events-none select-none">
          <p className="text-lg font-semibold text-white tracking-wide animate-pulse">
            Entrando na sua loja…
          </p>
          <div className="flex gap-1.5">
            {[0,1,2].map(i => (
              <span
                key={i}
                className="h-2 w-2 rounded-full bg-red-500"
                style={{ animation: `pulse 1.2s ease-in-out ${i * 0.3}s infinite` }}
              />
            ))}
          </div>
        </div>

        {/* Cars */}
        {cars.map((car) => {
          const isHorizontal = car.dir === "lr" || car.dir === "rl";
          const style: React.CSSProperties = {
            position: "fixed",
            animationName: `race-${car.dir}`,
            animationDuration: `${car.dur}s`,
            animationDelay: `${car.delay}s`,
            animationTimingFunction: "linear",
            animationIterationCount: "infinite",
            transform: car.dir === "rl" ? "scaleX(-1)" : undefined,
            ...(isHorizontal
              ? {
                  top: `${car.pos}%`,
                  left: 0,
                  transformOrigin: "left center",
                }
              : {
                  left: `${car.pos}%`,
                  top: 0,
                  transformOrigin: "center top",
                }),
          };

          return (
            <div
              key={car.id}
              style={style}
            >
              <div style={{ transform: `scale(${car.scale})`, transformOrigin: "left top" }}>
                <CarSvg color={car.color} />
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

// ─── Login form ───────────────────────────────────────────────────────────────

interface LoginFormProps {
  erro?: string;
}

export function LoginForm({ erro }: LoginFormProps) {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? undefined;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    erro ? "Não foi possível autenticar. Verifique suas credenciais." : null,
  );
  const [emailNaoConfirmado, setEmailNaoConfirmado] = useState<string | null>(null);
  const [reenviando, setReenviando] = useState(false);

  async function handleReenviar(email: string) {
    setReenviando(true);
    try {
      await reenviarConfirmacaoAction(email);
      toast.success("E-mail de confirmação reenviado. Confira sua caixa de entrada.");
    } finally {
      setReenviando(false);
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setEmailNaoConfirmado(null);
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "");
    const senha = String(form.get("senha") ?? "");

    const res = await signIn("credentials", {
      redirect: false,
      email,
      senha,
    });

    if (res?.error) {
      setLoading(false);
      if (res.code === "email_nao_confirmado") {
        setEmailNaoConfirmado(email);
      } else {
        setError("E-mail ou senha incorretos. Verifique suas credenciais.");
      }
      return;
    }

    // Mantém loading=true enquanto redireciona — overlay fica visível até sumir a página
    const session = await getSession();
    const dest =
      callbackUrl ??
      (session?.user?.tenantSlug ? `/t/${session.user.tenantSlug}` : "/admin");

    router.push(dest);
    router.refresh();
  }

  return (
    <>
      <RacingCarsOverlay visible={loading} />

      <form onSubmit={onSubmit} className="space-y-5">
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {emailNaoConfirmado && (
          <div className="space-y-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-800 dark:text-amber-400">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              Confirme seu e-mail antes de entrar. Enviamos um link para {emailNaoConfirmado}.
            </div>
            <button
              type="button"
              disabled={reenviando}
              onClick={() => handleReenviar(emailNaoConfirmado)}
              className="font-medium underline underline-offset-2 disabled:opacity-60"
            >
              {reenviando ? "Reenviando…" : "Reenviar e-mail de confirmação"}
            </button>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="voce@suarevenda.com.br"
              required
              autoComplete="email"
              disabled={loading}
              className="pl-9"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="senha">Senha</Label>
            <Link
              href="/esqueci-senha"
              className="text-xs font-medium text-primary hover:underline"
            >
              Esqueci minha senha
            </Link>
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="senha"
              name="senha"
              type="password"
              required
              autoComplete="current-password"
              disabled={loading}
              className="pl-9"
            />
          </div>
        </div>

        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          Entrar
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Prefere código por e-mail?{" "}
          <Link
            href={`/login/otp${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`}
            className="font-medium text-primary hover:underline"
          >
            Entrar com OTP
          </Link>
        </p>
      </form>
    </>
  );
}
