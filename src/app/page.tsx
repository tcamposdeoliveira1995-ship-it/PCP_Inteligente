"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TrendingUp, Package, AlertTriangle, CheckCircle2, BarChart3, History } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { PrevisaoHistorico, PrevisaoItem } from "@/types/pcp";
import { cn } from "@/lib/utils";

const LABEL_PERIODO: Record<string, string> = {
  "7_dias": "Últimos 7 dias",
  "15_dias": "Últimos 15 dias",
  "30_dias": "Últimos 30 dias",
  personalizado: "Período personalizado",
};

type FiltroEmpresa = "todos" | "YUKA" | "TC";

const EMPRESAS: { valor: FiltroEmpresa; label: string }[] = [
  { valor: "todos", label: "Todas" },
  { valor: "YUKA", label: "YUKA — Assados" },
  { valor: "TC", label: "TC — Frituras" },
];

export default function DashboardPage() {
  const [carregando, setCarregando] = useState(true);
  const [ultimaPrevisao, setUltimaPrevisao] = useState<PrevisaoHistorico | null>(null);
  const [itens, setItens] = useState<PrevisaoItem[]>([]);
  const [totalPrevisoesGeradas, setTotalPrevisoesGeradas] = useState(0);
  const [filtroEmpresa, setFiltroEmpresa] = useState<FiltroEmpresa>("todos");

  useEffect(() => {
    async function carregar() {
      const { data: previsoes } = await supabase
        .from("previsoes_historico")
        .select("*")
        .order("data_processamento", { ascending: false })
        .limit(1);

      const { count } = await supabase
        .from("previsoes_historico")
        .select("*", { count: "exact", head: true });

      if (count !== null) setTotalPrevisoesGeradas(count);

      if (previsoes && previsoes.length > 0) {
        const ultima = previsoes[0] as PrevisaoHistorico;
        setUltimaPrevisao(ultima);

        const { data: itensData } = await supabase
          .from("previsao_itens")
          .select("*")
          .eq("previsao_id", ultima.id)
          .order("producao_sugerida", { ascending: false });

        if (itensData) setItens(itensData as PrevisaoItem[]);
      }

      setCarregando(false);
    }
    carregar();
  }, []);

  // Previsões antigas (sem coluna EMPRESA na planilha importada) ficam com
  // empresa = null. Detectamos isso para exibir aviso no dashboard.
  const dadosSemEmpresa = itens.length > 0 && itens.every((i) => !i.empresa);

  const itensFiltrados = filtroEmpresa === "todos"
    ? itens
    : itens.filter((i) => {
        if (!i.empresa) return false;
        return i.empresa.toUpperCase().trim() === filtroEmpresa;
      });

  const top5 = itensFiltrados.slice(0, 5);
  const produtosParaProduzir = itensFiltrados.filter((i) => i.status === "produzir").length;
  const totalSugerido = itensFiltrados.reduce((acc, i) => acc + i.producao_sugerida, 0);

  if (carregando) {
    return (
      <div className="space-y-6 pt-12 md:pt-0">
        <div>
          <h1 className="text-2xl font-semibold text-marrom">Dashboard</h1>
          <p className="text-texto/60 mt-1">Visão geral do planejamento de produção.</p>
        </div>
        <p className="text-texto/50">Carregando...</p>
      </div>
    );
  }

  if (!ultimaPrevisao) {
    return (
      <div className="space-y-6 pt-12 md:pt-0">
        <div>
          <h1 className="text-2xl font-semibold text-marrom">Dashboard</h1>
          <p className="text-texto/60 mt-1">Visão geral do planejamento de produção.</p>
        </div>
        <Card className="text-center py-12">
          <TrendingUp size={40} className="mx-auto text-dourado mb-4" />
          <h2 className="text-lg font-medium text-marrom mb-2">Comece gerando sua primeira previsão</h2>
          <p className="text-texto/60 mb-6 max-w-md mx-auto">
            Importe o histórico de vendas e o estoque atual para que o sistema sugira automaticamente
            a quantidade de produção da próxima semana.
          </p>
          <Link href="/previsao">
            <Button size="lg">Ir para Previsão Semanal</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-12 md:pt-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-marrom">Dashboard</h1>
          <p className="text-texto/60 mt-1">Visão geral do planejamento de produção.</p>
        </div>
        <Link href="/previsao">
          <Button>
            <TrendingUp size={16} />
            Nova Previsão
          </Button>
        </Link>
      </div>

      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <p className="text-sm text-texto/60">Última previsão gerada</p>
            <p className="text-lg font-semibold text-marrom">
              {new Date(ultimaPrevisao.data_processamento).toLocaleString("pt-BR")}
            </p>
            <p className="text-sm text-texto/60 mt-1">
              {LABEL_PERIODO[ultimaPrevisao.periodo_analisado] ?? ultimaPrevisao.periodo_analisado}
            </p>
          </div>
          <Link href="/historico">
            <Button variant="outline">
              <History size={16} />
              Ver histórico completo
            </Button>
          </Link>
        </div>
      </Card>

      <div className="flex flex-wrap gap-2">
        {EMPRESAS.map((e) => (
          <button
            key={e.valor}
            onClick={() => setFiltroEmpresa(e.valor)}
            className={cn(
              "px-4 py-2 rounded-md text-sm font-medium transition-colors border",
              filtroEmpresa === e.valor
                ? "bg-dourado text-marrom border-dourado"
                : "bg-card text-texto border-cinza hover:bg-cinza/30"
            )}
          >
            {e.label}
          </button>
        ))}
      </div>

      {dadosSemEmpresa && filtroEmpresa !== "todos" && (
        <div className="rounded-md border border-yellow-500/40 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-700 dark:text-yellow-400">
          <strong>Filtro por empresa indisponível:</strong> a previsão salva foi gerada com uma planilha
          que não possui coluna <code className="font-mono">Empresa</code>. Gere uma nova previsão
          incluindo essa coluna para ativar o filtro.
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="flex items-center gap-4">
          <div className="p-3 rounded-md bg-cinza/40 text-marrom">
            <Package size={20} />
          </div>
          <div>
            <p className="text-xs text-texto/60">Produtos analisados</p>
            <p className="text-xl font-semibold text-marrom">{itensFiltrados.length}</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="p-3 rounded-md bg-cinza/40 text-erro">
            <AlertTriangle size={20} />
          </div>
          <div>
            <p className="text-xs text-texto/60">Para produzir</p>
            <p className="text-xl font-semibold text-marrom">{produtosParaProduzir}</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="p-3 rounded-md bg-cinza/40 text-dourado">
            <BarChart3 size={20} />
          </div>
          <div>
            <p className="text-xs text-texto/60">Total sugerido</p>
            <p className="text-xl font-semibold text-marrom">
              {totalSugerido.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}
            </p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="p-3 rounded-md bg-cinza/40 text-sucesso">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <p className="text-xs text-texto/60">Previsões geradas</p>
            <p className="text-xl font-semibold text-marrom">{totalPrevisoesGeradas}</p>
          </div>
        </Card>
      </div>

      <Card>
        <h3 className="font-medium text-marrom mb-4">
          Top 5 produtos com maior produção sugerida
          {filtroEmpresa !== "todos" && (
            <span className="ml-2 text-sm font-normal text-texto/60">
              — {filtroEmpresa === "YUKA" ? "YUKA (Assados)" : "TC (Frituras)"}
            </span>
          )}
        </h3>
        {top5.length === 0 ? (
          <p className="text-texto/50 text-sm">Nenhum produto encontrado para esta empresa.</p>
        ) : (
          <div className="space-y-2">
            {top5.map((item) => (
              <div
                key={item.codigo}
                className="flex items-center justify-between py-2 border-b border-cinza/50 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-texto">{item.produto}</p>
                  <p className="text-xs text-texto/50">Código {item.codigo}</p>
                </div>
                <p className="font-semibold text-marrom">
                  {item.producao_sugerida.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
