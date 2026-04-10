"use client";

import { useState } from "react";

// ── Constantes laborales — actualizar cada enero ──────────────────────────────
const SMMLV = 1423500;       // SMMLV 2025 (Decreto 2343/2024)
const AUX_TRANSPORTE = 200000; // Auxilio de transporte 2025

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatCOP(n: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency", currency: "COP", minimumFractionDigits: 0,
  }).format(Math.round(n));
}

function diasEntreFechas(inicio: string, fin: string): number {
  // Año laboral colombiano: meses de 30 días (CST Art. 134)
  const [yi, mi, di] = inicio.split("-").map(Number);
  const [yf, mf, df] = fin.split("-").map(Number);
  const d1 = Math.min(di, 30);
  const d2 = df === 31 ? 30 : df;
  return (yf - yi) * 360 + (mf - mi) * 30 + (d2 - d1);
}

function hoy(): string {
  return new Date().toISOString().split("T")[0];
}

interface Resultado {
  cesantias: number;
  intereses: number;
  prima: number;
  vacaciones: number;
  indemnizacion: number;
  total: number;
  diasLaborados: number;
  incluiAuxTransporte: boolean;
  salarioLiquidable: number;
}

// ── Cálculo principal (CST + Ley 789/2002) ────────────────────────────────────
function calcularLiquidacion(p: {
  salario: number;
  fechaInicio: string;
  fechaFin: string;
  causa: string;
  tipoContrato: string;
  fechaVencimiento: string;
}): Resultado {
  const dias = diasEntreFechas(p.fechaInicio, p.fechaFin);
  const incluiAux = p.salario <= SMMLV * 2;
  const salBase = p.salario + (incluiAux ? AUX_TRANSPORTE : 0);

  // Cesantías: salario_liquidable × días / 360 (Art. 249 CST)
  const cesantias = salBase * dias / 360;

  // Intereses sobre cesantías: 12% anual sobre el saldo (Ley 52/1975)
  const intereses = cesantias * 0.12 * dias / 360;

  // Prima de servicios: 15 días de salario por año (Art. 306 CST)
  // = salario_liquidable × días / 720
  const prima = salBase * dias / 720;

  // Vacaciones: 15 días de salario base por año (Art. 186 CST)
  // No incluye auxilio de transporte
  const vacaciones = p.salario * dias / 720;

  // Indemnización por despido sin justa causa (Art. 64 CST, Ley 789/2002)
  let indemnizacion = 0;
  if (p.causa === "despido_sin_justa_causa") {
    const anos = dias / 360;
    const salarioAlto = p.salario >= SMMLV * 10;
    if (p.tipoContrato === "indefinido") {
      if (salarioAlto) {
        indemnizacion = anos < 1
          ? (p.salario / 30) * 20
          : (p.salario / 30) * (20 + 15 * (anos - 1));
      } else {
        indemnizacion = anos < 1
          ? (p.salario / 30) * 30
          : (p.salario / 30) * (30 + 20 * (anos - 1));
      }
    } else if (p.tipoContrato === "fijo" && p.fechaVencimiento) {
      const diasRestantes = diasEntreFechas(p.fechaFin, p.fechaVencimiento);
      indemnizacion = Math.max(0, (p.salario / 30) * diasRestantes);
    } else if (p.tipoContrato === "obra_labor") {
      indemnizacion = anos < 1
        ? (p.salario / 30) * 30
        : (p.salario / 30) * (30 + 20 * (anos - 1));
    }
  }

  return {
    cesantias: Math.round(cesantias),
    intereses: Math.round(intereses),
    prima: Math.round(prima),
    vacaciones: Math.round(vacaciones),
    indemnizacion: Math.round(indemnizacion),
    total: Math.round(cesantias + intereses + prima + vacaciones + indemnizacion),
    diasLaborados: dias,
    incluiAuxTransporte: incluiAux,
    salarioLiquidable: salBase,
  };
}

