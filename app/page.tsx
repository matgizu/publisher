import type { Metadata } from "next";
import Link from "next/link";
import { ToolCard } from "@/components/ToolCard";
import { TOOLS_REGISTRY, CATEGORIAS } from "@/lib/tools-registry";
import { ArrowRight, Calculator, BarChart2, Zap } from "lucide-react";

export const metadata: Metadata = {
  title: "Calculadoras y Herramientas Gratuitas | CalcuTools",
  description:
    "Calculadoras financieras de hipoteca, préstamo, nómina e impuestos para Colombia y Latinoamérica. Gratis, sin registro, resultado inmediato.",
  alternates: { canonical: "https://calcutools.lat" },
};

const STATS = [
  { icon: Calculator, label: "Herramientas", value: "10+" },
  { icon: BarChart2,  label: "Cálculos al mes", value: "50K+" },
  { icon: Zap,        label: "Sin registro", value: "100%" },
];

export default function HomePage() {
  const featuredTools = TOOLS_REGISTRY.slice(0, 6);

  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-white py-16 sm:py-24 border-b border-gray-100">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: "radial-gradient(circle at 2px 2px, #1D9E75 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }} />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-primary-light text-primary-dark text-xs font-semibold px-3 py-1.5 rounded-full mb-6 border border-primary/20">
            <Zap size={12} />
            <span>Herramientas gratuitas para Colombia y Latinoamérica</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold text-text-primary leading-tight mb-5">
            Calculadoras y herramientas
            <br />
            <span className="text-primary">que sí te sirven</span>
          </h1>

          <p className="text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed mb-8">
            Sin registro, sin trampa. Calcula hipotecas, préstamos, nómina,
            impuestos y más — en segundos, con resultados claros.
          </p>

          <div className="flex flex-wrap justify-center gap-3">
            {CATEGORIAS.map(({ slug, label }) => (
              <Link
                key={slug}
                href={`/${slug}`}
                className="btn-primary text-sm"
              >
                Ver {label}
              </Link>
            ))}
          </div>

          {/* Stats */}
          <div className="mt-12 grid grid-cols-3 gap-4 max-w-lg mx-auto">
            {STATS.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex flex-col items-center gap-1">
                <Icon size={18} className="text-primary" />
                <span className="text-xl font-bold text-text-primary">{value}</span>
                <span className="text-xs text-text-muted">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tools grid */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-text-primary">Herramientas disponibles</h2>
            <p className="text-text-secondary mt-1 text-sm">
              {TOOLS_REGISTRY.length} herramienta{TOOLS_REGISTRY.length !== 1 ? "s" : ""} gratuita{TOOLS_REGISTRY.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {featuredTools.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {featuredTools.map((tool) => (
              <ToolCard key={tool.slug} tool={tool} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-text-muted">
            <Calculator size={40} className="mx-auto mb-3 opacity-30" />
            <p>Próximamente — estamos construyendo las primeras herramientas.</p>
          </div>
        )}
      </section>

      {/* CTA section */}
      <section className="bg-primary-light border-y border-primary/10 py-14">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl font-bold text-text-primary mb-3">
            ¿Necesitas una calculadora que no existe?
          </h2>
          <p className="text-text-secondary mb-6 text-sm">
            Publicamos herramientas nuevas cada semana. Si tienes una necesidad
            específica, es probable que ya esté en camino.
          </p>
          <Link href="/calculadoras" className="btn-primary inline-flex items-center gap-2 text-sm">
            Ver todas las calculadoras <ArrowRight size={14} />
          </Link>
        </div>
      </section>
    </main>
  );
}
