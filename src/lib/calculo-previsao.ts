import { PeriodoFiltro, PrevisaoItem } from "@/types/pcp";

interface VendaInput {
  codigo: string;
  produto: string;
  quantidade_vendida: number;
  data_venda: string;
}

interface EstoqueInput {
  codigo: string;
  produto: string;
  quantidade_atual: number;
  estoque_minimo: number;
}

export function diasDoPeriodo(periodo: PeriodoFiltro, inicio?: Date, fim?: Date): number {
  switch (periodo) {
    case "7_dias":
      return 7;
    case "15_dias":
      return 15;
    case "30_dias":
      return 30;
    case "personalizado":
      if (inicio && fim) {
        const diff = Math.ceil((fim.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24));
        return Math.max(diff, 1);
      }
      return 7;
  }
}

export function filtrarVendasPorPeriodo(
  vendas: VendaInput[],
  periodo: PeriodoFiltro,
  dataInicioPersonalizada?: Date,
  dataFimPersonalizada?: Date
): { vendasFiltradas: VendaInput[]; dataInicio: Date; dataFim: Date } {
  let dataFim: Date;
  let dataInicio: Date;

  if (periodo === "personalizado" && dataInicioPersonalizada && dataFimPersonalizada) {
    dataInicio = dataInicioPersonalizada;
    dataFim = dataFimPersonalizada;
  } else {
    const datasValidas = vendas
      .map((v) => new Date(v.data_venda))
      .filter((d) => !isNaN(d.getTime()));
    dataFim = datasValidas.length > 0 ? new Date(Math.max(...datasValidas.map((d) => d.getTime()))) : new Date();
    const dias = diasDoPeriodo(periodo);
    dataInicio = new Date(dataFim);
    dataInicio.setDate(dataInicio.getDate() - dias);
  }

  const vendasFiltradas = vendas.filter((v) => {
    const data = new Date(v.data_venda);
    return !isNaN(data.getTime()) && data >= dataInicio && data <= dataFim;
  });

  return { vendasFiltradas, dataInicio, dataFim };
}

export function gerarPrevisao(
  vendas: VendaInput[],
  estoque: EstoqueInput[],
  periodo: PeriodoFiltro,
  dataInicioPersonalizada?: Date,
  dataFimPersonalizada?: Date
): PrevisaoItem[] {
  const { vendasFiltradas, dataInicio, dataFim } = filtrarVendasPorPeriodo(
    vendas,
    periodo,
    dataInicioPersonalizada,
    dataFimPersonalizada
  );

  const diasPeriodo = Math.max(
    Math.ceil((dataFim.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24)),
    1
  );

  const vendasPorCodigo = new Map<string, { produto: string; total: number }>();
  for (const venda of vendasFiltradas) {
    const atual = vendasPorCodigo.get(venda.codigo);
    if (atual) {
      atual.total += venda.quantidade_vendida;
    } else {
      vendasPorCodigo.set(venda.codigo, { produto: venda.produto, total: venda.quantidade_vendida });
    }
  }

  const estoquePorCodigo = new Map<string, EstoqueInput>();
  for (const item of estoque) {
    estoquePorCodigo.set(item.codigo, item);
  }

  const todosCodigos = new Set<string>([...vendasPorCodigo.keys(), ...estoquePorCodigo.keys()]);

  const itens: PrevisaoItem[] = [];

  for (const codigo of todosCodigos) {
    const venda = vendasPorCodigo.get(codigo);
    const itemEstoque = estoquePorCodigo.get(codigo);

    const totalVendido = venda?.total ?? 0;
    const mediaSemanal = (totalVendido / diasPeriodo) * 7;
    const quantidadeAtual = itemEstoque?.quantidade_atual ?? 0;
    const estoqueMinimo = itemEstoque?.estoque_minimo ?? 0;

    const producaoSugeridaBruta = mediaSemanal - quantidadeAtual;
    const producaoSugerida = Math.max(producaoSugeridaBruta, 0);

    const coberturaDias = mediaSemanal > 0 ? (quantidadeAtual / mediaSemanal) * 7 : null;

    itens.push({
      codigo,
      produto: venda?.produto ?? itemEstoque?.produto ?? "(produto não identificado)",
      media_semanal: Number(mediaSemanal.toFixed(2)),
      estoque_atual: quantidadeAtual,
      estoque_minimo: estoqueMinimo,
      producao_sugerida: Number(producaoSugerida.toFixed(2)),
      status: producaoSugerida > 0 ? "produzir" : "estoque_ok",
      cobertura_dias: coberturaDias !== null ? Number(coberturaDias.toFixed(1)) : null,
    });
  }

  return itens.sort((a, b) => b.producao_sugerida - a.producao_sugerida);
}
