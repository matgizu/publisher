"use client";

import { useState, useCallback, useRef } from "react";

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface Parte {
  nombre: string;
  nit: string;
  regimen: string;
  direccion: string;
  ciudad: string;
  telefono: string;
  email: string;
}

interface Impuesto {
  nombre: string;
  tasa: string;
  base: number;
  valor: number;
}

interface Linea {
  id: string;
  descripcion: string;
  cantidad: number;
  unidad: string;
  precioUnitario: number;
  subtotal: number;
  impuestos: Impuesto[];
}

interface Factura {
  numero: string;
  fecha: string;
  fechaVencimiento: string;
  cufe: string;
  tipoDoc: string;
  moneda: string;
  emisor: Parte;
  receptor: Parte;
  lineas: Linea[];
  subtotal: number;
  totalImpuestos: number;
  total: number;
  notas: string;
}

// ── Parser DIAN UBL 2.1 ───────────────────────────────────────────────────────
function g(el: Element | Document, tag: string, index = 0): string {
  return el.getElementsByTagName(tag)[index]?.textContent?.trim() ?? "";
}
function ga(el: Element | Document, tag: string, attr: string): string {
  return el.getElementsByTagName(tag)[0]?.getAttribute(attr) ?? "";
}

function parseParte(container: Element | null): Parte {
  if (!container) return { nombre: "", nit: "", regimen: "", direccion: "", ciudad: "", telefono: "", email: "" };
  return {
    nombre: g(container, "RegistrationName") || g(container, "Name"),
    nit: g(container, "CompanyID") || g(container, "ID"),
    regimen: g(container, "TaxLevelCode"),
    direccion: g(container, "Line") || g(container, "AddressLine"),
    ciudad: g(container, "CityName"),
    telefono: g(container, "Telephone"),
    email: g(container, "ElectronicMail"),
  };
}

function parseDIAN(xml: string): Factura {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "text/xml");

  const parseErr = doc.querySelector("parsererror");
  if (parseErr) throw new Error("Archivo XML inválido o corrupto.");

  const rootTag = doc.documentElement.localName;
  if (!["Invoice", "CreditNote", "DebitNote"].includes(rootTag)) {
    throw new Error(`Documento no reconocido (raíz: <${rootTag}>). Solo se admiten facturas DIAN UBL 2.1.`);
  }

  // Header — el primer ID y fecha son los del documento, no de las líneas
  const allIDs = doc.getElementsByTagName("ID");
  const numero = allIDs[0]?.textContent?.trim() ?? "";

  const lineas: Linea[] = Array.from(doc.getElementsByTagName("InvoiceLine")).map((line) => {
    const impuestosLinea: Impuesto[] = Array.from(line.getElementsByTagName("TaxSubtotal")).map((sub) => ({
      nombre: g(sub, "Name") || "IVA",
      tasa: g(sub, "Percent"),
      base: parseFloat(g(sub, "TaxableAmount")) || 0,
      valor: parseFloat(sub.getElementsByTagName("TaxAmount")[0]?.textContent || "0") || 0,
    }));
    return {
      id: g(line, "ID"),
      descripcion: g(line, "Description") || g(line, "Name"),
      cantidad: parseFloat(ga(line, "InvoicedQuantity", "unitCode") ? g(line, "InvoicedQuantity") : "0") || 0,
      unidad: line.getElementsByTagName("InvoicedQuantity")[0]?.getAttribute("unitCode") ?? "",
      precioUnitario: parseFloat(g(line, "PriceAmount")) || 0,
      subtotal: parseFloat(g(line, "LineExtensionAmount")) || 0,
      impuestos: impuestosLinea,
    };
  });

  const impuestosDoc: Impuesto[] = Array.from(doc.getElementsByTagName("TaxSubtotal")).map((sub) => ({
    nombre: g(sub, "Name") || "IVA",
    tasa: g(sub, "Percent"),
    base: parseFloat(g(sub, "TaxableAmount")) || 0,
    valor: parseFloat(sub.getElementsByTagName("TaxAmount")[0]?.textContent || "0") || 0,
  }));

  const totalImpuestos = impuestosDoc.reduce((s, i) => s + i.valor, 0) ||
    parseFloat(doc.getElementsByTagName("TaxAmount")[0]?.textContent || "0") || 0;

  return {
    numero,
    fecha: g(doc, "IssueDate"),
    fechaVencimiento: g(doc, "DueDate"),
    cufe: g(doc, "UUID"),
    tipoDoc: g(doc, "InvoiceTypeCode"),
    moneda: g(doc, "DocumentCurrencyCode") || "COP",
    emisor: parseParte(doc.getElementsByTagName("AccountingSupplierParty")[0] ?? null),
    receptor: parseParte(doc.getElementsByTagName("AccountingCustomerParty")[0] ?? null),
    lineas,
    subtotal: parseFloat(g(doc, "LineExtensionAmount")) || 0,
    totalImpuestos,
    total: parseFloat(g(doc, "PayableAmount")) || 0,
    notas: g(doc, "Note"),
  };
}

