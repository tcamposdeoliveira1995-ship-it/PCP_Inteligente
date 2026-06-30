"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, TrendingUp, History, Settings, Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const ITENS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/previsao", label: "Previsão Semanal", icon: TrendingUp },
  { href: "/historico", label: "Histórico", icon: History },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [aberto, setAberto] = useState(false);

  return (
    <>
      <button
        onClick={() => setAberto(!aberto)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-card shadow-soft"
        aria-label="Abrir menu"
      >
        {aberto ? <X size={20} /> : <Menu size={20} />}
      </button>

      {aberto && (
        <div
          className="md:hidden fixed inset-0 bg-marrom/40 z-30"
          onClick={() => setAberto(false)}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-64 bg-marrom text-white z-40 transition-transform md:translate-x-0",
          aberto ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-6 border-b border-white/10">
          <h1 className="text-lg font-semibold tracking-tight">Mamma PCP</h1>
          <p className="text-xs text-white/60 mt-1">Planejamento de Produção</p>
        </div>

        <nav className="p-4 space-y-1">
          {ITENS.map((item) => {
            const ativo = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setAberto(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-md text-sm transition-colors",
                  ativo
                    ? "bg-dourado text-marrom font-medium"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                )}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
