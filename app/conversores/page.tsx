import type { Metadata } from "next";
import { ToolCard } from "@/components/ToolCard";
import { TOOLS_REGISTRY } from "@/lib/tools-registry";

export const metadata: Metadata = {
  title: "Generadores Gratis para Colombia | CalcuTools",
  description:
    "Generadores de documentos laborales, comprobantes de pago, cuentas de cobro y más para Colombia. Gratuitos, sin registro, funcionan en tu navegador.",
  alternates: { canonical: "https://calcutools.online/conversores" },
};

export default function ConversoresPage() {
  const generadores = TOOLS_REGISTRY.filter((t) => t.categoria === "generador");

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-10">
        <span className="text-xs font-semibold text-primary uppercase tracking-wider">Categoría</span>
        <h1 className="text-3xl font-extrabold text-text-primary mt-1 mb-3">Generadores</h1>
        <p className="text-text-secondary max-w-xl">
          Genera documentos laborales, comprobantes de nómina, cuentas de cobro y más.
          Sin registro, sin instalación — directo en tu navegador.
        </p>
      </div>

      {generadores.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {generadores.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </div>
      ) : (
        <p className="text-text-muted">Próximamente — preparando los primeros generadores.</p>
      )}
    </main>
  );
}
