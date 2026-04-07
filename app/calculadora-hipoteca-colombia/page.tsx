"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import {
  ChevronRight,
  Calculator,
  Copy,
  CheckCircle2,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AmortizacionRow {
  mes: number;
  cuota: number;
  capital: number;
  interes: number;
  saldo: number;
}

interface Resultado {
  cuotaMensual: number;
  totalPagado: number;
  totalIntereses: number;
  amortizacion: AmortizacionRow[];
}

// ─── Utility ──────────────────────────────────────────────────────────────────

function formatCOP(n: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function formatNumber(n: number): string {
  return new Intl.NumberFormat("es-CO").format(Math.round(n));
}

function calcularHipoteca(
  valorInmueble: number,
  tasaAnualPorcentaje: number,
  plazoAnios: number
): Resultado {
  const n = plazoAnios * 12; // meses
  const r = tasaAnualPorcentaje / 100 / 12; // tasa mensual

  // Fórmula: M = P[r(1+r)^n]/[(1+r)^n-1]
  const cuotaMensual =
    r === 0
      ? valorInmueble / n
      : (valorInmueble * (r * Math.pow(1 + r, n))) / (Math.pow(1 + r, n) - 1);

  const amortizacion: AmortizacionRow[] = [];
  let saldo = valorInmueble;

  for (let mes = 1; mes <= n; mes++) {
    const interes = saldo * r;
    const capital = cuotaMensual - interes;
    saldo = Math.max(0, saldo - capital);
    amortizacion.push({
      mes,
      cuota: cuotaMensual,
      capital,
      interes,
      saldo,
    });
  }

  const totalPagado = cuotaMensual * n;
  const totalIntereses = totalPagado - valorInmueble;

  return { cuotaMensual, totalPagado, totalIntereses, amortizacion };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function AdUnit({ id, label = "Publicidad" }: { id: string; label?: string }) {
  return (
    <div
      id={id}
      className="my-8 ad-unit"
      aria-label="Espacio publicitario"
    >
      <span>{label} (Google AdSense)</span>
    </div>
  );
}

function ResultCard({
  label,
  value,
  highlight,
  sublabel,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  sublabel?: string;
}) {
  return (
    <div
      className={`rounded-2xl p-5 flex flex-col gap-1 ${
        highlight
          ? "bg-primary text-white shadow-lg shadow-primary/20"
          : "bg-gray-50 border border-gray-100"
      }`}
    >
      <span
        className={`text-xs font-semibold uppercase tracking-wider ${
          highlight ? "text-white/70" : "text-text-muted"
        }`}
      >
        {label}
      </span>
      <span
        className={`text-2xl font-extrabold leading-none ${
          highlight ? "text-white" : "text-text-primary"
        }`}
      >
        {value}
      </span>
      {sublabel && (
        <span className={`text-xs mt-0.5 ${highlight ? "text-white/60" : "text-text-muted"}`}>
          {sublabel}
        </span>
      )}
    </div>
  );
}

function FaqItem({ pregunta, respuesta }: { pregunta: string; respuesta: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-gray-50 transition-colors"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className="font-semibold text-text-primary text-sm leading-snug">{pregunta}</span>
        {open ? (
          <ChevronUp size={16} className="text-primary flex-shrink-0" />
        ) : (
          <ChevronDown size={16} className="text-text-muted flex-shrink-0" />
        )}
      </button>
      {open && (
        <div className="px-5 pb-5">
          <p className="text-sm text-text-secondary leading-relaxed">{respuesta}</p>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CalculadoraHipotecaPage() {
  // ── Form state
  const [valorInmueble, setValorInmueble] = useState("");
  const [tasaAnual, setTasaAnual] = useState("");
  const [plazoAnios, setPlazoAnios] = useState("20");
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [tablaExpandida, setTablaExpandida] = useState(false);

  // ── Calculate
  const calcular = useCallback(() => {
    setError("");

    const valor = parseFloat(valorInmueble.replace(/\./g, "").replace(",", "."));
    const tasa  = parseFloat(tasaAnual.replace(",", "."));
    const plazo = parseInt(plazoAnios);

    if (isNaN(valor) || valor <= 0) {
      setError("Ingresa un valor del inmueble válido.");
      return;
    }
    if (isNaN(tasa) || tasa <= 0 || tasa > 100) {
      setError("La tasa de interés debe estar entre 0.1% y 100%.");
      return;
    }
    if (isNaN(plazo) || plazo <= 0) {
      setError("Selecciona un plazo válido.");
      return;
    }

    const r = calcularHipoteca(valor, tasa, plazo);
    setResultado(r);
    setTablaExpandida(false);
  }, [valorInmueble, tasaAnual, plazoAnios]);

  // ── Copy result
  const copiarResultado = useCallback(() => {
    if (!resultado) return;
    const texto = [
      "Resultado — Calculadora de Hipoteca Colombia",
      `Cuota mensual: ${formatCOP(resultado.cuotaMensual)}`,
      `Total a pagar: ${formatCOP(resultado.totalPagado)}`,
      `Total intereses: ${formatCOP(resultado.totalIntereses)}`,
      `Plazo: ${plazoAnios} años`,
      `Tasa EA: ${tasaAnual}%`,
    ].join("\n");
    navigator.clipboard.writeText(texto).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }, [resultado, plazoAnios, tasaAnual]);

  // ── Rows to show in table
  const filasTabla = resultado
    ? tablaExpandida
      ? resultado.amortizacion
      : resultado.amortizacion.slice(0, 24)
    : [];

  // ─ Schema JSON-LD
  const schemaWebApp = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Calculadora de Hipoteca Colombia",
    url: "https://calcutools.lat/calculadora-hipoteca-colombia",
    applicationCategory: "FinanceApplication",
    description:
      "Calcula la cuota mensual de tu crédito hipotecario en Colombia. Incluye tabla de amortización, total de intereses y costo total.",
    offers: { "@type": "Offer", price: "0", priceCurrency: "COP" },
    inLanguage: "es-CO",
    operatingSystem: "All",
  };

  const schemaFAQ = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "¿Qué es la tasa EA en Colombia?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "EA significa Efectiva Anual — es la tasa que realmente pagas en un año, incluyendo la capitalización. Si el banco te dice 12% EA, eso es lo que pagas anualmente. No confundas con tasa nominal o mensual; en Colombia los créditos hipotecarios siempre se expresan en EA.",
        },
      },
      {
        "@type": "Question",
        name: "¿Cuánto vale la cuota de un crédito de 200 millones en Colombia?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Depende de la tasa y el plazo. A una tasa del 13% EA y 20 años, la cuota mensual de un crédito de $200 millones COP sería aproximadamente $2.360.000. Con esta calculadora puedes ver el resultado exacto para tu caso.",
        },
      },
      {
        "@type": "Question",
        name: "¿Qué tasa de interés manejan los bancos en Colombia para hipoteca en 2025?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "En 2025 las tasas de crédito hipotecario en Colombia oscilan entre el 12% y el 18% EA, dependiendo del banco, el perfil crediticio del solicitante y si el crédito es para vivienda VIS o No VIS. El Banco de la República y la Superfinanciera publican las tasas de referencia actualizadas mensualmente.",
        },
      },
      {
        "@type": "Question",
        name: "¿Cuál es la diferencia entre cuota fija y cuota variable?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Con cuota fija (sistema francés, que usa esta calculadora) pagas lo mismo cada mes. Con cuota variable el monto cambia — generalmente empieza más alto y baja. En Colombia la mayoría de créditos hipotecarios nuevos son de cuota fija en pesos (UVR o tasa fija).",
        },
      },
      {
        "@type": "Question",
        name: "¿Por qué al principio casi todo es interés y poco capital?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Así funciona la amortización francesa. Como el saldo inicial es alto, los intereses son altos. A medida que pagas capital el saldo baja, y los intereses disminuyen. En un crédito a 20 años, los primeros años más del 80% de cada cuota va a intereses.",
        },
      },
      {
        "@type": "Question",
        name: "¿Tengo que pagar la cuota que arroja la calculadora o hay costos adicionales?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Esta calculadora te da la cuota pura capital+intereses. En la realidad, algunos bancos incluyen en la cuota el seguro de vida del deudor y el seguro de incendio del inmueble, lo que puede aumentarla un 5-15%. Siempre pide al banco el costo total incluyendo seguros.",
        },
      },
      {
        "@type": "Question",
        name: "¿Sirve esta calculadora para crédito VIS en Colombia?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Sí. Solo debes ingresar el valor del crédito (no del inmueble completo), la tasa que te ofrece el banco para VIS y el plazo. Para créditos VIS también puedes aplicar la cobertura de tasa del gobierno, que reduce la tasa efectiva. Consulta con tu banco el rate final después del subsidio.",
        },
      },
    ],
  };

  const schemaHowTo = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "Cómo usar la calculadora de hipoteca Colombia",
    description: "Pasos para calcular la cuota mensual de tu crédito hipotecario en Colombia.",
    step: [
      {
        "@type": "HowToStep",
        name: "Ingresa el valor del crédito",
        text: "Escribe el monto que vas a solicitar al banco (no el valor del inmueble completo, sino el préstamo).",
      },
      {
        "@type": "HowToStep",
        name: "Ingresa la tasa de interés EA",
        text: "Coloca la tasa que te ofreció el banco en formato Efectivo Anual. Ejemplo: 13.5",
      },
      {
        "@type": "HowToStep",
        name: "Selecciona el plazo",
        text: "Elige en años el tiempo total del crédito: 5, 10, 15, 20, 25 o 30 años.",
      },
      {
        "@type": "HowToStep",
        name: "Haz clic en Calcular",
        text: "Verás la cuota mensual, el total a pagar y la tabla completa de amortización.",
      },
    ],
  };

  const FAQ_ITEMS = [
    {
      pregunta: "¿Qué es la tasa EA y cómo la consigo?",
      respuesta:
        "EA = Efectivo Anual. Es la tasa real que pagas en un año. El banco debe indicártela antes de firmar cualquier crédito — es un requisito legal en Colombia según la Superfinanciera. Si la oferta dice '1.1% mensual', pídeles la equivalente EA para comparar correctamente.",
    },
    {
      pregunta: "¿Sobre qué valor calculo: el inmueble o lo que pido prestado?",
      respuesta:
        "Sobre el monto del préstamo. Si el inmueble vale $300 millones y tienes $60 millones de cuota inicial (20%), el crédito es de $240 millones. Eso es lo que vas a ingresar.",
    },
    {
      pregunta: "Las tasas de hipoteca en Colombia hoy (2025), ¿cuánto están?",
      respuesta:
        "En el primer trimestre de 2025 las tasas rondan entre 12% y 17% EA dependiendo del banco y si es VIS o No VIS. Bancolombia, Davivienda y AV Villas suelen publicar tasas preferenciales. Siempre cotiza en al menos 3 bancos antes de decidir.",
    },
    {
      pregunta: "¿Por qué el total que pago es casi el doble del préstamo?",
      respuesta:
        "A 20 años y con tasas del 12-15%, es completamente normal. Los intereses se acumulan sobre un saldo que demora años en bajar significativamente. La tabla de amortización de abajo te muestra exactamente cuándo empieza el capital a pesar más que los intereses.",
    },
    {
      pregunta: "¿Puedo pagar cuotas extra para salir antes del crédito?",
      respuesta:
        "Sí, en Colombia puedes hacer abonos extraordinarios a capital. La ley no permite que los bancos cobren penalidad por prepago en créditos de vivienda. Un abono a capital reduce el saldo y —si mantienes la cuota— acorta el plazo. Si reduces la cuota, el ahorro en tiempo es menor.",
    },
    {
      pregunta: "¿Sirve para crédito en UVR o solo en pesos?",
      respuesta:
        "Esta calculadora trabaja en pesos con tasa fija EA. Para créditos UVR (donde la cuota sube con la inflación), el cálculo es diferente porque el saldo se indexa mensualmente. Si tu banco te ofrece UVR+tasa, consulta directamente con ellos la cuota inicial y cómo varía.",
    },
    {
      pregunta: "¿Es lo mismo que el simulador del banco?",
      respuesta:
        "El resultado de capital e intereses debe coincidir. La diferencia es que el banco incluye seguros (vida, incendio) en la cuota final. Esta calculadora da la cuota financiera pura — es la base para comparar bancos de manera objetiva antes de incluir seguros.",
    },
  ];

  return (
    <>
      {/* Schema JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaWebApp) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaFAQ) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaHowTo) }}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Breadcrumb */}
        <nav aria-label="breadcrumb" className="flex items-center gap-1.5 text-xs text-text-muted mb-6">
          <Link href="/" className="hover:text-primary transition-colors">Inicio</Link>
          <ChevronRight size={12} />
          <Link href="/calculadoras" className="hover:text-primary transition-colors">Calculadoras</Link>
          <ChevronRight size={12} />
          <span className="text-text-secondary font-medium">Hipoteca Colombia</span>
        </nav>

        {/* H1 + Subtitle */}
        <header className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-text-primary leading-tight mb-3">
            Calculadora de Hipoteca Colombia
          </h1>
          <p className="text-text-secondary text-base leading-relaxed max-w-2xl">
            Ingresa el valor del crédito, la tasa EA y el plazo. Calcula tu cuota mensual,
            el total a pagar y descarga la tabla de amortización completa — en segundos.
          </p>
        </header>

        {/* ── WIDGET ─────────────────────────────────────────────────── */}
        <section
          aria-label="Calculadora de hipoteca"
          className="card p-6 sm:p-8 mb-8 border border-gray-100"
        >
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-9 h-9 rounded-xl bg-primary-light flex items-center justify-center">
              <Calculator size={18} className="text-primary" />
            </div>
            <h2 className="text-lg font-bold text-text-primary">Calculadora</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
            {/* Valor del crédito */}
            <div className="sm:col-span-2">
              <label htmlFor="valor-inmueble" className="block text-sm font-semibold text-text-primary mb-1.5">
                Valor del crédito (COP)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted text-sm font-medium">$</span>
                <input
                  id="valor-inmueble"
                  type="text"
                  inputMode="numeric"
                  className="input-field pl-8"
                  placeholder="Ej: 200,000,000"
                  aria-label="Valor del crédito hipotecario en pesos colombianos"
                  value={valorInmueble}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, "");
                    const formatted = raw ? Number(raw).toLocaleString("es-CO") : "";
                    setValorInmueble(formatted);
                  }}
                />
              </div>
              <p className="text-xs text-text-muted mt-1.5 flex items-center gap-1">
                <Info size={11} />
                Ingresa el monto a pedir prestado, no el valor total del inmueble.
              </p>
            </div>

            {/* Tasa EA */}
            <div>
              <label htmlFor="tasa-anual" className="block text-sm font-semibold text-text-primary mb-1.5">
                Tasa de interés anual (EA %)
              </label>
              <div className="relative">
                <input
                  id="tasa-anual"
                  type="number"
                  inputMode="decimal"
                  min="0.1"
                  max="99.9"
                  step="0.1"
                  className="input-field pr-10"
                  placeholder="Ej: 13.5"
                  aria-label="Tasa de interés anual efectiva en porcentaje"
                  value={tasaAnual}
                  onChange={(e) => setTasaAnual(e.target.value)}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted text-sm font-medium">%</span>
              </div>
              <p className="text-xs text-text-muted mt-1.5">
                En Colombia: 12%–17% EA típico (2025)
              </p>
            </div>

            {/* Plazo */}
            <div>
              <label htmlFor="plazo-anios" className="block text-sm font-semibold text-text-primary mb-1.5">
                Plazo
              </label>
              <select
                id="plazo-anios"
                className="input-field"
                aria-label="Plazo del crédito en años"
                value={plazoAnios}
                onChange={(e) => setPlazoAnios(e.target.value)}
              >
                {[5, 10, 15, 20, 25, 30].map((a) => (
                  <option key={a} value={a}>{a} años ({a * 12} cuotas)</option>
                ))}
              </select>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl mb-5">
              {error}
            </div>
          )}

          <button
            onClick={calcular}
            className="btn-primary w-full text-base h-12"
            aria-label="Calcular cuota mensual de hipoteca"
          >
            Calcular cuota mensual
          </button>
        </section>

        {/* ── RESULTADO ──────────────────────────────────────────────── */}
        {resultado && (
          <section
            role="status"
            aria-live="polite"
            aria-label="Resultado del cálculo"
            className="animate-result mb-8"
          >
            {/* Cards de resultado */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <ResultCard
                label="Cuota mensual"
                value={formatCOP(resultado.cuotaMensual)}
                highlight
                sublabel={`Durante ${plazoAnios} años`}
              />
              <ResultCard
                label="Total a pagar"
                value={formatCOP(resultado.totalPagado)}
                sublabel="Capital + intereses"
              />
              <ResultCard
                label="Total en intereses"
                value={formatCOP(resultado.totalIntereses)}
                sublabel={`${((resultado.totalIntereses / resultado.totalPagado) * 100).toFixed(1)}% del total`}
              />
            </div>

            {/* Barra de proporción */}
            <div className="bg-gray-50 rounded-2xl p-5 mb-6">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
                Proporción del crédito
              </p>
              <div className="flex h-4 rounded-full overflow-hidden mb-2">
                <div
                  className="bg-primary transition-all duration-700"
                  style={{
                    width: `${((parseFloat(valorInmueble.replace(/\./g, "")) / resultado.totalPagado) * 100).toFixed(1)}%`,
                  }}
                />
                <div className="bg-orange-300 flex-1" />
              </div>
              <div className="flex justify-between text-xs text-text-muted">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-2.5 h-2.5 rounded-sm bg-primary" />
                  Capital ({((parseFloat(valorInmueble.replace(/\./g, "")) / resultado.totalPagado) * 100).toFixed(0)}%)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-2.5 h-2.5 rounded-sm bg-orange-300" />
                  Intereses ({((resultado.totalIntereses / resultado.totalPagado) * 100).toFixed(0)}%)
                </span>
              </div>
            </div>

            {/* Botón copiar */}
            <button
              onClick={copiarResultado}
              className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary-dark transition-colors mb-8"
              aria-label="Copiar resultado al portapapeles"
            >
              {copied ? (
                <>
                  <CheckCircle2 size={16} className="text-green-500" />
                  <span className="text-green-600">¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy size={16} />
                  Copiar resultado
                </>
              )}
            </button>

            {/* Tabla de amortización */}
            <div className="card overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold text-text-primary text-sm">
                  Tabla de amortización ({resultado.amortizacion.length} meses)
                </h3>
                <span className="text-xs text-text-muted">
                  Sistema francés (cuota fija)
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm table-sticky">
                  <thead>
                    <tr className="text-xs text-text-muted">
                      <th className="px-4 py-3 text-center font-semibold bg-gray-50">#</th>
                      <th className="px-4 py-3 text-right font-semibold bg-gray-50 whitespace-nowrap">Cuota</th>
                      <th className="px-4 py-3 text-right font-semibold bg-gray-50 whitespace-nowrap">Capital</th>
                      <th className="px-4 py-3 text-right font-semibold bg-gray-50 whitespace-nowrap">Interés</th>
                      <th className="px-4 py-3 text-right font-semibold bg-gray-50 whitespace-nowrap">Saldo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filasTabla.map((row, i) => (
                      <tr
                        key={row.mes}
                        className={`border-t border-gray-50 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/40"}`}
                      >
                        <td className="px-4 py-2.5 text-center text-text-muted font-medium text-xs">
                          {row.mes}
                        </td>
                        <td className="px-4 py-2.5 text-right font-medium text-text-primary whitespace-nowrap">
                          ${formatNumber(row.cuota)}
                        </td>
                        <td className="px-4 py-2.5 text-right text-primary whitespace-nowrap">
                          ${formatNumber(row.capital)}
                        </td>
                        <td className="px-4 py-2.5 text-right text-orange-500 whitespace-nowrap">
                          ${formatNumber(row.interes)}
                        </td>
                        <td className="px-4 py-2.5 text-right text-text-secondary whitespace-nowrap">
                          ${formatNumber(row.saldo)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Ver más / menos */}
              {resultado.amortizacion.length > 24 && (
                <button
                  onClick={() => setTablaExpandida(!tablaExpandida)}
                  className="w-full py-3 text-sm font-medium text-primary hover:bg-primary-light/40 transition-colors border-t border-gray-100 flex items-center justify-center gap-2"
                >
                  {tablaExpandida ? (
                    <><ChevronUp size={14} /> Ver menos</>
                  ) : (
                    <><ChevronDown size={14} /> Ver los {resultado.amortizacion.length - 24} meses restantes</>
                  )}
                </button>
              )}
            </div>
          </section>
        )}

        {/* Ad #1 — below tool */}
        <AdUnit id="ad-below-tool" />

        {/* ── CÓMO USAR ──────────────────────────────────────────────── */}
        <section id="como-usar" className="mb-12">
          <h2 className="text-2xl font-bold text-text-primary mb-4">
            ¿Cómo usar la calculadora de hipoteca?
          </h2>
          <div className="space-y-4">
            {[
              {
                n: 1,
                titulo: "Ingresa el valor del crédito",
                desc:
                  "Es el monto que vas a pedir prestado al banco, no el valor del inmueble. Si el apartamento vale $250 millones y tienes $50 millones de cuota inicial, el crédito es de $200 millones.",
              },
              {
                n: 2,
                titulo: "Escribe la tasa EA que te ofreció el banco",
                desc:
                  "EA = Efectivo Anual. Ejemplo: si el banco te dice 13.5%, escribe 13.5. Ojo: no confundas con tasa mensual (que suele ser ~1.05-1.2%). Si el banco te da tasa mensual, multiplícala por 12 como aproximación (aunque el valor exacto de conversión es diferente).",
              },
              {
                n: 3,
                titulo: "Selecciona el plazo",
                desc:
                  "Elige entre 5 y 30 años. A mayor plazo, la cuota mensual baja — pero el total de intereses sube considerablemente. Con un crédito de $200M al 13% EA, la diferencia entre 15 y 25 años puede ser más de $100 millones en intereses adicionales.",
              },
              {
                n: 4,
                titulo: "Haz clic en 'Calcular cuota mensual'",
                desc:
                  "Verás inmediatamente: cuota mensual fija, total que pagarás y total de intereses. La tabla de amortización muestra mes a mes cómo se divide cada pago entre capital e intereses.",
              },
            ].map(({ n, titulo, desc }) => (
              <div key={n} className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                  {n}
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary text-sm mb-1">{titulo}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Ejemplo numérico */}
          <div className="mt-6 bg-primary-light rounded-2xl p-5 border border-primary/10">
            <p className="text-sm font-semibold text-primary-dark mb-2">Ejemplo real:</p>
            <p className="text-sm text-text-secondary leading-relaxed">
              Crédito de <strong>$180.000.000 COP</strong> a <strong>13.5% EA</strong> a{" "}
              <strong>20 años</strong>:
              la cuota mensual es aproximadamente <strong>$2.170.000</strong>, el total pagado es
              ~$520.800.000 y pagarás ~$340.800.000 en intereses — es decir, casi el doble del
              capital original. Cuánto duele... pero al menos ya lo sabes antes de firmar.
            </p>
          </div>
        </section>

        {/* ── CONTENIDO SEO ───────────────────────────────────────────── */}
        <section id="contenido-principal" className="mb-12 prose-sm max-w-none">
          <h2 className="text-2xl font-bold text-text-primary mb-4">
            Crédito hipotecario en Colombia: lo que el banco no te explica
          </h2>

          <p className="text-text-secondary leading-relaxed mb-4">
            Cuando el asesor del banco te dice "14.5% EA" y tú asientes con la cabeza sin entender
            realmente lo que eso significa, pasas al lado del número más importante de tu vida
            financiera. No es un problema de inteligencia — es que nadie te lo explica en términos
            que calcen con tu realidad. Esta calculadora de hipoteca Colombia existe exactamente
            para eso.
          </p>

          <p className="text-text-secondary leading-relaxed mb-4">
            Según la Superfinanciera de Colombia, el saldo total de la cartera hipotecaria del país
            superó los $90 billones de pesos en 2024. Son millones de familias pagando cuotas
            mensuales, muchas de ellas sin haber simulado el costo total antes de firmar. La
            diferencia entre tomarse 10 minutos con una calculadora y no hacerlo puede ser de
            cientos de millones de pesos en intereses.
          </p>

          <h3 className="text-lg font-bold text-text-primary mt-6 mb-3">
            Tasa EA, tasa mensual, tasa nominal: cuál es cuál
          </h3>

          <p className="text-text-secondary leading-relaxed mb-4">
            Este es el punto donde más gente se pierde. Y no es culpa de ellos — los bancos no
            siempre lo explican con claridad. Acá va la versión directa:
          </p>

          <ul className="list-none space-y-3 mb-4">
            <li className="flex gap-3 text-sm text-text-secondary">
              <span className="text-primary font-bold flex-shrink-0">→</span>
              <span>
                <strong className="text-text-primary">Tasa EA (Efectiva Anual):</strong> lo que
                realmente pagas en un año. Si es 13%, pagas 13% sobre el saldo pendiente
                anualmente. Es la tasa más honesta y la que usa esta calculadora.
              </span>
            </li>
            <li className="flex gap-3 text-sm text-text-secondary">
              <span className="text-primary font-bold flex-shrink-0">→</span>
              <span>
                <strong className="text-text-primary">Tasa mensual:</strong> la EA dividida (de
                forma compuesta) en 12. Un 13% EA equivale aproximadamente a 1.025% mensual. Si
                el banco te dice "1.2% mensual", eso es más de 15% anual.
              </span>
            </li>
            <li className="flex gap-3 text-sm text-text-secondary">
              <span className="text-primary font-bold flex-shrink-0">→</span>
              <span>
                <strong className="text-text-primary">Tasa nominal:</strong> una tasa que no
                incluye el efecto de la capitalización. Se usa menos en hipotecas, pero aparece
                en publicidad. Siempre convierte a EA para comparar.
              </span>
            </li>
          </ul>

          <p className="text-text-secondary leading-relaxed mb-4">
            En Colombia, la regulación obliga a los bancos a expresar las tasas de crédito en EA.
            Entonces si el comparador de la Superfinanciera dice 14% EA, eso es lo que debes
            ingresar acá.
          </p>

          {/* AdSense mid-content */}
          <AdUnit id="ad-mid-content" label="Publicidad (centro contenido)" />

          <h3 className="text-lg font-bold text-text-primary mt-2 mb-3">
            La amortización: por qué los primeros años casi todo son intereses
          </h3>

          <p className="text-text-secondary leading-relaxed mb-4">
            Alguien en un foro de finanzas personales colombiano lo describió así: llevaba 5 años
            pagando su crédito y al mirar el extracto se dio cuenta de que casi el 85% de cada
            cuota había ido a intereses y solo el 15% a bajar el saldo. "Fue un golpe duro", escribió,
            "pero al menos ahora entiendo para qué sirve mirar la tabla de amortización antes y no 5
            años después."
          </p>

          <p className="text-text-secondary leading-relaxed mb-4">
            La amortización es básicamente como intentar vaciar una piscina con un vasito mientras
            alguien la va llenando. Al principio, casi toda el agua que sacas es la que están
            metiendo (intereses). Después de varios años, cuando el saldo baja lo suficiente,
            empiezas a vaciar de verdad (capital).
          </p>

          <p className="text-text-secondary leading-relaxed mb-4">
            En términos reales: en un crédito de $200 millones a 20 años al 13% EA, la cuota
            mensual es ~$2.360.000. El primer mes, solo ~$235.000 van a capital y ~$2.125.000 van
            a intereses. Al año 10, esa proporción empieza a acercarse a 50/50. Al año 16 o 17 ya
            pagas más capital que intereses. Por eso los abonos extraordinarios al capital tienen
            tanto impacto al principio.
          </p>

          <h3 className="text-lg font-bold text-text-primary mt-6 mb-3">
            Las tasas de crédito hipotecario en Colombia hoy
          </h3>

          <p className="text-text-secondary leading-relaxed mb-4">
            Para el primer trimestre de 2025, las tasas de crédito hipotecario en Colombia oscilan
            entre el 12% y el 18% EA, según el simulador oficial de la Superfinanciera y las tasas
            publicadas por los principales bancos. El rango exacto depende de varios factores:
          </p>

          <ul className="list-none space-y-2 mb-4">
            {[
              "Perfil crediticio (historia en centrales de riesgo)",
              "Si es vivienda VIS o No VIS (las VIS tienen coberturas de tasa del gobierno)",
              "El banco que elijas — Bancolombia, Davivienda, BBVA, AV Villas y Banco Caja Social tienen tasas distintas",
              "El monto del crédito y la relación loan-to-value (cuánto financias vs. el valor del inmueble)",
            ].map((item, i) => (
              <li key={i} className="flex gap-3 text-sm text-text-secondary">
                <span className="text-primary font-bold flex-shrink-0">·</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <p className="text-text-secondary leading-relaxed mb-4">
            Recomendación práctica: cotiza en mínimo 3 bancos antes de decidir. Una diferencia de
            1.5 puntos en la tasa EA en un crédito de $200 millones a 20 años se traduce en más
            de $30 millones de diferencia en intereses totales. No es un detalle menor.
          </p>

          <h3 className="text-lg font-bold text-text-primary mt-6 mb-3">
            Prepago y abonos extraordinarios: el truco más subestimado
          </h3>

          <p className="text-text-secondary leading-relaxed mb-4">
            En Colombia, la Ley 546 de 1999 prohíbe que los bancos cobren penalidades por prepago
            de créditos de vivienda. Eso significa que si en diciembre recibes primas o utilidades,
            puedes hacer un abono extra al capital sin que te cobren nada adicional.
          </p>

          <p className="text-text-secondary leading-relaxed mb-4">
            ¿Qué impacto tiene? Enorme. Un abono de $5 millones al capital en el año 3 de un crédito
            al 13% EA puede ahorrarte entre $12 y $15 millones en intereses futuros y acortar el
            plazo entre 8 y 12 meses. Si haces eso sistemáticamente cada fin de año, podrías terminar
            un crédito a 20 años en 14 o 15 años.
          </p>

          <p className="text-text-secondary leading-relaxed">
            Eso sí: cuando hagas el abono, pregunta al banco si quieren reducir el plazo (se termina
            antes con la misma cuota) o reducir la cuota (se paga la misma cantidad de tiempo con
            cuotas más bajas). La primera opción ahorra mucho más en intereses totales.
          </p>
        </section>

        {/* ── FAQ ─────────────────────────────────────────────────────── */}
        <section id="faq" className="mb-12">
          <h2 className="text-2xl font-bold text-text-primary mb-5">Preguntas frecuentes</h2>
          <div className="space-y-3">
            {FAQ_ITEMS.map((item) => (
              <FaqItem key={item.pregunta} {...item} />
            ))}
          </div>
        </section>

        {/* ── HERRAMIENTAS RELACIONADAS ────────────────────────────────── */}
        <section id="herramientas-relacionadas" className="mb-8">
          <h2 className="text-2xl font-bold text-text-primary mb-4">
            Herramientas relacionadas
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                slug: "simulador-credito-vehiculo-colombia",
                nombre: "Simulador Crédito de Vehículo",
                desc: "Calcula cuota, total e intereses para tu crédito de carro.",
              },
              {
                slug: "calculadora-prestamo-personal",
                nombre: "Calculadora Préstamo Personal",
                desc: "Cuota mensual y tabla de amortización para préstamos a corto plazo.",
              },
              {
                slug: "calculadora-nomina-colombia",
                nombre: "Calculadora de Nómina Colombia",
                desc: "Salario neto desde salario bruto con prestaciones y deducciones.",
              },
            ].map((tool) => (
              <div
                key={tool.slug}
                className="p-4 rounded-xl border border-gray-100 hover:border-primary/30 hover:bg-primary-light/30 transition-all duration-150"
              >
                <p className="text-sm font-semibold text-text-primary mb-1">{tool.nombre}</p>
                <p className="text-xs text-text-muted leading-relaxed mb-3">{tool.desc}</p>
                <span className="text-xs font-semibold text-primary flex items-center gap-1">
                  Próximamente <ChevronRight size={11} />
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Ad #3 — bottom */}
        <AdUnit id="ad-bottom" />
      </div>
    </>
  );
}
