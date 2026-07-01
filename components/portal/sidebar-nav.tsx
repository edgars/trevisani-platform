"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Building2,
  Car,
  CreditCard,
  FileSignature,
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
} satisfies Record<string, LucideIcon>;

export type NavIconName = keyof typeof NAV_ICONS;

export interface NavItem {
  href: string;
  label: string;
  icon: NavIconName;
}

export function SidebarNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <nav className="grid gap-0.5 px-3 py-2 text-sm">
      {items.map((item) => {
        const Icon = NAV_ICONS[item.icon];
        const active =
          pathname === item.href ||
          (item.href !== "/" && pathname?.startsWith(item.href + "/"));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 transition-colors",
              active
                ? "bg-sidebar-active-bg text-sidebar-active-fg font-medium shadow-sm"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
