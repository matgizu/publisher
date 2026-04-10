"use client";

import { useState, useEffect, useCallback } from "react";

// ─── Constantes laborales Colombia 2025 ───────────────────────────────────────
const SMMLV = 1_423_500;
const AUX_TRANSPORTE = 200_000;
const PCT_SALUD = 0.04;
const PCT_PENSION = 0.04;
const PCT_FONDO_SOLIDARIDAD = 0.01;
const HORAS_MES = 240;

// ─── Utilidades ───────────────────────────────────────────────────────────────
const formatCOP = (value: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);

const num = (v: string | number) => {
  const n = typeof v === "string" ? parseFloat(v.replace(/[^\d.]/g, "")) : v;
  return isNaN(n) ? 0 : n;
};

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface FormData {
  empleadorNombre: string;
  empleadorNit: string;
  empleadorCiudad: string;
  trabajadorNombre: string;
  trabajadorCedula: string;
  trabajadorCargo: string;
  periodotipo: "mensual" | "quincena1" | "quincena2";
  periodoMes: string;
  salarioBase: string;
  hesDiurnas: string;
  hesNocturnas: string;
  otroDevNombre: string;
  otroDevValor: string;
  anticipos: string;
  libranza: string;
  otraDeducNombre: string;
  otraDeducValor: string;
}

interface Calculo {
  valorHora: number;
  hesDiurnasValor: number;
  hesNocturnasValor: number;
  tieneAuxTransporte: boolean;
  auxTransporte: number;
  ibc: number;
  deducSalud: number;
  deducPension: number;
  deducFondoSol: number;
  totalDevengado: number;
  totalDeducciones: number;
  netoAPagar: number;
}

// ─── Función de cálculo ───────────────────────────────────────────────────────
function calcular(form: FormData): Calculo {
  const salarioBase = num(form.salarioBase);
  const hesDiurnas = num(form.hesDiurnas);
  const hesNocturnas = num(form.hesNocturnas);
  const otrosDevengados = num(form.otroDevValor);
  const anticipos = num(form.anticipos);
  const libranza = num(form.libranza);
  const otrasDeducciones = num(form.otraDeducValor);

  const valorHora = salarioBase / HORAS_MES;
  const hesDiurnasValor = hesDiurnas * valorHora * 1.25;
  const hesNocturnasValor = hesNocturnas * valorHora * 1.75;
  const tieneAuxTransporte = salarioBase > 0 && salarioBase <= 2 * SMMLV;
  const auxTransporte = tieneAuxTransporte ? AUX_TRANSPORTE : 0;
  const ibc = salarioBase;
  const deducSalud = Math.round(ibc * PCT_SALUD);
  const deducPension = Math.round(ibc * PCT_PENSION);
  const deducFondoSol =
    ibc > 4 * SMMLV ? Math.round(ibc * PCT_FONDO_SOLIDARIDAD) : 0;
  const totalDevengado =
    salarioBase +
    auxTransporte +
    hesDiurnasValor +
    hesNocturnasValor +
    otrosDevengados;
  const totalDeducciones =
    deducSalud +
    deducPension +
    deducFondoSol +
    anticipos +
    libranza +
    otrasDeducciones;
  const netoAPagar = totalDevengado - totalDeducciones;

  return {
    valorHora,
    hesDiurnasValor,
    hesNocturnasValor,
    tieneAuxTransporte,
    auxTransporte,
    ibc,
    deducSalud,
    deducPension,
    deducFondoSol,
    totalDevengado,
    totalDeducciones,
    netoAPagar,
  };
}