const CAUSAS = [
  { value: "renuncia", label: "Renuncia voluntaria" },
  { value: "despido_sin_justa_causa", label: "Despido sin justa causa" },
  { value: "despido_con_justa_causa", label: "Despido con justa causa" },
  { value: "mutuo_acuerdo", label: "Mutuo acuerdo" },
  { value: "vencimiento", label: "Vencimiento del contrato" },
];

const seoContent = `
<style>
  .sc h2{font-size:1.2rem;font-weight:700;color:#0F6E56;margin:1.8rem 0 .6rem}
  .sc h3{font-size:1rem;font-weight:700;color:#1D9E75;margin:1.3rem 0 .4rem}
  .sc p{margin-bottom:.85rem;line-height:1.7;font-size:.88rem;color:#2C2C2A}
  .sc ul,.sc ol{padding-left:1.3rem;margin-bottom:.9rem}
  .sc li{margin-bottom:.35rem;font-size:.88rem;line-height:1.6}
  .sc strong{color:#0F6E56}
  .sc table{width:100%;border-collapse:collapse;font-size:.82rem;margin:1rem 0}
  .sc th{background:#E1F5EE;color:#0F6E56;padding:.45rem .7rem;text-align:left;border:1px solid #c5e8db}
  .sc td{padding:.4rem .7rem;border:1px solid #e0e0e0}
  .sc tr:nth-child(even) td{background:#f9fafb}
</style>
<div class="sc">
<h2>¿Qué incluye una liquidación laboral en Colombia?</h2>
<p>La liquidación laboral es el pago de todos los derechos económicos causados durante la relación de trabajo que el empleador debe cancelar al momento de la terminación del contrato. Sin importar si renunciaste, te despidieron o el contrato venció, tienes derecho a recibir cuatro conceptos básicos: cesantías, intereses sobre cesantías, prima de servicios y vacaciones proporcionales. La indemnización solo aplica en caso de despido sin justa causa.</p>
<h2>Cesantías — Art. 249 CST</h2>
<p>Equivalen a un mes de salario por cada año trabajado. La fórmula es: <strong>Salario base mensual × días laborados ÷ 360</strong>. El salario base incluye el auxilio de transporte si tu salario es igual o menor a dos SMMLV. Las cesantías se consignan en el fondo de cesantías a más tardar el 14 de febrero de cada año; en la liquidación se pagan directamente.</p>
<h2>Intereses sobre cesantías — Ley 52/1975</h2>
<p>El empleador te debe pagar el <strong>12% anual</strong> sobre el saldo de cesantías acumuladas. La fórmula es: Cesantías × 12% × días del período ÷ 360. Se pagan junto con las cesantías en la liquidación o directamente al trabajador a 31 de diciembre si el contrato está vigente.</p>
<h2>Prima de servicios — Art. 306 CST</h2>
<p>Equivale a 15 días de salario por cada semestre trabajado (30 días al año). El salario base para la prima sí incluye el auxilio de transporte. Fórmula: <strong>Salario liquidable × días ÷ 720</strong>. Se paga en dos fechas del año: antes del 30 de junio y antes del 20 de diciembre, pero en la liquidación se calcula proporcional a los días trabajados en el último período.</p>
<h2>Vacaciones — Art. 186 CST</h2>
<p>Tienes derecho a 15 días hábiles de descanso remunerado por cada año de servicio. Para la liquidación se pagan proporcionalmente. Fórmula: <strong>Salario base × días ÷ 720</strong>. A diferencia de los demás conceptos, el auxilio de transporte no se incluye en el salario base para vacaciones.</p>
<h2>Indemnización por despido sin justa causa — Art. 64 CST</h2>
<p>Solo aplica cuando el empleador termina el contrato sin una causa legal válida (las causas justas están listadas en el Art. 62 CST). La tarifa depende de la antigüedad y el nivel salarial:</p>
<table>
<thead><tr><th>Tipo de contrato</th><th>Salario &lt; 10 SMMLV</th><th>Salario ≥ 10 SMMLV</th></tr></thead>
<tbody>
<tr><td>Indefinido &lt; 1 año</td><td>30 días de salario</td><td>20 días de salario</td></tr>
<tr><td>Indefinido ≥ 1 año</td><td>30 días (año 1) + 20 días/año adicional</td><td>20 días (año 1) + 15 días/año adicional</td></tr>
<tr><td>Término fijo</td><td colspan="2">Salario por días restantes del contrato</td></tr>
</tbody>
</table>
<h2>Auxilio de transporte en la liquidación</h2>
<p>El auxilio de transporte (<strong>${formatCOP(AUX_TRANSPORTE)}/mes en 2025</strong>) se incluye en el salario base para calcular cesantías y prima, pero NO para vacaciones ni indemnización. Solo aplica si tu salario mensual es igual o menor a 2 SMMLV (${formatCOP(SMMLV * 2)} en 2025). Si ganas más de ese monto, el auxilio de transporte no entra en la liquidación.</p>
<h2>Año laboral colombiano: ¿por qué se divide entre 360?</h2>
<p>El Código Sustantivo del Trabajo (Art. 134) establece que para efectos de liquidaciones, cada mes se considera de 30 días, lo que resulta en un año de 360 días. Los días 29, 30 y 31 de los meses que los tienen se redondean a 30. Esta es la razón por la que todas las fórmulas dividen entre 360 (o 720 para conceptos de 15 días por año).</p>
</div>`;