// ── Helpers UI ────────────────────────────────────────────────────────────────
function formatCOP(n: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(n);
}
function formatFecha(s: string) {
  if (!s) return "—";
  const [y, m, d] = s.split("-");
  const meses = ["","ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
  return `${d} ${meses[parseInt(m)]} ${y}`;
}
const TIPO_DOC: Record<string, string> = {
  "01": "Factura de venta", "02": "Factura de exportación",
  "03": "Factura por contingencia", "91": "Nota crédito", "92": "Nota débito",
};

// ── SEO content ───────────────────────────────────────────────────────────────
const seoHTML = `
<style>
.sc h2{font-size:1.15rem;font-weight:700;color:#0F6E56;margin:1.8rem 0 .6rem}
.sc h3{font-size:.98rem;font-weight:700;color:#1D9E75;margin:1.3rem 0 .4rem}
.sc p{margin-bottom:.85rem;line-height:1.7;font-size:.88rem;color:#2C2C2A}
.sc ul{padding-left:1.3rem;margin-bottom:.9rem}
.sc li{margin-bottom:.35rem;font-size:.88rem;line-height:1.6}
.sc strong{color:#0F6E56}
</style>
<div class="sc">
<h2>¿Por qué no puedo abrir un archivo .xml de factura electrónica?</h2>
<p>El archivo <strong>.xml</strong> que te envía tu proveedor <em>es</em> la factura electrónica real — el documento con validez fiscal ante la DIAN. El PDF que te adjuntan al correo es solo una representación visual de ese XML, pero no tiene fuerza legal por sí solo. El problema es que un archivo XML no se puede abrir con doble clic como un PDF: si lo intentas, el sistema operativo no sabe qué programa usar.</p>
<p>Las opciones tradicionales para verlo son: <strong>(1)</strong> abrirlo con tu software contable (Siigo, Alegra, World Office) — requiere tener licencia y saber usarlo; <strong>(2)</strong> usar el portal de la DIAN — necesitas credenciales de acceso; <strong>(3)</strong> una herramienta de Excel con macros VBA que cuesta $130.000 COP y solo funciona en Windows; <strong>(4)</strong> un script de Python en GitHub — requiere saber programar. Esta herramienta elimina todas esas barreras: arrastras el archivo, lo lees en pantalla y lo descargas en PDF. <strong>Gratis, sin registro, sin instalar nada.</strong></p>
<h2>¿Qué información contiene el XML de una factura DIAN?</h2>
<p>La DIAN adoptó el estándar internacional <strong>UBL 2.1</strong> (Universal Business Language) para las facturas electrónicas en Colombia. Cada XML tiene tres grandes bloques: datos del emisor (tu proveedor), datos del receptor (tú o tu empresa) y las líneas de detalle con los productos o servicios. Además incluye el <strong>CUFE</strong> (Código Único de Factura Electrónica), que es el identificador que puedes usar para verificar la factura directamente en el sitio de la DIAN.</p>
<h2>¿El visualizador es realmente gratis y sin registro?</h2>
<p>Sí, 100%. El archivo XML nunca sale de tu computador: todo el procesamiento ocurre en el navegador usando JavaScript puro (la API nativa <code>DOMParser</code>). No hay servidor que reciba tus facturas, no hay base de datos donde se almacenen, no hay formulario de registro. Puedes usarlo las veces que quieras con cualquier cantidad de facturas.</p>
<h2>¿Funciona con facturas de todos los proveedores?</h2>
<p>Sí, siempre que la factura siga el estándar DIAN UBL 2.1, que es <strong>obligatorio para todos los facturadores electrónicos en Colombia</strong> desde 2020. No importa si tu proveedor usa Siigo, Alegra, Factúralo, Loggro, World Office, Heliox o cualquier otro software autorizado por la DIAN: todos producen el mismo formato XML.</p>
<h2>¿Cómo verifico que la factura es válida ante la DIAN?</h2>
<p>Copia el CUFE que aparece en el visor y ve a <strong>catalogo.dian.gov.co/UCI/Gestor.aspx</strong>. Pega el CUFE en el buscador y la DIAN te mostrará si el documento fue validado y su estado actual. Una factura con CUFE válido en el sistema de la DIAN tiene plena fuerza como soporte de costo o deducción en tu declaración de renta.</p>
</div>`;

const faqData = [
  {
    q: "¿El visualizador sube mis facturas a algún servidor?",
    a: "No. El archivo .xml nunca sale de tu dispositivo. El procesamiento se hace completamente en tu navegador con JavaScript nativo (DOMParser). No hay servidor que reciba nada, no hay base de datos, no hay registro de tus facturas en ningún sistema externo. Puedes verificarlo revisando el tráfico de red con las herramientas de desarrollador de tu navegador.",
  },
  {
    q: "¿Por qué la factura de la DIAN viene en XML y no directamente en PDF?",
    a: "Porque el XML es el documento con validez fiscal. La DIAN valida la firma digital del archivo XML antes de autorizar la factura — ese proceso no se puede hacer con un PDF. El PDF que acompaña a la factura es solo una 'representación gráfica' para facilitar la lectura humana, pero no tiene la firma digital validada por la DIAN. Para efectos contables y tributarios, lo que importa es el XML.",
  },
  {
    q: "¿Qué hago si el XML que tengo está dentro de un archivo .zip?",
    a: "Algunos softwares de facturación envían el XML comprimido en un .zip junto con el PDF. Descomprime el archivo primero (clic derecho → Extraer aquí en Windows), ubica el archivo con extensión .xml y arrástralo al visor. Si el .zip contiene varios archivos .xml, el que te interesa como factura es el que tiene 'FV', 'FC' o el número de factura en el nombre — no el que dice 'AttachedDocument' (ese es el documento contenedor).",
  },
  {
    q: "¿Puedo usar esto con notas crédito y notas débito?",
    a: "Sí. El visor reconoce facturas de venta (tipo 01), facturas de exportación (tipo 02), notas crédito (tipo 91) y notas débito (tipo 92). Todos estos documentos siguen el mismo estándar UBL 2.1 de la DIAN.",
  },
  {
    q: "¿Funciona en el celular?",
    a: "Sí, el visor está diseñado para funcionar en móvil. Sin embargo, compartir archivos .xml desde aplicaciones de correo en Android/iOS puede ser limitado dependiendo del cliente de correo. La experiencia es mejor en computador de escritorio o portátil.",
  },
  {
    q: "¿Qué es el CUFE y para qué sirve?",
    a: "El CUFE (Código Único de Factura Electrónica) es un hash criptográfico de 96 caracteres que identifica de forma única cada factura en el sistema de la DIAN. Con él puedes verificar que la factura fue realmente validada por la DIAN (no es una factura falsa) y consultar su estado en el portal de facturación electrónica. Cualquier factura electrónica legítima en Colombia debe tener CUFE.",
  },
];

// ── Componente ────────────────────────────────────────────────────────────────
export default function VisorXMLDian() {
  const [factura, setFactura] = useState<Factura | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [copiado, setCopiado] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const procesar = useCallback((file: File) => {
    if (!file.name.toLowerCase().endsWith(".xml")) {
      setError("El archivo debe tener extensión .xml");
      return;
    }
    setLoading(true);
    setError("");
    setFactura(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const xml = e.target?.result as string;
        setFactura(parseDIAN(xml));
      } catch (err: any) {
        setError(err.message || "No se pudo leer el archivo.");
      } finally {
        setLoading(false);
      }
    };
    reader.onerror = () => { setError("Error leyendo el archivo."); setLoading(false); };
    reader.readAsText(file, "UTF-8");
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) procesar(file);
  }, [procesar]);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) procesar(file);
  };

  const copiarCUFE = () => {
    if (!factura?.cufe) return;
    navigator.clipboard.writeText(factura.cufe).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    });
  };

  const schema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Visualizador de Factura Electrónica XML DIAN — Gratis y Sin Registro",
    url: "https://calcutools.online/visualizador-factura-electronica-xml-dian",
    description: "Abre y lee tu factura electrónica .xml de la DIAN en segundos. Gratis, sin registro, sin instalar nada. Funciona con todas las facturas UBL 2.1 de Colombia.",
    applicationCategory: "BusinessApplication",
    operatingSystem: "All",
    offers: { "@type": "Offer", price: "0", priceCurrency: "COP" },
    inLanguage: "es-CO",
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org", "@type": "FAQPage",
        mainEntity: faqData.map(f => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
      })}} />

      <div className="min-h-screen bg-gray-50 text-[#2C2C2A]">

        {/* HEADER */}
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <nav className="text-xs text-gray-400 mb-2">
              <a href="/" className="hover:underline text-[#1D9E75]">calcutools.online</a>
              <span className="mx-1">/</span>
              <span>Visualizador XML DIAN</span>
            </nav>
            <h1 className="text-2xl md:text-3xl font-bold text-[#0F6E56] leading-tight">
              Visualizador de Factura Electrónica XML DIAN
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Abre y lee cualquier archivo <strong>.xml</strong> de la DIAN en segundos —{" "}
              <span className="text-[#1D9E75] font-semibold">gratis, sin registro, sin instalar nada</span>
            </p>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-6">

          {/* BADGES */}
          <div className="flex flex-wrap gap-2 mb-5">
            {["✅ 100% Gratis", "🔒 Sin registro", "💻 Sin instalar", "🇨🇴 DIAN UBL 2.1", "🔐 Archivo nunca sale de tu PC"].map(b => (
              <span key={b} className="text-xs font-semibold px-3 py-1 rounded-full bg-[#E1F5EE] text-[#0F6E56] border border-[#1D9E75]/30">{b}</span>
            ))}
          </div>

          {/* DROP ZONE */}
          {!factura && (
            <section
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => fileRef.current?.click()}
              className={`cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition-all mb-6 ${
                dragging ? "border-[#1D9E75] bg-[#E1F5EE]" : "border-gray-300 bg-white hover:border-[#1D9E75] hover:bg-[#f0fdf7]"
              }`}
            >
              <input ref={fileRef} type="file" accept=".xml" className="hidden" onChange={onFile} />
              <div className="text-5xl mb-3">{loading ? "⏳" : "📄"}</div>
              {loading ? (
                <p className="text-[#1D9E75] font-semibold">Leyendo la factura...</p>
              ) : (
                <>
                  <p className="text-lg font-bold text-[#0F6E56] mb-1">Arrastra tu archivo .xml aquí</p>
                  <p className="text-sm text-gray-500">o haz clic para seleccionarlo desde tu computador</p>
                  <p className="text-xs text-gray-400 mt-3">Compatible con facturas de venta, notas crédito y notas débito — todos los softwares DIAN</p>
                </>
              )}
            </section>
          )}

          {error && (
            <div className="mb-5 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 flex gap-2 items-start">
              <span className="text-lg">⚠️</span>
              <div>
                <p className="font-semibold">No se pudo procesar el archivo</p>
                <p>{error}</p>
                <button onClick={() => { setError(""); setFactura(null); }} className="mt-2 text-xs underline text-red-600">Intentar con otro archivo</button>
              </div>
            </div>
          )}

          {/* RESULTADO */}
          {factura && (
            <section className="mb-8">

              {/* Toolbar */}
              <div className="flex flex-wrap gap-3 mb-4 items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-[#0F6E56]">
                    {TIPO_DOC[factura.tipoDoc] || "Documento electrónico"} {factura.numero}
                  </span>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">DIAN UBL 2.1</span>
                </div>
                <button
                  onClick={() => { setFactura(null); setError(""); if (fileRef.current) fileRef.current.value = ""; }}
                  className="text-xs text-gray-500 hover:text-red-500 underline"
                >
                  ← Cargar otro archivo
                </button>
              </div>

              <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">

                {/* Cabecera factura */}
                <div className="px-6 py-5 text-white" style={{ background: "linear-gradient(135deg, #1D9E75, #0F6E56)" }}>
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-widest opacity-75 mb-1">{TIPO_DOC[factura.tipoDoc] || "Documento electrónico"}</p>
                      <p className="text-2xl font-bold">N° {factura.numero}</p>
                      <p className="text-sm opacity-90 mt-1">Fecha: {formatFecha(factura.fecha)}{factura.fechaVencimiento ? ` · Vence: ${formatFecha(factura.fechaVencimiento)}` : ""}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs opacity-75 mb-1">Total a pagar</p>
                      <p className="text-3xl font-bold">{formatCOP(factura.total)}</p>
                      <p className="text-xs opacity-75 mt-1">{factura.moneda}</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-6">

                  {/* Emisor / Receptor */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[{ label: "Emisor (Proveedor)", data: factura.emisor }, { label: "Receptor (Comprador)", data: factura.receptor }].map(({ label, data }) => (
                      <div key={label} className="rounded-xl p-4" style={{ background: "#F0FDF7", border: "1px solid #c5e8db" }}>
                        <p className="text-xs font-bold uppercase tracking-wide mb-2 text-[#0F6E56]">{label}</p>
                        <p className="font-semibold text-sm text-[#2C2C2A]">{data.nombre || "—"}</p>
                        {data.nit && <p className="text-xs text-gray-600">NIT / CC: <strong>{data.nit}</strong></p>}
                        {data.regimen && <p className="text-xs text-gray-500">Régimen: {data.regimen}</p>}
                        {data.ciudad && <p className="text-xs text-gray-500">{data.ciudad}{data.direccion ? ` · ${data.direccion}` : ""}</p>}
                        {data.email && <p className="text-xs text-gray-500">{data.email}</p>}
                        {data.telefono && <p className="text-xs text-gray-500">Tel: {data.telefono}</p>}
                      </div>
                    ))}
                  </div>

                  {/* Líneas */}
                  {factura.lineas.length > 0 && (
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide mb-2 text-[#0F6E56]">Detalle de productos / servicios</p>
                      <div className="overflow-x-auto rounded-xl border border-gray-200">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-[#E1F5EE] text-[#0F6E56]">
                              <th className="text-left px-3 py-2 font-semibold">#</th>
                              <th className="text-left px-3 py-2 font-semibold">Descripción</th>
                              <th className="text-right px-3 py-2 font-semibold">Cant.</th>
                              <th className="text-right px-3 py-2 font-semibold">Precio unitario</th>
                              <th className="text-right px-3 py-2 font-semibold">Subtotal</th>
                            </tr>
                          </thead>
                          <tbody>
                            {factura.lineas.map((l, i) => (
                              <tr key={i} className={i % 2 === 1 ? "bg-gray-50" : "bg-white"}>
                                <td className="px-3 py-2 text-gray-400">{l.id || i + 1}</td>
                                <td className="px-3 py-2 font-medium">{l.descripcion || "—"}</td>
                                <td className="px-3 py-2 text-right">{l.cantidad} {l.unidad}</td>
                                <td className="px-3 py-2 text-right">{formatCOP(l.precioUnitario)}</td>
                                <td className="px-3 py-2 text-right font-semibold">{formatCOP(l.subtotal)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Totales */}
                  <div className="flex justify-end">
                    <div className="w-full max-w-xs space-y-2 text-sm">
                      <div className="flex justify-between text-gray-600">
                        <span>Subtotal:</span>
                        <span>{formatCOP(factura.subtotal)}</span>
                      </div>
                      {factura.totalImpuestos > 0 && (
                        <div className="flex justify-between text-gray-600">
                          <span>Impuestos:</span>
                          <span>{formatCOP(factura.totalImpuestos)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-base pt-2 border-t-2 border-[#1D9E75] text-[#0F6E56]">
                        <span>TOTAL A PAGAR:</span>
                        <span>{formatCOP(factura.total)}</span>
                      </div>
                    </div>
                  </div>

                  {/* CUFE */}
                  {factura.cufe && (
                    <div className="rounded-xl bg-gray-50 border border-gray-200 p-4">
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-bold uppercase tracking-wide text-[#0F6E56] mb-1">CUFE (Código Único de Factura Electrónica)</p>
                          <p className="text-xs font-mono text-gray-600 break-all">{factura.cufe}</p>
                        </div>
                        <button
                          onClick={copiarCUFE}
                          className="flex-shrink-0 text-xs px-3 py-1.5 rounded-lg border border-[#1D9E75] text-[#1D9E75] hover:bg-[#E1F5EE] transition-colors"
                        >
                          {copiado ? "✓ Copiado" : "Copiar"}
                        </button>
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        Verifica en: <a href="https://catalogo.dian.gov.co/UCI/Gestor.aspx" target="_blank" rel="noopener noreferrer" className="text-[#1D9E75] underline">catalogo.dian.gov.co</a>
                      </p>
                    </div>
                  )}

                  {/* Notas */}
                  {factura.notas && (
                    <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-amber-700 mb-1">Notas</p>
                      <p className="text-sm text-amber-900">{factura.notas}</p>
                    </div>
                  )}

                </div>
              </div>
            </section>
          )}

          {/* SEO CONTENT */}
          <section className="mb-8 bg-white rounded-2xl shadow-sm p-6" dangerouslySetInnerHTML={{ __html: seoHTML }} />

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
