"use client";

import { useEffect, useState } from "react";
import { Settings, Save } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

export default function ConfiguracoesPage() {
  const [margem, setMargem] = useState<number>(0);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    async function carregar() {
      const { data } = await supabase
        .from("configuracoes")
        .select("valor")
        .eq("chave", "margem_seguranca")
        .maybeSingle();

      if (data?.valor !== undefined && data?.valor !== null) {
        setMargem(Number(data.valor));
      }
      setCarregando(false);
    }
    carregar();
  }, []);

  async function salvar() {
    setSalvando(true);
    try {
      const { error } = await supabase
        .from("configuracoes")
        .upsert({ chave: "margem_seguranca", valor: margem, updated_at: new Date().toISOString() }, { onConflict: "chave" });

      if (error) throw error;
      toast.success("Configurações salvas!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao salvar configurações.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="space-y-6 pt-12 md:pt-0">
      <div>
        <h1 className="text-2xl font-semibold text-marrom">Configurações</h1>
        <p className="text-texto/60 mt-1">Ajustes gerais do módulo de previsão.</p>
      </div>

      <Card>
        <h3 className="font-medium text-marrom mb-1">Margem de segurança</h3>
        <p className="text-sm text-texto/60 mb-4">
          Percentual aplicado em cima da Produção Sugerida calculada, para absorver imprevistos de demanda.
        </p>

        {carregando ? (
          <p className="text-texto/50 text-sm">Carregando...</p>
        ) : (
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={0}
              max={200}
              step={1}
              value={margem}
              onChange={(e) => setMargem(Number(e.target.value))}
              className="w-24 px-3 py-2 rounded-md border border-cinza text-sm bg-card"
            />
            <span className="text-texto/70">%</span>
            <Button onClick={salvar} disabled={salvando}>
              <Save size={16} />
              {salvando ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        )}

        <p className="text-xs text-texto/50 mt-3">
          Exemplo: com 10%, uma produção calculada de 100 unidades vira 110 sugeridas.
        </p>
      </Card>

      <Card className="text-center py-10">
        <Settings size={32} className="mx-auto text-texto/30 mb-3" />
        <p className="text-texto/60 text-sm">
          Em breve: integração com Mamma Rota e mapeamento de colunas de planilhas.
        </p>
      </Card>
    </div>
  );
}
