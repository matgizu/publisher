"use client";

import { useState, useEffect, useRef } from "react";

// ── helpers ──────────────────────────────────────────────────────────────────

function getTodayString() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatCOP(n: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(n);
}

function formatDateEs(dateStr: string) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  const meses = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
  return `${parseInt(d)} de ${meses[parseInt(m) - 1]} de ${y}`;
}

const unidades = ["","uno","dos","tres","cuatro","cinco","seis","siete","ocho","nueve","diez","once","doce","trece","catorce","quince","dieciséis","diecisiete","dieciocho","diecinueve","veinte","veintiún","veintidós","veintitrés","veinticuatro","veinticinco","veintiséis","veintisiete","veintiocho","veintinueve"];
const decenas = ["","","veinte","treinta","cuarenta","cincuenta","sesenta","setenta","ochenta","noventa"];
const centenas = ["","ciento","doscientos","trescientos","cuatrocientos","quinientos","seiscientos","setecientos","ochocientos","novecientos"];

function numToWords(n: number): string {
  if (n === 0) return "cero";
  if (n < 0) return "menos " + numToWords(-n);
  if (n < 30) return unidades[n];
  if (n < 100) {
    const d = Math.floor(n / 10);
    const u = n % 10;
    return u === 0 ? decenas[d] : decenas[d] + " y " + unidades[u];
  }
  if (n === 100) return "cien";
  if (n < 1000) {
    const c = Math.floor(n / 100);
    const rest = n % 100;
    return rest === 0 ? centenas[c] : centenas[c] + " " + numToWords(rest);
  }
  if (n < 2000) {
    const rest = n % 1000;
    return rest === 0 ? "mil" : "mil " + numToWords(rest);
  }
  if (n < 1000000) {
    const miles = Math.floor(n / 1000);
    const rest = n % 1000;
    return numToWords(miles) + " mil" + (rest === 0 ? "" : " " + numToWords(rest));
  }
  if (n < 2000000) {
    const rest = n % 1000000;
    return "un millón" + (rest === 0 ? "" : " " + numToWords(rest));
  }
  if (n < 1000000000) {
    const mills = Math.floor(n / 1000000);
    const rest = n % 1000000;
    return numToWords(mills) + " millones" + (rest === 0 ? "" : " " + numToWords(rest));
  }
  const bills = Math.floor(n / 1000000000);
  const rest = n % 1000000000;
  return numToWords(bills) + " mil millones" + (rest === 0 ? "" : " " + numToWords(rest));
}

function valorEnLetras(n: number): string {
  if (!n || n <= 0) return "";
  return numToWords(n).toUpperCase() + " PESOS M/CTE";
}

// ── tipos ─────────────────────────────────────────────────────────────────────

interface FormData {
  ciudad: string;
  fecha: string;
  numeroCuenta: string;
  nombreContratante: string;
  nitContratante: string;
  nombreContratista: string;
  cedulaContratista: string;
  descripcion: string;
  valorTotal: string;
  tipoRetencion: string;
  esDeclarante: string;
  banco: string;
  tipoCuenta: string;
  numeroCuentaBancaria: string;
}

interface RetencionInfo {
  tipo: string;
  tasa: number;
  valor: number;
  neto: number;
}

// ── componente principal ──────────────────────────────────────────────────────

