import { Package, AlertTriangle, CheckCircle2, BarChart3 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PrevisaoItem } from "@/types/pcp";
import { cn } from "@/lib/utils";

interface Props {
  itens: PrevisaoItem[];
}

export function Indicadores({ itens }: Props) {
  const produtosAnalisados = itens.length;
  const produtosParaProduzir = itens.filter((i) => i.status === "produzir").length;
  const produtosOk = itens.filter((i) => i.status === "estoque_ok").length;
  const totalSugerido = itens.reduce((acc, i) => acc + i.producao_sugerida, 0);

  const cards = [
    {
      label: "Produtos analisados",
      valor: produtosAnalisados,
      icon: Package,
      cor: "text-marrom",
    },
    {
      label: "Produtos para produzir",
      valor: produtosParaProduzir,
      icon: AlertTriangle,
      cor: "text-erro",
    },
    {
      label: "Estoque suficiente",
      valor: produtosOk,
      icon: CheckCircle2,
      cor: "text-sucesso",
    },
    {
      label: "Total sugerido p/ produção",
      valor: totalSugerido.toLocaleString("pt-BR", { maximumFractionDigits: 1 }),
      icon: BarChart3,
      cor: "text-dourado",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.label} className="flex items-center gap-4">
            <div className={cn("p-3 rounded-md bg-cinza/40", card.cor)}>
              <Icon size={20} />
            </div>
            <div>
              <p className="text-xs text-texto/60">{card.label}</p>
              <p className="text-xl font-semibold text-marrom">{card.valor}</p>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
