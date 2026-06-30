import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { PrevisaoItem } from "@/types/pcp";

export function exportarPrevisaoPDF(itens: PrevisaoItem[]) {
  const doc = new jsPDF({ orientation: "landscape" });

  const dataHoje = new Date().toLocaleDateString("pt-BR");

  doc.setFontSize(16);
  doc.setTextColor(77, 68, 61); // marrom
  doc.text("Previsão Semanal de Produção", 14, 18);

  doc.setFontSize(10);
  doc.setTextColor(120, 110, 100);
  doc.text(`Mamma Mia · Gerado em ${dataHoje}`, 14, 25);

  const linhas = itens.map((item) => [
    item.codigo,
    item.produto,
    item.media_semanal.toLocaleString("pt-BR", { maximumFractionDigits: 1 }),
    item.estoque_atual.toLocaleString("pt-BR", { maximumFractionDigits: 1 }),
    item.estoque_minimo.toLocaleString("pt-BR", { maximumFractionDigits: 1 }),
    item.producao_sugerida.toLocaleString("pt-BR", { maximumFractionDigits: 1 }),
    item.status === "produzir" ? "Produzir" : "Estoque OK",
    item.cobertura_dias !== null ? `${item.cobertura_dias} d` : "—",
  ]);

  autoTable(doc, {
    startY: 32,
    head: [["Código", "Produto", "Média Semanal", "Estoque Atual", "Estoque Mínimo", "Produção Sugerida", "Status", "Cobertura"]],
    body: linhas,
    headStyles: { fillColor: [200, 164, 106], textColor: [77, 68, 61], fontStyle: "bold" },
    bodyStyles: { fontSize: 8 },
    alternateRowStyles: { fillColor: [245, 241, 236] },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 6) {
        if (data.cell.raw === "Produzir") {
          data.cell.styles.textColor = [211, 47, 47];
          data.cell.styles.fontStyle = "bold";
        } else {
          data.cell.styles.textColor = [46, 125, 50];
        }
      }
    },
  });

  const dataArquivo = new Date().toISOString().split("T")[0];
  doc.save(`previsao-semanal-${dataArquivo}.pdf`);
}
