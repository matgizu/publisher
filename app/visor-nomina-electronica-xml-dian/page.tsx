"use client";

import React, { useState, useCallback, useRef } from "react";

// ─── Types ───────────────────────────────────────────────────

interface LineItem { concepto: string; valor: number; }

interface NominaData {
  periodoInicio: string;
  periodoFin: string;
  empleadorNombre: string;
  empleadorNIT: string;
  empleadoNombre: string;
  cedula: string;
  tipoDocumento: string;
  tipoContrato: string;
  sueldo: number;
  devengados: LineItem[];
  deducciones: LineItem[];
  devengadosTotal: number;
  deduccionesTotal: number;
  comprobanteTotal: number;
  cune: string;
  numero: string;
}

// ─── Constants ───────────────────────────────────────────────

const TIPO_CONTRATO: Record<string, string> = {
  "01": "Indefinido", "02": "Fijo", "03": "Obra o labor",
  "04": "Aprendizaje", "05": "Ocasional",
};

// ─── Helpers ─────────────────────────────────────────────────

const cop = (n: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);

function fFecha(s: string) {
  if (!s || !s.includes("-")) return s;
  const [y, m, d] = s.split("-");
  const M = ["", "ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  return `${parseInt(d)} ${M[parseInt(m)]} ${y}`;
}

// ─── XML Parser ──────────────────────────────────────────────

function parseNomina(xmlText: string): NominaData {
  const doc = new DOMParser().parseFromString(xmlText, "text/xml");
  if (doc.querySelector("parsererror"))
    throw new Error("XML malformado. Verifica que el archivo sea un .xml de nómina electrónica DIAN válido.");

  const g = (t: string) => doc.getElementsByTagName(t)[0];
  const a = (t: string, k: string) => g(t)?.getAttribute(k) ?? "";
  const tx = (t: string) => g(t)?.textContent?.trim() ?? "";

  const periodoInicio = a("Periodo", "FechaInicioPago");
  const periodoFin = a("Periodo", "FechaFinPago");
  const empleadorNombre =
    a("Empleador", "RazonSocial") ||
    [a("Empleador", "PrimerNombre"), a("Empleador", "PrimerApellido")].filter(Boolean).join(" ");
  const empleadorNIT = a("Empleador", "NIT");

  const apellidos = [a("Empleado", "PrimerApellido"), a("Empleado", "SegundoApellido")].filter(Boolean).join(" ");
  const nombres = [a("Empleado", "PrimerNombre"), a("Empleado", "OtrosNombres")].filter(Boolean).join(" ");
  const empleadoNombre = `${nombres} ${apellidos}`.trim();
  const cedula = a("Empleado", "NumeroDocumento");
  const tipoDocumento = a("Empleado", "TipoDocumento");
  const tipoContrato = a("Empleado", "TipoContrato");
  const sueldo = parseFloat(a("Empleado", "Sueldo") || "0");

  // Devengados
  const devengados: LineItem[] = [];
  const addD = (c: string, v: number) => { if (v > 0) devengados.push({ concepto: c, valor: v }); };

  const bas = g("Basico");
  if (bas) addD("Salario básico", parseFloat(bas.getAttribute("SueldoTrabajado") || "0"));

  const tra = g("Transporte");
  if (tra) {
    addD("Auxilio de transporte", parseFloat(tra.getAttribute("AuxilioTransporte") || "0"));
    const viat = parseFloat(tra.getAttribute("ViaticosManuAlojS") || "0") + parseFloat(tra.getAttribute("ViaticosManuAlojNS") || "0");
    addD("Viáticos", viat);
  }

  Array.from(doc.getElementsByTagName("HoraExtraRecargo")).forEach((el, i) => {
    const pct = el.getAttribute("Porcentaje") || "";
    addD(`HE/recargo${pct ? ` (${pct}%)` : ""} #${i + 1}`, parseFloat(el.getAttribute("Pago") || "0"));
  });

  const vacC = g("VacacionesComunes");
  if (vacC) addD("Vacaciones disfrutadas", parseFloat(vacC.getAttribute("Pago") || "0"));
  const vacK = g("VacacionesCompensadas");
  if (vacK) addD("Vacaciones compensadas", parseFloat(vacK.getAttribute("Pago") || "0"));

  const pri = g("Primas");
  if (pri) addD("Prima de servicios", parseFloat(pri.getAttribute("Pago") || "0") + parseFloat(pri.getAttribute("PagoNS") || "0"));

  const ces = g("Cesantias");
  if (ces) {
    addD("Cesantías", parseFloat(ces.getAttribute("Pago") || "0"));
    addD("Intereses sobre cesantías", parseFloat(ces.getAttribute("PagoIntereses") || "0"));
  }

  Array.from(doc.getElementsByTagName("Comision")).forEach(el =>
    addD("Comisión", parseFloat(el.getAttribute("Comision") || "0")));
  Array.from(doc.getElementsByTagName("Bonificacion")).forEach((el, i) =>
    addD(`Bonificación #${i + 1}`, parseFloat(el.getAttribute("BonificacionS") || "0") + parseFloat(el.getAttribute("BonificacionNS") || "0")));
  Array.from(doc.getElementsByTagName("OtroConcepto")).forEach(el =>
    addD(el.getAttribute("DescripcionConcepto") || "Otro devengado",
      parseFloat(el.getAttribute("ConceptoS") || "0") + parseFloat(el.getAttribute("ConceptoNS") || "0")));

  // Deducciones
  const deducciones: LineItem[] = [];
  const addDed = (c: string, v: number) => { if (v > 0) deducciones.push({ concepto: c, valor: v }); };

  const sal = g("Salud");
  if (sal) addDed(`Salud (${sal.getAttribute("Porcentaje") || "4"}%)`, parseFloat(sal.getAttribute("Deduccion") || "0"));
  const pen = g("FondoPension");
  if (pen) addDed(`Pensión (${pen.getAttribute("Porcentaje") || "4"}%)`, parseFloat(pen.getAttribute("Deduccion") || "0"));
  const fsp = g("FondoSP");
  if (fsp) {
    addDed("Solidaridad pensional (subcuenta)", parseFloat(fsp.getAttribute("DeduccionSub") || "0"));
    addDed("Solidaridad pensional (voluntario)", parseFloat(fsp.getAttribute("DeduccionSoli") || "0"));
  }
  const ret = g("RetencionFuente");
  if (ret) addDed("Retención en la fuente", parseFloat(ret.getAttribute("RetencionFuente") || "0"));
  const afc = g("AFC");
  if (afc) addDed("AFC", parseFloat(afc.getAttribute("AFC") || "0"));

  Array.from(doc.getElementsByTagName("Libranza")).forEach(el =>
    addDed(el.getAttribute("Descripcion") || "Libranza", parseFloat(el.getAttribute("Deduccion") || "0")));
  Array.from(doc.getElementsByTagName("Sindicato")).forEach((el, i) =>
    addDed(`Sindicato #${i + 1}`, parseFloat(el.getAttribute("Deduccion") || "0")));
  Array.from(doc.getElementsByTagName("Sancion")).forEach(el =>
    addDed("Sanción", parseFloat(el.getAttribute("SancionPublic") || "0") + parseFloat(el.getAttribute("SancionPriv") || "0")));
  Array.from(doc.getElementsByTagName("OtraDeduccion")).forEach(el =>
    addDed(el.getAttribute("Descripcion") || "Otra deducción", parseFloat(el.getAttribute("Valor") || "0")));
  Array.from(doc.getElementsByTagName("Anticipo")).forEach(el =>
    addDed(el.getAttribute("Descripcion") || "Anticipo", parseFloat(el.getAttribute("Anticipo") || "0")));

  const devengadosTotal =
    parseFloat(tx("DevengadosTotal")) || devengados.reduce((s, x) => s + x.valor, 0);
  const deduccionesTotal =
    parseFloat(tx("DeduccionesTotal")) || deducciones.reduce((s, x) => s + x.valor, 0);
  const comprobanteTotal =
    parseFloat(tx("ComprobanteTotal")) || devengadosTotal - deduccionesTotal;
  const cune = tx("CUNE");
  const numero =
    a("NumeroSecuenciaXML", "Numero") || a("NumeroSecuenciaXML", "Consecutivo");

  return {
    periodoInicio, periodoFin, empleadorNombre, empleadorNIT,
    empleadoNombre, cedula, tipoDocumento, tipoContrato, sueldo,
    devengados, deducciones,
    devengadosTotal, deduccionesTotal, comprobanteTotal,
    cune, numero,
  };
}

// ─── Component ───────────────────────────────────────────────

export default function VisorNominaXML() {
  const [status, setStatus] = useState<"idle" | "parsing" | "done" | "error">("idle");
  const [data, setData] = useState<NominaData | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [cuneCopied, setCuneCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback((file: File) => {
    setStatus("parsing");
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = parseNomina(e.target?.result as string);
        setData(parsed);
        setStatus("done");
      } catch (err) {
        setErrorMsg((err as Error).message || "Error al procesar el XML.");
        setStatus("error");
      }
    };
    reader.readAsText(file, "utf-8");
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const copyCUNE = () => {
    if (data?.cune) {
      navigator.clipboard.writeText(data.cune).then(() => {
        setCuneCopied(true);
        setTimeout(() => setCuneCopied(false), 2000);
      });
    }
  };

  const reset = () => {
    setStatus("idle");
    setData(null);
    setErrorMsg("");
    if (inputRef.current) inputRef.current.value = "";
  };

  // Tabla reutilizable
  const renderTabla = (
    title: string,
    items: LineItem[],
    total: number,
    isDeduccion: boolean
  ) => (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
      <div className={`px-5 py-3 ${isDeduccion ? "bg-red-50" : "bg-[#E1F5EE]"}`}>
        <h3 className={`font-bold text-sm uppercase tracking-wide ${isDeduccion ? "text-red-700" : "text-[#0F6E56]"}`}>
          {title}
        </h3>
      </div>
      {items.length === 0 ? (
        <p className="px-5 py-4 text-sm text-[#5F5E5A] italic">Sin conceptos registrados</p>
      ) : (
        <table className="w-full text-sm">
          <tbody>
            {items.map((item, i) => (
              <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                <td className="px-5 py-2.5 text-[#2C2C2A]">{item.concepto}</td>
                <td className="px-5 py-2.5 text-right font-mono text-[#2C2C2A] whitespace-nowrap">
                  {cop(item.valor)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className={`border-t-2 ${isDeduccion ? "border-red-200" : "border-[#1D9E75]"}`}>
              <td className="px-5 py-3 font-bold text-sm text-[#2C2C2A]">Total {title.toLowerCase()}</td>
              <td className="px-5 py-3 text-right font-bold font-mono text-[#2C2C2A] whitespace-nowrap">
                {cop(total)}
              </td>
            </tr>
          </tfoot>
        </table>
      )}
    </div>
  );

  // FAQ data
  const faqs = [
    {
      q: "¿Qué es la nómina electrónica DIAN?",
      a: "Es el documento electrónico en formato XML que los empleadores deben emitir a la DIAN por cada pago de nómina, según el Decreto 2245 de 2023 y la Resolución 000013. Funciona como la factura electrónica pero para comprobantes de nómina, y contiene todos los devengados, deducciones y el neto del trabajador. La DIAN lo valida y emite el CUNE como sello de autenticidad.",
    },
    {
      q: "¿Por qué me llega un archivo .xml en lugar de un PDF?",
      a: "El XML es el formato oficial exigido por la DIAN para la nómina electrónica. Es el documento con validez legal. Muchos software de nómina también generan un PDF por comodidad, pero el XML es el original. Esta herramienta te permite leer ese XML sin necesidad de tener ningún software instalado.",
    },
    {
      q: "¿El archivo se sube a algún servidor?",
      a: "No. El procesamiento ocurre 100% en tu navegador usando DOMParser, una API nativa de JavaScript. Tu XML nunca sale de tu computador — no hay servidores intermedios, no hay registros, no hay nada que se almacene en ningún lado. Puedes incluso desconectarte de internet antes de subir el archivo.",
    },
    {
      q: "¿Qué es el CUNE y cómo lo verifico?",
      a: "El CUNE (Código Único de Nómina Electrónica) es el identificador que asigna la DIAN a cada comprobante validado. Es equivalente al CUFE de la factura electrónica. Puedes verificar la autenticidad del documento ingresando el CUNE en el portal de consulta de documentos electrónicos de la DIAN: mueinvoicing.dian.gov.co.",
    },
    {
      q: "¿Qué hago si el XML no me muestra datos?",
      a: "Puede pasar por dos razones: (1) el XML fue generado en modo 'pruebas' y no tiene datos reales de nómina, o (2) el software de nómina de tu empleador usa una estructura ligeramente diferente. En ese caso, comparte el XML con el área de RRHH para que lo verifiquen directamente en el software que lo generó.",
    },
    {
      q: "¿Esta herramienta sirve para empleadas domésticas?",
      a: "Sí, siempre que el empleador haya emitido el XML de nómina electrónica. Las personas naturales que contratan trabajadores domésticos también están obligadas a emitir nómina electrónica si superan los umbrales definidos por la DIAN. El XML resultante tiene exactamente el mismo formato.",
    },
  ];

  const schemaFaq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const schemaHowTo = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "Cómo abrir un XML de nómina electrónica DIAN",
    description: "Pasos para leer tu archivo XML de nómina electrónica DIAN en el navegador sin instalar software",
    step: [
      { "@type": "HowToStep", name: "Consigue el archivo", text: "Solicita el archivo .xml de nómina electrónica al área de RRHH o a tu empleador." },
      { "@type": "HowToStep", name: "Sube el archivo", text: "Arrastra el archivo .xml al recuadro de esta herramienta o haz clic en 'Seleccionar archivo'." },
      { "@type": "HowToStep", name: "Revisa el resultado", text: "En segundos verás el período de pago, devengados, deducciones, neto total y el CUNE de verificación DIAN." },
    ],
  };

  const contenidoPrincipal = `
<h2>¿Qué información tiene el XML de nómina electrónica?</h2>
<p>El archivo XML sigue el estándar técnico definido por la DIAN (Resolución 000013, Anexo Técnico v1.0). Tiene toda la información que antes ibas a buscar en el desprendible de papel: el período de pago, los datos del empleador y del trabajador, los devengados desglosados (salario básico, auxilio de transporte, horas extras, primas, cesantías) y las deducciones (salud, pensión, fondo de solidaridad, retención en la fuente, libranzas).</p>
<p>El problema es que está en código. "PrimerApellido", "SueldoTrabajado", "AuxilioTransporte". Así lo abre Excel. Así lo ve el Bloc de notas. Acá lo ves en tabla, como debe ser.</p>

<h2>¿Cuándo están obligados los empleadores a emitir nómina electrónica?</h2>
<p>El Decreto 2245 de 2023 y la Resolución 000013 de la DIAN establecieron la obligatoriedad por etapas. Para 2024, prácticamente todos los empleadores bajo relación laboral deben emitir el Documento Soporte de Nómina Electrónica (DSNE).</p>
<ul>
  <li>Grandes contribuyentes: obligados desde 2022</li>
  <li>Personas jurídicas y grandes empresas: desde 2023</li>
  <li>Personas naturales empleadoras y pequeñas empresas: desde 2024</li>
</ul>
<p>Si tu empleador no te ha entregado el XML todavía, está en mora. Puedes pedirlo directamente o consultarlo en el portal de la DIAN con tu RUT y el CUNE del documento.</p>

<h2>¿Qué es el CUNE y para qué sirve?</h2>
<p>El CUNE (Código Único de Nómina Electrónica) es el sello que le pone la DIAN al documento después de validarlo. Es como la firma digital de tu comprobante. Si el empleador generó el XML pero no lo envió a la DIAN para validación, el CUNE no existe o está en blanco.</p>
<p>Puedes verificar la autenticidad de cualquier nómina electrónica ingresando el CUNE en el portal de consulta de documentos electrónicos de la DIAN. Si el documento aparece allí, es legítimo y el empleador cumplió con su obligación.</p>

<h2>¿Por qué no hay más visores gratuitos de nómina electrónica?</h2>
<p>Los visores existentes son módulos dentro de software de nómina de pago: Siigo, Helisa, Alegra, Nominapp. El empleador los tiene porque necesita generar y enviar los XMLs. Pero el trabajador que solo necesita leer su propio comprobante no tiene ninguna herramienta gratuita disponible. Acá llenamos ese vacío.</p>
<p>Arrastra el XML, ve tu nómina en tabla, copia el CUNE. Gratis, sin registro, sin que el archivo salga de tu computador.</p>

<h2>Devengados y deducciones: qué significa cada concepto</h2>
<p>Los <strong>devengados</strong> son todo lo que te paga el empleador: salario básico, auxilio de transporte (si ganas menos de 2 SMMLV), horas extras, vacaciones, primas, cesantías e intereses sobre cesantías, comisiones y bonificaciones.</p>
<p>Las <strong>deducciones</strong> son los descuentos que el empleador hace antes de pagarte: salud (4% del salario base), pensión (4%), fondo de solidaridad pensional si ganas más de 4 SMMLV, retención en la fuente si aplica, libranzas y otros descuentos autorizados.</p>
<p>El <strong>neto</strong> es simplemente Total Devengados menos Total Deducciones. Es lo que debería llegar a tu cuenta.</p>`;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaFaq) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaHowTo) }}
      />

      {/* ── HEADER ─────────────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 pt-6 pb-8">
          <nav className="text-xs text-[#5F5E5A] mb-4">
            <a href="/" className="hover:text-[#1D9E75]">Inicio</a>
            {" / "}
            <span>Laboral</span>
            {" / "}
            <span className="text-[#2C2C2A]">Visor XML Nómina Electrónica DIAN</span>
          </nav>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#2C2C2A] leading-tight mb-2">
            Visor XML Nómina Electrónica DIAN
          </h1>
          <p className="text-[#5F5E5A] text-base mb-4">
            Tu empresa te mandó un .xml que no puedes abrir. Arrástalo aquí y en 3 segundos ves
            devengados, deducciones y neto en tabla — sin software, sin registro.
          </p>
          <div className="flex flex-wrap gap-2 text-xs font-medium">
            {[
              "✅ Gratis",
              "🔒 Sin registro",
              "🔍 100% local — tu XML no sale del browser",
              "🇨🇴 Estándar DIAN",
            ].map((b) => (
              <span key={b} className="bg-[#E1F5EE] text-[#0F6E56] px-3 py-1 rounded-full">
                {b}
              </span>
            ))}
          </div>
        </div>
      </header>

      {/* ── MAIN ───────────────────────────────────────────────── */}
      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">

        {/* ZONA UPLOAD — oculta cuando hay resultado */}
        {status !== "done" && (
          <section>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => status === "idle" && inputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-10 md:p-16 text-center transition-colors ${
                status === "idle"
                  ? `cursor-pointer ${dragOver ? "border-[#1D9E75] bg-[#E1F5EE]" : "border-gray-300 bg-gray-50 hover:border-[#1D9E75] hover:bg-[#E1F5EE]"}`
                  : "cursor-default border-gray-200 bg-gray-50"
              }`}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".xml,text/xml,application/xml"
                onChange={onFileChange}
                className="hidden"
              />

              {status === "idle" && (
                <>
                  <div className="text-5xl mb-4">📄</div>
                  <p className="text-lg font-bold text-[#2C2C2A] mb-1">
                    Arrastra tu .xml de nómina electrónica aquí
                  </p>
                  <p className="text-sm text-[#5F5E5A] mb-5">
                    o haz clic para seleccionar el archivo desde tu computador
                  </p>
                  <button
                    type="button"
                    className="bg-[#1D9E75] text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-[#0F6E56] transition-colors"
                    onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
                  >
                    Seleccionar archivo .xml
                  </button>
                  <p className="text-xs text-[#5F5E5A] mt-4">
                    El archivo nunca sale de tu navegador — procesamiento 100% local
                  </p>
                </>
              )}

              {status === "parsing" && (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-10 h-10 border-4 border-[#1D9E75] border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm font-medium text-[#2C2C2A]">Procesando XML...</p>
                </div>
              )}

              {status === "error" && (
                <div>
                  <div className="text-4xl mb-3">❌</div>
                  <p className="font-bold text-red-700 mb-1">No se pudo leer el archivo</p>
                  <p className="text-sm text-red-600 mb-5">{errorMsg}</p>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); reset(); }}
                    className="text-sm text-[#1D9E75] font-semibold border border-[#1D9E75] px-4 py-2 rounded-lg hover:bg-[#E1F5EE]"
                  >
                    Intentar con otro archivo
                  </button>
                </div>
              )}
            </div>
          </section>
        )}

        {/* RESULTADO */}
        {status === "done" && data && (
          <section className="space-y-5">

            {/* Chips resumen */}
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="bg-[#E1F5EE] text-[#0F6E56] px-3 py-1.5 rounded-full font-medium">
                📅 {fFecha(data.periodoInicio)} → {fFecha(data.periodoFin)}
              </span>
              {data.empleadoNombre && (
                <span className="bg-[#E1F5EE] text-[#0F6E56] px-3 py-1.5 rounded-full font-medium">
                  👤 {data.empleadoNombre}
                </span>
              )}
              {data.numero && (
                <span className="bg-gray-100 text-[#5F5E5A] px-3 py-1.5 rounded-full font-medium">
                  N° {data.numero}
                </span>
              )}
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                <h3 className="text-xs font-bold text-[#5F5E5A] uppercase tracking-wide mb-2">Empleador</h3>
                <p className="font-bold text-[#2C2C2A]">{data.empleadorNombre || "—"}</p>
                {data.empleadorNIT && (
                  <p className="text-sm text-[#5F5E5A]">NIT {data.empleadorNIT}</p>
                )}
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                <h3 className="text-xs font-bold text-[#5F5E5A] uppercase tracking-wide mb-2">Trabajador</h3>
                <p className="font-bold text-[#2C2C2A]">{data.empleadoNombre || "—"}</p>
                <p className="text-sm text-[#5F5E5A]">
                  {data.tipoDocumento || "CC"} {data.cedula}
                </p>
                {data.tipoContrato && (
                  <p className="text-sm text-[#5F5E5A]">
                    Contrato: {TIPO_CONTRATO[data.tipoContrato] || data.tipoContrato}
                  </p>
                )}
                {data.sueldo > 0 && (
                  <p className="text-sm text-[#5F5E5A]">Sueldo base: {cop(data.sueldo)}</p>
                )}
              </div>
            </div>

            {/* Tablas */}
            {renderTabla("Devengados", data.devengados, data.devengadosTotal, false)}
            {renderTabla("Deducciones", data.deducciones, data.deduccionesTotal, true)}

            {/* NETO TOTAL */}
            <div className="bg-[#1D9E75] rounded-2xl p-6 md:p-8 text-white text-center shadow-lg">
              <p className="text-xs font-bold opacity-75 uppercase tracking-widest mb-1">
                Neto a pagar
              </p>
              <p className="text-4xl md:text-5xl font-extrabold tracking-tight">
                {cop(data.comprobanteTotal)}
              </p>
              <p className="text-xs opacity-60 mt-2">
                ComprobanteTotal según XML validado por DIAN
              </p>
            </div>

            {/* CUNE */}
            {data.cune && (
              <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <h3 className="text-xs font-bold text-[#5F5E5A] uppercase tracking-wide">
                      CUNE — Código único de validación DIAN
                    </h3>
                  </div>
                  <button
                    onClick={copyCUNE}
                    className="flex-shrink-0 text-xs text-[#1D9E75] font-semibold border border-[#1D9E75] px-3 py-1 rounded-lg hover:bg-[#E1F5EE] transition-colors"
                  >
                    {cuneCopied ? "✅ Copiado" : "Copiar"}
                  </button>
                </div>
                <p className="font-mono text-xs bg-gray-50 p-3 rounded-lg break-all text-[#2C2C2A]">
                  {data.cune.length > 30
                    ? `${data.cune.slice(0, 22)}…${data.cune.slice(-8)}`
                    : data.cune}
                </p>
                <p className="text-xs text-[#5F5E5A] mt-2">
                  Este código garantiza que tu nómina fue validada por la DIAN.
                  Verifica en{" "}
                  <span className="font-medium text-[#1D9E75]">mueinvoicing.dian.gov.co</span>
                </p>
              </div>
            )}

            {/* Reset */}
            <button
              onClick={reset}
              className="w-full text-sm text-[#5F5E5A] border border-gray-200 py-3 rounded-xl hover:border-[#1D9E75] hover:text-[#1D9E75] transition-colors"
            >
              Cargar otro XML
            </button>
          </section>
        )}

        {/* CÓMO USAR */}
        <section className="bg-[#E1F5EE] rounded-2xl p-6">
          <h2 className="text-lg font-extrabold text-[#0F6E56] mb-4">
            ¿Cómo abrir tu XML de nómina electrónica?
          </h2>
          <ol className="space-y-3">
            {[
              "Pídele el archivo .xml al área de RRHH o a tu empleador. Algunos sistemas también lo envían por correo electrónico.",
              "Arrastra el archivo al recuadro de arriba o haz clic en 'Seleccionar archivo'. No hay límite de tamaño.",
              "En segundos verás el período de pago, devengados, deducciones y el neto total organizados en tabla.",
              "Copia el CUNE con un clic para verificar la autenticidad del documento directamente en el portal de la DIAN.",
            ].map((paso, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-[#1D9E75] text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {i + 1}
                </span>
                <p className="text-sm text-[#2C2C2A]">{paso}</p>
              </li>
            ))}
          </ol>
          <div className="mt-5 bg-white rounded-xl p-4 text-sm">
            <p className="font-semibold text-[#0F6E56] mb-1">Ejemplo de lo que verás:</p>
            <p className="text-[#5F5E5A]">
              Período: 1 ene 2025 → 31 ene 2025 · Empleador: EMPRESA COLOMBIA SAS (NIT 900.123.456-1) ·
              Trabajador: Carlos García López (CC 12345678) · Salario básico: $2.000.000 ·
              Aux. transporte: $200.000 · Salud (4%): $80.000 · Pensión (4%): $80.000 ·{" "}
              <strong>Neto: $2.040.000</strong>
            </p>
          </div>
        </section>

        {/* CONTENIDO SEO */}
        <section
          className="text-[#2C2C2A] [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-[#2C2C2A] [&_h2]:mt-6 [&_h2]:mb-3 [&_p]:mb-3 [&_p]:text-sm [&_p]:leading-relaxed [&_ul]:pl-5 [&_ul]:mb-3 [&_li]:mb-1 [&_li]:text-sm [&_strong]:font-semibold"
          dangerouslySetInnerHTML={{ __html: contenidoPrincipal }}
        />

        {/* FAQ */}
        <section>
          <h2 className="text-xl font-extrabold text-[#2C2C2A] mb-6">Preguntas frecuentes</h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-5 py-4 text-left text-sm font-semibold text-[#2C2C2A] hover:bg-gray-50 transition-colors"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  aria-expanded={openFaq === i}
                >
                  <span>{faq.q}</span>
                  <span
                    className={`flex-shrink-0 ml-3 text-[#1D9E75] text-xl font-bold transition-transform duration-200 ${
                      openFaq === i ? "rotate-45" : ""
                    }`}
                  >
                    +
                  </span>
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4 text-sm text-[#5F5E5A] leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* HERRAMIENTAS RELACIONADAS */}
        <section className="border-t border-gray-100 pt-8">
          <h2 className="text-base font-bold text-[#2C2C2A] mb-4">Herramientas relacionadas</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              {
                href: "/generador-desprendible-nomina-colombia",
                label: "Generador de desprendible de nómina",
                desc: "Crea tu comprobante de pago en PDF",
              },
              {
                href: "/calculadora-neto-honorarios-freelance-colombia",
                label: "Calculadora neto honorarios",
                desc: "¿Cuánto te queda después de retención y SS?",
              },
              {
                href: "/visor-factura-electronica-xml-dian",
                label: "Visor XML Factura Electrónica DIAN",
                desc: "Lee tus facturas electrónicas en el navegador",
              },
            ].map((t) => (
              <a
                key={t.href}
                href={t.href}
                className="block bg-white border border-gray-200 rounded-xl p-4 hover:border-[#1D9E75] hover:shadow-sm transition-all"
              >
                <p className="font-semibold text-sm text-[#2C2C2A] mb-1">{t.label}</p>
                <p className="text-xs text-[#5F5E5A]">{t.desc}</p>
              </a>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
