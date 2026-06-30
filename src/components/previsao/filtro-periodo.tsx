"use client";

import { PeriodoFiltro } from "@/types/pcp";
import { cn } from "@/lib/utils";

interface Props {
  periodo: PeriodoFiltro;
  onChange: (periodo: PeriodoFiltro) => void;
  dataInicio?: string;
  dataFim?: string;
  onDataInicioChange?: (data: string) => void;
  onDataFimChange?: (data: string) => void;
}

const OPCOES: { valor: PeriodoFiltro; label: string }[] = [
  { valor: "7_dias", label: "Últimos 7 dias" },
  { valor: "15_dias", label: "Últimos 15 dias" },
  { valor: "30_dias", label: "Últimos 30 dias" },
  { valor: "personalizado", label: "Período personalizado" },
];

export function FiltroPeriodo({ periodo, onChange, dataInicio, dataFim, onDataInicioChange, onDataFimChange }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {OPCOES.map((opcao) => (
        <button
          key={opcao.valor}
          onClick={() => onChange(opcao.valor)}
          className={cn(
            "px-4 py-2 rounded-md text-sm font-medium transition-colors border",
            periodo === opcao.valor
              ? "bg-dourado text-marrom border-dourado"
              : "bg-card text-texto border-cinza hover:bg-cinza/30"
          )}
        >
          {opcao.label}
        </button>
      ))}

      {periodo === "personalizado" && (
        <div className="flex items-center gap-2 ml-2">
          <input
            type="date"
            value={dataInicio ?? ""}
            onChange={(e) => onDataInicioChange?.(e.target.value)}
            className="px-3 py-2 rounded-md border border-cinza text-sm bg-card"
          />
          <span className="text-texto/50">até</span>
          <input
            type="date"
            value={dataFim ?? ""}
            onChange={(e) => onDataFimChange?.(e.target.value)}
            className="px-3 py-2 rounded-md border border-cinza text-sm bg-card"
          />
        </div>
      )}
    </div>
  );
}
