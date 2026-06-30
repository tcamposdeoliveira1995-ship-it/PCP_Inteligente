"use client";

import { useState, useEffect } from "react";
import { Brain } from "lucide-react";
import { toast } from "sonner";
import { ImportacaoVendas } from "@/components/previsao/importacao-vendas";
import { ImportacaoEstoque } from "@/components/previsao/importacao-estoque";
import { FiltroPeriodo } from "@/components/previsao/filtro-periodo";
import { Indicadores } from "@/components/previsao/indicadores";
import { TabelaPrevisao } from "@/components/previsao/tabela-previsao";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { gerarPrevisao } from "@/lib/calculo-previsao";
import { supabase } from "@/lib/supabase";
import { ImportacaoStatus, PeriodoFiltro, PrevisaoItem } from "@/types/pcp";

interface VendaInput {
  codigo: string;
  produto: string;
  quantidade_vendida: number;
  data_venda: string;
  empresa?: string;
}
interface EstoqueInput {
  codigo: string;
  produto: string;
  quantidade_atual: number;
  estoque_minimo: number;
}

export default function PrevisaoPage() {
  const [vendas, setVendas] = useState<VendaInput[]>([]);
  const [estoque, setEstoque] = useState<EstoqueInput[]>([]);
  const [statusVendas, setStatusVendas] = useState<ImportacaoStatus | null>(null);
  const [statusEstoque, setStatusEstoque] = useState<ImportacaoStatus | null>(null);

  const [periodo, setPeriodo] = useState<PeriodoFiltro>("7_dias");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  const [itens, setItens] = useState<PrevisaoItem[]>([]);
  const [processando, setProcessando] = useState(false);
  const [jaProcessou, setJaProcessou] = useState(false);
  const [margemSeguranca, setMargemSeguranca] = useState(0);

  useEffect(() => {
    async function carregarMargem() {
      const { data } = await supabase
        .from("configuracoes")
        .select("valor")
        .eq("chave", "margem_seguranca")
        .maybeSingle();
      if (data?.valor !== undefined && data?.valor !== null) {
        setMargemSeguranca(Number(data.valor));
      }
    }
    carregarMargem();
  }, []);

  const podeGerar = vendas.length > 0 && estoque.length > 0;

  function handleImportVendas(dados: VendaInput[], status: ImportacaoStatus) {
    setVendas(dados);
    setStatusVendas(status);
    toast.success(`Histórico de vendas importado: ${dados.length} registros`);
  }

  function handleImportEstoque(dados: EstoqueInput[], status: ImportacaoStatus) {
    setEstoque(dados);
    setStatusEstoque(status);
    toast.success(`Estoque importado: ${dados.length} produtos`);
  }

  async function gerarEPersistirPrevisao() {
    setProcessando(true);
    try {
      const inicio = periodo === "personalizado" && dataInicio ? new Date(dataInicio) : undefined;
      const fim = periodo === "personalizado" && dataFim ? new Date(dataFim) : undefined;

      const resultado = gerarPrevisao(vendas, estoque, periodo, inicio, fim, margemSeguranca);
      setItens(resultado);
      setJaProcessou(true);

      const totalSugerido = resultado.reduce((acc, i) => acc + i.producao_sugerida, 0);

      const { data: previsaoHeader, error: erroHeader } = await supabase
        .from("previsoes_historico")
        .insert({
          periodo_analisado: periodo,
          periodo_inicio: inicio ? inicio.toISOString().split("T")[0] : null,
          periodo_fim: fim ? fim.toISOString().split("T")[0] : null,
          arquivo_vendas: statusVendas?.nomeArquivo ?? "—",
          arquivo_estoque: statusEstoque?.nomeArquivo ?? "—",
          quantidade_produtos: resultado.length,
          quantidade_total_sugerida: totalSugerido,
        })
        .select()
        .single();

      if (erroHeader) throw erroHeader;

      if (previsaoHeader) {
        const itensParaInserir = resultado.map((item) => ({
          previsao_id: previsaoHeader.id,
          codigo: item.codigo,
          produto: item.produto,
          media_semanal: item.media_semanal,
          estoque_atual: item.estoque_atual,
          estoque_minimo: item.estoque_minimo,
          producao_sugerida: item.producao_sugerida,
          status: item.status,
          cobertura_dias: item.cobertura_dias,
          empresa: item.empresa ?? null,
        }));

        const { error: erroItens } = await supabase.from("previsao_itens").insert(itensParaInserir);
        if (erroItens) throw erroItens;
      }

      toast.success("Previsão gerada e salva no histórico!");
    } catch (err) {
      console.error(err);
      toast.error("Previsão gerada, mas houve erro ao salvar no histórico.");
    } finally {
      setProcessando(false);
    }
  }

  function handlePeriodoChange(novoPeriodo: PeriodoFiltro) {
    setPeriodo(novoPeriodo);
    if (jaProcessou && podeGerar && novoPeriodo !== "personalizado") {
      const resultado = gerarPrevisao(vendas, estoque, novoPeriodo, undefined, undefined, margemSeguranca);
      setItens(resultado);
    }
  }

  return (
    <div className="space-y-6 pt-12 md:pt-0">
      <div>
        <h1 className="text-2xl font-semibold text-marrom">Previsão Semanal de Produção</h1>
        <p className="text-texto/60 mt-1">Planejamento baseado no histórico de vendas e estoque atual.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <ImportacaoVendas onImportar={handleImportVendas} />
        <ImportacaoEstoque onImportar={handleImportEstoque} />
      </div>

      {(statusVendas?.sucesso || statusEstoque?.sucesso) && (
        <Card>
          <h3 className="font-medium text-marrom mb-3">Resumo da Importação</h3>
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            {statusVendas?.sucesso && (
              <div>
                <p className="font-medium text-texto/80">Histórico de Vendas</p>
                <p className="text-texto/60">Arquivo: {statusVendas.nomeArquivo}</p>
                <p className="text-texto/60">Registros importados: {statusVendas.totalRegistros}</p>
              </div>
            )}
            {statusEstoque?.sucesso && (
              <div>
                <p className="font-medium text-texto/80">Estoque</p>
                <p className="text-texto/60">Arquivo: {statusEstoque.nomeArquivo}</p>
                <p className="text-texto/60">Produtos importados: {statusEstoque.totalRegistros}</p>
              </div>
            )}
          </div>
        </Card>
      )}

      <Button
        size="lg"
        className="w-full"
        disabled={!podeGerar || processando}
        onClick={gerarEPersistirPrevisao}
      >
        <Brain size={20} />
        {processando ? "Gerando previsão..." : "Gerar Previsão Semanal"}
      </Button>

      {jaProcessou && (
        <>
          <FiltroPeriodo
            periodo={periodo}
            onChange={handlePeriodoChange}
            dataInicio={dataInicio}
            dataFim={dataFim}
            onDataInicioChange={setDataInicio}
            onDataFimChange={setDataFim}
          />

          <Indicadores itens={itens} />

          <TabelaPrevisao itens={itens} />
        </>
      )}
    </div>
  );
}
