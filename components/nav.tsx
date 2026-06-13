"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ListTodo, Lightbulb, Film } from "lucide-react";
import { cn } from "@/lib/cn";

const items = [
  { href: "/", label: "TODAY", icon: Home },
  { href: "/pipeline", label: "PIPELINE", icon: ListTodo },
  { href: "/ideas", label: "IDEAS", icon: Lightbulb },
  { href: "/library", label: "LIBRARY", icon: Film },
];

export function Nav() {
  const pathname = usePathname();
  return (
    <>
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-bg hairline-t safe-bottom z-50">
        <ul className="grid grid-cols-4">
          {items.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/" && pathname.startsWith(href));
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 py-3 mono-caps",
                    active ? "text-accent" : "text-textDim"
                  )}
                >
                  <Icon size={18} strokeWidth={1.5} />
                  <span className="text-[9px]">{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <aside className="hidden md:flex fixed top-0 left-0 bottom-0 w-[200px] bg-bg hairline flex-col z-40">
        <div className="px-5 py-6 hairline-b">
          <div className="font-display text-2xl tracking-wide">R2·STUDIO</div>
          <div className="mono-caps text-textDim mt-1">content ops</div>
        </div>
        <ul className="flex-1 py-3">
          {items.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/" && pathname.startsWith(href));
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    "flex items-center gap-3 px-5 py-3 mono-caps",
                    active ? "text-accent bg-surface" : "text-textDim hover:text-text"
                  )}
                >
                  <Icon size={16} strokeWidth={1.5} />
                  <span>{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="px-5 py-4 hairline-t mono-caps text-textDim">
          v1 · offline-dev
        </div>
      </aside>
    </>
  );
}
