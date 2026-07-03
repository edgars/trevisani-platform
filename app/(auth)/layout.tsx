/**
 * Layout do grupo (auth) — tela cheia, sem header/footer do marketing.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen">{children}</div>;
}