// ─── Etiqueta período ─────────────────────────────────────────────────────────
function labelPeriodo(tipo: string, mes: string): string {
  const labels: Record<string, string> = {
    mensual: "Mensual",
    quincena1: "Primera quincena",
    quincena2: "Segunda quincena",
  };
  if (!mes) return labels[tipo] || tipo;
  const [year, month] = mes.split("-");
  const fecha = new Date(parseInt(year), parseInt(month) - 1, 1);
  const mesNombre = fecha.toLocaleDateString("es-CO", {
    month: "long",
    year: "numeric",
  });
  return `${labels[tipo]} — ${mesNombre.charAt(0).toUpperCase() + mesNombre.slice(1)}`;
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function GeneradorDesprendibleNomina() {
  const [form, setForm] = useState<FormData>({
    empleadorNombre: "",
    empleadorNit: "",
    empleadorCiudad: "",
    trabajadorNombre: "",
    trabajadorCedula: "",
    trabajadorCargo: "",
    periodotipo: "mensual",
    periodoMes: new Date().toISOString().slice(0, 7),
    salarioBase: "",
    hesDiurnas: "",
    hesNocturnas: "",
    otroDevNombre: "",
    otroDevValor: "",
    anticipos: "",
    libranza: "",
    otraDeducNombre: "",
    otraDeducValor: "",
  });

  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [jspdfLoaded, setJspdfLoaded] = useState(false);
  const [generando, setGenerando] = useState(false);

  const calc = calcular(form);

  // ─── Cargar jsPDF desde CDN ───────────────────────────────────────────────
  useEffect(() => {
    if (document.getElementById("jspdf-cdn")) {
      setJspdfLoaded(true);
      return;
    }
    const script = document.createElement("script");
    script.id = "jspdf-cdn";
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
    script.async = true;
    script.onload = () => setJspdfLoaded(true);
    document.head.appendChild(script);
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setForm((prev) => ({ ...prev, [name]: value }));
    },
    []
  );

  const canGeneratePDF =
    num(form.salarioBase) > 0 && form.trabajadorNombre.trim().length > 0;

  // ─── Generar PDF ──────────────────────────────────────────────────────────
  const generatePDF = useCallback(() => {
    if (!jspdfLoaded || !canGeneratePDF) return;
    setGenerando(true);
    try {
      const { jsPDF } = (window as any).jspdf;
      const doc = new jsPDF({ unit: "mm", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();
      const marginL = 18;
      const marginR = 18;
      const colRight = pageW - marginR;
      let y = 18;

      const c = calcular(form);

      // ── Encabezado ──
      doc.setFillColor(29, 158, 117);
      doc.rect(0, 0, pageW, 14, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.text("calcutools.online", marginL, 9);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("COMPROBANTE DE NÓMINA", pageW / 2, 9, { align: "center" });
      y = 22;

      // ── Nombre empleador ──
      doc.setTextColor(44, 44, 42);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(form.empleadorNombre || "—", marginL, y);
      y += 6;
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(95, 94, 90);
      const nitLabel = form.empleadorNit ? `NIT/CC: ${form.empleadorNit}` : "";
      const ciudadLabel = form.empleadorCiudad
        ? ` · ${form.empleadorCiudad}`
        : "";
      doc.text(nitLabel + ciudadLabel, marginL, y);
      y += 5;

      // ── Línea divisoria ──
      doc.setDrawColor(29, 158, 117);
      doc.setLineWidth(0.5);
      doc.line(marginL, y, colRight, y);
      y += 6;

      // ── Datos trabajador ──
      doc.setTextColor(44, 44, 42);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("DATOS DEL TRABAJADOR", marginL, y);
      y += 5;

      const tdFields = [
        ["Nombre:", form.trabajadorNombre || "—"],
        ["Cédula:", form.trabajadorCedula || "—"],
        ["Cargo:", form.trabajadorCargo || "—"],
        ["Período:", labelPeriodo(form.periodotipo, form.periodoMes)],
      ];
      doc.setFont("helvetica", "normal");
      tdFields.forEach(([label, value]) => {
        doc.setFont("helvetica", "bold");
        doc.text(label, marginL, y);
        doc.setFont("helvetica", "normal");
        doc.text(value, marginL + 22, y);
        y += 5;
      });
      y += 2;

      // ── Tabla devengados ──
      const drawTableHeader = (title: string) => {
        doc.setFillColor(225, 245, 238);
        doc.rect(marginL, y - 4, colRight - marginL, 7, "F");
        doc.setFont("helvetica", "bold");
        doc.setTextColor(15, 110, 86);
        doc.setFontSize(9);
        doc.text(title, marginL + 2, y);
        doc.text("VALOR", colRight - 2, y, { align: "right" });
        doc.setTextColor(44, 44, 42);
        y += 4;
        doc.setDrawColor(200, 230, 220);
        doc.setLineWidth(0.3);
        doc.line(marginL, y, colRight, y);
        y += 4;
      };

      const drawRow = (
        concept: string,
        value: number,
        bold = false,
        highlight = false
      ) => {
        if (highlight) {
          doc.setFillColor(225, 245, 238);
          doc.rect(marginL, y - 4, colRight - marginL, 6.5, "F");
        }
        doc.setFont("helvetica", bold ? "bold" : "normal");
        doc.setFontSize(9);
        doc.setTextColor(44, 44, 42);
        doc.text(concept, marginL + 2, y);
        doc.text(formatCOP(value), colRight - 2, y, { align: "right" });
        y += 5.5;
      };

      drawTableHeader("DEVENGADOS");
      drawRow("Salario base", num(form.salarioBase));
      if (c.tieneAuxTransporte) drawRow("Auxilio de transporte", c.auxTransporte);
      if (num(form.hesDiurnas) > 0)
        drawRow(
          `Horas extra diurnas (${form.hesDiurnas}h)`,
          c.hesDiurnasValor
        );
      if (num(form.hesNocturnas) > 0)
        drawRow(
          `Horas extra nocturnas (${form.hesNocturnas}h)`,
          c.hesNocturnasValor
        );
      if (form.otroDevNombre && num(form.otroDevValor) > 0)
        drawRow(form.otroDevNombre, num(form.otroDevValor));
      drawRow("TOTAL DEVENGADO", c.totalDevengado, true, true);
      y += 4;

      // ── Tabla deducciones ──
      drawTableHeader("DEDUCCIONES");
      drawRow("Salud empleado (4%)", c.deducSalud);
      drawRow("Pensión empleado (4%)", c.deducPension);
      if (c.deducFondoSol > 0)
        drawRow("Fondo de solidaridad (1%)", c.deducFondoSol);
      if (num(form.anticipos) > 0) drawRow("Anticipos", num(form.anticipos));
      if (num(form.libranza) > 0) drawRow("Libranza", num(form.libranza));
      if (form.otraDeducNombre && num(form.otraDeducValor) > 0)
        drawRow(form.otraDeducNombre, num(form.otraDeducValor));
      drawRow("TOTAL DEDUCCIONES", c.totalDeducciones, true, true);
      y += 6;

      // ── Neto a pagar ──
      doc.setFillColor(29, 158, 117);
      doc.roundedRect(marginL, y - 5, colRight - marginL, 13, 2, 2, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("NETO A PAGAR:", marginL + 4, y + 3);
      doc.text(formatCOP(c.netoAPagar), colRight - 4, y + 3, {
        align: "right",
      });
      y += 18;

      // ── Firmas ──
      doc.setTextColor(44, 44, 42);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setDrawColor(150, 150, 150);
      doc.setLineWidth(0.3);
      const col1 = marginL + 18;
      const col2 = pageW / 2 + 20;
      doc.line(marginL, y, col1 + 30, y);
      doc.line(pageW / 2, y, col2 + 30, y);
      y += 4;
      doc.text("Firma Empleador", marginL, y);
      doc.text("Firma Trabajador", pageW / 2, y);
      y += 12;

      // ── Pie ──
      doc.setDrawColor(29, 158, 117);
      doc.setLineWidth(0.3);
      doc.line(marginL, y, colRight, y);
      y += 5;
      doc.setFontSize(7.5);
      doc.setTextColor(95, 94, 90);
      doc.text(
        "Generado en calcutools.online — Gratis, sin registro",
        pageW / 2,
        y,
        { align: "center" }
      );

      // ── Nombre archivo ──
      const nombreArchivo = `desprendible-nomina-${(form.trabajadorNombre || "trabajador")
        .toLowerCase()
        .replace(/\s+/g, "-")}-${form.periodoMes || "periodo"}.pdf`;
      doc.save(nombreArchivo);
    } catch (err) {
      console.error("Error generando PDF:", err);
    } finally {
      setGenerando(false);
    }
  }, [form, jspdfLoaded, canGeneratePDF]);

  // ─── FAQ Data ─────────────────────────────────────────────────────────────
  const faqs = [
    {
      q: "¿El desprendible de nómina es obligatorio en Colombia?",
      a: "Sí. El empleador tiene la obligación de informar al trabajador sobre los conceptos que componen su pago, incluyendo las deducciones por seguridad social. El artículo 32 de la Ley 1393 de 2010 refuerza que debe ser posible verificar los aportes a seguridad social. No entregarlo puede traer problemas en una eventual reclamación laboral o inspección del Ministerio de Trabajo.",
    },
    {
      q: "¿Debo entregar desprendible de nómina a mi empleada doméstica?",
      a: "Sí. Si tienes una trabajadora doméstica contratada formalmente —interna, externa o por días trabajando más de un día a la semana—, debes entregarle un comprobante de pago donde se detallen los ingresos y los descuentos. No importa que no seas empresa. Con esta herramienta pones tu nombre y cédula como empleador y generas el PDF en minutos.",
    },
    {
      q: "¿El auxilio de transporte se incluye para calcular salud y pensión?",
      a: "No. Es un error muy frecuente. El auxilio de transporte ($200.000 en 2025) se suma al total devengado, pero no forma parte del Ingreso Base de Cotización (IBC). Salud y pensión se calculan solamente sobre el salario base. Esta herramienta ya hace esa separación correctamente de forma automática.",
    },
    {
      q: "¿Cuánto se descuenta de salud y pensión al trabajador en 2025?",
      a: "Al trabajador se le descuenta el 4% del IBC para salud y otro 4% para pensión. Con salario mínimo de $1.423.500, eso es $56.940 por cada concepto, o sea $113.880 en total. El empleador aporta aparte el 8.5% a salud y el 12% a pensión, pero eso no se refleja como descuento en el desprendible del trabajador.",
    },
    {
      q: "¿Necesito instalar algún programa para usar el generador?",
      a: "No. La herramienta funciona completamente en tu navegador web — Chrome, Safari, Firefox, el que uses. No necesitas descargar Excel, no necesitas instalar software de nómina, no necesitas crear cuenta. Llenas el formulario, ves el resumen y descargas el PDF. Funciona desde el celular también.",
    },
    {
      q: "¿Puedo generar desprendibles de meses anteriores?",
      a: "Sí. En el campo de mes y año seleccionas el período que necesites. Verifica que los valores sean correctos para ese mes. Por ejemplo, si necesitas generar un desprendible de diciembre 2024, el SMMLV era $1.300.000 y el auxilio de transporte $162.000. La herramienta usa los valores que tú ingreses, así que asegúrate de poner el salario que correspondía en ese período.",
    },
    {
      q: "¿El desprendible generado sirve para solicitar créditos o arriendo?",
      a: "El desprendible de nómina no reemplaza una certificación laboral formal, pero muchos bancos, cooperativas y arrendadores lo aceptan como soporte complementario. Generalmente piden los últimos 2 o 3 desprendibles. Con esta herramienta puedes generarlos todos en PDF y tu trabajador los presenta junto con la certificación laboral.",
    },
    {
      q: "¿Qué pasa con el fondo de solidaridad pensional?",
      a: "Solo aplica si el trabajador gana más de 4 SMMLV, es decir más de $5.694.000 mensuales en 2025. En ese caso, se descuenta un 1% adicional sobre el IBC. Si tu empleado gana el mínimo o un salario por debajo de ese tope, no le aplica. La herramienta detecta automáticamente si debe incluirlo o no según el salario que ingreses.",
    },
  ];

  // ─── Input styles ─────────────────────────────────────────────────────────
  const inputCls =
    "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-[#2C2C2A] placeholder-gray-400 focus:border-[#1D9E75] focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/20 transition";
  const labelCls = "block text-xs font-semibold text-[#5F5E5A] mb-1 uppercase tracking-wide";

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      {/* JSON-LD Schemas */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "HowTo",
            name: "Cómo generar un desprendible de nómina en Colombia gratis",
            description:
              "Genera un comprobante de pago de nómina colombiano en PDF sin Excel, sin registro y sin instalar nada. Con cálculo automático de salud, pensión y auxilio de transporte 2025.",
            step: [
              {
                "@type": "HowToStep",
                name: "Ingresa datos del empleador",
                text: "Escribe los datos del empleador: nombre de tu empresa o tu nombre como persona natural, y tu NIT o cédula.",
              },
              {
                "@type": "HowToStep",
                name: "Ingresa datos del trabajador y período",
                text: "Llena los datos del trabajador: nombre completo, número de cédula y el cargo. Selecciona el período de pago y el mes.",
              },
              {
                "@type": "HowToStep",
                name: "Registra salario y conceptos adicionales",
                text: "Ingresa el salario base mensual. Si gana hasta $2.847.000 el sistema suma el auxilio de transporte automáticamente.",
              },
              {
                "@type": "HowToStep",
                name: "Revisa y descarga el PDF",
                text: "Revisa el resumen en pantalla y haz clic en Generar PDF para descargar el desprendible.",
              },
            ],
          }),
        }}
      />

      <div className="min-h-screen bg-gray-50 font-sans text-[#2C2C2A]">
        {/* ── HEADER ─────────────────────────────────────────────────────── */}
        <header className="bg-white border-b border-gray-100">
          <div className="max-w-5xl mx-auto px-4 py-6">
            {/* Breadcrumb */}
            <nav className="text-xs text-[#5F5E5A] mb-3" aria-label="Breadcrumb">
              <a href="https://calcutools.online" className="hover:text-[#1D9E75] transition">
                Inicio
              </a>
              <span className="mx-1.5">›</span>
              <a href="https://calcutools.online/herramientas-laborales" className="hover:text-[#1D9E75] transition">
                Herramientas laborales
              </a>
              <span className="mx-1.5">›</span>
              <span className="text-[#1D9E75] font-medium">Desprendible de nómina</span>
            </nav>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2C2C2A] leading-tight mb-2">
              Generador de Desprendible de Nómina Colombia 2025{" "}
              <span className="text-[#1D9E75]">— PDF Gratis</span>
            </h1>
            <p className="text-[#5F5E5A] text-sm sm:text-base max-w-2xl mb-4">
              Llena el formulario, genera el PDF y entrégale el comprobante de pago a tu trabajador.
              Sin Excel, sin registro, sin instalar nada.
            </p>

            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              {[
                "✅ 100% Gratis",
                "🔒 Sin registro",
                "💻 Sin instalar",
                "📄 PDF descargable",
              ].map((b) => (
                <span
                  key={b}
                  className="inline-flex items-center bg-[#E1F5EE] text-[#0F6E56] text-xs font-semibold px-3 py-1 rounded-full"
                >
                  {b}
                </span>
              ))}
            </div>
          </div>
        </header>

        {/* ── MAIN ────────────────────────────────────────────────────────── */}
        <main className="max-w-5xl mx-auto px-4 py-8">
          {/* Intro */}
          <p className="text-sm text-[#5F5E5A] bg-white border border-[#E1F5EE] rounded-xl p-4 mb-8 leading-relaxed">
            Tienes una empleada doméstica, un par de trabajadores en tu tienda o un negocio pequeño. Llega la quincena y necesitas entregar el desprendible… pero no tienes software de nómina y no quieres pelearte con un Excel. Esta herramienta te resuelve eso en menos de 3 minutos: calcula salud (4%), pensión (4%), auxilio de transporte y todo lo demás con los valores{" "}
            <strong>2025</strong>, y genera un PDF profesional listo para imprimir o enviar por WhatsApp.
          </p>

          {/* ── Formulario + Preview ─────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Columna izquierda */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-5">
              {/* Empleador */}
              <div>
                <h2 className="text-sm font-bold text-[#0F6E56] uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span className="w-5 h-5 bg-[#E1F5EE] rounded-full flex items-center justify-center text-xs">🏢</span>
                  Datos del empleador
                </h2>
                <div className="space-y-3">
                  <div>
                    <label className={labelCls}>Nombre empresa o persona natural *</label>
                    <input
                      type="text"
                      name="empleadorNombre"
                      value={form.empleadorNombre}
                      onChange={handleChange}
                      placeholder="Ej: Tienda La Esperanza / María López"
                      className={inputCls}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>NIT o Cédula</label>
                      <input
                        type="text"
                        name="empleadorNit"
                        value={form.empleadorNit}
                        onChange={handleChange}
                        placeholder="900.123.456-1"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Ciudad</label>
                      <input
                        type="text"
                        name="empleadorCiudad"
                        value={form.empleadorCiudad}
                        onChange={handleChange}
                        placeholder="Bogotá"
                        className={inputCls}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Trabajador */}
              <div>
                <h2 className="text-sm font-bold text-[#0F6E56] uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span className="w-5 h-5 bg-[#E1F5EE] rounded-full flex items-center justify-center text-xs">👤</span>
                  Datos del trabajador
                </h2>
                <div className="space-y-3">
                  <div>
                    <label className={labelCls}>Nombre completo *</label>
                    <input
                      type="text"
                      name="trabajadorNombre"
                      value={form.trabajadorNombre}
                      onChange={handleChange}
                      placeholder="Ej: Ana Sofía Martínez García"
                      className={inputCls}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Cédula</label>
                      <input
                        type="text"
                        name="trabajadorCedula"
                        value={form.trabajadorCedula}
                        onChange={handleChange}
                        placeholder="1.012.345.678"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Cargo</label>
                      <input
                        type="text"
                        name="trabajadorCargo"
                        value={form.trabajadorCargo}
                        onChange={handleChange}
                        placeholder="Empleada doméstica"
                        className={inputCls}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Período */}
              <div>
                <h2 className="text-sm font-bold text-[#0F6E56] uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span className="w-5 h-5 bg-[#E1F5EE] rounded-full flex items-center justify-center text-xs">📅</span>
                  Período de pago
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Tipo</label>
                    <select
                      name="periodotipo"
                      value={form.periodotipo}
                      onChange={handleChange}
                      className={inputCls}
                    >
                      <option value="mensual">Mensual</option>
                      <option value="quincena1">Primera quincena</option>
                      <option value="quincena2">Segunda quincena</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Mes y año</label>
                    <input
                      type="month"
                      name="periodoMes"
                      value={form.periodoMes}
                      onChange={handleChange}
                      className={inputCls}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Columna derecha */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-5">
              {/* Devengados */}
              <div>
                <h2 className="text-sm font-bold text-[#0F6E56] uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span className="w-5 h-5 bg-[#E1F5EE] rounded-full flex items-center justify-center text-xs">💰</span>
                  Devengados
                </h2>
                <div className="space-y-3">
                  <div>
                    <label className={labelCls}>Salario base mensual (COP) *</label>
                    <input
                      type="number"
                      name="salarioBase"
                      value={form.salarioBase}
                      onChange={handleChange}
                      placeholder="1.423.500"
                      min={0}
                      className={`${inputCls} text-base font-semibold`}
                    />
                    {num(form.salarioBase) > 0 && (
                      <p className="text-xs mt-1 text-[#5F5E5A]">
                        {calc.tieneAuxTransporte
                          ? "✅ Aplica auxilio de transporte $200.000"
                          : "ℹ️ No aplica auxilio de transporte (salario > 2 SMMLV)"}
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>H. extra diurnas</label>
                      <input
                        type="number"
                        name="hesDiurnas"
                        value={form.hesDiurnas}
                        onChange={handleChange}
                        placeholder="0"
                        min={0}
                        className={inputCls}
                      />
                      <p className="text-xs text-[#5F5E5A] mt-0.5">Recargo 25%</p>
                    </div>
                    <div>
                      <label className={labelCls}>H. extra nocturnas</label>
                      <input
                        type="number"
                        name="hesNocturnas"
                        value={form.hesNocturnas}
                        onChange={handleChange}
                        placeholder="0"
                        min={0}
                        className={inputCls}
                      />
                      <p className="text-xs text-[#5F5E5A] mt-0.5">Recargo 75%</p>
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Otro devengado (opcional)</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        name="otroDevNombre"
                        value={form.otroDevNombre}
                        onChange={handleChange}
                        placeholder="Nombre concepto"
                        className={inputCls}
                      />
                      <input
                        type="number"
                        name="otroDevValor"
                        value={form.otroDevValor}
                        onChange={handleChange}
                        placeholder="Valor COP"
                        min={0}
                        className={inputCls}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Deducciones */}
              <div>
                <h2 className="text-sm font-bold text-[#0F6E56] uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span className="w-5 h-5 bg-[#E1F5EE] rounded-full flex items-center justify-center text-xs">➖</span>
                  Deducciones adicionales
                </h2>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Anticipos</label>
                      <input
                        type="number"
                        name="anticipos"
                        value={form.anticipos}
                        onChange={handleChange}
                        placeholder="0"
                        min={0}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Libranza</label>
                      <input
                        type="number"
                        name="libranza"
                        value={form.libranza}
                        onChange={handleChange}
                        placeholder="0"
                        min={0}
                        className={inputCls}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Otra deducción (opcional)</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        name="otraDeducNombre"
                        value={form.otraDeducNombre}
                        onChange={handleChange}
                        placeholder="Nombre concepto"
                        className={inputCls}
                      />
                      <input
                        type="number"
                        name="otraDeducValor"
                        value={form.otraDeducValor}
                        onChange={handleChange}
                        placeholder="Valor COP"
                        min={0}
                        className={inputCls}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Preview en tiempo real ─────────────────────────────────────── */}
          {num(form.salarioBase) > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-[#E1F5EE] p-5 mb-8">
              <h2 className="text-base font-bold text-[#0F6E56] mb-4 flex items-center gap-2">
                <span>📊</span> Vista previa del desprendible
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Devengados */}
                <div>
                  <p className="text-xs font-bold text-[#5F5E5A] uppercase tracking-wider mb-2">
                    Devengados
                  </p>
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-gray-100">
                      <tr>
                        <td className="py-1.5 text-[#2C2C2A]">Salario base</td>
                        <td className="py-1.5 text-right font-medium">{formatCOP(num(form.salarioBase))}</td>
                      </tr>
                      {calc.tieneAuxTransporte && (
                        <tr>
                          <td className="py-1.5 text-[#2C2C2A]">Auxilio transporte</td>
                          <td className="py-1.5 text-right font-medium">{formatCOP(calc.auxTransporte)}</td>
                        </tr>
                      )}
                      {num(form.hesDiurnas) > 0 && (
                        <tr>
                          <td className="py-1.5 text-[#2C2C2A]">H. extra diurnas ({form.hesDiurnas}h)</td>
                          <td className="py-1.5 text-right font-medium">{formatCOP(calc.hesDiurnasValor)}</td>
                        </tr>
                      )}
                      {num(form.hesNocturnas) > 0 && (
                        <tr>
                          <td className="py-1.5 text-[#2C2C2A]">H. extra nocturnas ({form.hesNocturnas}h)</td>
                          <td className="py-1.5 text-right font-medium">{formatCOP(calc.hesNocturnasValor)}</td>
                        </tr>
                      )}
                      {form.otroDevNombre && num(form.otroDevValor) > 0 && (
                        <tr>
                          <td className="py-1.5 text-[#2C2C2A]">{form.otroDevNombre}</td>
                          <td className="py-1.5 text-right font-medium">{formatCOP(num(form.otroDevValor))}</td>
                        </tr>
                      )}
                      <tr className="border-t-2 border-[#1D9E75]">
                        <td className="py-2 font-bold text-[#0F6E56]">Total devengado</td>
                        <td className="py-2 text-right font-bold text-[#0F6E56]">{formatCOP(calc.totalDevengado)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Deducciones */}
                <div>
                  <p className="text-xs font-bold text-[#5F5E5A] uppercase tracking-wider mb-2">
                    Deducciones
                  </p>
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-gray-100">
                      <tr>
                        <td className="py-1.5 text-[#2C2C2A]">Salud (4%)</td>
                        <td className="py-1.5 text-right font-medium text-red-600">−{formatCOP(calc.deducSalud)}</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 text-[#2C2C2A]">Pensión (4%)</td>
                        <td className="py-1.5 text-right font-medium text-red-600">−{formatCOP(calc.deducPension)}</td>
                      </tr>
                      {calc.deducFondoSol > 0 && (
                        <tr>
                          <td className="py-1.5 text-[#2C2C2A]">Fondo solidaridad (1%)</td>
                          <td className="py-1.5 text-right font-medium text-red-600">−{formatCOP(calc.deducFondoSol)}</td>
                        </tr>
                      )}
                      {num(form.anticipos) > 0 && (
                        <tr>
                          <td className="py-1.5 text-[#2C2C2A]">Anticipos</td>
                          <td className="py-1.5 text-right font-medium text-red-600">−{formatCOP(num(form.anticipos))}</td>
                        </tr>
                      )}
                      {num(form.libranza) > 0 && (
                        <tr>
                          <td className="py-1.5 text-[#2C2C2A]">Libranza</td>
                          <td className="py-1.5 text-right font-medium text-red-600">−{formatCOP(num(form.libranza))}</td>
                        </tr>
                      )}
                      {form.otraDeducNombre && num(form.otraDeducValor) > 0 && (
                        <tr>
                          <td className="py-1.5 text-[#2C2C2A]">{form.otraDeducNombre}</td>
                          <td className="py-1.5 text-right font-medium text-red-600">−{formatCOP(num(form.otraDeducValor))}</td>
                        </tr>
                      )}
                      <tr className="border-t-2 border-red-300">
                        <td className="py-2 font-bold text-red-700">Total deducciones</td>
                        <td className="py-2 text-right font-bold text-red-700">−{formatCOP(calc.totalDeducciones)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Neto a pagar */}
              <div className="mt-5 bg-[#1D9E75] rounded-xl p-4 flex items-center justify-between">
                <span className="text-white font-bold text-base sm:text-lg">
                  💵 NETO A PAGAR
                </span>
                <span className="text-white font-extrabold text-xl sm:text-2xl">
                  {formatCOP(calc.netoAPagar)}
                </span>
              </div>

              {/* Info IBC */}
              <p className="text-xs text-[#5F5E5A] mt-3 bg-gray-50 rounded-lg p-3">
                <strong>IBC (base salud/pensión):</strong> {formatCOP(calc.ibc)} · 
                <strong> Valor hora:</strong> {formatCOP(Math.round(calc.valorHora))}
                {calc.deducFondoSol > 0 && (
                  <> · <strong>Fondo solidaridad:</strong> aplica (IBC &gt; 4 SMMLV)</>
                )}
              </p>
            </div>
          )}

          {/* ── Botón Descargar PDF ─────────────────────────────────────────── */}
          <div className="flex justify-center mb-12">
            <button
              onClick={generatePDF}
              disabled={!canGeneratePDF || generando || !jspdfLoaded}
              className={`
                inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-base shadow-lg transition-all
                ${canGeneratePDF && jspdfLoaded
                  ? "bg-[#1D9E75] hover:bg-[#0F6E56] text-white cursor-pointer active:scale-95 shadow-[#1D9E75]/30"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }
              `}
            >
              {generando ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Generando PDF...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Descargar Desprendible PDF
                </>
              )}
            </button>
          </div>
          {!canGeneratePDF && (
            <p className="text-center text-xs text-[#5F5E5A] -mt-10 mb-10">
              Ingresa el salario base y el nombre del trabajador para habilitar el PDF
            </p>
          )}
        </main>

        {/* ── CÓMO USAR ──────────────────────────────────────────────────── */}
        <section className="bg-white border-t border-gray-100 py-12">
          <div className="max-w-5xl mx-auto px-4">
            <h2 className="text-xl font-extrabold text-[#2C2C2A] mb-2">
              ¿Cómo usar el generador de desprendible de nómina?
            </h2>
            <p className="text-[#5F5E5A] text-sm mb-8">
              Cuatro pasos, menos de 3 minutos.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
              {[
                {
                  n: "1",
                  title: "Datos del empleador",
                  desc: "Escribe el nombre de tu empresa o tu nombre como persona natural, y tu NIT o cédula. Si tienes una empleada doméstica, pon tu nombre y cédula normal.",
                },
                {
                  n: "2",
                  title: "Datos del trabajador",
                  desc: "Nombre completo, cédula y cargo. Selecciona el período de pago (quincenal o mensual) y el mes correspondiente.",
                },
                {
                  n: "3",
                  title: "Salario y conceptos",
                  desc: "Ingresa el salario base. Si gana hasta $2.847.000, el sistema suma los $200.000 de auxilio de transporte automáticamente. Agrega horas extra si aplica.",
                },
                {
                  n: "4",
                  title: "Revisar y descargar PDF",
                  desc: "Revisa el resumen en pantalla con devengados, deducciones y neto. Si todo cuadra, descarga el PDF listo para entregar o enviar por WhatsApp.",
                },
              ].map((step) => (
                <div key={step.n} className="bg-[#E1F5EE] rounded-2xl p-5 relative">
                  <span className="absolute top-4 right-4 text-2xl font-extrabold text-[#1D9E75]/20">
                    {step.n}
                  </span>
                  <div className="w-8 h-8 bg-[#1D9E75] text-white rounded-full flex items-center justify-center font-bold text-sm mb-3">
                    {step.n}
                  </div>
                  <h3 className="font-bold text-[#0F6E56] text-sm mb-2">{step.title}</h3>
                  <p className="text-xs text-[#5F5E5A] leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>

            {/* Ejemplo numérico */}
            <div className="bg-[#E1F5EE] border border-[#1D9E75]/20 rounded-2xl p-5">
              <h3 className="font-bold text-[#0F6E56] mb-3 flex items-center gap-2">
                <span>🔢</span> Ejemplo con salario mínimo 2025
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div className="bg-white rounded-xl p-4">
                  <p className="text-xs text-[#5F5E5A] font-semibold uppercase mb-2">Devengado</p>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>Salario mínimo</span>
                      <span className="font-medium">$1.423.500</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Aux. transporte</span>
                      <span className="font-medium">$200.000</span>
                    </div>
                    <div className="flex justify-between font-bold border-t pt-1 text-[#0F6E56]">
                      <span>Total devengado</span>
                      <span>$1.623.500</span>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-4">
                  <p className="text-xs text-[#5F5E5A] font-semibold uppercase mb-2">Deducciones</p>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>Salud (4%)</span>
                      <span className="font-medium text-red-600">−$56.940</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pensión (4%)</span>
                      <span className="font-medium text-red-600">−$56.940</span>
                    </div>
                    <div className="flex justify-between font-bold border-t pt-1 text-red-700">
                      <span>Total deducciones</span>
                      <span>−$113.880</span>
                    </div>
                  </div>
                </div>
                <div className="bg-[#1D9E75] rounded-xl p-4 flex flex-col justify-center">
                  <p className="text-white/80 text-xs font-semibold uppercase mb-1">Neto a pagar</p>
                  <p className="text-white text-xl font-extrabold">$1.509.620</p>
                  <p className="text-white/70 text-xs mt-1">$1.623.500 − $113.880</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── CONTENIDO SEO ──────────────────────────────────────────────── */}
        <section
          className="max-w-5xl mx-auto px-4 py-12 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-[#2C2C2A] [&_h2]:mt-8 [&_h2]:mb-3 [&_p]:text-[#5F5E5A] [&_p]:text-sm [&_p]:leading-relaxed [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-2 [&_li]:text-sm [&_li]:text-[#5F5E5A] [&_strong]:text-[#2C2C2A]"
        >
          <h2>¿Qué es un desprendible de nómina y por qué debes entregarlo?</h2>
          <p>
            El desprendible de nómina —también le dicen comprobante de pago, colilla de pago o "el papelito del sueldo"— es el documento donde le detallas a tu trabajador cuánto ganó, cuánto le descontaron y cuánto recibe neto. No es un capricho: el Código Sustantivo del Trabajo en Colombia establece que el empleador debe informar al trabajador sobre los conceptos de su pago.
          </p>
          <p>
            Además, el artículo 32 de la Ley 1393 de 2010 exige que se pueda verificar la información sobre aportes a seguridad social. Sin desprendible, tu trabajador no tiene cómo comprobar que le están pagando salud y pensión correctamente. Y tú como empleador quedas expuesto ante una posible demanda laboral.
          </p>
          <p>
            ¿Lo más común que pasa? Que el empleador pequeño —el dueño de la tienda, la señora que tiene una empleada interna, el restaurante con 4 meseros— simplemente le transfiere la plata al trabajador y ya. Sin papeles. Eso funciona hasta que no funciona: cuando el trabajador va a pedir un crédito y le piden soporte de ingresos, o cuando hay una inspección del Ministerio de Trabajo.
          </p>

          <h2>¿Por qué este generador y no una plantilla de Excel?</h2>
          <p>
            Si buscas "formato desprendible de nómina gratis" en Google, te van a salir 10 páginas ofreciéndote descargar un archivo de Excel o Word. Los publican Actualícese, Gerencie, blogs de contadores… y están bien, no son malos. Pero tienen un problema real: necesitas tener Excel instalado, saber usarlo, ajustar las fórmulas si algo cambió (como el SMMLV que sube cada enero), y luego convertirlo a PDF para imprimirlo bonito.
          </p>
          <p>
            Este generador hace todo eso por ti directamente en el navegador. No descargas ningún archivo previo. No necesitas Excel ni Word ni Google Sheets. Llenas un formulario, revisas los números y descargas el PDF final. Punto.
          </p>
          <p>
            Y ojo con algo importante: las fórmulas ya están actualizadas con los valores 2025. El SMMLV de $1.423.500, el auxilio de transporte de $200.000, los porcentajes de salud y pensión. No tienes que verificar si la plantilla de turno está actualizada o si usa los datos del año pasado.
          </p>

          <h2>¿Qué calcula automáticamente esta herramienta?</h2>
          <p>Todo lo que normalmente te toca hacer a mano o con calculadora:</p>
          <ul>
            <li>
              <strong>Auxilio de transporte:</strong> $200.000 mensuales si el salario base es igual o menor a $2.847.000 (2 veces el SMMLV 2025). Se suma al total devengado pero NO se incluye en la base para calcular salud y pensión.
            </li>
            <li>
              <strong>Salud empleado:</strong> 4% del Ingreso Base de Cotización (IBC), que es el salario base sin auxilio de transporte.
            </li>
            <li>
              <strong>Pensión empleado:</strong> 4% del IBC.
            </li>
            <li>
              <strong>Fondo de solidaridad pensional:</strong> 1% adicional si el IBC supera los $5.694.000 (4 SMMLV). Esto aplica para salarios altos, no para el mínimo.
            </li>
            <li>
              <strong>Total devengado:</strong> salario base + auxilio de transporte + horas extra + otros ingresos adicionales que hayas registrado.
            </li>
            <li>
              <strong>Total deducciones:</strong> salud + pensión + fondo de solidaridad (si aplica) + anticipos + libranzas + cualquier otra deducción.
            </li>
            <li>
              <strong>Neto a pagar:</strong> total devengado menos total deducciones. El número que realmente le llega al trabajador.
            </li>
          </ul>

          <h2>Desprendible de nómina para empleada de servicio doméstico</h2>
          <p>
            Este es uno de los casos más comunes y donde más dudas hay. En Colombia hay más de 600.000 trabajadoras domésticas formalizadas, y miles de empleadores que no saben cómo hacerles el desprendible porque "solo es una persona, no tengo empresa".
          </p>
          <p>
            La buena noticia: no necesitas ser empresa. Si empleas a alguien en tu casa —sea empleada interna, externa, por días (si trabaja más de un día a la semana con el mismo empleador)— estás obligado a pagar seguridad social y tienes la responsabilidad de informarle cuánto le pagas y cuánto le descuentas.
          </p>
          <p>
            Con esta herramienta, en el campo de "empleador" pones tu nombre y tu cédula. En "cargo" escribes lo que aplique: empleada doméstica, auxiliar de servicios generales, niñera, entre otros.
            El generador hace los mismos cálculos que para cualquier otro trabajador y el PDF queda igual de profesional.
          </p>
        </section>

        {/* ── FAQ ─────────────────────────────────────────────────────────── */}
        <section className="bg-white border-t border-gray-100 py-12">
          <div className="max-w-3xl mx-auto px-4">
            <h2 className="text-xl font-extrabold text-[#2C2C2A] mb-8">
              Preguntas frecuentes
            </h2>
            <div className="space-y-3">
              {faqs.map((faq, i) => (
                <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between px-5 py-4 text-left text-sm font-semibold text-[#2C2C2A] hover:bg-gray-50 transition"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    aria-expanded={openFaq === i}
                  >
                    <span>{faq.q}</span>
                    <span className={`ml-3 text-[#1D9E75] transition-transform ${openFaq === i ? "rotate-45" : ""}`}>+</span>
                  </button>
                  {openFaq === i && (
                    <div className="px-5 pb-4 text-sm text-[#5F5E5A] leading-relaxed border-t border-gray-100">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── HERRAMIENTAS RELACIONADAS ───────────────────────────────────── */}
        <section className="bg-gray-50 border-t border-gray-100 py-12">
          <div className="max-w-5xl mx-auto px-4">
            <h2 className="text-lg font-extrabold text-[#2C2C2A] mb-6">
              Herramientas laborales relacionadas
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  href: "https://calcutools.online/calculadora-liquidacion-laboral-colombia",
                  title: "Calculadora de liquidación laboral",
                  desc: "Calcula cesantías, primas, vacaciones e indemnización según el CST.",
                },
                {
                  href: "https://calcutools.online/generador-cuenta-de-cobro-colombia",
                  title: "Generador de cuenta de cobro",
                  desc: "Crea tu cuenta de cobro en PDF gratis. Ideal para contratistas y freelancers.",
                },
                {
                  href: "https://calcutools.online/visualizador-factura-electronica-xml-dian",
                  title: "Visor de factura electrónica DIAN",
                  desc: "Lee y visualiza tu factura XML de la DIAN sin software especial.",
                },
              ].map((tool) => (
                <a
                  key={tool.href}
                  href={tool.href}
                  className="bg-white rounded-2xl p-5 border border-gray-200 hover:border-[#1D9E75] hover:shadow-sm transition block"
                >
                  <p className="font-semibold text-sm text-[#2C2C2A] mb-1">{tool.title}</p>
                  <p className="text-xs text-[#5F5E5A] leading-relaxed">{tool.desc}</p>
                </a>
              ))}
            </div>
          </div>
        </section>

      </div>
    </>
  );
}