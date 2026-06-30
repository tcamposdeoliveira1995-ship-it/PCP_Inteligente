"use client";

import { useMemo, useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  SortingState,
} from "@tanstack/react-table";
import { Search, ArrowUpDown, Download } from "lucide-react";
import { PrevisaoItem } from "@/types/pcp";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { exportarPrevisaoExcel } from "@/lib/exportar-excel";
import { exportarPrevisaoPDF } from "@/lib/exportar-pdf";
import { cn } from "@/lib/utils";

interface Props {
  itens: PrevisaoItem[];
}

type FiltroEmpresa = "todos" | "YUKA" | "TC";

export function TabelaPrevisao({ itens }: Props) {
  const [busca, setBusca] = useState("");
  const [sorting, setSorting] = useState<SortingState>([{ id: "producao_sugerida", desc: true }]);
  const [filtroEmpresa, setFiltroEmpresa] = useState<FiltroEmpresa>("todos");

  const itensFiltrados = useMemo(() => {
    if (filtroEmpresa === "todos") return itens;
    return itens.filter((i) => i.empresa === filtroEmpresa);
  }, [itens, filtroEmpresa]);

  const colunas = useMemo<ColumnDef<PrevisaoItem>[]>(
    () => [
      { accessorKey: "codigo", header: "Código" },
      { accessorKey: "produto", header: "Produto" },
      {
        accessorKey: "empresa",
        header: "Empresa",
        cell: (info) => info.getValue<string | null>() ?? "—",
      },
      {
        accessorKey: "media_semanal",
        header: "Média Semanal",
        cell: (info) => formatNum(info.getValue<number>()),
      },
      {
        accessorKey: "estoque_atual",
        header: "Estoque Atual",
        cell: (info) => formatNum(info.getValue<number>()),
      },
      {
        accessorKey: "estoque_minimo",
        header: "Estoque Mínimo",
        cell: (info) => formatNum(info.getValue<number>()),
      },
      {
        accessorKey: "producao_sugerida",
        header: "Produção Sugerida",
        cell: (info) => (
          <span className="font-semibold text-marrom">{formatNum(info.getValue<number>())}</span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: (info) =>
          info.getValue() === "produzir" ? (
            <Badge variant="erro">🔴 Produzir</Badge>
          ) : (
            <Badge variant="sucesso">🟢 Estoque OK</Badge>
          ),
      },
      {
        accessorKey: "cobertura_dias",
        header: "Cobertura (dias)",
        cell: (info) => {
          const v = info.getValue<number | null>();
          return v === null ? "—" : `${v} d`;
        },
      },
    ],
    []
  );

  const table = useReactTable({
    data: itensFiltrados,
    columns: colunas,
    state: { sorting, globalFilter: busca },
    onSortingChange: setSorting,
    onGlobalFilterChange: setBusca,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: (row, _columnId, filterValue) => {
      const termo = String(filterValue).toLowerCase();
      const codigo = String(row.getValue("codigo")).toLowerCase();
      const produto = String(row.getValue("produto")).toLowerCase();
      return codigo.includes(termo) || produto.includes(termo);
    },
  });

  const empresas: { valor: FiltroEmpresa; label: string }[] = [
    { valor: "todos", label: "Todas as empresas" },
    { valor: "YUKA", label: "YUKA — Assados" },
    { valor: "TC", label: "TC — Frituras" },
  ];

  return (
    <div className="card-mamma p-5">
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex flex-wrap gap-2">
          {empresas.map((e) => (
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

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-texto/40" />
            <input
              type="text"
              placeholder="Pesquisar por código ou produto..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-md border border-cinza text-sm bg-card"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => exportarPrevisaoExcel(itensFiltrados)}>
              <Download size={16} />
              Exportar Excel
            </Button>
            <Button variant="outline" onClick={() => exportarPrevisaoPDF(itensFiltrados)}>
              <Download size={16} />
              Exportar PDF
            </Button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-cinza">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    className="text-left py-3 px-3 font-medium text-texto/70 cursor-pointer select-none whitespace-nowrap"
                  >
                    <div className="flex items-center gap-1">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      <ArrowUpDown size={12} className="text-texto/30" />
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={colunas.length} className="text-center py-8 text-texto/50">
                  Nenhum produto encontrado.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="border-b border-cinza/50 hover:bg-cinza/20">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="py-3 px-3 whitespace-nowrap">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatNum(n: number) {
  return n.toLocaleString("pt-BR", { maximumFractionDigits: 1 });
}
