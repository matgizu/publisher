"use client";

import { useState, useEffect, useRef } from "react";

const contenidoPrincipal = `
<h2>¿Cómo funciona realmente cobrar por Nequi o Daviplata?</h2><p>A diferencia de lo que mucha gente cree, Nequi y Daviplata no tienen un "link mágico" que abra la app con el monto prellenado desde afuera. Eso solo existe dentro de la app misma. Lo que sí funciona — y muy bien — son tres cosas: un QR con tu número de celular, un mensaje de WhatsApp con los datos del cobro, y una tarjeta digital que puedes compartir por cualquier medio.</p><p>Esta herramienta genera las tres en segundos. Sin apps adicionales, sin registro, sin vueltas.</p><h2>El QR con tu número: ideal para ventas presenciales</h2><p>Cuando alguien abre Nequi y va a "Transferir" → "Escanear QR", puede escanear el código que genera esta herramienta. Automáticamente aparece tu número en la pantalla de envío y el pagador solo escribe el monto. Lo mismo funciona en Daviplata. Es el método más rápido para cobros en persona: lo imprimes, lo pegas en tu puesto y listo.</p><p>La calidad del QR es alta resolución para que funcione bien impreso en papel, adhesivo o cartón.</p><h2>El mensaje de WhatsApp prellenado: para ventas remotas</h2><p>Para negocios que operan por redes sociales — que en Colombia son la mayoría — el botón de WhatsApp es el más útil. Genera un mensaje tipo: <em>"Hola, por favor págame $35.000 por Nequi al celular 3101234567 – concepto: x10 empanadas"</em>. El cliente solo tiene que abrir la app, buscar el número y confirmar. Cero errores de digitación, cero excusas de "no vi el número bien".</p><h2>La tarjeta de cobro: para compartir en redes o stories</h2><p>La tarjeta muestra de forma clara la plataforma, tu número, el monto y el concepto. Puedes hacer captura de pantalla y enviarla por Instagram, TikTok o cualquier chat. Es lo que hacen la mayoría de emprendedores informales — esta herramienta te ahorra el hacerlo a mano cada vez.</p><h2>¿Para quién sirve esta herramienta?</h2><ul><li><strong>Vendedores de Instagram, TikTok y WhatsApp</strong> que necesitan cobrar rápido sin pasarela de pagos.</li><li><strong>Freelancers y trabajadores independientes</strong> que cobran por proyecto o por hora.</li><li><strong>Tiendas de barrio y negocios pequeños</strong> que quieren ofrecer pago digital sin datafono.</li><li><strong>Personas normales</strong> que quieren dividir la cuenta del restaurante o cobrar una vaca.</li><li><strong>Domiciliarios y repartidores</strong> que cobran contra entrega.</li></ul><h2>Tips para cobrar más rápido</h2><ul><li>Imprime el QR en tamaño mínimo de 6x6 cm para que se escanee bien con cámara de lejos.</li><li>Incluye siempre un concepto claro. "Pago pendiente" no dice nada. "Camiseta negra talla L" sí.</li><li>Si vendes en ferias, genera un QR sin monto fijo — el cliente abre la app y escribe el valor según lo que compró.</li><li>Comparte el mensaje de WhatsApp apenas cierres la venta. Entre más tiempo pase, más probable que el cliente "lo deje para después".</li></ul>
`;