const faqData = [
  {
    q: "¿Me pagan liquidación si renuncio?",
    a: "Sí. Cuando renuncias voluntariamente tienes derecho a cesantías, intereses sobre cesantías, prima de servicios proporcional y vacaciones proporcionales. Lo que NO recibes al renunciar es la indemnización por despido, ya que esa solo aplica cuando el empleador termina el contrato sin justa causa.",
  },
  {
    q: "¿Cuánto tiempo tiene el empleador para pagar la liquidación?",
    a: "La liquidación debe pagarse al momento de la terminación del contrato. Si el empleador no la paga en ese momento, incurre en una sanción moratoria equivalente a un día de salario por cada día de retardo, hasta por 24 meses (Art. 65 CST). Después de 24 meses, los intereses corren a la tasa máxima legal.",
  },
  {
    q: "¿El auxilio de transporte se incluye en la liquidación?",
    a: "Parcialmente. El auxilio de transporte se suma al salario para calcular cesantías e intereses sobre cesantías y prima de servicios, pero NO se incluye para el cálculo de vacaciones ni de indemnización. Solo aplica si tu salario mensual es igual o menor a dos SMMLV.",
  },
  {
    q: "¿Qué pasa con los días de vacaciones no disfrutados?",
    a: "Si al momento de la liquidación tenías vacaciones causadas que no habías tomado, el empleador debe pagártelas en dinero. La calculadora incluye el valor proporcional de vacaciones desde tu último periodo de corte. Si ya tenías vacaciones completas pendientes, debes sumarlas al resultado.",
  },
  {
    q: "¿Cuál es la diferencia entre despido con y sin justa causa?",
    a: "Las causas justas de terminación están listadas en el Art. 62 del CST: llegar constantemente tarde, no cumplir con las funciones del contrato, revelación de secretos, actos inmorales en el trabajo, entre otras. Si el empleador termina el contrato invocando una de esas causales y puede probarla, no hay indemnización. Si no puede probarla o simplemente no existe causa justa, debe pagar la indemnización calculada según tu antigüedad.",
  },
  {
    q: "¿La calculadora sirve para contratos por obra o labor?",
    a: "Sí. Para contratos por obra o labor, la liquidación incluye los mismos cuatro conceptos básicos. En caso de terminación anticipada sin justa causa, la indemnización se calcula igual que para contratos indefinidos (30 días de salario por el primer año + 20 días por cada año adicional si el salario es inferior a 10 SMMLV).",
  },
  {
    q: "¿Qué es el SMMLV y para qué sirve en la liquidación?",
    a: "El Salario Mínimo Mensual Legal Vigente (SMMLV) es el salario mínimo que el gobierno fija cada año mediante decreto. En la liquidación sirve para dos cosas: determinar si aplica el auxilio de transporte (aplica si ganas ≤ 2 SMMLV) y para definir la tarifa de indemnización (la tabla cambia si ganas ≥ 10 SMMLV).",
  },
  {
    q: "¿Los valores que arroja la calculadora son exactos?",
    a: "La calculadora usa las fórmulas del Código Sustantivo del Trabajo y aplica el año laboral de 360 días (meses de 30 días) según el Art. 134 CST. Para la mayoría de contratos de empleados con salario fijo, los resultados son muy precisos. Casos especiales como salario variable, comisiones, horas extra o beneficios extralegales pueden requerir ajuste manual o asesoría de un abogado laboral.",
  },
];

