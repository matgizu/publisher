import Link from "next/link";
import { Tool } from "@/lib/tools-registry";
import { ArrowRight, TrendingUp } from "lucide-react";

interface ToolCardProps {
  tool: Tool;
  variant?: "default" | "compact";
}

const CATEGORIA_COLORS: Record<string, string> = {
  calculadora: "bg-primary-light text-primary-dark",
  conversor:   "bg-blue-50 text-blue-700",
  generador:   "bg-violet-50 text-violet-700",
};

const CATEGORIA_LABELS: Record<string, string> = {
  calculadora: "Calculadora",
  conversor:   "Conversor",
  generador:   "Generador",
};

export function ToolCard({ tool, variant = "default" }: ToolCardProps) {
  const colorClass = CATEGORIA_COLORS[tool.categoria] ?? "bg-gray-100 text-gray-600";
  const catLabel  = CATEGORIA_LABELS[tool.categoria] ?? tool.categoria;

  if (variant === "compact") {
    return (
      <Link
        href={`/${tool.slug}`}
        className="flex items-start gap-3 p-4 rounded-xl border border-gray-100 hover:border-primary/30 hover:bg-primary-light/40 transition-all duration-150 group"
      >
        <div className="w-9 h-9 rounded-lg bg-primary-light flex items-center justify-center flex-shrink-0">
          <TrendingUp size={16} className="text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-text-primary group-hover:text-primary transition-colors leading-snug">
            {tool.nombre}
          </p>
          <p className="text-xs text-text-muted mt-0.5 line-clamp-1">{tool.descripcion}</p>
        </div>
        <ArrowRight size={14} className="text-gray-300 group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
      </Link>
    );
  }

  return (
    <Link
      href={`/${tool.slug}`}
      className="card p-6 flex flex-col gap-4 group hover:border-primary/20"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="w-11 h-11 rounded-xl bg-primary-light flex items-center justify-center flex-shrink-0">
          <TrendingUp size={20} className="text-primary" />
        </div>
        <span className={`badge mt-1 ${colorClass}`}>{catLabel}</span>
      </div>

      {/* Content */}
      <div>
        <h3 className="font-bold text-text-primary text-base leading-snug group-hover:text-primary transition-colors">
          {tool.nombre}
        </h3>
        <p className="text-sm text-text-secondary mt-1.5 line-clamp-2 leading-relaxed">
          {tool.descripcion}
        </p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-50">
        <span className="text-xs text-text-muted">Gratis · Sin registro</span>
        <span className="text-xs font-semibold text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
          Abrir <ArrowRight size={12} />
        </span>
      </div>
    </Link>
  );
}
