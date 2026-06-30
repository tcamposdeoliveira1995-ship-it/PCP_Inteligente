import * as XLSX from "xlsx";

export interface ParseResult<T> {
  sucesso: boolean;
  dados: T[];
  colunasFaltando: string[];
  totalRegistros: number;
}

const COLUNAS_VENDAS_SIMPLES = ["Código", "Produto", "Quantidade Vendida", "Data da Venda"];
const COLUNAS_VENDAS_CURVA_ABC = ["COD_PRODUTO", "DESC_PRODUTO", "TOT_QTDE", "PERIODO"];
const COLUNAS_ESTOQUE = ["Código", "Produto", "Quantidade Atual", "Estoque Mínimo"];
const COLUNAS_ESTOQUE_ALT = ["Código", "Produto", "QTD Atual", "Estoque Mínimo"];

const MESES: Record<string, string> = {
  jan: "01",
  fev: "02",
  mar: "03",
  abr: "04",
  mai: "05",
  jun: "06",
  jul: "07",
  ago: "08",
  set: "09",
  out: "10",
  nov: "11",
  dez: "12",
};

function normalizarChave(chave: string) {
  return chave
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function lerArquivo(file: File): Promise<unknown[][]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "binary", cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false });
        resolve(json as unknown[][]);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsBinaryString(file);
  });
}

function colunasPresentes(headerRow: string[], colunasEsperadas: string[]): boolean {
  const headerNormalizado = headerRow.map(normalizarChave);
  return colunasEsperadas.every((coluna) => headerNormalizado.includes(normalizarChave(coluna)));
}

function validarColunas(headerRow: string[], colunasEsperadas: string[]): string[] {
  const headerNormalizado = headerRow.map(normalizarChave);
  const faltando: string[] = [];
  for (const coluna of colunasEsperadas) {
    if (!headerNormalizado.includes(normalizarChave(coluna))) {
      faltando.push(coluna);
    }
  }
  return faltando;
}

function mapearLinhas(rows: unknown[][], headerRow: string[]) {
  const headerNormalizado = headerRow.map(normalizarChave);
  return rows.slice(1).filter((row) => row.some((cell) => cell !== undefined && cell !== "")).map((row) => {
    const obj: Record<string, unknown> = {};
    headerNormalizado.forEach((key, idx) => {
      obj[key] = row[idx];
    });
    return obj;
  });
}

// Converte período tipo "DEZ_25" ou "MAI_26" para o primeiro dia daquele mês: "2025-12-01"
function periodoParaData(periodo: unknown): string {
  const str = String(periodo ?? "").trim().toLowerCase();
  const match = str.match(/^([a-z]{3})_(\d{2})$/);
  if (!match) return "";
  const [, mesAbrev, anoAbrev] = match;
  const mes = MESES[mesAbrev];
  if (!mes) return "";
  const ano = `20${anoAbrev}`;
  return `${ano}-${mes}-01`;
}

export async function parseVendasHistorico(
  file: File
): Promise<ParseResult<{ codigo: string; produto: string; quantidade_vendida: number; data_venda: string }>> {
  const rows = await lerArquivo(file);
  if (rows.length === 0) {
    return { sucesso: false, dados: [], colunasFaltando: COLUNAS_VENDAS_SIMPLES, totalRegistros: 0 };
  }
  const headerRow = rows[0] as string[];

  const ehFormatoSimples = colunasPresentes(headerRow, COLUNAS_VENDAS_SIMPLES);
  const ehFormatoCurvaABC = colunasPresentes(headerRow, COLUNAS_VENDAS_CURVA_ABC);

  if (!ehFormatoSimples && !ehFormatoCurvaABC) {
    const colunasFaltando = validarColunas(headerRow, COLUNAS_VENDAS_SIMPLES);
    return { sucesso: false, dados: [], colunasFaltando, totalRegistros: 0 };
  }

  const linhas = mapearLinhas(rows, headerRow);

  if (ehFormatoCurvaABC) {
    const dados = linhas
      .map((linha) => ({
        codigo: String(linha["cod_produto"] ?? "").trim(),
        produto: String(linha["desc_produto"] ?? "").trim(),
        quantidade_vendida: parseFloat(String(linha["tot_qtde"] ?? "0").replace(",", ".")) || 0,
        data_venda: periodoParaData(linha["periodo"]),
      }))
      .filter((item) => item.codigo && item.data_venda);

    return { sucesso: true, dados, colunasFaltando: [], totalRegistros: dados.length };
  }

  const dados = linhas.map((linha) => ({
    codigo: String(linha["codigo"] ?? "").trim(),
    produto: String(linha["produto"] ?? "").trim(),
    quantidade_vendida: parseFloat(String(linha["quantidade vendida"] ?? "0").replace(",", ".")) || 0,
    data_venda: normalizarData(linha["data da venda"]),
  }));

  return { sucesso: true, dados, colunasFaltando: [], totalRegistros: dados.length };
}

export async function parseEstoqueAtual(
  file: File
): Promise<ParseResult<{ codigo: string; produto: string; quantidade_atual: number; estoque_minimo: number }>> {
  const rows = await lerArquivo(file);
  if (rows.length === 0) {
    return { sucesso: false, dados: [], colunasFaltando: COLUNAS_ESTOQUE, totalRegistros: 0 };
  }
  const headerRow = rows[0] as string[];

  const ehFormatoPadrao = colunasPresentes(headerRow, COLUNAS_ESTOQUE);
  const ehFormatoSistema = colunasPresentes(headerRow, COLUNAS_ESTOQUE_ALT);

  if (!ehFormatoPadrao && !ehFormatoSistema) {
    const colunasFaltando = validarColunas(headerRow, COLUNAS_ESTOQUE);
    return { sucesso: false, dados: [], colunasFaltando, totalRegistros: 0 };
  }

  const linhas = mapearLinhas(rows, headerRow);
  const chaveQuantidade = ehFormatoSistema ? "qtd atual" : "quantidade atual";

  const dados = linhas.map((linha) => ({
    codigo: String(linha["codigo"] ?? "").trim(),
    produto: String(linha["produto"] ?? "").trim(),
    quantidade_atual: parseFloat(String(linha[chaveQuantidade] ?? "0").replace(",", ".")) || 0,
    estoque_minimo: parseFloat(String(linha["estoque minimo"] ?? "0").replace(",", ".")) || 0,
  }));

  return { sucesso: true, dados, colunasFaltando: [], totalRegistros: dados.length };
}

function normalizarData(valor: unknown): string {
  if (!valor) return "";
  if (valor instanceof Date) return valor.toISOString().split("T")[0];
  const str = String(valor).trim();
  const match = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (match) {
    const [, d, m, y] = match;
    const ano = y.length === 2 ? `20${y}` : y;
    return `${ano}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.split("T")[0];
  return str;
}
