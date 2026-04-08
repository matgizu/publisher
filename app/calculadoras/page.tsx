import type { Metadata } from "next";
import { ToolCard } from "@/components/ToolCard";
import { TOOLS_REGISTRY } from "@/lib/tools-registry";

export const metadata: Metadata = {
  title: "Calculadoras Financieras Gratis para Colombia | CalcuTools",
  description:
    "Calculadoras de hipoteca, préstamo personal, nómina, impuestos y más para Colombia y Latinoamérica. Gratuitas, sin registro.",
  alternates: { canonical: "https://caclutools.online/calculadoras" },
};

export default function CalculadorasPage() {
  const calculadoras = TOOLS_REGISTRY.filter((t) => t.categoria === "calculadora");

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-10">
        <span className="text-xs font-semibold text-primary uppercase tracking-wider">Categoría</span>
        <h1 className="text-3xl font-extrabold text-text-primary mt-1 mb-3">Calculadoras</h1>
        <p className="text-text-secondary max-w-xl">
          Calculadoras financieras y de salud gratuitas para Colombia y Latinoamérica.
          Sin registro, sin instalación — calculan en tu navegador.
        </p>
      </div>

      {calculadoras.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {calculadoras.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </div>
      ) : (
        <p className="text-text-muted">Próximamente — preparando las primeras calculadoras.</p>
      )}
    </main>
  );
}
