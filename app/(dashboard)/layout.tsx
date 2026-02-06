"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui";
import { createBrowserClient } from "@/lib/supabase/client";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/leads", label: "Leads" },
  { href: "/agenda", label: "Agenda" }
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  async function handleLogout() {
    const supabase = createBrowserClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-sm font-semibold text-slate-500">ZapRápido</p>
            <h1 className="text-lg font-semibold">Painel</h1>
          </div>
          <nav className="flex gap-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={
                  pathname === item.href
                    ? "text-sm font-semibold text-slate-900"
                    : "text-sm text-slate-500 hover:text-slate-900"
                }
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <Button onClick={handleLogout}>Sair</Button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-6">{children}</main>
    </div>
  );
}