export default function GeneradorLinkCobro() {
  const [plataforma, setPlataforma] = useState("Nequi");
  const [celular, setCelular] = useState("");
  const [monto, setMonto] = useState("");
  const [concepto, setConcepto] = useState("");
  const [resultado, setResultado] = useState<{
    whatsapp: string;
    mensaje: string;
  } | null>(null);
  const [error, setError] = useState("");
  const [copiadoNum, setCopiadoNum] = useState(false);
  const [qrReady, setQrReady] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js";
    script.async = true;
    script.onload = () => setQrReady(true);
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);

  const generateQR = (phone: string) => {
    if (!qrRef.current || !(window as any).QRCode) return;
    qrRef.current.innerHTML = "";
    // QR encodes just the phone number — works in Nequi/Daviplata scanner
    new (window as any).QRCode(qrRef.current, {
      text: phone,
      width: 256,
      height: 256,
      colorDark: "#1D9E75",
      colorLight: "#ffffff",
      correctLevel: (window as any).QRCode.CorrectLevel.H,
    });
  };

  const handleGenerar = () => {
    setError("");
    setResultado(null);
    setCopiadoNum(false);

    const phone = celular.trim().replace(/\D/g, "");
    if (!phone || phone.length < 7) {
      setError("Ingresa un número de celular o cuenta válido.");
      return;
    }
    if (monto && (parseInt(monto, 10) < 100 || parseInt(monto, 10) > 10000000)) {
      setError("El monto debe estar entre $100 y $10.000.000 COP.");
      return;
    }

    const montoNum = monto ? parseInt(monto, 10) : null;
    const montoStr = montoNum ? `$${montoNum.toLocaleString("es-CO")}` : null;
    const conceptoStr = concepto.trim();

    let mensaje = `Por favor págame`;
    if (montoStr) mensaje += ` ${montoStr}`;
    mensaje += ` por ${plataforma} al celular ${phone}`;
    if (conceptoStr) mensaje += ` – concepto: ${conceptoStr}`;

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
    setResultado({ whatsapp: whatsappUrl, mensaje });

    setTimeout(() => { generateQR(phone); }, 100);
  };

  const handleDescargarQR = () => {
    if (!qrRef.current) return;
    const canvas = qrRef.current.querySelector("canvas");
    if (!canvas) return;
    const a = document.createElement("a");
    a.download = `qr-cobro-${plataforma.toLowerCase().replace(/ /g, "-")}.png`;
    a.href = canvas.toDataURL("image/png");
    a.click();
  };

  const handleCopiarNumero = () => {
    const phone = celular.trim().replace(/\D/g, "");
    navigator.clipboard.writeText(phone).then(() => {
      setCopiadoNum(true);
      setTimeout(() => setCopiadoNum(false), 2000);
    });
  };

  const faqs = [
    {
      q: "¿El QR abre Nequi directamente con mi número prellenado?",
      a: "Sí, pero de una forma específica: el receptor abre la app de Nequi, va a Transferir → Escanear QR, y al escanear el código aparece tu número en la pantalla de envío. El monto lo escribe el pagador manualmente. Lo mismo funciona en Daviplata. No es un link externo que \"abre la app automáticamente\" — es un QR que funciona desde dentro de las apps.",
    },
    {
      q: "¿Por qué no hay un 'link directo' que abra la app con el monto ya puesto?",
      a: "Nequi y Daviplata no exponen esa funcionalidad desde webs externas — es una decisión de seguridad de cada app. Los links de cobro que generan ellas mismas (como el de 'Solicitar dinero' de Nequi) solo se crean desde dentro de la app con sesión iniciada. Lo que sí funciona desde afuera es el QR con número y el mensaje de WhatsApp, que es lo que ofrece esta herramienta.",
    },
    {
      q: "¿Cobran algo por usar la herramienta?",
      a: "No, es completamente gratis. Todo se procesa en tu navegador — ningún dato sale a ningún servidor. Genera cuantos QR y mensajes necesites sin costo ni registro.",
    },
    {
      q: "¿El QR se puede imprimir o solo funciona en pantalla?",
      a: "Funciona en ambos formatos. Se descarga como PNG de alta resolución. Lo puedes imprimir en papel, adhesivo, cartón o tarjeta de presentación. Para uso impreso recomendamos mínimo 6×6 cm para que se escanee bien con cámara a distancia.",
    },
    {
      q: "¿Puedo generar un QR sin poner monto?",
      a: "Sí. El campo de monto es opcional. Sin monto, el QR y el mensaje solo incluyen tu número y concepto — el pagador escribe el valor manualmente al abrir la app. Útil si vendes productos con precios variables.",
    },
    {
      q: "¿Funciona para Bancolombia también?",
      a: "Para Bancolombia el QR funciona si el pagador tiene la app Bancolombia y usa la opción de transferir por QR. El mensaje de WhatsApp funciona para cualquier plataforma porque incluye el número de cuenta y el monto de forma clara.",
    },
  ];

  const platformColors: Record<string, string> = {
    Nequi: "bg-purple-100 text-purple-700 border-purple-200",
    Daviplata: "bg-red-100 text-red-700 border-red-200",
    "Bancolombia Personas": "bg-yellow-100 text-yellow-700 border-yellow-200",
  };
  const platformEmojis: Record<string, string> = {
    Nequi: "💜",
    Daviplata: "❤️",
    "Bancolombia Personas": "💛",
  };

  const phoneDisplay = celular.trim().replace(/\D/g, "");
  const montoDisplay = monto ? `$${parseInt(monto).toLocaleString("es-CO")}` : null;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org", "@type": "WebApplication",
        name: "Generador de Tarjeta de Cobro Nequi / Daviplata con QR",
        url: "https://calcutools.online/generador-link-cobro-nequi-daviplata",
        description: "Genera gratis tu QR de cobro Nequi, Daviplata o Bancolombia con mensaje de WhatsApp prellenado. Sin registro, 100% en tu navegador.",
        applicationCategory: "FinanceApplication", operatingSystem: "All",
        offers: { "@type": "Offer", price: "0", priceCurrency: "COP" },
      })}} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org", "@type": "HowTo",
        name: "Cómo generar un QR de cobro Nequi, Daviplata o Bancolombia",
        description: "Genera un QR de cobro con tu número y mensaje de WhatsApp prellenado en menos de 30 segundos.",
        step: [
          { "@type": "HowToStep", position: 1, name: "Selecciona plataforma", text: "Elige Nequi, Daviplata o Bancolombia." },
          { "@type": "HowToStep", position: 2, name: "Ingresa tu número", text: "Escribe tu número de celular o cuenta." },
          { "@type": "HowToStep", position: 3, name: "Agrega monto y concepto", text: "Escribe el valor a cobrar y el concepto del pago (ambos opcionales)." },
          { "@type": "HowToStep", position: 4, name: "Genera y comparte", text: "Haz clic en Generar. Descarga el QR o comparte el mensaje por WhatsApp." },
        ],
      })}} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org", "@type": "FAQPage",
        mainEntity: faqs.map((f) => ({
          "@type": "Question", name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      })}} />

      <div className="min-h-screen bg-white text-[#2C2C2A] font-sans">
        {/* HEADER */}
        <header className="bg-[#E1F5EE] border-b border-[#1D9E75]/20 px-4 py-6 md:px-8">
          <div className="max-w-3xl mx-auto">
            <nav className="text-sm text-[#5F5E5A] mb-3" aria-label="Breadcrumb">
              <ol className="flex flex-wrap items-center gap-1">
                <li><a href="/" className="hover:text-[#1D9E75] transition-colors">Inicio</a></li>
                <li>/</li>
                <li><a href="/herramientas" className="hover:text-[#1D9E75] transition-colors">Herramientas</a></li>
                <li>/</li>
                <li className="text-[#1D9E75] font-medium" aria-current="page">QR de Cobro Nequi / Daviplata</li>
              </ol>
            </nav>
            <h1 className="text-2xl md:text-3xl font-bold text-[#2C2C2A] leading-tight mb-2">
              Generador de QR de Cobro Nequi, Daviplata y Bancolombia
            </h1>
            <p className="text-[#5F5E5A] text-base md:text-lg leading-relaxed">
              Crea tu QR con número de celular y mensaje de WhatsApp prellenado — listo para compartir o imprimir
            </p>
          </div>
        </header>

        {/* INTRO */}
        <div className="max-w-3xl mx-auto px-4 md:px-8 pt-6">
          <p className="text-[#5F5E5A] leading-relaxed bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-4 text-sm md:text-base">
            Te acaban de comprar algo por Instagram, el cliente dice "pásame tu Nequi" y tú ahí dictando el número dígito a dígito. Eso le pasa a miles de vendedores todos los días. Esta herramienta genera en segundos un <strong>QR con tu número</strong> (que el pagador escanea desde la app) y un <strong>mensaje de WhatsApp listo para enviar</strong> con el monto y concepto. Sin apps adicionales, sin registro, sin vueltas.
          </p>
        </div>

        {/* MAIN WIDGET */}
        <main className="max-w-3xl mx-auto px-4 md:px-8 py-8">
          <div className="bg-white border-2 border-[#1D9E75]/20 rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-[#1D9E75] to-[#0F6E56] px-6 py-4">
              <h2 className="text-white font-bold text-lg flex items-center gap-2">
                <span>🔗</span> Genera tu QR de cobro gratis
              </h2>
            </div>

            <div className="p-5 md:p-7 space-y-5">
              {/* Plataforma */}
              <div>
                <label className="block text-sm font-semibold text-[#2C2C2A] mb-2">Plataforma de cobro</label>
                <div className="grid grid-cols-3 gap-2">
                  {["Nequi", "Daviplata", "Bancolombia Personas"].map((p) => (
                    <button key={p} onClick={() => setPlataforma(p)}
                      className={`py-3 px-2 rounded-xl border-2 text-xs font-semibold transition-all text-center ${
                        plataforma === p
                          ? "border-[#1D9E75] bg-[#E1F5EE] text-[#1D9E75]"
                          : "border-gray-200 bg-white text-[#5F5E5A] hover:border-[#1D9E75]/40"
                      }`}>
                      <div className="text-lg mb-1">{platformEmojis[p]}</div>
                      <div>{p === "Bancolombia Personas" ? "Bancolombia" : p}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Celular */}
              <div>
                <label className="block text-sm font-semibold text-[#2C2C2A] mb-1">
                  {plataforma === "Bancolombia Personas" ? "Número de cuenta Bancolombia" : "Tu número de celular"}
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input type="tel" value={celular} onChange={(e) => setCelular(e.target.value)}
                  placeholder="3001234567" maxLength={20}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-[#2C2C2A] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1D9E75] focus:border-transparent transition text-base" />
              </div>

              {/* Monto */}
              <div>
                <label className="block text-sm font-semibold text-[#2C2C2A] mb-1">
                  Monto a cobrar (COP) <span className="text-[#5F5E5A] font-normal text-xs">— Opcional</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5F5E5A] font-semibold">$</span>
                  <input type="number" value={monto} onChange={(e) => setMonto(e.target.value)}
                    placeholder="Opcional" min={100} max={10000000}
                    className="w-full border border-gray-300 rounded-xl pl-8 pr-4 py-3 text-[#2C2C2A] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1D9E75] focus:border-transparent transition text-base" />
                </div>
                {monto && (
                  <p className="text-xs text-[#1D9E75] mt-1">= ${parseInt(monto || "0").toLocaleString("es-CO")} COP</p>
                )}
              </div>

              {/* Concepto */}
              <div>
                <label className="block text-sm font-semibold text-[#2C2C2A] mb-1">Concepto del cobro</label>
                <input type="text" value={concepto} onChange={(e) => setConcepto(e.target.value)}
                  placeholder="Ej: Domicilio pedido #42" maxLength={60}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-[#2C2C2A] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1D9E75] focus:border-transparent transition text-base" />
                <p className="text-xs text-[#5F5E5A] mt-1 text-right">{concepto.length}/60</p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm flex items-center gap-2">
                  <span>⚠️</span> {error}
                </div>
              )}

              <button onClick={handleGenerar}
                className="w-full bg-[#1D9E75] hover:bg-[#0F6E56] text-white font-bold py-4 rounded-xl transition-all text-base shadow-md hover:shadow-lg active:scale-95">
                🔗 Generar QR de cobro
              </button>
            </div>

            {/* RESULTADOS */}
            {resultado && (
              <div role="status" aria-live="polite"
                className="border-t border-[#1D9E75]/20 bg-[#F0FBF7] px-5 md:px-7 py-6 space-y-6">
                <div className="flex items-center gap-2">
                  <span className="text-[#1D9E75] text-xl">✅</span>
                  <h3 className="font-bold text-[#2C2C2A] text-lg">¡Listo para compartir!</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${platformColors[plataforma]}`}>
                    {platformEmojis[plataforma]} {plataforma}
                  </span>
                </div>

                {/* Tarjeta de cobro visual */}
                <div>
                  <p className="text-sm font-semibold text-[#2C2C2A] mb-3">🪪 Tarjeta de cobro</p>
                  <div className="bg-white border-2 border-[#1D9E75]/30 rounded-2xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-[#1D9E75]">{platformEmojis[plataforma]} {plataforma}</span>
                      {montoDisplay && (
                        <span className="text-2xl font-bold text-[#2C2C2A]">{montoDisplay}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-mono font-bold text-[#2C2C2A] tracking-wider">{phoneDisplay}</span>
                      <button onClick={handleCopiarNumero}
                        className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all ${
                          copiadoNum ? "bg-green-500 text-white" : "bg-[#1D9E75]/10 text-[#1D9E75] hover:bg-[#1D9E75]/20"
                        }`}>
                        {copiadoNum ? "✓ Copiado" : "Copiar número"}
                      </button>
                    </div>
                    {concepto && (
                      <p className="text-sm text-[#5F5E5A] bg-[#F9FAFB] rounded-lg px-3 py-2">
                        📝 {concepto}
                      </p>
                    )}
                    <p className="text-xs text-[#5F5E5A]">
                      💡 Haz captura de pantalla de esta tarjeta para compartirla por Instagram o WhatsApp
                    </p>
                  </div>
                </div>

                {/* QR */}
                <div>
                  <p className="text-sm font-semibold text-[#2C2C2A] mb-1">📱 Código QR con tu número</p>
                  <p className="text-xs text-[#5F5E5A] mb-3">
                    El pagador abre Nequi/Daviplata → Transferir → Escanear QR → tu número aparece automáticamente
                  </p>
                  <div className="flex flex-col items-center gap-4">
                    <div className="bg-white p-4 rounded-2xl shadow-md border border-gray-100 inline-block" ref={qrRef} />
                    <button onClick={handleDescargarQR}
                      className="bg-white border-2 border-[#1D9E75] text-[#1D9E75] font-semibold px-6 py-3 rounded-xl hover:bg-[#E1F5EE] transition-all text-sm flex items-center gap-2">
                      ⬇️ Descargar QR en PNG
                    </button>
                    <p className="text-xs text-[#5F5E5A] text-center">Alta resolución — imprimible en adhesivo, cartón o papel</p>
                  </div>
                </div>

                {/* Vista previa mensaje */}
                <div>
                  <p className="text-sm font-semibold text-[#2C2C2A] mb-2">💬 Mensaje prellenado para enviar</p>
                  <div className="bg-white border border-gray-200 rounded-xl p-4 text-sm text-[#5F5E5A] leading-relaxed whitespace-pre-wrap">
                    {resultado.mensaje}
                  </div>
                </div>

                {/* Botón WhatsApp */}
                <a href={resultado.whatsapp} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 w-full bg-[#25D366] hover:bg-[#1dba58] text-white font-bold py-4 rounded-xl transition-all text-base shadow-md hover:shadow-lg">
                  <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  Enviar mensaje de cobro por WhatsApp
                </a>

                <p className="text-xs text-center text-[#5F5E5A]">
                  🔒 Tu información no se almacena. Todo se procesa en tu navegador.
                </p>
              </div>
            )}
          </div>
        </main>

        {/* CÓMO USAR */}
        <section className="max-w-3xl mx-auto px-4 md:px-8 py-8">
          <div className="bg-[#F9FAFB] border border-gray-200 rounded-2xl p-6 md:p-8">
            <h2 className="text-xl font-bold text-[#2C2C2A] mb-5 flex items-center gap-2">
              <span>📋</span> ¿Cómo usar el Generador de QR de Cobro?
            </h2>
            <ol className="space-y-4">
              {[
                { num: "1", title: "Selecciona la plataforma", desc: "Elige entre Nequi, Daviplata o Bancolombia Personas según la app que uses para recibir pagos." },
                { num: "2", title: "Ingresa tu número y monto", desc: "Escribe tu número de celular (o cuenta Bancolombia) y el monto en pesos colombianos que quieres cobrar. Ambos son opcionales si solo quieres el QR genérico." },
                { num: "3", title: "Agrega un concepto", desc: "Escribe una referencia corta del cobro — por ejemplo: 'Camiseta talla M' o 'Almuerzo ejecutivo'. Aparece en el mensaje de WhatsApp." },
                { num: "4", title: "Genera y comparte", desc: "Haz clic en Generar. Descarga el QR en PNG para imprimirlo, o usa el botón de WhatsApp para enviar el mensaje de cobro directo." },
              ].map((paso) => (
                <li key={paso.num} className="flex gap-4 items-start">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#1D9E75] text-white font-bold text-sm flex items-center justify-center">{paso.num}</span>
                  <div>
                    <p className="font-semibold text-[#2C2C2A] text-sm">{paso.title}</p>
                    <p className="text-[#5F5E5A] text-sm leading-relaxed">{paso.desc}</p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-6 bg-[#E1F5EE] border border-[#1D9E75]/20 rounded-xl p-4">
              <p className="text-sm font-semibold text-[#1D9E75] mb-1">📌 Ejemplo real</p>
              <p className="text-sm text-[#5F5E5A] leading-relaxed">
                Vendes empanadas a $3.500 c/u, un cliente pide 10. Seleccionas <strong>Nequi</strong>, escribes tu celular <strong>3101234567</strong>, monto <strong>$35.000</strong>, concepto <em>"x10 empanadas"</em>. La herramienta genera un QR con tu número (el pagador lo escanea desde Nequi → Transferir) y un mensaje de WhatsApp listo: <em>"Por favor págame $35.000 por Nequi al celular 3101234567 – concepto: x10 empanadas"</em>.
              </p>
            </div>
          </div>
        </section>

        {/* CONTENIDO PRINCIPAL */}
        <section className="max-w-3xl mx-auto px-4 md:px-8 py-4">
          <div className="[&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-[#2C2C2A] [&_h2]:mt-10 [&_h2]:mb-4 [&_p]:text-[#5F5E5A] [&_p]:leading-relaxed [&_p]:mb-5 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2 [&_li]:text-[#5F5E5A] [&_strong]:font-semibold [&_strong]:text-[#2C2C2A] [&_em]:italic"
            dangerouslySetInnerHTML={{ __html: contenidoPrincipal }} />
        </section>

        {/* FAQ */}
        <section className="max-w-3xl mx-auto px-4 md:px-8 py-8">
          <h2 className="text-xl font-bold text-[#2C2C2A] mb-6 flex items-center gap-2">
            <span>❓</span> Preguntas frecuentes
          </h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full text-left px-5 py-4 flex justify-between items-start gap-3 hover:bg-[#F9FAFB] transition-colors"
                  aria-expanded={openFaq === i}>
                  <span className="font-semibold text-[#2C2C2A] text-sm leading-snug">{faq.q}</span>
                  <span className="text-[#1D9E75] text-lg flex-shrink-0 mt-0.5">{openFaq === i ? "−" : "+"}</span>
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4 text-[#5F5E5A] text-sm leading-relaxed border-t border-gray-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* HERRAMIENTAS RELACIONADAS */}
        <section className="max-w-3xl mx-auto px-4 md:px-8 py-8 pb-16">
          <h2 className="text-xl font-bold text-[#2C2C2A] mb-5 flex items-center gap-2">
            <span>🛠️</span> Herramientas relacionadas
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { href: "/calculadora-precio-venta-emprendimiento", title: "Calculadora de Precio de Venta", desc: "Define el precio justo para tus productos sumando costos y margen de ganancia.", emoji: "🏷️" },
              { href: "/generador-recibo-pago-colombia", title: "Generador de Recibo de Pago", desc: "Crea y descarga un recibo de pago profesional gratis en segundos.", emoji: "🧾" },
              { href: "/calculadora-costo-envio-colombia", title: "Calculadora de Costo de Envío", desc: "Calcula el valor del domicilio para tu negocio según ciudad y peso.", emoji: "📦" },
            ].map((tool) => (
              <a key={tool.href} href={tool.href}
                className="group bg-white border border-gray-200 rounded-xl p-5 hover:border-[#1D9E75] hover:shadow-md transition-all">
                <div className="text-2xl mb-3">{tool.emoji}</div>
                <h3 className="font-semibold text-[#2C2C2A] text-sm mb-2 group-hover:text-[#1D9E75] transition-colors leading-snug">{tool.title}</h3>
                <p className="text-[#5F5E5A] text-xs leading-relaxed">{tool.desc}</p>
                <span className="text-[#1D9E75] text-xs font-semibold mt-3 inline-block">Usar herramienta →</span>
              </a>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
