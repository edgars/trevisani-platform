"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { CornerDownLeft, Search } from "lucide-react";

import { cn } from "@/lib/utils";
import { NAV_ICONS, type NavItem } from "./sidebar-nav";

/**
 * Busca global estilo command palette (⌘K). Pesquisa sobre os itens de
 * navegação do portal atual.
 */
export function GlobalSearch({ items }: { items: NavItem[] }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [highlighted, setHighlighted] = React.useState(0);

  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const normalized = query.trim().toLowerCase();
  const results = normalized
    ? items.filter(
        (item) =>
          item.label.toLowerCase().includes(normalized) ||
          item.group?.toLowerCase().includes(normalized),
      )
    : items;

  function go(href: string) {
    setOpen(false);
    setQuery("");
    router.push(href);
  }

  function onInputKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[highlighted]) {
      e.preventDefault();
      go(results[highlighted].href);
    }
  }

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) setQuery("");
        setHighlighted(0);
      }}
    >
      {/* Trigger com cara de input */}
      <DialogPrimitive.Trigger asChild>
        <button
          type="button"
          className="group flex h-9 w-full max-w-md items-center gap-2 rounded-full border bg-background px-3.5 text-sm text-muted-foreground transition-colors hover:bg-accent"
        >
          <Search className="h-4 w-4 shrink-0" />
          <span className="flex-1 truncate text-left">Buscar...</span>
          <kbd className="hidden items-center gap-0.5 rounded-full border bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground sm:flex">
            ⌘ K
          </kbd>
        </button>
      </DialogPrimitive.Trigger>

      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
        <DialogPrimitive.Content className="fixed left-1/2 top-[20%] z-50 w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 overflow-hidden rounded-2xl border bg-popover shadow-2xl outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95">
          <DialogPrimitive.Title className="sr-only">
            Busca global
          </DialogPrimitive.Title>
          <div className="flex items-center gap-2 border-b px-4">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setHighlighted(0);
              }}
              onKeyDown={onInputKeyDown}
              placeholder="Buscar páginas..."
              className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
              ESC
            </kbd>
          </div>
          <div className="max-h-72 overflow-y-auto p-2">
            {results.length === 0 ? (
              <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                Nenhum resultado para &ldquo;{query}&rdquo;.
              </p>
            ) : (
              results.map((item, i) => {
                const Icon = NAV_ICONS[item.icon];
                return (
                  <button
                    key={item.href}
                    type="button"
                    onClick={() => go(item.href)}
                    onMouseEnter={() => setHighlighted(i)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                      i === highlighted
                        ? "bg-accent text-accent-foreground"
                        : "text-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.group && (
                      <span className="text-xs text-muted-foreground">
                        {item.group}
                      </span>
                    )}
                    {i === highlighted && (
                      <CornerDownLeft className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
