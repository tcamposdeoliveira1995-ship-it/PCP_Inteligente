import * as XLSX from "xlsx";

export interface ParseResult<T> {
  sucesso: boolean;
  dados: T[];
  colunasFaltando: string[];
  totalRegistros: number;
}

const COLUNAS_VENDAS = ["Código", "Produto", "Quantidade Vendida", "Data da Venda"];
const COLUNAS_ESTOQUE = ["Código", "Produto", "Quantidade Atual", "Estoque Mínimo"];

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

export async function parseVendasHistorico(
  file: File
): Promise<ParseResult<{ codigo: string; produto: string; quantidade_vendida: number; data_venda: string }>> {
  const rows = await lerArquivo(file);
  if (rows.length === 0) {
    return { sucesso: false, dados: [], colunasFaltando: COLUNAS_VENDAS, totalRegistros: 0 };
  }
  const headerRow = rows[0] as string[];
  const colunasFaltando = validarColunas(headerRow, COLUNAS_VENDAS);
  if (colunasFaltando.length > 0) {
    return { sucesso: false, dados: [], colunasFaltando, totalRegistros: 0 };
  }

  const linhas = mapearLinhas(rows, headerRow);
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
  const colunasFaltando = validarColunas(headerRow, COLUNAS_ESTOQUE);
  if (colunasFaltando.length > 0) {
    return { sucesso: false, dados: [], colunasFaltando, totalRegistros: 0 };
  }

  const linhas = mapearLinhas(rows, headerRow);
  const dados = linhas.map((linha) => ({
    codigo: String(linha["codigo"] ?? "").trim(),
    produto: String(linha["produto"] ?? "").trim(),
    quantidade_atual: parseFloat(String(linha["quantidade atual"] ?? "0").replace(",", ".")) || 0,
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
