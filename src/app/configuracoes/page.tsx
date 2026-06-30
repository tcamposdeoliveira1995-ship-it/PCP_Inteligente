import { Settings } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function ConfiguracoesPage() {
  return (
    <div className="space-y-6 pt-12 md:pt-0">
      <div>
        <h1 className="text-2xl font-semibold text-marrom">Configurações</h1>
        <p className="text-texto/60 mt-1">Ajustes gerais do módulo de previsão.</p>
      </div>

      <Card className="text-center py-12">
        <Settings size={36} className="mx-auto text-texto/30 mb-3" />
        <p className="text-texto/60">
          Em breve: margem de segurança, integração com Mamma Rota e parâmetros de cálculo.
        </p>
      </Card>
    </div>
  );
}
