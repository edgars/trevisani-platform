"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Building2,
  Car,
  CreditCard,
  FileSignature,
  Globe,
  LayoutDashboard,
  type LucideIcon,
  Package,
  PlusCircle,
  Receipt,
  Settings,
  ShieldAlert,
  ShoppingBag,
  ShoppingCart,
  Truck,
  Users,
  Wallet,
  Zap,
  TrendingUp,
  Gavel,
  MessageCircle,
} from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Nomes de ícones aceitos. Server components passam apenas a string;
 * a resolução para componente React acontece aqui no cliente para não
 * atravessar a fronteira RSC com refs de componente (que não são
 * serializáveis).
 */
export const NAV_ICONS = {
  barchart3: BarChart3,
  building2: Building2,
  car: Car,
  creditcard: CreditCard,
  filesignature: FileSignature,
  globe: Globe,
  layoutdashboard: LayoutDashboard,
  package: Package,
  pluscircle: PlusCircle,
  receipt: Receipt,
  settings: Settings,
  shieldalert: ShieldAlert,
  shoppingbag: ShoppingBag,
  shoppingcart: ShoppingCart,
  truck: Truck,
  users: Users,
  wallet: Wallet,
  zap: Zap,
  trendingup: TrendingUp,
  gavel: Gavel,
  messagecirlce: MessageCircle,
} satisfies Record<string, LucideIcon>;

export type NavIconName = keyof typeof NAV_ICONS;

export interface NavItem {
  href: string;
  label: string;
  icon: NavIconName;
  /** Rótulo do grupo na sidebar (ex.: "Catálogo"). Itens consecutivos com o
   * mesmo grupo são renderizados sob o mesmo cabeçalho. */
  group?: string;
}

interface NavGroup {
  label?: string;
  items: NavItem[];
}

/** Agrupa itens consecutivos que compartilham o mesmo `group`. */
export function groupNavItems(items: NavItem[]): NavGroup[] {
  const groups: NavGroup[] = [];
  for (const item of items) {
    const last = groups[groups.length - 1];
    if (last && last.label === item.group) {
      last.items.push(item);
    } else {
      groups.push({ label: item.group, items: [item] });
    }
  }
  return groups;
}

export function SidebarNav({
  items,
  collapsed = false,
}: {
  items: NavItem[];
  collapsed?: boolean;
}) {
  const pathname = usePathname();
  const groups = groupNavItems(items);

  return (
    <nav className={cn("flex flex-col gap-6 py-3 text-sm", collapsed ? "px-2" : "px-3")}>
      {groups.map((group, gi) => (
        <div key={group.label ?? gi} className="flex flex-col gap-0.5">
          {group.label && !collapsed && (
            <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60">
              {group.label}
            </p>
          )}
          {group.label && collapsed && gi > 0 && (
            <div className="mx-2 mb-2 border-t border-sidebar-border" />
          )}
          {group.items.map((item) => {
            const Icon = NAV_ICONS[item.icon];
            const active =
              pathname === item.href ||
              (item.href !== "/" && pathname?.startsWith(item.href + "/"));
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg py-2.5 transition-colors",
                  collapsed ? "justify-center px-0" : "px-3",
                  active
                    ? "bg-sidebar-active-bg text-sidebar-active-fg font-medium shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span className="text-[13px]">{item.label}</span>}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
