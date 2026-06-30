"use client";

import { useEffect, useState } from "react";
import { History as HistoryIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { PrevisaoHistorico } from "@/types/pcp";

const LABEL_PERIODO: Record<string, string> = {
  "7_dias": "Últimos 7 dias",
  "15_dias": "Últimos 15 dias",
  "30_dias": "Últimos 30 dias",
  personalizado: "Período personalizado",
};

export default function HistoricoPage() {
  const [historico, setHistorico] = useState<PrevisaoHistorico[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregar() {
      const { data, error } = await supabase
        .from("previsoes_historico")
        .select("*")
        .order("data_processamento", { ascending: false });

      if (!error && data) setHistorico(data as PrevisaoHistorico[]);
      setCarregando(false);
    }
    carregar();
  }, []);

  return (
    <div className="space-y-6 pt-12 md:pt-0">
      <div>
        <h1 className="text-2xl font-semibold text-marrom">Histórico</h1>
        <p className="text-texto/60 mt-1">Todas as previsões geradas anteriormente.</p>
      </div>

      {carregando ? (
        <p className="text-texto/50">Carregando...</p>
      ) : historico.length === 0 ? (
        <Card className="text-center py-12">
          <HistoryIcon size={36} className="mx-auto text-texto/30 mb-3" />
          <p className="text-texto/60">Nenhuma previsão gerada ainda.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {historico.map((item) => (
            <Card key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="font-medium text-marrom">
                  {new Date(item.data_processamento).toLocaleString("pt-BR")}
                </p>
                <p className="text-sm text-texto/60">
                  {LABEL_PERIODO[item.periodo_analisado] ?? item.periodo_analisado} · Vendas:{" "}
                  {item.arquivo_vendas} · Estoque: {item.arquivo_estoque}
                </p>
              </div>
              <div className="flex gap-6 text-sm">
                <div>
                  <p className="text-texto/50">Produtos</p>
                  <p className="font-semibold text-marrom">{item.quantidade_produtos}</p>
                </div>
                <div>
                  <p className="text-texto/50">Total sugerido</p>
                  <p className="font-semibold text-marrom">
                    {item.quantidade_total_sugerida.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
