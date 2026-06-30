export interface VendaHistorico {
  id: string;
  codigo: string;
  produto: string;
  quantidade_vendida: number;
  data_venda: string;
  arquivo_origem: string;
  importado_em: string;
}

export interface EstoqueAtual {
  id: string;
  codigo: string;
  produto: string;
  quantidade_atual: number;
  estoque_minimo: number;
  arquivo_origem: string;
  importado_em: string;
}

export interface PrevisaoItem {
  codigo: string;
  produto: string;
  media_semanal: number;
  estoque_atual: number;
  estoque_minimo: number;
  producao_sugerida: number;
  status: "produzir" | "estoque_ok";
  cobertura_dias: number | null;
  empresa: string | null;
}

export interface PrevisaoHistorico {
  id: string;
  data_processamento: string;
  periodo_analisado: string;
  periodo_inicio: string | null;
  periodo_fim: string | null;
  arquivo_vendas: string;
  arquivo_estoque: string;
  quantidade_produtos: number;
  quantidade_total_sugerida: number;
  usuario: string | null;
}

export type PeriodoFiltro = "7_dias" | "15_dias" | "30_dias" | "personalizado";

export interface ImportacaoStatus {
  nomeArquivo: string;
  totalRegistros: number;
  dataHora: string;
  sucesso: boolean;
  erros?: string[];
}