export default function GeneradorCuentaCobro() {
  const [form, setForm] = useState<FormData>({
    ciudad: "Bogotá",
    fecha: getTodayString(),
    numeroCuenta: "001",
    nombreContratante: "",
    nitContratante: "",
    nombreContratista: "",
    cedulaContratista: "",
    descripcion: "",
    valorTotal: "",
    tipoRetencion: "honorarios",
    esDeclarante: "si",
    banco: "Bancolombia",
    tipoCuenta: "Ahorros",
    numeroCuentaBancaria: "",
  });

  const [showPreview, setShowPreview] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [jspdfLoaded, setJspdfLoaded] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && !(window as any).jspdf) {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
      script.onload = () => setJspdfLoaded(true);
      document.head.appendChild(script);
    } else {
      setJspdfLoaded(true);
    }
  }, []);

  const valor = parseFloat(form.valorTotal) || 0;

  function calcRetencion(): RetencionInfo {
    const declarante = form.esDeclarante === "si";
    let tasa = 0;
    if (form.tipoRetencion === "honorarios") tasa = declarante ? 10 : 11;
    else if (form.tipoRetencion === "servicios") tasa = declarante ? 4 : 6;
    else if (form.tipoRetencion === "arrendamiento_muebles") tasa = declarante ? 4 : 3.5;
    else if (form.tipoRetencion === "arrendamiento_inmuebles") tasa = 3.5;
    else if (form.tipoRetencion === "compras") tasa = 2.5;
    else tasa = 0;
    const retencionValor = valor >= 160000 ? Math.round(valor * tasa / 100) : 0;
    return { tipo: form.tipoRetencion, tasa, valor: retencionValor, neto: valor - retencionValor };
  }

  const retencion = calcRetencion();

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  function handleGenerar(e: React.FormEvent) {
    e.preventDefault();
    setShowPreview(true);
    setTimeout(() => previewRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }

  const declaracionLegal = "Bajo la gravedad de juramento manifiesto que NO estoy obligado a facturar electrónicamente según el Art. 7 del Decreto 19 de 2012. Certifico que no soy responsable del IVA. Autorizo practicar retención en la fuente si aplica según Art. 383 del Estatuto Tributario.";

  function handleDescargarPDF() {
    if (!(window as any).jspdf && !jspdfLoaded) {
      alert("Cargando librería PDF, intenta de nuevo en un momento.");
      return;
    }
    const { jsPDF } = (window as any).jspdf;
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    const primary = [29, 158, 117];
    const dark = [15, 110, 86];
    const textColor = [44, 44, 42];
    const lightBg = [225, 245, 238];

    // Header background
    doc.setFillColor(...(primary as [number,number,number]));
    doc.rect(0, 0, 210, 35, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("CUENTA DE COBRO", 105, 14, { align: "center" });
    doc.setFontSize(13);
    doc.text(`N° ${form.numeroCuenta.padStart(3, "0")}`, 105, 22, { align: "center" });
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`${form.ciudad}, ${formatDateEs(form.fecha)}`, 105, 30, { align: "center" });

    // Section helper
    let y = 42;
    function addSection(title: string, lines: string[][]) {
      doc.setFillColor(...(lightBg as [number,number,number]));
      doc.rect(14, y - 4, 182, 7, "F");
      doc.setTextColor(...(dark as [number,number,number]));
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text(title.toUpperCase(), 16, y);
      y += 6;
      doc.setTextColor(...(textColor as [number,number,number]));
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      lines.forEach(([label, val]) => {
        doc.setFont("helvetica", "bold");
        doc.text(label + ":", 16, y);
        doc.setFont("helvetica", "normal");
        doc.text(val || "—", 60, y);
        y += 6;
      });
      y += 3;
    }

    addSection("Contratante (quien paga)", [
      ["Nombre / Razón social", form.nombreContratante],
      ["NIT / CC", form.nitContratante],
    ]);

    addSection("Contratista (quien cobra)", [
      ["Nombre completo", form.nombreContratista],
      ["Cédula de ciudadanía", form.cedulaContratista],
    ]);

    addSection("Concepto del servicio", [
      ["Descripción", ""],
    ]);
    // Multi-line description
    const descLines = doc.splitTextToSize(form.descripcion || "—", 160);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(descLines, 16, y - 3);
    y += descLines.length * 5 + 2;

    // Valores
    doc.setFillColor(...(lightBg as [number,number,number]));
    doc.rect(14, y - 4, 182, 7, "F");
    doc.setTextColor(...(dark as [number,number,number]));
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("VALOR", 16, y);
    y += 6;

    doc.setTextColor(...(textColor as [number,number,number]));
    doc.setFont("helvetica", "normal");
    doc.text("Valor bruto:", 16, y);
    doc.setFont("helvetica", "bold");
    doc.text(formatCOP(valor), 60, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.text("Valor en letras:", 16, y);
    const letrasLines = doc.splitTextToSize(valorEnLetras(valor), 130);
    doc.text(letrasLines, 60, y);
    y += letrasLines.length * 5 + 2;

    if (valor >= 160000 && retencion.tasa > 0) {
      doc.text(`Retención en la fuente (${retencion.tasa}% ${form.tipoRetencion}):`, 16, y);
      doc.setTextColor(180, 0, 0);
      doc.text(`- ${formatCOP(retencion.valor)}`, 110, y);
      doc.setTextColor(...(textColor as [number,number,number]));
      y += 6;
      doc.setFont("helvetica", "bold");
      doc.text("Valor neto a pagar:", 16, y);
      doc.setFillColor(...(primary as [number,number,number]));
      doc.setTextColor(255, 255, 255);
      doc.rect(55, y - 4, 40, 7, "F");
      doc.text(formatCOP(retencion.neto), 75, y, { align: "center" });
      doc.setTextColor(...(textColor as [number,number,number]));
      y += 8;
    } else {
      doc.setFont("helvetica", "bold");
      doc.text("Valor total a pagar:", 16, y);
      doc.setFillColor(...(primary as [number,number,number]));
      doc.setTextColor(255, 255, 255);
      doc.rect(55, y - 4, 40, 7, "F");
      doc.text(formatCOP(valor), 75, y, { align: "center" });
      doc.setTextColor(...(textColor as [number,number,number]));
      y += 8;
    }

    y += 2;
    addSection("Datos bancarios para pago", [
      ["Banco", form.banco],
      ["Tipo de cuenta", form.tipoCuenta],
      ["Número de cuenta", form.numeroCuentaBancaria],
    ]);

    // Declaración legal
    y += 2;
    doc.setFillColor(255, 248, 220);
    const declLines = doc.splitTextToSize(declaracionLegal, 176);
    doc.rect(14, y - 4, 182, declLines.length * 5 + 8, "F");
    doc.setTextColor(100, 70, 0);
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.text(declLines, 16, y);
    y += declLines.length * 5 + 8;

    // Firma
    y += 6;
    doc.setDrawColor(...(primary as [number,number,number]));
    doc.setLineWidth(0.5);
    doc.line(14, y, 90, y);
    doc.setTextColor(...(textColor as [number,number,number]));
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(form.nombreContratista || "Firma del contratista", 52, y + 5, { align: "center" });
    doc.text(`C.C. ${form.cedulaContratista}`, 52, y + 10, { align: "center" });

    // Footer
    doc.setFillColor(...(primary as [number,number,number]));
    doc.rect(0, 285, 210, 12, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.text("Generado en calcutools.online — Herramienta gratuita para independientes en Colombia", 105, 292, { align: "center" });

    doc.save(`cuenta-cobro-${form.numeroCuenta.padStart(3,"0")}-${form.nombreContratista.replace(/\s+/g,"-")}.pdf`);
  }

  function handleWhatsApp() {
    const descCorta = form.descripcion.length > 60 ? form.descripcion.substring(0, 60) + "..." : form.descripcion;
    const msg = `Hola, adjunto mi cuenta de cobro #${form.numeroCuenta} por ${formatCOP(valor)} – ${descCorta}. Quedo atento al pago. ${form.nombreContratista}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  }

  const faqData = [
    {
      q: "¿La cuenta de cobro reemplaza la factura electrónica?",
      a: "No, son documentos diferentes con propósitos distintos. La cuenta de cobro es para personas naturales no responsables de IVA que prestan servicios bajo contrato de prestación de servicios. La factura electrónica es obligatoria para responsables de IVA y requiere autorización de la DIAN con resolución de numeración. Si cumples los requisitos para no ser responsable de IVA (Art. 437 ET) —ingresos brutos anuales menores a 3.500 UVT, entre otros—, la cuenta de cobro es tu documento válido. No necesitas factura electrónica. Pero si ya eres responsable de IVA, la cuenta de cobro no reemplaza tu obligación de facturar electrónicamente."
    },
    {
      q: "¿Cuánto es la retención en la fuente en una cuenta de cobro?",
      a: "Depende del tipo de pago y de si eres declarante de renta. Para honorarios: 10% si eres declarante, 11% si no lo eres. Para servicios en general: 4% declarantes, 6% no declarantes. Para arrendamientos de bienes inmuebles: 3.5% en ambos casos. Estas tarifas están en el Art. 383 y Art. 392 del Estatuto Tributario. Importante: si el valor de tu cuenta de cobro es inferior a la base mínima de retención (aproximadamente 4 UVT, unos $160.000 en 2026 para honorarios y servicios), la empresa no te practica retención y te paga el valor completo."
    },
    {
      q: "¿Debo cobrar IVA en mi cuenta de cobro?",
      a: "En la mayoría de casos, no. La cuenta de cobro la usan personas naturales no responsables de IVA, por lo que no deben liquidar ni cobrar este impuesto. Si perteneces al grupo de no responsables de IVA según el Art. 437 del Estatuto Tributario (ingresos brutos anuales inferiores a 3.500 UVT, un solo establecimiento de comercio, no ser usuario aduanero, entre otros requisitos), no cobras IVA. Si ya superaste los topes y eres responsable de IVA, entonces debes emitir factura electrónica con IVA del 19%, no cuenta de cobro."
    },
    {
      q: "¿Qué pasa si la empresa no me descuenta retención?",
      a: "Si la empresa estaba obligada a practicarte retención y no lo hizo, el problema es de ella, no tuyo. La empresa como agente de retención es solidariamente responsable ante la DIAN por el impuesto no retenido (Art. 370 ET). Dicho esto, si tu pago es inferior a la base mínima de retención (aproximadamente $160.000 para honorarios y servicios en 2026), la empresa no está obligada a retener. Además, tú sigues obligado a declarar ese ingreso en tu declaración de renta si superas los topes, independientemente de si te retuvieron o no."
    },
    {
      q: "¿La cuenta de cobro sirve para declarar renta?",
      a: "Sí, absolutamente. La cuenta de cobro es un soporte válido de tus ingresos como independiente. Al momento de preparar tu declaración de renta, tus cuentas de cobro —junto con los certificados de retención que te expide la empresa pagadora— son la base para reportar tus ingresos brutos. La DIAN cruza información: lo que la empresa reporta como pago a terceros debe coincidir con lo que tú declaras como ingreso. Por eso es fundamental guardar copia de todas tus cuentas de cobro organizadas por año fiscal con su respectivo consecutivo."
    },
    {
      q: "¿Cuál es la diferencia entre honorarios y servicios?",
      a: "Los honorarios corresponden a pagos por servicios que requieren conocimiento técnico, científico o profesional especializado: abogados, médicos, ingenieros, contadores, consultores, diseñadores profesionales. La retención es 10% para declarantes. Los servicios en general son actividades que no exigen ese nivel de especialización: mantenimiento, aseo, transporte, vigilancia, logística. La retención baja al 4% para declarantes. La clasificación depende de la naturaleza del servicio, no del título profesional. En la práctica, revisa cómo está redactado tu contrato de prestación de servicios, porque el concepto ahí definido es lo que usa contabilidad."
    },
    {
      q: "¿Necesito RUT para hacer una cuenta de cobro?",
      a: "Sí. Aunque la cuenta de cobro como tal no exige una casilla de RUT, las empresas te lo van a pedir como requisito para crearte como proveedor en su sistema contable y poder girarte el pago. El RUT (Registro Único Tributario) es tu identificación ante la DIAN y contiene tu actividad económica, tu régimen tributario y tus responsabilidades fiscales. Lo puedes obtener gratis en cualquier punto de atención de la DIAN o por la plataforma MUISCA (muisca.dian.gov.co). Tenlo actualizado, especialmente la actividad económica y la dirección."
    },
    {
      q: "¿Cuánto tiempo debo guardar mis cuentas de cobro?",
      a: "Mínimo cinco años contados desde el 1 de enero del año siguiente al de la emisión, según el Art. 632 del Estatuto Tributario y las normas generales de conservación de documentos contables. Este plazo coincide con el término de firmeza de la declaración de renta. Si la DIAN te requiere información, necesitas mostrar esos soportes. Lo recomendable es guardarlos en formato digital (PDF) organizados por año y con un respaldo en la nube. Si tu cuenta de cobro está relacionada con un contrato que tiene garantías o cláusulas de vigencia extendida, guárdala hasta que venzan todas las obligaciones."
    },
  ];

  const schemaWebApp = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Generador de Cuenta de Cobro Colombia",
    "url": "https://calcutools.online/generador-cuenta-de-cobro-colombia",
    "description": "Genera tu cuenta de cobro en PDF gratis con retención en la fuente calculada (Art. 383 ET). Campos legales, vista previa y descarga sin registro. Colombia 2026.",
    "applicationCategory": "FinanceApplication",
    "operatingSystem": "All",
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "COP" },
    "inLanguage": "es-CO"
  };

  const schemaFAQ = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqData.map(f => ({
      "@type": "Question",
      "name": f.q,
      "acceptedAnswer": { "@type": "Answer", "text": f.a }
    }))
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaWebApp) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaFAQ) }} />

      <div className="min-h-screen bg-gray-50" style={{ color: "#2C2C2A" }}>

        {/* ── HEADER ── */}
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <nav className="text-xs text-gray-500 mb-2">
              <a href="/" className="hover:underline" style={{ color: "#1D9E75" }}>calcutools.online</a>
              <span className="mx-1">/</span>
              <span>Generador Cuenta de Cobro</span>
            </nav>
            <h1 className="text-2xl md:text-3xl font-bold leading-tight" style={{ color: "#0F6E56" }}>
              Generador de Cuenta de Cobro Colombia: Crea tu PDF Profesional con Retención en la Fuente
            </h1>
            <p className="mt-2 text-sm md:text-base text-gray-600">
              Llena el formulario, revisa la vista previa en tiempo real y descarga tu cuenta de cobro en PDF con todos los campos legales. Sin registro, sin servidor, 100% gratis.
            </p>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-6">

          {/* ── INTRO ── */}
          <section className="mb-8 p-5 rounded-xl border-l-4 bg-white shadow-sm" style={{ borderColor: "#1D9E75" }}>
            <p className="text-sm md:text-base leading-relaxed text-gray-700">
              Terminaste el proyecto de diseño el viernes, mandaste un correo pidiendo el pago y la respuesta fue: «Necesitamos la cuenta de cobro con todos los datos para pasarla a contabilidad». Ahí empezó el problema. ¿Qué campos van? ¿Le pongo retención o no? ¿Honorarios o servicios? Si eres freelancer, consultor, fotógrafo, profe particular o abogado independiente en Colombia, esta situación te resulta familiar. Nuestro <strong>generador de cuenta de cobro</strong> te resuelve eso en menos de tres minutos: llenas los datos, ves la vista previa al instante y descargas un PDF profesional con la retención en la fuente ya calculada según el Art. 383 del Estatuto Tributario. Sin registro, sin subir nada a ningún servidor. Todo se procesa en tu navegador.
            </p>
          </section>

          {/* ── WIDGET PRINCIPAL ── */}
          <section className="bg-white rounded-2xl shadow-md overflow-hidden mb-10">
            <div className="px-5 py-4 text-white font-bold text-lg" style={{ background: "#1D9E75" }}>
              📄 Generador de Cuenta de Cobro
            </div>

            <form onSubmit={handleGenerar} className="p-5 space-y-6">

              {/* Fila 1: ciudad + fecha */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1" style={{ color: "#0F6E56" }}>Ciudad</label>
                  <input
                    type="text"
                    name="ciudad"
                    value={form.ciudad}
                    onChange={handleChange}
                    placeholder="Bogotá"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
                    style={{ focusRingColor: "#1D9E75" }}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1" style={{ color: "#0F6E56" }}>Fecha</label>
                  <input
                    type="date"
                    name="fecha"
                    value={form.fecha}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
                    required
                  />
                </div>
              </div>

              {/* Número de cuenta */}
              <div>
                <label className="block text-sm font-semibold mb-1" style={{ color: "#0F6E56" }}>Número de cuenta de cobro (consecutivo)</label>
                <input
                  type="number"
                  name="numeroCuenta"
                  value={form.numeroCuenta}
                  onChange={handleChange}
                  min="1"
                  className="w-full md:w-40 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
                  required
                />
              </div>

              {/* Contratante */}
              <div className="p-4 rounded-xl" style={{ background: "#E1F5EE" }}>
                <p className="text-sm font-bold mb-3" style={{ color: "#0F6E56" }}>🏢 Datos del Contratante (quien paga)</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-gray-600">Nombre o Razón Social</label>
                    <input
                      type="text"
                      name="nombreContratante"
                      value={form.nombreContratante}
                      onChange={handleChange}
                      placeholder="Empresa S.A.S."
                      className="w-full border border-gray-300 bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-gray-600">NIT o CC</label>
                    <input
                      type="text"
                      name="nitContratante"
                      value={form.nitContratante}
                      onChange={handleChange}
                      placeholder="900.123.456-7"
                      className="w-full border border-gray-300 bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Contratista */}
              <div className="p-4 rounded-xl border border-gray-200">
                <p className="text-sm font-bold mb-3" style={{ color: "#0F6E56" }}>👤 Tus datos como Contratista (quien cobra)</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-gray-600">Nombre completo</label>
                    <input
                      type="text"
                      name="nombreContratista"
                      value={form.nombreContratista}
                      onChange={handleChange}
                      placeholder="Tu nombre completo"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-gray-600">Cédula de ciudadanía</label>
                    <input
                      type="text"
                      name="cedulaContratista"
                      value={form.cedulaContratista}
                      onChange={handleChange}
                      placeholder="1.234.567.890"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-semibold mb-1" style={{ color: "#0F6E56" }}>Descripción del servicio prestado</label>
                <textarea
                  name="descripcion"
                  value={form.descripcion}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Ej: Diseño de identidad visual para la marca XYZ, incluyendo logo, paleta de colores y manual de marca. Periodo: 1 al 31 de marzo de 2026."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 resize-none"
                  required
                />
              </div>

              {/* Valor */}
              <div>
                <label className="block text-sm font-semibold mb-1" style={{ color: "#0F6E56" }}>Valor total en COP</label>
                <input
                  type="number"
                  name="valorTotal"
                  value={form.valorTotal}
                  onChange={handleChange}
                  placeholder="3500000"
                  min="0"
                  className="w-full md:w-72 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
                  required
                />
                {valor > 0 && (
                  <p className="mt-2 text-xs font-semibold" style={{ color: "#1D9E75" }}>
                    En letras: {valorEnLetras(valor)}
                  </p>
                )}
              </div>

              {/* TABLA RETENCIÓN */}
              {valor > 0 && (
                <div className="rounded-xl overflow-hidden border border-gray-200">
                  <div className="px-4 py-2 text-sm font-bold text-white" style={{ background: "#0F6E56" }}>
                    🧾 Retención en la Fuente — Art. 383 ET
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold mb-1 text-gray-600">Tipo de pago</label>
                        <select
                          name="tipoRetencion"
                          value={form.tipoRetencion}
                          onChange={handleChange}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
                        >
                          <option value="honorarios">Honorarios (profesionales especializados)</option>
                          <option value="servicios">Servicios en general</option>
                          <option value="arrendamiento_muebles">Arrendamiento bienes muebles</option>
                          <option value="arrendamiento_inmuebles">Arrendamiento bienes inmuebles</option>
                          <option value="compras">Compras en general</option>
                          <option value="ninguno">Sin retención</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold mb-1 text-gray-600">¿Eres declarante de renta?</label>
                        <select
                          name="esDeclarante"
                          value={form.esDeclarante}
                          onChange={handleChange}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
                        >
                          <option value="si">Sí, soy declarante de renta</option>
                          <option value="no">No soy declarante de renta</option>
                        </select>
                      </div>
                    </div>

                    {valor < 160000 ? (
                      <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200 text-xs text-yellow-800">
                        ⚠️ El valor es inferior a $160.000 (≈4 UVT). <strong>No aplica retención en la fuente.</strong> Te pagan el valor completo.
                      </div>
                    ) : form.tipoRetencion === "ninguno" ? (
                      <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 text-xs text-gray-600">
                        Sin retención seleccionada. Valor neto a pagar: <strong>{formatCOP(valor)}</strong>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-3">
                        <div className="p-3 rounded-lg text-center" style={{ background: "#E1F5EE" }}>
                          <p className="text-xs text-gray-500 mb-1">Tasa retención</p>
                          <p className="text-xl font-bold" style={{ color: "#0F6E56" }}>{retencion.tasa}%</p>
                        </div>
                        <div className="p-3 rounded-lg text-center bg-red-50">
                          <p className="text-xs text-gray-500 mb-1">Retención</p>
                          <p className="text-base font-bold text-red-600">-{formatCOP(retencion.valor)}</p>
                        </div>
                        <div className="p-3 rounded-lg text-center text-white" style={{ background: "#1D9E75" }}>
                          <p className="text-xs mb-1 opacity-80">Neto a recibir</p>
                          <p className="text-base font-bold">{formatCOP(retencion.neto)}</p>
                        </div>
                      </div>
                    )}
                    <p className="text-xs text-gray-400 italic">
                      Solo aplica si el pago supera $160.000 y la empresa es agente retenedor. Tasas 2026 según Art. 383 y 392 del ET.
                    </p>
                  </div>
                </div>
              )}

              {/* Datos bancarios */}
              <div className="p-4 rounded-xl" style={{ background: "#E1F5EE" }}>
                <p className="text-sm font-bold mb-3" style={{ color: "#0F6E56" }}>🏦 Datos Bancarios para el Pago</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-gray-600">Banco</label>
                    <select
                      name="banco"
                      value={form.banco}
                      onChange={handleChange}
                      className="w-full border border-gray-300 bg-white rounded-lg px-3 py-2 text-sm focus:outline-none"
                    >
                      <option>Bancolombia</option>
                      <option>Davivienda</option>
                      <option>BBVA</option>
                      <option>Nequi</option>
                      <option>Banco de Bogotá</option>
                      <option>Banco Popular</option>
                      <option>Banco AV Villas</option>
                      <option>Scotiabank Colpatria</option>
                      <option>Otro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-gray-600">Tipo de cuenta</label>
                    <select
                      name="tipoCuenta"
                      value={form.tipoCuenta}
                      onChange={handleChange}
                      className="w-full border border-gray-300 bg-white rounded-lg px-3 py-2 text-sm focus:outline-none"
                    >
                      <option>Ahorros</option>
                      <option>Corriente</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-gray-600">Número de cuenta</label>
                    <input
                      type="text"
                      name="numeroCuentaBancaria"
                      value={form.numeroCuentaBancaria}
                      onChange={handleChange}
                      placeholder="000-123456789"
                      className="w-full border border-gray-300 bg-white rounded-lg px-3 py-2 text-sm focus:outline-none"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Botón generar */}
              <button
                type="submit"
                className="w-full py-3 rounded-xl text-white font-bold text-base transition-all hover:opacity-90 active:scale-95 shadow-md"
                style={{ background: "#1D9E75" }}
              >
                👁️ Generar Vista Previa y Cuenta de Cobro
              </button>
            </form>
          </section>

          {/* ── VISTA PREVIA ── */}
          {showPreview && (
            <section ref={previewRef} className="mb-10">
              <h2 className="text-xl font-bold mb-4" style={{ color: "#0F6E56" }}>Vista Previa del Documento</h2>
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden border-2" style={{ borderColor: "#1D9E75" }}>

                {/* Encabezado documento */}
                <div className="py-6 px-6 text-center text-white" style={{ background: "#1D9E75" }}>
                  <p className="text-xs uppercase tracking-widest opacity-80 mb-1">Documento</p>
                  <h3 className="text-2xl font-bold">CUENTA DE COBRO</h3>
                  <p className="text-lg font-semibold mt-1">N° {form.numeroCuenta.padStart(3, "0")}</p>
                  <p className="text-sm mt-1 opacity-90">{form.ciudad}, {formatDateEs(form.fecha)}</p>
                </div>

                <div className="p-6 space-y-5">

                  {/* Contratante */}
                  <div className="rounded-lg p-4" style={{ background: "#E1F5EE" }}>
                    <p className="text-xs font-bold uppercase mb-2 tracking-wide" style={{ color: "#0F6E56" }}>Contratante (quien paga)</p>
                    <p className="text-sm"><span className="font-semibold">Nombre / Razón social:</span> {form.nombreContratante || "—"}</p>
                    <p className="text-sm"><span className="font-semibold">NIT / CC:</span> {form.nitContratante || "—"}</p>
                  </div>

                  {/* Contratista */}
                  <div className="rounded-lg p-4 border border-gray-200">
                    <p className="text-xs font-bold uppercase mb-2 tracking-wide" style={{ color: "#0F6E56" }}>Contratista (quien cobra)</p>
                    <p className="text-sm"><span className="font-semibold">Nombre completo:</span> {form.nombreContratista || "—"}</p>
                    <p className="text-sm"><span className="font-semibold">Cédula de ciudadanía:</span> {form.cedulaContratista || "—"}</p>
                  </div>

                  {/* Descripción */}
                  <div className="rounded-lg p-4 border border-gray-200">
                    <p className="text-xs font-bold uppercase mb-2 tracking-wide" style={{ color: "#0F6E56" }}>Concepto del servicio</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{form.descripcion || "—"}</p>
                  </div>

                  {/* Valores */}
                  <div className="rounded-lg overflow-hidden border border-gray-200">
                    <div className="px-4 py-2 text-xs font-bold uppercase tracking-wide text-white" style={{ background: "#0F6E56" }}>
                      Valor
                    </div>
                    <div className="p-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-semibold">Valor bruto:</span>
                        <span className="font-bold text-base">{formatCOP(valor)}</span>
                      </div>
                      <div className="text-xs text-gray-500 italic">
                        {valorEnLetras(valor)}
                      </div>
                      {valor >= 160000 && retencion.tasa > 0 && form.tipoRetencion !== "ninguno" && (
                        <>
                          <div className="border-t pt-2 flex justify-between text-sm text-red-600">
                            <span>Retención ({retencion.tasa}% {form.tipoRetencion}):</span>
                            <span>- {formatCOP(retencion.valor)}</span>
                          </div>
                          <div className="flex justify-between font-bold text-base pt-1 border-t">
                            <span>Valor neto a pagar:</span>
                            <span style={{ color: "#1D9E75" }}>{formatCOP(retencion.neto)}</span>
                          </div>
                        </>
                      )}
                      {(valor < 160000 || form.tipoRetencion === "ninguno") && (
                        <div className="flex justify-between font-bold text-base pt-1 border-t">
                          <span>Total a pagar:</span>
                          <span style={{ color: "#1D9E75" }}>{formatCOP(valor)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Datos bancarios */}
                  <div className="rounded-lg p-4" style={{ background: "#E1F5EE" }}>
                    <p className="text-xs font-bold uppercase mb-2 tracking-wide" style={{ color: "#0F6E56" }}>Datos bancarios para el pago</p>
                    <p className="text-sm"><span className="font-semibold">Banco:</span> {form.banco}</p>
                    <p className="text-sm"><span className="font-semibold">Tipo de cuenta:</span> {form.tipoCuenta}</p>
                    <p className="text-sm"><span className="font-semibold">Número de cuenta:</span> {form.numeroCuentaBancaria || "—"}</p>
                  </div>

                  {/* Declaración legal */}
                  <div className="rounded-lg p-4 border border-yellow-300 bg-yellow-50">
                    <p className="text-xs font-bold uppercase mb-1 text-yellow-800">Declaración legal</p>
                    <p className="text-xs text-yellow-900 italic leading-relaxed">{declaracionLegal}</p>
                  </div>

                  {/* Firma */}
                  <div className="pt-4">
                    <div className="border-t-2 border-gray-400 w-48 mb-2" />
                    <p className="text-sm font-semibold">{form.nombreContratista || "Nombre del contratista"}</p>
                    <p className="text-xs text-gray-500">C.C. {form.cedulaContratista || "—"}</p>
                  </div>

                </div>
              </div>

              {/* Botones PDF y WhatsApp */}
              <div className="flex flex-col sm:flex-row gap-3 mt-5">
                <button
                  onClick={handleDescargarPDF}
                  className="flex-1 py-3 rounded-xl text-white font-bold text-sm transition-all hover:opacity-90 active:scale-95 shadow-md flex items-center justify-center gap-2"
                  style={{ background: "#1D9E75" }}
                >
                  📥 Descargar PDF
                </button>
                <button
                  onClick={handleWhatsApp}
                  className="flex-1 py-3 rounded-xl text-white font-bold text-sm transition-all hover:opacity-90 active:scale-95 shadow-md flex items-center justify-center gap-2"
                  style={{ background: "#25D366" }}
                >
                  💬 Enviar por WhatsApp
                </button>
              </div>
            </section>
          )}

          {/* ── CÓMO USAR ── */}
          <section className="mb-10 bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-xl font-bold mb-5" style={{ color: "#0F6E56" }}>Cómo generar tu cuenta de cobro en 5 pasos</h2>
            <ol className="space-y-4">
              {[
                {
                  title: "Paso 1 — Datos del contratante",
                  desc: "Ingresa el nombre o razón social de la empresa y su NIT. Estos datos aparecen en el RUT que normalmente te comparten al firmar contrato."
                },
                {
                  title: "Paso 2 — Tus datos como contratista",
                  desc: "Escribe tu nombre completo, número de cédula, ciudad, datos bancarios (banco, tipo de cuenta y número) y tu dirección de correo."
                },
                {
                  title: "Paso 3 — Describe el servicio",
                  desc: "Detalla qué trabajo realizaste, el periodo y el valor total. La herramienta convierte automáticamente el valor a letras en español."
                },
                {
                  title: "Paso 4 — Selecciona el tipo de retención",
                  desc: "Elige entre honorarios (10%), servicios (6%) o arrendamientos (3.5%). Si no aplica retención porque el monto es inferior al tope ($160.000 en 2026), deja el campo en cero."
                },
                {
                  title: "Paso 5 — Revisa la vista previa y descarga",
                  desc: "Verifica todos los datos en la vista previa en tiempo real. Si todo está correcto, haz clic en 'Descargar PDF' o comparte el resumen por WhatsApp directamente."
                }
              ].map((step, i) => (
                <li key={i} className="flex gap-4">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full text-white text-sm font-bold flex items-center justify-center" style={{ background: "#1D9E75" }}>
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: "#0F6E56" }}>{step.title}</p>
                    <p className="text-sm text-gray-600">{step.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="mt-5 p-4 rounded-xl border-l-4 bg-gray-50 text-sm text-gray-700" style={{ borderColor: "#1D9E75" }}>
              <strong>Ejemplo:</strong> Prestas servicios de consultoría por $3.500.000. Seleccionas 'Honorarios declarante' al 10%. La herramienta calcula: Retención = $350.000. Total a pagar = $3.150.000. En el PDF aparece: 'TRES MILLONES QUINIENTOS MIL PESOS M/CTE' como valor bruto, con el desglose de retención debajo.
            </div>
          </section>

          {/* ── CONTENIDO PRINCIPAL ── */}
          <section
            className="mb-10 bg-white rounded-2xl shadow-sm p-6 prose prose-sm max-w-none"
            style={{ color: "#2C2C2A" }}
            dangerouslySetInnerHTML={{
              __html: `
              <style>
                .content-section h2{font-size:1.25rem;font-weight:700;color:#0F6E56;margin-top:2rem;margin-bottom:0.75rem;}
                .content-section h3{font-size:1.05rem;font-weight:700;color:#1D9E75;margin-top:1.5rem;margin-bottom:0.5rem;}
                .content-section p{margin-bottom:0.9rem;line-height:1.7;font-size:0.9rem;color:#2C2C2A;}
                .content-section ul,.content-section ol{padding-left:1.4rem;margin-bottom:1rem;}
                .content-section li{margin-bottom:0.4rem;font-size:0.9rem;line-height:1.6;}
                .content-section strong{color:#0F6E56;}
                .content-section table{width:100%;border-collapse:collapse;margin:1rem 0;font-size:0.82rem;}
                .content-section th{background:#E1F5EE;color:#0F6E56;padding:0.5rem 0.75rem;text-align:left;border:1px solid #c5e8db;}
                .content-section td{padding:0.45rem 0.75rem;border:1px solid #e0e0e0;}
                .content-section tr:nth-child(even) td{background:#f9f9f9;}
                .content-section em{font-size:0.8rem;color:#777;}
              </style>
              <div class="content-section">
              <h2>¿Qué es una cuenta de cobro y cuándo la necesitas?</h2><p>Una cuenta de cobro es el documento que usas como trabajador independiente para solicitar formalmente el pago de un servicio prestado. No es una factura electrónica. No necesita autorización de la DIAN. Pero sí es un soporte contable válido que la empresa pagadora incluye en su contabilidad y que tú guardas como respaldo de tus ingresos.</p><p>¿Cuándo la necesitas concretamente? Cada vez que una persona natural no obligada a facturar electrónicamente —es decir, alguien que pertenece al régimen simplificado o no responsable de IVA— presta un servicio y necesita cobrar. El fundamento legal está en el <strong>Artículo 7 del Decreto 19 de 2012</strong> (Decreto Antitrámites), que reconoce la cuenta de cobro como documento equivalente para soportar pagos a terceros no obligados a facturar.</p><p>En la práctica, la usan diseñadores gráficos, desarrolladores web, fotógrafos, consultores de marketing, profesores particulares, abogados independientes, contadores que trabajan por honorarios, psicólogos, nutricionistas y cualquier profesional que trabaje por cuenta propia en Colombia.</p><p>Ojo con esto: si ya te inscribiste como responsable de IVA o pasaste el tope de ingresos del régimen simple, probablemente necesitas factura electrónica. Pero si eres independiente con ingresos dentro de los límites del no responsable de IVA (menos de 3.500 UVT de ingresos brutos anuales, es decir, aproximadamente $168.021.500 para 2026), la cuenta de cobro es tu documento.</p><h2>Campos obligatorios de una cuenta de cobro en Colombia</h2><p>No existe una norma que diga «la cuenta de cobro debe tener exactamente estos campos». Pero la costumbre mercantil y las exigencias de los departamentos de contabilidad han consolidado una estructura que, si no la sigues, te devuelven el documento. Estos son los campos que necesitas incluir sí o sí:</p><ul><li><strong>Ciudad y fecha de emisión:</strong> Indica dónde y cuándo generas la cuenta de cobro. Ejemplo: Bogotá D.C., 15 de marzo de 2026.</li><li><strong>Número consecutivo:</strong> Cada cuenta debe tener un número único y correlativo. No puedes enviar dos cuentas con el mismo número al mismo pagador. Esto es clave para tu contabilidad y la de la empresa.</li><li><strong>Datos del contratante (quien paga):</strong> Razón social o nombre completo, NIT o cédula, dirección. Es la empresa o persona que te contrató.</li><li><strong>Datos del contratista (tú, quien cobra):</strong> Nombre completo, cédula de ciudadanía, dirección, teléfono y correo electrónico. También tu RUT si te lo piden.</li><li><strong>Concepto o descripción del servicio:</strong> Qué hiciste exactamente. No basta con poner «servicios profesionales». Detalla: «Diseño de identidad visual para la marca XYZ, incluyendo logo, paleta de colores y manual de marca». Entre más específico, menos preguntas de contabilidad.</li><li><strong>Valor total en números y en letras:</strong> Ambos son obligatorios. Si pones $2.500.000 en números, debe decir también «Dos millones quinientos mil pesos moneda corriente». Nuestro generador hace esta conversión automáticamente.</li><li><strong>Datos bancarios:</strong> Nombre del banco, tipo de cuenta (ahorros o corriente), número de cuenta. Sin esto, no te pueden transferir.</li><li><strong>Declaración de retención en la fuente:</strong> Indica si eres declarante o no declarante de renta, y el porcentaje de retención aplicable según el tipo de pago. Esto lo exige el área contable para aplicar correctamente la retención conforme al Art. 383 del Estatuto Tributario.</li><li><strong>Firma:</strong> Tu firma como contratista. En un PDF digital, basta con tu nombre digitado como firma, aunque algunas empresas aceptan firma escaneada.</li></ul><p>Nuestro generador de cuenta de cobro incluye todos estos campos en el formulario, así no se te olvida ninguno y el área contable no te devuelve el documento.</p><h2>Retención en la fuente en la cuenta de cobro: tasas 2026</h2><p>Este es el punto donde más se confunden los independientes. Y con razón, porque las tasas cambian según el tipo de pago y si eres declarante o no de renta. Vamos por partes.</p><p>La <strong>retención en la fuente</strong> es un mecanismo de recaudo anticipado del impuesto de renta. No es un impuesto adicional: es un adelanto que la empresa te descuenta al pagarte y le consigna a la DIAN a tu nombre. Cuando declares renta, ese valor ya pagado se resta de lo que debas.</p><h3>Tasas de retención vigentes para 2026</h3><table><thead><tr><th>Tipo de pago</th><th>Declarante de renta</th><th>No declarante</th><th>Base mínima (2026)</th></tr></thead><tbody><tr><td>Honorarios</td><td>10%</td><td>11%</td><td>$160.000 (aprox. 4 UVT)</td></tr><tr><td>Servicios en general</td><td>4%</td><td>6%</td><td>$160.000 (aprox. 4 UVT)</td></tr><tr><td>Arrendamiento bienes muebles</td><td>4%</td><td>3.5%</td><td>$160.000 (aprox. 4 UVT)</td></tr><tr><td>Arrendamiento bienes inmuebles</td><td>3.5%</td><td>3.5%</td><td>27 UVT</td></tr><tr><td>Compras en general</td><td>2.5%</td><td>2.5%</td><td>27 UVT</td></tr></tbody></table><p><em>La UVT para 2026 se estima en aproximadamente $49.799 (pendiente de confirmación por DIAN en enero 2026). Las bases mínimas se actualizan cada año.</em></p><h3>¿Honorarios o servicios? La diferencia que te afecta el bolsillo</h3><p>La diferencia impacta directamente el porcentaje de retención que te descuentan. Honorarios aplican a servicios con alto componente intelectual o profesional especializado: ingenieros, diseñadores, consultores, abogados, contadores. La retención base es del 10% para declarantes. Servicios aplican a actividades más operativas o de apoyo. La retención baja al 4% para declarantes. La clasificación depende de la naturaleza del servicio descrita en tu contrato, no de tu título profesional. En la práctica, revisa el objeto de tu contrato: la redacción ahí es lo que usa contabilidad para clasificar el pago y aplicar la tarifa correcta.</p><h2>¿Es obligatorio el número consecutivo en una cuenta de cobro?</h2><p>Sí. El número consecutivo es una buena práctica contable que protege tanto al contratista como al pagador. Te permite llevar un control claro de cuántas cuentas has emitido y en qué orden, lo que facilita conciliaciones y responde a posibles requerimientos de la DIAN. Cada cuenta debe tener un número único y correlativo por cliente o en general para todos tus clientes según tu organización. Nuestro generador incluye este campo y lo formatea automáticamente con ceros a la izquierda para que el PDF quede presentable.</p><h2>Preguntas legales frecuentes sobre la cuenta de cobro</h2><p>Una pregunta que surge con frecuencia es si la cuenta de cobro necesita firma original en físico. La respuesta es no: desde el <strong>Decreto 19 de 2012</strong> (Decreto Antitrámites) y la posterior <strong>Ley 2052 de 2020</strong>, los documentos en formato digital tienen plena validez para trámites públicos y privados en Colombia. Un PDF con tu nombre digitado como firma es suficiente para la gran mayoría de empresas pagadoras. Otra pregunta frecuente: ¿necesito timbre o sello notarial? No. La cuenta de cobro no requiere autenticación notarial.</p></div>
              `
            }}
          />

          {/* ── FAQ ── */}
          <section className="mb-10 bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-xl font-bold mb-5" style={{ color: "#0F6E56" }}>Preguntas frecuentes sobre la cuenta de cobro</h2>
            <div className="space-y-3">
              {faqData.map((faq, i) => (
                <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
                  <button
                    className="w-full text-left px-4 py-3 flex justify-between items-center font-semibold text-sm"
                    style={{ color: "#0F6E56" }}
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

