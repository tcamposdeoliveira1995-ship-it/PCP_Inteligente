"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TrendingUp, Package, AlertTriangle, CheckCircle2, BarChart3, History } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { PrevisaoHistorico, PrevisaoItem } from "@/types/pcp";

const LABEL_PERIODO: Record<string, string> = {
  "7_dias": "Últimos 7 dias",
  "15_dias": "Últimos 15 dias",
  "30_dias": "Últimos 30 dias",
  personalizado: "Período personalizado",
};

export default function DashboardPage() {
  const [carregando, setCarregando] = useState(true);
  const [ultimaPrevisao, setUltimaPrevisao] = useState<PrevisaoHistorico | null>(null);
  const [itens, setItens] = useState<PrevisaoItem[]>([]);
  const [totalPrevisoesGeradas, setTotalPrevisoesGeradas] = useState(0);

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
          .order("producao_sugerida", { ascending: false })
          .limit(5);

        if (itensData) setItens(itensData as PrevisaoItem[]);
      }

      setCarregando(false);
    }
    carregar();
  }, []);

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

  const produtosParaProduzir = itens.filter((i) => i.status === "produzir").length;

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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="flex items-center gap-4">
          <div className="p-3 rounded-md bg-cinza/40 text-marrom">
            <Package size={20} />
          </div>
          <div>
            <p className="text-xs text-texto/60">Produtos analisados</p>
            <p className="text-xl font-semibold text-marrom">{ultimaPrevisao.quantidade_produtos}</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="p-3 rounded-md bg-cinza/40 text-erro">
            <AlertTriangle size={20} />
          </div>
          <div>
            <p className="text-xs text-texto/60">P/ produzir (top 5)</p>
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
              {ultimaPrevisao.quantidade_total_sugerida.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}
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
        <h3 className="font-medium text-marrom mb-4">Top 5 produtos com maior produção sugerida</h3>
        <div className="space-y-2">
          {itens.map((item) => (
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
      </Card>
    </div>
  );
}