export default function CalculadoraLiquidacion() {
  const [salario, setSalario] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState(hoy());
  const [causa, setCausa] = useState("renuncia");
  const [tipoContrato, setTipoContrato] = useState("indefinido");
  const [fechaVencimiento, setFechaVencimiento] = useState("");
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [error, setError] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  function handleCalcular(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setResultado(null);

    const sal = parseFloat(salario.replace(/\D/g, ""));
    if (!sal || sal < SMMLV) {
      setError(`El salario debe ser mayor o igual al SMMLV (${formatCOP(SMMLV)}).`);
      return;
    }
    if (!fechaInicio || !fechaFin) {
      setError("Ingresa las fechas de inicio y fin del contrato.");
      return;
    }
    const dias = diasEntreFechas(fechaInicio, fechaFin);
    if (dias <= 0) {
      setError("La fecha de fin debe ser posterior a la fecha de inicio.");
      return;
    }
    if (tipoContrato === "fijo" && causa === "despido_sin_justa_causa" && !fechaVencimiento) {
      setError("Para contrato a término fijo ingresa la fecha de vencimiento.");
      return;
    }

    setResultado(calcularLiquidacion({
      salario: sal,
      fechaInicio,
      fechaFin,
      causa,
      tipoContrato,
      fechaVencimiento,
    }));
  }

  const anos = fechaInicio && fechaFin
    ? (diasEntreFechas(fechaInicio, fechaFin) / 360).toFixed(1)
    : null;

  const schema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Calculadora de Liquidación Laboral Colombia",
    url: "https://calcutools.online/calculadora-liquidacion-laboral-colombia",
    description: "Calcula tu liquidación laboral en Colombia: cesantías, intereses, prima, vacaciones e indemnización según el Código Sustantivo del Trabajo.",
    applicationCategory: "FinanceApplication",
    operatingSystem: "All",
    offers: { "@type": "Offer", price: "0", priceCurrency: "COP" },
    inLanguage: "es-CO",
  };

  const schemaFAQ = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqData.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaFAQ) }} />

      <div className="min-h-screen bg-gray-50 text-[#2C2C2A]">

        {/* HEADER */}
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-3xl mx-auto px-4 py-4">
            <nav className="text-xs text-gray-500 mb-2">
              <a href="/" className="hover:underline text-[#1D9E75]">calcutools.online</a>
              <span className="mx-1">/</span>
              <span>Calculadora Liquidación Laboral</span>
            </nav>
            <h1 className="text-2xl md:text-3xl font-bold leading-tight text-[#0F6E56]">
              Calculadora de Liquidación Laboral Colombia 2025
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Calcula cesantías, intereses, prima, vacaciones e indemnización según el Código Sustantivo del Trabajo. Gratis, sin registro.
            </p>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 py-6">

          {/* INTRO */}
          <div className="mb-6 p-4 bg-white rounded-xl border-l-4 border-[#1D9E75] shadow-sm text-sm text-gray-700 leading-relaxed">
            Te despidieron, renunciaste o el contrato venció y no sabes cuánto te deben. Llena los datos y la calculadora te muestra cada concepto desglosado con la fórmula que usa tu empresa de nómina.
          </div>

          {/* FORMULARIO */}
          <section className="bg-white rounded-2xl shadow-sm overflow-hidden mb-8">
            <div className="px-5 py-4 text-white font-bold" style={{ background: "#1D9E75" }}>
              📋 Datos del contrato
            </div>
            <form onSubmit={handleCalcular} className="p-5 space-y-5">

              {/* Tipo de contrato */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-[#0F6E56]">Tipo de contrato</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { v: "indefinido", l: "Término indefinido" },
                    { v: "fijo", l: "Término fijo" },
                    { v: "obra_labor", l: "Obra o labor" },
                  ].map(({ v, l }) => (
                    <button key={v} type="button" onClick={() => setTipoContrato(v)}
                      className={`py-2 px-2 rounded-lg border-2 text-xs font-semibold transition-all text-center ${
                        tipoContrato === v
                          ? "border-[#1D9E75] bg-[#E1F5EE] text-[#1D9E75]"
                          : "border-gray-200 text-gray-500 hover:border-[#1D9E75]/40"
                      }`}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Salario */}
              <div>
                <label className="block text-sm font-semibold mb-1 text-[#0F6E56]">
                  Salario mensual base (COP) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-sm">$</span>
                  <input
                    type="number"
                    value={salario}
                    onChange={(e) => setSalario(e.target.value)}
                    placeholder={`Mínimo ${formatCOP(SMMLV)}`}
                    min={SMMLV}
                    className="w-full border border-gray-300 rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]"
                    required
                  />
                </div>
                {salario && parseFloat(salario) <= SMMLV * 2 && (
                  <p className="text-xs text-[#1D9E75] mt-1">✓ Aplica auxilio de transporte ({formatCOP(AUX_TRANSPORTE)}/mes)</p>
                )}
              </div>

              {/* Fechas */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1 text-[#0F6E56]">
                    Fecha de inicio <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    max={fechaFin}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1 text-[#0F6E56]">
                    Fecha de terminación <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                    min={fechaInicio}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]"
                    required
                  />
                </div>
              </div>
              {anos && (
                <p className="text-xs text-gray-500 -mt-3">
                  Tiempo laborado: <strong className="text-[#1D9E75]">{anos} años</strong> ({diasEntreFechas(fechaInicio, fechaFin)} días laborales)
                </p>
              )}

              {/* Causa de terminación */}
              <div>
                <label className="block text-sm font-semibold mb-1 text-[#0F6E56]">Causa de terminación</label>
                <select
                  value={causa}
                  onChange={(e) => setCausa(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]"
                >
                  {CAUSAS.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
                {causa === "despido_sin_justa_causa" && (
                  <p className="text-xs text-amber-600 mt-1">⚠ Aplica indemnización según antigüedad (Art. 64 CST)</p>
                )}
              </div>

              {/* Fecha vencimiento (solo contrato fijo + despido sin justa causa) */}
              {tipoContrato === "fijo" && causa === "despido_sin_justa_causa" && (
                <div>
                  <label className="block text-sm font-semibold mb-1 text-[#0F6E56]">
                    Fecha de vencimiento del contrato <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={fechaVencimiento}
                    onChange={(e) => setFechaVencimiento(e.target.value)}
                    min={fechaFin}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]"
                  />
                  <p className="text-xs text-gray-500 mt-1">Para calcular la indemnización por días restantes del contrato</p>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 rounded-xl text-white font-bold text-sm shadow-md hover:opacity-90 active:scale-95 transition-all"
                style={{ background: "#1D9E75" }}
              >
                🧮 Calcular liquidación
              </button>
            </form>
          </section>

          {/* RESULTADO */}
          {resultado && (
            <section className="bg-white rounded-2xl shadow-md overflow-hidden mb-8 border-2 border-[#1D9E75]">
              <div className="px-5 py-4 text-white font-bold text-lg" style={{ background: "#0F6E56" }}>
                📊 Liquidación estimada
              </div>
              <div className="p-5 space-y-3">

                {[
                  {
                    label: "Cesantías",
                    value: resultado.cesantias,
                    formula: `${formatCOP(resultado.salarioLiquidable)} × ${resultado.diasLaborados} días ÷ 360`,
                    nota: resultado.incluiAuxTransporte ? "Incluye auxilio de transporte" : undefined,
                  },
                  {
                    label: "Intereses sobre cesantías (12% anual)",
                    value: resultado.intereses,
                    formula: `${formatCOP(resultado.cesantias)} × 12% × ${resultado.diasLaborados} días ÷ 360`,
                  },
                  {
                    label: "Prima de servicios",
                    value: resultado.prima,
                    formula: `${formatCOP(resultado.salarioLiquidable)} × ${resultado.diasLaborados} días ÷ 720`,
                    nota: resultado.incluiAuxTransporte ? "Incluye auxilio de transporte" : undefined,
                  },
                  {
                    label: "Vacaciones proporcionales",
                    value: resultado.vacaciones,
                    formula: `${formatCOP(parseFloat(salario.replace(/\D/g, "")))} × ${resultado.diasLaborados} días ÷ 720`,
                    nota: "Solo salario base (sin auxilio de transporte)",
                  },
                ].map(({ label, value, formula, nota }) => (
                  <div key={label} className="flex justify-between items-start py-2 border-b border-gray-100">
                    <div>
                      <p className="text-sm font-semibold text-[#2C2C2A]">{label}</p>
                      <p className="text-xs text-gray-400 font-mono">{formula}</p>
                      {nota && <p className="text-xs text-[#1D9E75]">{nota}</p>}
                    </div>
                    <span className="text-sm font-bold text-[#0F6E56] ml-4 whitespace-nowrap">{formatCOP(value)}</span>
                  </div>
                ))}

                {resultado.indemnizacion > 0 && (
                  <div className="flex justify-between items-start py-2 border-b border-orange-200 bg-orange-50 rounded-lg px-3">
                    <div>
                      <p className="text-sm font-semibold text-orange-800">Indemnización por despido sin justa causa</p>
                      <p className="text-xs text-orange-500">Art. 64 CST — Ley 789/2002</p>
                    </div>
                    <span className="text-sm font-bold text-orange-700 ml-4 whitespace-nowrap">{formatCOP(resultado.indemnizacion)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center pt-3 mt-1 border-t-2 border-[#1D9E75]">
                  <span className="text-base font-bold text-[#0F6E56]">TOTAL LIQUIDACIÓN</span>
                  <span className="text-2xl font-bold text-[#0F6E56]">{formatCOP(resultado.total)}</span>
                </div>

                <div className="mt-2 p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-800">
                  <strong>Nota:</strong> Este cálculo es orientativo y usa el año laboral de 360 días (Art. 134 CST). Para salario variable, comisiones, horas extra o beneficios extralegales consulta con un abogado laboral.
                </div>
              </div>
            </section>
          )}

          {/* SEO CONTENT */}
          <section
            className="mb-8 bg-white rounded-2xl shadow-sm p-6 prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: seoContent }}
          />

          {/* FAQ */}
          <section className="mb-8 bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-xl font-bold mb-5 text-[#0F6E56]">Preguntas frecuentes</h2>
            <div className="space-y-3">
              {faqData.map((faq, i) => (
                <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
                  <button
                    className="w-full text-left px-4 py-3 flex justify-between items-center font-semibold text-sm text-[#0F6E56]"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  >
                    {faq.q}
                    <span className="ml-2 flex-shrink-0">{openFaq === i ? "▲" : "▼"}</span>
                  </button>
                  {openFaq === i && (
                    <div className="px-4 pb-4 text-sm text-gray-700 leading-relaxed border-t border-gray-100 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

        </main>
      </div>
    </>
  );
}
