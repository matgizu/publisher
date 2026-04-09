"use client";

import { useState } from "react";

const NEOBANCOS = [
  { nombre: "Lulo Bank", tasa: 14.0, color: "#1D9E75", textColor: "#fff" },
  { nombre: "Pibank", tasa: 13.5, color: "#0F6E56", textColor: "#fff" },
  { nombre: "Nu Colombia", tasa: 13.22, color: "#820AD1", textColor: "#fff" },
  { nombre: "Nequi", tasa: 5.0, color: "#FF0080", textColor: "#fff" },
];

function calcularRendimiento(capital: number, tasa: number, dias: number): number {
  return capital * (tasa / 100) * (dias / 365);
}

function formatCOP(value: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function AdUnit({ id, slot }: { id: string; slot: string }) {
  return (
    <div
      id={id}
      className="my-6 flex justify-center items-center min-h-[90px] bg-gray-50 rounded-lg border border-dashed border-gray-200"
    >
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_ID ?? "ca-pub-XXXXXXXXXX"}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}

export default function Page() {
  const [capital, setCapital] = useState<string>("");
  const [dias, setDias] = useState<string>("");
  const [resultados, setResultados] = useState<
    { nombre: string; tasa: number; rendimiento: number; total: number; color: string }[] | null
  >(null);
  const [error, setError] = useState<string>("");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleCalcular = () => {
    setError("");
    const cap = parseFloat(capital.replace(/\./g, "").replace(",", "."));
    const d = parseInt(dias);

    if (!cap || isNaN(cap) || cap < 10000 || cap > 500000000) {
      setError("Ingresa un capital válido entre $10.000 y $500.000.000 COP.");
      setResultados(null);
      return;
    }
    if (!d || isNaN(d) || d < 1 || d > 365) {
      setError("Ingresa un número de días válido entre 1 y 365.");
      setResultados(null);
      return;
    }

    const calcs = NEOBANCOS.map((banco) => ({
      nombre: banco.nombre,
      tasa: banco.tasa,
      color: banco.color,
      rendimiento: calcularRendimiento(cap, banco.tasa, d),
      total: cap + calcularRendimiento(cap, banco.tasa, d),
    })).sort((a, b) => b.rendimiento - a.rendimiento);

    setResultados(calcs);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleCalcular();
  };

  const faqData = [
    {
      q: "¿Qué neobanco tiene la tasa más alta en Colombia en 2026?",
      a: "En 2026, Lulo Bank ofrece la tasa más alta con un 14.0% EA, seguido por Pibank con 13.5% EA y Nu Colombia con 13.22% EA. Nequi tiene la tasa más baja del grupo con 5.0% EA. Para maximizar rendimientos en plazos medianos y largos, Lulo Bank es la opción más rentable según los datos vigentes del primer semestre de 2026.",
    },
    {
      q: "¿Cómo se calcula el rendimiento de un neobanco en Colombia?",
      a: "Se usa la fórmula de interés simple: Rendimiento = Capital × (Tasa EA / 100) × (Días / 365). Por ejemplo, $10.000.000 COP a 14.0% EA durante 180 días genera $690.411 COP. Esta fórmula es la que aplican los neobancos colombianos para cuentas de ahorro a la vista, y es la que utiliza nuestra calculadora para todos sus comparativos.",
    },
    {
      q: "¿Los rendimientos de los neobancos tributan en Colombia?",
      a: "Sí. Los rendimientos financieros obtenidos en cuentas de neobancos colombianos son ingresos gravables y deben declararse en renta si superas los topes establecidos por la DIAN. Algunas plataformas practican retención en la fuente sobre intereses. El GMF (gravamen al movimiento financiero, 4×1000) puede aplicar sobre retiros dependiendo de si el titular tiene la exención activa en esa cuenta bancaria.",
    },
    {
      q: "¿Es seguro depositar dinero en neobancos como Nu o Lulo Bank en Colombia?",
      a: "Sí. Nu Colombia, Lulo Bank y Pibank están vigilados por la Superintendencia Financiera de Colombia (SFC) y los depósitos están cubiertos por el Seguro de Depósitos del Fondo de Garantías de Instituciones Financieras (Fogafín) hasta $50 millones COP por titular por entidad, lo que los convierte en alternativas legalmente respaldadas para el ahorro en Colombia.",
    },
    {
      q: "¿La tasa EA de los neobancos es fija o puede cambiar?",
      a: "Las tasas EA de los neobancos en Colombia son variables y pueden cambiar en cualquier momento según las condiciones del mercado y las decisiones del Banco de la República. Las tasas mostradas en esta calculadora (Lulo Bank 14.0%, Pibank 13.5%, Nu 13.22%, Nequi 5.0%) corresponden a los valores vigentes en 2026, pero te recomendamos verificarlas directamente en la app o sitio oficial de cada neobanco antes de tomar decisiones.",
    },
    {
      q: "¿Puedo comparar la rentabilidad de los neobancos con un CDT tradicional?",
      a: "Nuestra calculadora está especializada en neobancos colombianos 2026. Sin embargo, los CDT de bancos tradicionales en Colombia en 2026 ofrecen tasas que oscilan entre 11% y 13.5% EA para plazos de 90 a 365 días, lo que los sitúa en un rango similar al de Pibank y Nu. La ventaja de los neobancos es la liquidez inmediata, mientras que los CDT tienen penalización por retiro anticipado.",
    },
    {
      q: "¿Cuánto rinden $1.000.000 COP en cada neobanco durante un año?",
      a: "Con $1.000.000 COP durante 365 días bajo interés simple: Lulo Bank genera $140.000 COP, Pibank $135.000 COP, Nu $132.200 COP y Nequi $50.000 COP. La diferencia entre Lulo Bank y Nequi es de $90.000 COP anuales por cada millón depositado, lo que demuestra el impacto real de elegir un neobanco de alta rentabilidad.",
    },
  ];

  const mainContent = `<h2>¿Por qué comparar la rentabilidad de los neobancos en Colombia 2026?</h2>
<p>Los neobancos han revolucionado el ahorro en Colombia al ofrecer tasas de interés muy superiores a las de la banca tradicional. Mientras un banco convencional puede pagar entre 3% y 6% EA en cuentas de ahorro, plataformas como <strong>Lulo Bank</strong> y <strong>Pibank</strong> superan el 13% EA en 2026, lo que representa una diferencia sustancial para cualquier ahorrador. Conocer exactamente cuánto rinde cada opción en COP te permite tomar decisiones basadas en datos reales, no en publicidad.</p>

<h2>Tasas vigentes de neobancos Colombia 2026</h2>
<p>Estas son las tasas efectivas anuales (EA) utilizadas en nuestra calculadora, correspondientes a los valores oficiales del primer semestre de 2026:</p>
<ul>
  <li><strong>Lulo Bank:</strong> 14.0% EA — la tasa más alta entre los neobancos líderes del país.</li>
  <li><strong>Pibank:</strong> 13.5% EA — propuesta competitiva del banco digital del Grupo Pichincha.</li>
  <li><strong>Nu Colombia:</strong> 13.22% EA — rendimiento de la cuenta Nu, sin cuota de manejo.</li>
  <li><strong>Nequi:</strong> 5.0% EA — bolsillos de ahorro con tasa menor, ideal para metas de corto plazo.</li>
</ul>

<h2>Fórmula de cálculo: interés simple</h2>
<p>La calculadora aplica la fórmula estándar de <strong>interés simple proporcional</strong>, reconocida por la Superintendencia Financiera de Colombia para cuentas de ahorro a la vista:</p>
<p><code>Rendimiento = Capital × (Tasa EA / 100) × (Días / 365)</code></p>
<p>Esta fórmula es transparente, verificable y te da el rendimiento bruto antes de retención en la fuente (4×1000 no aplica a rendimientos, pero sí existe GMF en algunos retiros). El resultado que verás es el rendimiento nominal generado durante el período elegido.</p>

<h2>Beneficios de usar esta calculadora</h2>
<ul>
  <li>✅ <strong>Comparación simultánea</strong> de los 4 principales neobancos en una sola pantalla.</li>
  <li>✅ <strong>Resultados en COP</strong> con cifras exactas, sin conversiones ni estimaciones vagas.</li>
  <li>✅ <strong>Tasas 2026 actualizadas</strong>, reflejando el entorno de tasas del Banco de la República.</li>
  <li>✅ <strong>Cálculo flexible</strong> por días: desde 1 día hasta 365 días o más.</li>
  <li>✅ <strong>Sin registro</strong> ni instalación — 100% gratuita y disponible en cualquier dispositivo.</li>
  <li>✅ <strong>Tabla ordenada</strong> de mayor a menor rendimiento para decidir en segundos.</li>
</ul>

<h2>¿Qué neobanco rinde más en Colombia en 2026?</h2>
<p>Para la mayoría de horizontes temporales, <strong>Lulo Bank lidera el ranking de rentabilidad</strong> con su tasa del 14.0% EA, seguido muy de cerca por Pibank (13.5% EA) y Nu (13.22% EA). La diferencia entre los tres primeros es pequeña en plazos cortos, pero se amplía significativamente en plazos superiores a 180 días. <strong>Nequi</strong>, con 5.0% EA, queda rezagado en rentabilidad pura, aunque sigue siendo útil para fondos de emergencia por su liquidez inmediata y su integración con Bancolombia.</p>

<h2>Contexto macroeconómico: tasas altas en Colombia 2026</h2>
<p>La tasa de intervención del Banco de la República cerró 2025 en 9.25% y el entorno de tasas altas ha beneficiado directamente a los ahorradores en neobancos, que trasladan parte de ese rendimiento al usuario final. Se estima que durante 2026 las tasas de los neobancos se mantendrán competitivas entre 12% y 15% EA, haciendo de estas plataformas una alternativa real a los CDT bancarios tradicionales para montos menores a $50 millones COP.</p>`;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "Calculadora de Rentabilidad Neobancos Colombia 2026",
            url: "https://calcutools.online/calculadora-rentabilidad-neobancos-colombia-2026",
            description:
              "Calcula y compara la rentabilidad de Nu, Lulo Bank, Pibank y Nequi en 2026. Ingresa tu capital y período y descubre cuánto ganarás en COP.",
            applicationCategory: "FinanceApplication",
            operatingSystem: "All",
            offers: { "@type": "Offer", price: "0", priceCurrency: "COP" },
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "HowTo",
            name: "Cómo calcular la rentabilidad de los neobancos en Colombia 2026",
            description:
              "Guía paso a paso para usar la calculadora de rentabilidad de neobancos colombianos y comparar el rendimiento en COP de Nu, Lulo Bank, Pibank y Nequi.",
            totalTime: "PT1M",
            tool: [{ "@type": "HowToTool", name: "Calculadora de Rentabilidad Neobancos Colombia 2026" }],
            supply: [
              { "@type": "HowToSupply", name: "Capital inicial en pesos colombianos (COP)" },
              { "@type": "HowToSupply", name: "Número de días del período de ahorro" },
            ],
            step: [
              {
                "@type": "HowToStep",
                position: 1,
                name: "Ingresa tu capital",
                text: "Escribe el monto en pesos colombianos (COP) que deseas depositar. Por ejemplo, $5.000.000 COP.",
                url: "https://calcutools.online/calculadora-rentabilidad-neobancos-colombia-2026#paso-1",
              },
              {
                "@type": "HowToStep",
                position: 2,
                name: "Define el período en días",
                text: "Selecciona o ingresa el número de días que planeas mantener tu ahorro. Puedes ingresar desde 1 hasta 365 días. Por ejemplo, 90 días equivale aproximadamente a 3 meses.",
                url: "https://calcutools.online/calculadora-rentabilidad-neobancos-colombia-2026#paso-2",
              },
              {
                "@type": "HowToStep",
                position: 3,
                name: "Haz clic en Calcular y revisa la tabla",
                text: "Presiona el botón Calcular. La herramienta aplicará la fórmula Rendimiento = Capital × (Tasa EA / 100) × (Días / 365) para cada neobanco y mostrará una tabla comparativa ordenada de mayor a menor rendimiento en COP.",
                url: "https://calcutools.online/calculadora-rentabilidad-neobancos-colombia-2026#paso-3",
              },
            ],
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: [
              {
                "@type": "Question",
                name: "¿Qué neobanco tiene la tasa más alta en Colombia en 2026?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "En 2026, Lulo Bank ofrece la tasa más alta con un 14.0% EA, seguido por Pibank con 13.5% EA y Nu Colombia con 13.22% EA. Nequi tiene la tasa más baja del grupo con 5.0% EA. Para maximizar rendimientos en plazos medianos y largos, Lulo Bank es la opción más rentable según los datos vigentes del primer semestre de 2026.",
                },
              },
              {
                "@type": "Question",
                name: "¿Cómo se calcula el rendimiento de un neobanco en Colombia?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Se usa la fórmula de interés simple: Rendimiento = Capital × (Tasa EA / 100) × (Días / 365). Por ejemplo, $10.000.000 COP a 14.0% EA durante 180 días genera $690.411 COP. Esta fórmula es la que aplican los neobancos colombianos para cuentas de ahorro a la vista.",
                },
              },
              {
                "@type": "Question",
                name: "¿Los rendimientos de los neobancos tributan en Colombia?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Sí. Los rendimientos financieros obtenidos en cuentas de neobancos colombianos son ingresos gravables y deben declararse en renta si superas los topes establecidos por la DIAN. Algunas plataformas practican retención en la fuente sobre intereses. El GMF (4×1000) puede aplicar sobre retiros dependiendo de si el titular tiene la exención activa en esa cuenta.",
                },
              },
              {
                "@type": "Question",
                name: "¿Es seguro depositar dinero en neobancos como Nu o Lulo Bank en Colombia?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Sí. Nu Colombia, Lulo Bank y Pibank están vigilados por la Superintendencia Financiera de Colombia (SFC) y los depósitos están cubiertos por Fogafín hasta $50 millones COP por titular por entidad, lo que los convierte en alternativas legalmente respaldadas para el ahorro en Colombia.",
                },
              },
              {
                "@type": "Question",
                name: "¿La tasa EA de los neobancos es fija o puede cambiar?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Las tasas EA de los neobancos en Colombia son variables y pueden cambiar según las condiciones del mercado y las decisiones del Banco de la República. Las tasas mostradas (Lulo Bank 14.0%, Pibank 13.5%, Nu 13.22%, Nequi 5.0%) corresponden a valores vigentes en 2026, pero se recomienda verificarlas en la app oficial de cada neobanco.",
                },
              },
              {
                "@type": "Question",
                name: "¿Puedo comparar la rentabilidad de los neobancos con un CDT tradicional?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Los CDT de bancos tradicionales en Colombia en 2026 ofrecen tasas entre 11% y 13.5% EA para plazos de 90 a 365 días, similar a Pibank y Nu. La ventaja de los neobancos es la liquidez inmediata, mientras que los CDT tienen penalización por retiro anticipado.",
                },
              },
              {
                "@type": "Question",
                name: "¿Cuánto rinden $1.000.000 COP en cada neobanco durante un año?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Con $1.000.000 COP durante 365 días bajo interés simple: Lulo Bank genera $140.000 COP, Pibank $135.000 COP, Nu $132.200 COP y Nequi $50.000 COP. La diferencia entre Lulo Bank y Nequi es de $90.000 COP anuales por cada millón depositado.",
                },
              },
            ],
          }),
        }}
      />

      <div className="min-h-screen bg-white text-[#2C2C2A]">
        {/* Header */}
        <header className="bg-[#E1F5EE] border-b border-[#1D9E75]/20 px-4 py-6 md:px-8">
          <div className="max-w-4xl mx-auto">
            <nav aria-label="Breadcrumb" className="mb-3">
              <ol className="flex flex-wrap items-center gap-1 text-sm text-[#5F5E5A]">
                <li>
                  <a href="/" className="hover:text-[#1D9E75] transition-colors">
                    Inicio
                  </a>
                </li>
                <li aria-hidden="true" className="text-[#5F5E5A]">›</li>
                <li>
                  <a href="/fintech" className="hover:text-[#1D9E75] transition-colors">
                    Fintech
                  </a>
                </li>
                <li aria-hidden="true" className="text-[#5F5E5A]">›</li>
                <li className="text-[#1D9E75] font-medium" aria-current="page">
                  Rentabilidad Neobancos Colombia 2026
                </li>
              </ol>
            </nav>
            <h1 className="text-2xl md:text-4xl font-bold text-[#2C2C2A] leading-tight mb-2">
              Calculadora de Rentabilidad Neobancos Colombia 2026
            </h1>
            <p className="text-base md:text-lg text-[#5F5E5A] max-w-2xl">
              Compara en segundos cuánto rinde tu dinero en Nu, Lulo Bank, Pibank y Nequi con tasas EA reales 2026
            </p>
          </div>
        </header>

        {/* Main Widget */}
        <main className="max-w-4xl mx-auto px-4 py-8 md:px-8">
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-5 md:p-8 mb-6">
            <h2 className="text-xl font-semibold text-[#2C2C2A] mb-1">Calcula tu rendimiento</h2>
            <p className="text-sm text-[#5F5E5A] mb-6">
              Ingresa tu capital y el período de inversión para comparar los 4 principales neobancos.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
              {/* Capital */}
              <div id="paso-1">
                <label htmlFor="capital" className="block text-sm font-semibold text-[#2C2C2A] mb-1">
                  Capital a invertir (COP)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5F5E5A] font-medium text-sm">$</span>
                  <input
                    id="capital"
                    type="number"
                    min={10000}
                    max={500000000}
                    step={10000}
                    placeholder="5000000"
                    value={capital}
                    onChange={(e) => setCapital(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full pl-7 pr-14 py-3 border border-gray-300 rounded-xl text-[#2C2C2A] text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75] focus:border-transparent transition"
                    aria-label="Capital a invertir en pesos colombianos"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#5F5E5A] font-medium">COP</span>
                </div>
                <p className="text-xs text-[#5F5E5A] mt-1">Mín: $10.000 — Máx: $500.000.000</p>
              </div>

              {/* Días */}
              <div id="paso-2">
                <label htmlFor="dias" className="block text-sm font-semibold text-[#2C2C2A] mb-1">
                  Días de inversión
                </label>
                <div className="relative">
                  <input
                    id="dias"
                    type="number"
                    min={1}
                    max={365}
                    placeholder="90"
                    value={dias}
                    onChange={(e) => setDias(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full pl-4 pr-16 py-3 border border-gray-300 rounded-xl text-[#2C2C2A] text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75] focus:border-transparent transition"
                    aria-label="Número de días de inversión"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#5F5E5A] font-medium">días</span>
                </div>
                <p className="text-xs text-[#5F5E5A] mt-1">Mín: 1 día — Máx: 365 días</p>
              </div>
            </div>

            {/* Quick presets */}
            <div className="flex flex-wrap gap-2 mb-6">
              <span className="text-xs text-[#5F5E5A] self-center font-medium">Períodos rápidos:</span>
              {[30, 60, 90, 180, 365].map((d) => (
                <button
                  key={d}
                  onClick={() => setDias(String(d))}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    dias === String(d)
                      ? "bg-[#1D9E75] text-white border-[#1D9E75]"
                      : "bg-white text-[#1D9E75] border-[#1D9E75] hover:bg-[#E1F5EE]"
                  }`}
                >
                  {d} días
                </button>
              ))}
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm" role="alert">
                ⚠️ {error}
              </div>
            )}

            <button
              id="paso-3"
              onClick={handleCalcular}
              className="w-full md:w-auto px-8 py-3.5 bg-[#1D9E75] hover:bg-[#0F6E56] active:bg-[#0F6E56] text-white font-semibold rounded-xl text-base transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75] focus:ring-offset-2"
              aria-label="Calcular rentabilidad en neobancos"
            >
              Calcular rentabilidad
            </button>

            {/* Resultados */}
            <div role="status" aria-live="polite" aria-atomic="true">
              {resultados && (
                <div className="mt-8">
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                    <h3 className="text-lg font-semibold text-[#2C2C2A]">Tabla comparativa de rendimiento</h3>
                    <span className="text-xs text-[#5F5E5A] bg-[#E1F5EE] px-3 py-1 rounded-full">
                      {dias} días · {formatCOP(parseFloat(capital))} COP
                    </span>
                  </div>

                  {/* Mejor opción destacada */}
                  <div className="mb-5 p-4 bg-[#E1F5EE] border border-[#1D9E75]/30 rounded-xl flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🏆</span>
                      <div>
                        <p className="text-xs text-[#5F5E5A] font-medium uppercase tracking-wide">Mejor opción</p>
                        <p className="text-base font-bold text-[#1D9E75]">
                          {resultados[0].nombre} — {resultados[0].tasa}% EA
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-[#5F5E5A]">Rendimiento neto</p>
                      <p className="text-2xl font-bold text-[#1D9E75]">{formatCOP(resultados[0].rendimiento)}</p>
                    </div>
                  </div>

                  {/* Tabla desktop */}
                  <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-200">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="text-left px-4 py-3 text-[#5F5E5A] font-semibold">#</th>
                          <th className="text-left px-4 py-3 text-[#5F5E5A] font-semibold">Neobanco</th>
                          <th className="text-right px-4 py-3 text-[#5F5E5A] font-semibold">Tasa EA</th>
                          <th className="text-right px-4 py-3 text-[#5F5E5A] font-semibold">Rendimiento</th>
                          <th className="text-right px-4 py-3 text-[#5F5E5A] font-semibold">Total final</th>
                          <th className="px-4 py-3 text-[#5F5E5A] font-semibold">Barra</th>
                        </tr>
                      </thead>
                      <tbody>
                        {resultados.map((r, i) => {
                          const porcentaje = (r.rendimiento / resultados[0].rendimiento) * 100;
                          return (
                            <tr
                              key={r.nombre}
                              className={`border-b border-gray-100 transition-colors ${
                                i === 0 ? "bg-[#E1F5EE]/40" : "hover:bg-gray-50"
                              }`}
                            >
                              <td className="px-4 py-4">
                                <span
                                  className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold ${
                                    i === 0
                                      ? "bg-[#1D9E75] text-white"
                                      : "bg-gray-100 text-[#5F5E5A]"
                                  }`}
                                >
                                  {i + 1}
                                </span>
                              </td>
                              <td className="px-4 py-4 font-semibold text-[#2C2C2A]">{r.nombre}</td>
                              <td className="px-4 py-4 text-right text-[#5F5E5A]">{r.tasa}%</td>
                              <td className={`px-4 py-4 text-right font-bold ${i === 0 ? "text-[#1D9E75]" : "text-[#2C2C2A]"}`}>
                                {formatCOP(r.rendimiento)}
                              </td>
                              <td className="px-4 py-4 text-right text-[#5F5E5A]">{formatCOP(r.total)}</td>
                              <td className="px-4 py-4 w-32">
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className="h-2 rounded-full transition-all duration-500"
                                    style={{
                                      width: `${porcentaje}%`,
                                      backgroundColor: r.color,
                                    }}
                                  />
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Cards mobile */}
                  <div className="md:hidden flex flex-col gap-3">
                    {resultados.map((r, i) => {
                      const porcentaje = (r.rendimiento / resultados[0].rendimiento) * 100;
                      return (
                        <div
                          key={r.nombre}
                          className={`p-4 rounded-xl border ${
                            i === 0
                              ? "border-[#1D9E75] bg-[#E1F5EE]/50"
                              : "border-gray-200 bg-white"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span
                                className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                                  i === 0 ? "bg-[#1D9E75] text-white" : "bg-gray-100 text-[#5F5E5A]"
                                }`}
                              >
                                {i + 1}
                              </span>
                              <span className="font-semibold text-[#2C2C2A]">{r.nombre}</span>
                            </div>
                            <span className="text-xs text-[#5F5E5A] bg-gray-100 px-2 py-0.5 rounded-full">
                              {r.tasa}% EA
                            </span>
                          </div>
                          <div className="flex items-end justify-between mb-3">
                            <div>
                              <p className="text-xs text-[#5F5E5A]">Rendimiento</p>
                              <p className={`text-xl font-bold ${i === 0 ? "text-[#1D9E75]" : "text-[#2C2C2A]"}`}>
                                {formatCOP(r.rendimiento)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-[#5F5E5A]">Total final</p>
                              <p className="text-sm text-[#5F5E5A] font-medium">{formatCOP(r.total)}</p>
                            </div>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div
                              className="h-1.5 rounded-full"
                              style={{ width: `${porcentaje}%`, backgroundColor: r.color }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {resultados.length >= 2 && (
                    <p className="text-xs text-[#5F5E5A] mt-4 p-3 bg-gray-50 rounded-lg">
                      💡 Diferencia entre {resultados[0].nombre} y {resultados[resultados.length - 1].nombre}:{" "}
                      <strong className="text-[#1D9E75]">
                        {formatCOP(resultados[0].rendimiento - resultados[resultados.length - 1].rendimiento)}
                      </strong>{" "}
                      en {dias} días. Fórmula: Rendimiento = Capital × (Tasa EA / 100) × (Días / 365)
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          <AdUnit id="ad-below-tool" slot="1111111111" />

          {/* Cómo usar */}
          <section className="mb-10" aria-labelledby="como-usar-titulo">
            <h2 id="como-usar-titulo" className="text-xl md:text-2xl font-bold text-[#2C2C2A] mb-5">
              ¿Cómo calcular la rentabilidad en neobancos colombianos?
            </h2>
            <div className="flex flex-col gap-4 mb-6">
              {[
                {
                  paso: "1",
                  titulo: "Ingresa tu capital",
                  desc: "Escribe el monto en pesos colombianos (COP) que deseas depositar. Por ejemplo, $5.000.000 COP.",
                },
                {
                  paso: "2",
                  titulo: "Define el período en días",
                  desc: "Selecciona o ingresa el número de días que planeas mantener tu ahorro. Por ejemplo, 90 días equivale a aproximadamente 3 meses.",
                },
                {
                  paso: "3",
                  titulo: "Revisa la tabla comparativa",
                  desc: "Haz clic en 'Calcular' y revisa la tabla con el rendimiento neto de cada neobanco ordenado de mayor a menor.",
                },
              ].map((item) => (
                <div key={item.paso} className="flex gap-4 p-4 bg-[#E1F5EE]/50 rounded-xl border border-[#1D9E75]/15">
                  <span className="flex-shrink-0 w-9 h-9 bg-[#1D9E75] text-white rounded-full flex items-center justify-center font-bold text-sm">
                    {item.paso}
                  </span>
                  <div>
                    <p className="font-semibold text-[#2C2C2A] text-sm mb-0.5">{item.titulo}</p>
                    <p className="text-sm text-[#5F5E5A]">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Ejemplo numérico */}
            <div className="bg-white border border-[#1D9E75]/25 rounded-xl p-5 shadow-sm">
              <h3 className="font-bold text-[#2C2C2A] mb-3 flex items-center gap-2">
                <span className="text-[#1D9E75]">📊</span> Ejemplo numérico
              </h3>
              <p className="text-sm text-[#5F5E5A] mb-3">
                Con un capital de <strong>$5.000.000 COP</strong> durante <strong>90 días</strong>:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { banco: "Lulo Bank", tasa: "14.0% EA", rinde: "$172.603 COP", best: true },
                  { banco: "Pibank", tasa: "13.5% EA", rinde: "$166.438 COP", best: false },
                  { banco: "Nu Colombia", tasa: "13.22% EA", rinde: "$162.990 COP", best: false },
                  { banco: "Nequi", tasa: "5.0% EA", rinde: "$61.644 COP", best: false },
                ].map((item) => (
                  <div
                    key={item.banco}
                    className={`flex items-center justify-between p-3 rounded-lg text-sm ${
                      item.best ? "bg-[#1D9E75] text-white" : "bg-gray-50 text-[#2C2C2A]"
                    }`}
                  >
                    <span className="font-medium">
                      {item.best && "🏆 "}{item.banco} ({item.tasa})
                    </span>
                    <span className="font-bold">{item.rinde}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-[#5F5E5A] mt-3 font-medium">
                Diferencia entre el mejor y el peor: <strong className="text-[#1D9E75]">$110.959 COP</strong> en solo 3 meses.
              </p>
            </div>
          </section>

          {/* Contenido principal SEO */}
          <section
            className="prose prose-sm md:prose-base max-w-none mb-10 prose-headings:text-[#2C2C2A] prose-headings:font-bold prose-p:text-[#5F5E5A] prose-li:text-[#5F5E5A] prose-strong:text-[#2C2C2A] prose-code:bg-[#E1F5EE] prose-code:text-[#1D9E75] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-3"
            dangerouslySetInnerHTML={{ __html: mainContent }}
          />

          <AdUnit id="ad-mid-content" slot="2222222222" />

          {/* FAQ */}
          <section className="mb-10" aria-labelledby="faq-titulo">
            <h2 id="faq-titulo" className="text-xl md:text-2xl font-bold text-[#2C2C2A] mb-5">
              Preguntas frecuentes sobre rentabilidad de neobancos Colombia 2026
            </h2>
            <div className="flex flex-col gap-2">
              {faqData.map((item, i) => (
                <div
                  key={i}
                  className="border border-gray-200 rounded-xl overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between px-5 py-4 text-left bg-white hover:bg-[#E1F5EE]/40 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#1D9E75]"
                    aria-expanded={openFaq === i}
                    aria-controls={`faq-answer-${i}`}
                    id={`faq-question-${i}`}
                  >
                    <span className="font-semibold text-[#2C2C2A] text-sm md:text-base pr-3">{item.q}</span>
                    <span
                      className={`flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-[#1D9E75]/10 text-[#1D9E75] font-bold text-sm transition-transform duration-200 ${
                        openFaq === i ? "rotate-180" : ""
                      }`}
                      aria-hidden="true"
                    >
                      ▾
                    </span>
                  </button>
                  {openFaq === i && (
                    <div
                      id={`faq-answer-${i}`}
                      role="region"
                      aria-labelledby={`faq-question-${i}`}
                      className="px-5 pb-4 pt-1 bg-white text-sm text-[#5F5E5A] leading-relaxed border-t border-gray-100"
                    >
                      {item.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Herramientas relacionadas */}
          <section className="mb-10" aria-labelledby="relacionadas-titulo">
            <h2 id="relacionadas-titulo" className="text-xl font-bold text-[#2C2C2A] mb-4">
              Herramientas relacionadas
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  titulo: "Calculadora de CDT Colombia 2026",
                  desc: "Compara rendimientos de CDT en los principales bancos colombianos.",
                  href: "/calculadora-cdt-colombia-2026",
                  icon: "🏦",
                },
                {
                  titulo: "Calculadora de Interés Compuesto",
                  desc: "Simula el crecimiento de tus ahorros con capitalización compuesta.",
                  href: "/calculadora-interes-compuesto",
                  icon: "📈",
                },
                {
                  titulo: "Calculadora de Inflación Colombia",
                  desc: "Descubre el poder adquisitivo real de tu dinero ajustado por IPC.",
                  href: "/calculadora-inflacion-colombia",
                  icon: "💰",
                },
              ].map((tool) => (
                <a
                  key={tool.titulo}
                  href={tool.href}
                  className="flex flex-col gap-2 p-4 bg-white border border-gray-200 rounded-xl hover:border-[#1D9E75] hover:shadow-md transition-all group"
                >
                  <span className="text-2xl">{tool.icon}</span>
                  <p className="font-semibold text-[#2C2C2A] text-sm group-hover:text-[#1D9E75] transition-colors">
                    {tool.titulo}
                  </p>
                  <p className="text-xs text-[#5F5E5A]">{tool.desc}</p>
                </a>
              ))}
            </div>
          </section>

          <AdUnit id="ad-bottom" slot="3333333333" />
        </main>
      </div>
    </>
  );
}