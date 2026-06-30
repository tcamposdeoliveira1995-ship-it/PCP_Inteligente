"use client";

import { useRef, useState } from "react";
import { Upload, CheckCircle2, AlertCircle, FileSpreadsheet } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { parseVendasHistorico } from "@/lib/parser";
import { ImportacaoStatus } from "@/types/pcp";

interface Props {
  onImportar: (dados: { codigo: string; produto: string; quantidade_vendida: number; data_venda: string }[], status: ImportacaoStatus) => void;
}

export function ImportacaoVendas({ onImportar }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<ImportacaoStatus | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function handleArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setCarregando(true);
    try {
      const resultado = await parseVendasHistorico(file);
      const novoStatus: ImportacaoStatus = {
        nomeArquivo: file.name,
        totalRegistros: resultado.totalRegistros,
        dataHora: new Date().toLocaleString("pt-BR"),
        sucesso: resultado.sucesso,
        erros: resultado.colunasFaltando.length > 0 ? resultado.colunasFaltando : undefined,
      };
      setStatus(novoStatus);
      if (resultado.sucesso) {
        onImportar(resultado.dados, novoStatus);
      }
    } finally {
      setCarregando(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet size={18} className="text-dourado" />
          Histórico de Vendas
        </CardTitle>
        <CardDescription>Colunas esperadas: Código, Produto, Quantidade Vendida, Data da Venda</CardDescription>
      </CardHeader>

      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={handleArquivo}
      />

      <Button
        variant="outline"
        className="w-full"
        onClick={() => inputRef.current?.click()}
        disabled={carregando}
      >
        <Upload size={16} />
        {carregando ? "Importando..." : "Importar Planilha"}
      </Button>

      {status && (
        <div className="mt-4 p-3 rounded-md bg-cinza/30 text-sm space-y-1">
          {status.sucesso ? (
            <div className="flex items-center gap-2 text-sucesso font-medium">
              <CheckCircle2 size={16} />
              Importado com sucesso
            </div>
          ) : (
            <div className="flex items-center gap-2 text-erro font-medium">
              <AlertCircle size={16} />
              Erro na importação
            </div>
          )}
          <p className="text-texto/70">Arquivo: {status.nomeArquivo}</p>
          {status.sucesso && <p className="text-texto/70">Registros: {status.totalRegistros}</p>}
          <p className="text-texto/70">Data/Hora: {status.dataHora}</p>
          {status.erros && (
            <p className="text-erro">
              Colunas faltando: {status.erros.join(", ")}
            </p>
          )}
        </div>
      )}
    </Card>
  );
}
