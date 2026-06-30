import * as XLSX from "xlsx";
import { PrevisaoItem } from "@/types/pcp";

export function exportarPrevisaoExcel(itens: PrevisaoItem[]) {
  const dados = itens.map((item) => ({
    Código: item.codigo,
    Produto: item.produto,
    "Média Semanal": item.media_semanal,
    "Estoque Atual": item.estoque_atual,
    "Estoque Mínimo": item.estoque_minimo,
    "Produção Sugerida": item.producao_sugerida,
    Status: item.status === "produzir" ? "Produzir" : "Estoque OK",
    "Cobertura (dias)": item.cobertura_dias ?? "—",
  }));

  const worksheet = XLSX.utils.json_to_sheet(dados);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Previsão Semanal");

  const dataHoje = new Date().toISOString().split("T")[0];
  XLSX.writeFile(workbook, `previsao-semanal-${dataHoje}.xlsx`);
}
