import Link from "next/link";
import { TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  return (
    <div className="space-y-6 pt-12 md:pt-0">
      <div>
        <h1 className="text-2xl font-semibold text-marrom">Dashboard</h1>
        <p className="text-texto/60 mt-1">Visão geral do planejamento de produção.</p>
      </div>

      <Card className="text-center py-12">
        <TrendingUp size={40} className="mx-auto text-dourado mb-4" />
        <h2 className="text-lg font-medium text-marrom mb-2">Comece gerando sua primeira previsão</h2>
        <p className="text-texto/60 mb-6 max-w-md mx-auto">
          Importe o histórico de vendas e o estoque atual para que o sistema sugira automaticamente
          a quantidade de produção da próxima semana.
        </p>
        <Link href="/previsao">
          <Button size="lg">Ir para Previsão Semanal</Button>
        </Link>
      </Card>
    </div>
  );
}
