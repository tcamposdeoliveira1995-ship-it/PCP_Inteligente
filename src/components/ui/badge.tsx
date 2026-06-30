import { cn } from "@/lib/utils";

interface BadgeProps {
  variant: "sucesso" | "alerta" | "erro" | "neutro";
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant, children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
        variant === "sucesso" && "bg-sucesso/10 text-sucesso",
        variant === "alerta" && "bg-alerta/10 text-alerta",
        variant === "erro" && "bg-erro/10 text-erro",
        variant === "neutro" && "bg-cinza text-texto",
        className
      )}
    >
      {children}
    </span>
  );
}
