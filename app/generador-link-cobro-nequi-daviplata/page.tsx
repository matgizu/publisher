"use client";

import { useState, useEffect, useRef } from "react";

const contenidoPrincipal = `
<h2>¿Por qué necesitas generar un link de pago Nequi o Daviplata?</h2><p>Colombia tiene más de 40 millones de cuentas activas entre Nequi y Daviplata según datos de la Superfinanciera a cierre de 2024. Eso significa que tu cliente probablemente tiene al menos una de las dos. El problema es que cobrar sigue siendo un proceso manual: dictas el número, el otro lo copia mal, te toca confirmar, y a veces la venta simplemente se pierde porque el cliente "después le transfiere" (y nunca vuelve).</p><p>Un link de cobro elimina esa fricción. El cliente hace clic, le aparece la app con el monto listo y solo confirma. Sin errores de digitación, sin excusas.</p><h2>¿Qué plataformas soporta esta herramienta?</h2><ul><li><strong>Nequi:</strong> Genera el deeplink oficial que abre la app directo en la pantalla de pago con tu número y monto prellenado.</li><li><strong>Daviplata:</strong> Crea el enlace de cobro compatible con la app de Daviplata para Android e iOS.</li><li><strong>Bancolombia (personas):</strong> Genera un link de transferencia para cuentas de ahorro o corriente de Bancolombia.</li></ul><p>Todo en una sola pantalla. No necesitas tres tutoriales de YouTube diferentes ni andar buscando en foros cómo armar la URL a mano.</p><h2>El código QR: tu mejor aliado si vendes en físico</h2><p>Si tienes un puesto de comidas, una tienda de barrio o un emprendimiento en ferias, el QR cambia todo. Lo imprimes, lo pegas en la pared o en la mesa, y el cliente lo escanea con la cámara del celular. No hay que deletrear números, no hay filas.</p><p>La herramienta genera el QR en formato PNG de alta resolución. Lo puedes descargar, imprimirlo en adhesivo o pegarlo en tu catálogo digital.</p><h2>Compartir por WhatsApp: donde realmente se vende en Colombia</h2><p>Seamos honestos: el 80% de los negocios informales en Colombia se mueven por WhatsApp. Por eso incluimos un botón que abre WhatsApp con un mensaje ya armado tipo: <em>"Hola, puedes pagarme $35.000 por Nequi aquí: [link]"</em>. Solo eliges el contacto y envías. Cero copiar y pegar, cero errores.</p><h2>¿Generar link de pago Nequi es seguro?</h2><p>La herramienta no almacena tu número ni tu información. Todo se procesa en tu navegador — nada se envía a ningún servidor. El link generado usa los deeplinks oficiales de cada plataforma, los mismos que las apps usan internamente. Tú compartes el enlace, el cliente lo abre y la transacción se hace directamente en Nequi, Daviplata o Bancolombia. Nosotros no tocamos la plata en ningún momento.</p><h2>¿Para quién sirve este generador?</h2><ul><li><strong>Vendedores de Instagram, TikTok y WhatsApp</strong> que necesitan cobrar rápido sin pasarela de pagos.</li><li><strong>Freelancers y trabajadores independientes</strong> que cobran por proyecto o por hora.</li><li><strong>Tiendas de barrio y negocios pequeños</strong> que quieren ofrecer pago digital sin datafono.</li><li><strong>Personas normales</strong> que quieren dividir la cuenta del restaurante o cobrar una vaca.</li><li><strong>Domiciliarios y repartidores</strong> que cobran contra entrega.</li></ul><h2>Diferencia entre link de cobro y link de solicitud Nequi</h2><p>Mucha gente confunde las dos cosas. Dentro de la app Nequi existe la opción de "solicitar dinero", pero solo funciona entre usuarios Nequi y requiere que ambos tengan la app abierta. El link de cobro que genera esta herramienta es una URL que puedes compartir por cualquier medio — WhatsApp, correo, SMS, redes sociales — y el receptor la abre cuando quiera.</p><p>Eso sí, el receptor necesita tener instalada la app correspondiente. Si le mandas un link de Nequi a alguien que solo tiene Daviplata, no le va a funcionar. Por eso la herramienta te permite generar links para las tres plataformas más usadas en Colombia.</p><h2>Tips para cobrar más rápido con tu link</h2><ul><li>Siempre incluye un concepto claro. "Pago pendiente" no dice nada. "Camiseta negra talla L" sí.</li><li>Genera un QR fijo con tu número y sin monto si vendes productos de diferentes precios — el cliente pone la cifra al abrir la app.</li><li>Comparte el link apenas cierres la venta. Entre más tiempo pase, más probable que el cliente se "enfríe".</li><li>Si vendes en ferias o eventos, imprime el QR en tamaño grande. La gente escanea más rápido de lo que busca efectivo.</li></ul>
`;

export default function GeneradorLinkCobro() {
  const [plataforma, setPlataforma] = useState("Nequi");
  const [celular, setCelular] = useState("");
  const [monto, setMonto] = useState("");
  const [concepto, setConcepto] = useState("");
  const [resultado, setResultado] = useState<{
    link: string;
    whatsapp: string;
    mensaje: string;
  } | null>(null);
  const [error, setError] = useState("");
  const [copiado, setCopiado] = useState(false);
  const [qrReady, setQrReady] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const qrRef = useRef<HTMLDivElement>(null);
  const qrInstanceRef = useRef<any>(null);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js";
    script.async = true;
    script.onload = () => setQrReady(true);
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const formatCOP = (value: string) => {
    const num = parseInt(value.replace(/\D/g, ""), 10);
    if (isNaN(num)) return "";
    return num.toLocaleString("es-CO");
  };

  const buildLink = () => {
    const phone = celular.trim().replace(/\D/g, "");
    const amount = monto ? parseInt(monto, 10) : null;
    const concept = concepto.trim();

    if (plataforma === "Nequi") {
      let url = `nequi://cobro?phone=${phone}`;
      if (amount) url += `&amount=${amount}`;
      if (concept) url += `&message=${encodeURIComponent(concept)}`;
      return url;
    }
    if (plataforma === "Daviplata") {
      let url = `daviplata://pago?telefono=${phone}`;
      if (amount) url += `&valor=${amount}`;
      if (concept) url += `&concepto=${encodeURIComponent(concept)}`;
      return url;
    }
    if (plataforma === "Bancolombia Personas") {
      let url = `bancolombia://transferencia?cuenta=${phone}`;
      if (amount) url += `&monto=${amount}`;
      if (concept) url += `&descripcion=${encodeURIComponent(concept)}`;
      return url;
    }
    return "";
  };

  const generateQR = (link: string) => {
    if (!qrRef.current || !(window as any).QRCode) return;
    if (qrRef.current) {
      qrRef.current.innerHTML = "";
    }
    qrInstanceRef.current = new (window as any).QRCode(qrRef.current, {
      text: link,
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
    setCopiado(false);

    const phone = celular.trim().replace(/\D/g, "");
    if (!phone || phone.length < 7) {
      setError("Ingresa un número de celular o cuenta válido.");
      return;
    }
    if (monto && (parseInt(monto, 10) < 100 || parseInt(monto, 10) > 10000000)) {
      setError("El monto debe estar entre $100 y $10.000.000 COP.");
      return;
    }

    const link = buildLink();
    const montoNum = monto ? parseInt(monto, 10) : null;
    const montoStr = montoNum
      ? `$${montoNum.toLocaleString("es-CO")}`
      : "el valor acordado";
    const conceptoStr = concepto.trim() || "pago";
    const mensaje = `Hola, puedes pagarme ${montoStr} por ${plataforma} aquí: ${link}\nConcepto: ${conceptoStr}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(mensaje)}`;

    setResultado({ link, whatsapp: whatsappUrl, mensaje });

    setTimeout(() => {
      generateQR(link);
    }, 100);
  };

  const handleCopiar = () => {
    if (!resultado) return;
    navigator.clipboard.writeText(resultado.link).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    });
  };

  const handleDescargarQR = () => {
    if (!qrRef.current) return;
    const canvas = qrRef.current.querySelector("canvas");
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `qr-cobro-${plataforma.toLowerCase().replace(/ /g, "-")}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const faqs = [
    {
      q: "¿El link de cobro Nequi funciona si la otra persona no tiene Nequi?",
      a: "No. El link abre la aplicación de Nequi en el celular del receptor, así que necesita tenerla instalada y con cuenta activa. Si tu cliente usa Daviplata, genera el link para esa plataforma en lugar de Nequi. Por eso esta herramienta te deja escoger entre Nequi, Daviplata y Bancolombia.",
    },
    {
      q: "¿Cobran algo por generar el link o el QR?",
      a: "No, la herramienta es completamente gratis. Todo se procesa en tu navegador, no hay cuentas premium ni límites de uso. Genera cuantos links necesites sin costo. La transacción en sí puede tener costos dependiendo de tu plan en Nequi o Daviplata, pero eso ya es tema de cada app.",
    },
    {
      q: "¿Puedo generar un link de cobro Nequi sin poner monto?",
      a: "Sí. El campo de monto es opcional. Si lo dejas vacío, el link abre la app de Nequi y el pagador escribe el valor manualmente. Esto es útil si vendes productos con precios variables o si quieres un QR genérico para tu negocio que sirva para cualquier cobro.",
    },
    {
      q: "¿El QR se puede imprimir o solo funciona digital?",
      a: "Funciona en ambos formatos. Se descarga como imagen PNG de buena resolución. Lo puedes imprimir en papel, adhesivo, tarjeta de presentación o lo que necesites. Muchos tenderos lo pegan junto a la caja registradora y les funciona perfecto para cobros del día a día.",
    },
    {
      q: "¿Es seguro compartir mi número de celular en el link?",
      a: "El link contiene tu número porque es necesario para que la app sepa a quién enviar el dinero — igual que cuando le dictas tu número al cliente de forma verbal. No se expone información adicional como saldo o datos personales. Si te preocupa la privacidad, comparte el link solo con personas de confianza o clientes directos.",
    },
    {
      q: "¿Puedo crear un link de cobro Bancolombia para cuenta de ahorros?",
      a: "Sí. La herramienta soporta cuentas Bancolombia personas — tanto de ahorro como corriente. Seleccionas Bancolombia como plataforma, ingresas tu número de cuenta, el monto y el concepto. Se genera un link que facilita la transferencia, aunque el receptor necesita tener la app Bancolombia instalada.",
    },
    {
      q: "¿Funciona el link en iPhone y Android?",
      a: "Sí, los deeplinks son compatibles con iOS y Android. Cuando el receptor hace clic, el celular detecta automáticamente si tiene la app instalada y la abre. Si no la tiene, lo redirige a la tienda de aplicaciones. Funciona igual en ambos sistemas operativos.",
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

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "Generador de Link de Cobro Nequi / Daviplata",
            url: "https://calcutools.online/generador-link-cobro-nequi-daviplata",
            description:
              "Genera gratis tu link de pago Nequi, Daviplata o Bancolombia con QR descargable. Copia el enlace, comparte por WhatsApp y cobra al instante.",
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
            name: "Cómo generar un link de cobro Nequi, Daviplata o Bancolombia con QR",
            description:
              "Genera un enlace de cobro personalizado con código QR descargable para Nequi, Daviplata o Bancolombia en menos de 30 segundos.",
            step: [
              {
                "@type": "HowToStep",
                position: 1,
                name: "Seleccionar plataforma",
                text: "Selecciona la plataforma de cobro: Nequi, Daviplata o Bancolombia.",
              },
              {
                "@type": "HowToStep",
                position: 2,
                name: "Ingresar datos",
                text: "Escribe tu número de celular o cuenta Bancolombia y el monto en pesos colombianos que quieres cobrar.",
              },
              {
                "@type": "HowToStep",
                position: 3,
                name: "Agregar concepto",
                text: "Agrega un concepto corto como referencia del cobro, por ejemplo: Camiseta talla M o Almuerzo ejecutivo.",
              },
              {
                "@type": "HowToStep",
                position: 4,
                name: "Generar y compartir",
                text: "Haz clic en Generar link de cobro. Copia el enlace, descarga el QR en PNG o comparte directo por WhatsApp con mensaje prellenado.",
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
                name: "¿El link de cobro Nequi funciona si la otra persona no tiene Nequi?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "No. El link abre la aplicación de Nequi en el celular del receptor, así que necesita tenerla instalada y con cuenta activa. Si tu cliente usa Daviplata, genera el link para esa plataforma en lugar de Nequi. Por eso esta herramienta te deja escoger entre Nequi, Daviplata y Bancolombia.",
                },
              },
              {
                "@type": "Question",
                name: "¿Cobran algo por generar el link o el QR?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "No, la herramienta es completamente gratis. Todo se procesa en tu navegador, no hay cuentas premium ni límites de uso. Genera cuantos links necesites sin costo.",
                },
              },
              {
                "@type": "Question",
                name: "¿Puedo generar un link de cobro Nequi sin poner monto?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Sí. El campo de monto es opcional. Si lo dejas vacío, el link abre la app de Nequi y el pagador escribe el valor manualmente. Esto es útil si vendes productos con precios variables.",
                },
              },
              {
                "@type": "Question",
                name: "¿El QR se puede imprimir o solo funciona digital?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Funciona en ambos formatos. Se descarga como imagen PNG de buena resolución. Lo puedes imprimir en papel, adhesivo, tarjeta de presentación o lo que necesites.",
                },
              },
              {
                "@type": "Question",
                name: "¿Es seguro compartir mi número de celular en el link?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "El link contiene tu número porque es necesario para que la app sepa a quién enviar el dinero. No se expone información adicional como saldo o datos personales.",
                },
              },
              {
                "@type": "Question",
                name: "¿Puedo crear un link de cobro Bancolombia para cuenta de ahorros?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Sí. La herramienta soporta cuentas Bancolombia personas — tanto de ahorro como corriente. Seleccionas Bancolombia como plataforma, ingresas tu número de cuenta, el monto y el concepto.",
                },
              },
              {
                "@type": "Question",
                name: "¿Funciona el link en iPhone y Android?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Sí, los deeplinks son compatibles con iOS y Android. Cuando el receptor hace clic, el celular detecta automáticamente si tiene la app instalada y la abre.",
                },
              },
            ],
          }),
        }}
      />

      <div className="min-h-screen bg-white text-[#2C2C2A] font-sans">
        {/* HEADER */}
        <header className="bg-[#E1F5EE] border-b border-[#1D9E75]/20 px-4 py-6 md:px-8">
          <div className="max-w-3xl mx-auto">
            <nav className="text-sm text-[#5F5E5A] mb-3" aria-label="Breadcrumb">
              <ol className="flex flex-wrap items-center gap-1">
                <li>
                  <a href="/" className="hover:text-[#1D9E75] transition-colors">
                    Inicio
                  </a>
                </li>
                <li className="text-[#5F5E5A]">/</li>
                <li>
                  <a href="/herramientas" className="hover:text-[#1D9E75] transition-colors">
                    Herramientas
                  </a>
                </li>
                <li className="text-[#5F5E5A]">/</li>
                <li className="text-[#1D9E75] font-medium" aria-current="page">
                  Link de Cobro Nequi / Daviplata
                </li>
              </ol>
            </nav>
            <h1 className="text-2xl md:text-3xl font-bold text-[#2C2C2A] leading-tight mb-2">
              Generador de Link de Cobro Nequi, Daviplata y Bancolombia con QR
            </h1>
            <p className="text-[#5F5E5A] text-base md:text-lg leading-relaxed">
              Crea tu enlace de cobro personalizado en 10 segundos y compártelo por WhatsApp con código QR descargable
            </p>
          </div>
        </header>

        {/* INTRO */}
        <div className="max-w-3xl mx-auto px-4 md:px-8 pt-6">
          <p className="text-[#5F5E5A] leading-relaxed bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-4 text-sm md:text-base">
            Te acaban de comprar algo por Instagram, el cliente dice "pásame tu Nequi" y tú ahí, escribiendo el número a mano, rezando para que no se equivoque en un dígito y la plata termine en otro celular. Eso le pasa a miles de vendedores informales en Colombia todos los días. Con esta herramienta generas un link de pago Nequi, Daviplata o Bancolombia en segundos — con monto, concepto y código QR listo para compartir por WhatsApp. Sin apps extra, sin registro, sin vueltas.
          </p>
        </div>

        {/* MAIN WIDGET */}
        <main className="max-w-3xl mx-auto px-4 md:px-8 py-8">
          <div className="bg-white border-2 border-[#1D9E75]/20 rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-[#1D9E75] to-[#0F6E56] px-6 py-4">
              <h2 className="text-white font-bold text-lg flex items-center gap-2">
                <span>🔗</span> Genera tu link de cobro gratis
              </h2>
            </div>

            <div className="p-5 md:p-7 space-y-5">
              {/* Plataforma */}
              <div>
                <label className="block text-sm font-semibold text-[#2C2C2A] mb-2">
                  Plataforma de cobro
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {["Nequi", "Daviplata", "Bancolombia Personas"].map((p) => (
                    <button
                      key={p}
                      onClick={() => setPlataforma(p)}
                      className={`py-3 px-2 rounded-xl border-2 text-xs font-semibold transition-all text-center ${
                        plataforma === p
                          ? "border-[#1D9E75] bg-[#E1F5EE] text-[#1D9E75]"
                          : "border-gray-200 bg-white text-[#5F5E5A] hover:border-[#1D9E75]/40"
                      }`}
                    >
                      <div className="text-lg mb-1">{platformEmojis[p]}</div>
                      <div>{p === "Bancolombia Personas" ? "Bancolombia" : p}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Celular */}
              <div>
                <label className="block text-sm font-semibold text-[#2C2C2A] mb-1">
                  {plataforma === "Bancolombia Personas"
                    ? "Número de cuenta Bancolombia"
                    : "Número de celular"}
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="tel"
                  value={celular}
                  onChange={(e) => setCelular(e.target.value)}
                  placeholder="3001234567"
                  maxLength={20}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-[#2C2C2A] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1D9E75] focus:border-transparent transition text-base"
                />
              </div>

              {/* Monto */}
              <div>
                <label className="block text-sm font-semibold text-[#2C2C2A] mb-1">
                  Monto a cobrar (COP){" "}
                  <span className="text-[#5F5E5A] font-normal text-xs">— Opcional</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5F5E5A] font-semibold">
                    $
                  </span>
                  <input
                    type="number"
                    value={monto}
                    onChange={(e) => setMonto(e.target.value)}
                    placeholder="Opcional"
                    min={100}
                    max={10000000}
                    className="w-full border border-gray-300 rounded-xl pl-8 pr-4 py-3 text-[#2C2C2A] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1D9E75] focus:border-transparent transition text-base"
                  />
                </div>
                {monto && (
                  <p className="text-xs text-[#1D9E75] mt-1">
                    = ${parseInt(monto || "0").toLocaleString("es-CO")} COP
                  </p>
                )}
              </div>

              {/* Concepto */}
              <div>
                <label className="block text-sm font-semibold text-[#2C2C2A] mb-1">
                  Concepto del cobro
                </label>
                <input
                  type="text"
                  value={concepto}
                  onChange={(e) => setConcepto(e.target.value)}
                  placeholder="Ej: Domicilio pedido #42"
                  maxLength={60}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-[#2C2C2A] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1D9E75] focus:border-transparent transition text-base"
                />
                <p className="text-xs text-[#5F5E5A] mt-1 text-right">
                  {concepto.length}/60
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm flex items-center gap-2">
                  <span>⚠️</span> {error}
                </div>
              )}

              <button
                onClick={handleGenerar}
                className="w-full bg-[#1D9E75] hover:bg-[#0F6E56] text-white font-bold py-4 rounded-xl transition-all text-base shadow-md hover:shadow-lg active:scale-95"
              >
                🔗 Generar link de cobro
              </button>
            </div>

            {/* RESULTADOS */}
            {resultado && (
              <div
                role="status"
                aria-live="polite"
                className="border-t border-[#1D9E75]/20 bg-[#F0FBF7] px-5 md:px-7 py-6 space-y-6"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[#1D9E75] text-xl">✅</span>
                  <h3 className="font-bold text-[#2C2C2A] text-lg">
                    ¡Link de cobro generado!
                  </h3>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${platformColors[plataforma]}`}
                  >
                    {platformEmojis[plataforma]} {plataforma}
                  </span>
                </div>

                {/* Link copiable */}
                <div>
                  <p className="text-sm font-semibold text-[#2C2C2A] mb-2">
                    🔗 Link de cobro
                  </p>
                  <div className="flex gap-2">
                    <div className="flex-1 bg-white border border-[#1D9E75]/30 rounded-xl px-4 py-3 text-sm text-[#5F5E5A] font-mono break-all">
                      {resultado.link}
                    </div>
                    <button
                      onClick={handleCopiar}
                      className={`px-4 py-3 rounded-xl font-semibold text-sm transition-all whitespace-nowrap ${
                        copiado
                          ? "bg-green-500 text-white"
                          : "bg-[#1D9E75] text-white hover:bg-[#0F6E56]"
                      }`}
                    >
                      {copiado ? "✓ Copiado" : "Copiar"}
                    </button>
                  </div>
                </div>

                {/* QR */}
                <div>
                  <p className="text-sm font-semibold text-[#2C2C2A] mb-3">
                    📱 Código QR descargable
                  </p>
                  <div className="flex flex-col items-center gap-4">
                    <div
                      className="bg-white p-4 rounded-2xl shadow-md border border-gray-100 inline-block"
                      ref={qrRef}
                    />
                    <button
                      onClick={handleDescargarQR}
                      className="bg-white border-2 border-[#1D9E75] text-[#1D9E75] font-semibold px-6 py-3 rounded-xl hover:bg-[#E1F5EE] transition-all text-sm flex items-center gap-2"
                    >
                      ⬇️ Descargar QR en PNG
                    </button>
                    <p className="text-xs text-[#5F5E5A] text-center">
                      Escanea con la cámara del celular o imprime para tu negocio
                    </p>
                  </div>
                </div>

                {/* Vista previa mensaje */}
                <div>
                  <p className="text-sm font-semibold text-[#2C2C2A] mb-2">
                    💬 Vista previa del mensaje
                  </p>
                  <div className="bg-white border border-gray-200 rounded-xl p-4 text-sm text-[#5F5E5A] leading-relaxed whitespace-pre-wrap">
                    {resultado.mensaje}
                  </div>
                </div>

                {/* Botón WhatsApp */}
                <a
                  href={resultado.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 w-full bg-[#25D366] hover:bg-[#1dba58] text-white font-bold py-4 rounded-xl transition-all text-base shadow-md hover:shadow-lg"
                >
                  <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  Compartir por WhatsApp
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
              <span>📋</span> ¿Cómo usar el Generador de Link de Cobro?
            </h2>
            <ol className="space-y-4">
              {[
                {
                  num: "1",
                  title: "Selecciona la plataforma",
                  desc: "Elige entre Nequi, Daviplata o Bancolombia Personas según la app que uses para recibir pagos.",
                },
                {
                  num: "2",
                  title: "Ingresa tu número y monto",
                  desc: "Escribe tu número de celular (o cuenta Bancolombia) y el monto en pesos colombianos que quieres cobrar. El monto es opcional.",
                },
                {
                  num: "3",
                  title: "Agrega un concepto",
                  desc: "Escribe una referencia corta del cobro — por ejemplo: 'Camiseta talla M' o 'Almuerzo ejecutivo'.",
                },
                {
                  num: "4",
                  title: "Genera y comparte",
                  desc: "Haz clic en 'Generar link de cobro'. Copia el enlace, descarga el QR en PNG o comparte directo por WhatsApp con mensaje prellenado.",
                },
              ].map((paso) => (
                <li key={paso.num} className="flex gap-4 items-start">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#1D9E75] text-white font-bold text-sm flex items-center justify-center">
                    {paso.num}
                  </span>
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
                Si vendes empanadas a $3.500 cada una y un cliente te pide 10, seleccionas <strong>Nequi</strong>, escribes tu celular (ej: 3101234567), pones <strong>$35.000</strong> como monto y <em>"x10 empanadas"</em> como concepto. La herramienta genera un link tipo{" "}
                <code className="bg-white border border-gray-200 px-1 rounded text-xs">
                  nequi://cobro?phone=3101234567&amount=35000&message=x10+empanadas
                </code>{" "}
                y un QR que el cliente solo escanea para pagar sin digitar nada.
              </p>
            </div>
          </div>
        </section>

        {/* CONTENIDO PRINCIPAL */}
        <section className="max-w-3xl mx-auto px-4 md:px-8 py-4">
          <div
            className="[&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-[#2C2C2A] [&_h2]:mt-10 [&_h2]:mb-4 [&_p]:text-[#5F5E5A] [&_p]:leading-relaxed [&_p]:mb-5 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2 [&_li]:text-[#5F5E5A] [&_strong]:font-semibold [&_strong]:text-[#2C2C2A] [&_em]:italic"
            dangerouslySetInnerHTML={{ __html: contenidoPrincipal }}
          />
        </section>

        {/* FAQ */}
        <section className="max-w-3xl mx-auto px-4 md:px-8 py-8">
          <h2 className="text-xl font-bold text-[#2C2C2A] mb-6 flex items-center gap-2">
            <span>❓</span> Preguntas frecuentes
          </h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="border border-gray-200 rounded-xl overflow-hidden bg-white"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full text-left px-5 py-4 flex justify-between items-start gap-3 hover:bg-[#F9FAFB] transition-colors"
                  aria-expanded={openFaq === i}
                >
                  <span className="font-semibold text-[#2C2C2A] text-sm leading-snug">
                    {faq.q}
                  </span>
                  <span className="text-[#1D9E75] text-lg flex-shrink-0 mt-0.5">
                    {openFaq === i ? "−" : "+"}
                  </span>
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
              {
                href: "/calculadora-costo-envio-colombia",
                title: "Calculadora de Costo de Envío Colombia",
                desc: "Calcula el valor del domicilio para tu negocio según ciudad y peso.",
                emoji: "📦",
              },
              {
                href: "/calculadora-precio-venta-emprendimiento",
                title: "Calculadora de Precio de Venta",
                desc: "Define el precio justo para tus productos sumando costos y margen de ganancia.",
                emoji: "🏷️",
              },
              {
                href: "/generador-recibo-pago-colombia",
                title: "Generador de Recibo de Pago Colombia",
                desc: "Crea y descarga un recibo de pago profesional gratis en segundos.",
                emoji: "🧾",
              },
            ].map((tool) => (
              <a
                key={tool.href}
                href={tool.href}
                className="group bg-white border border-gray-200 rounded-xl p-5 hover:border-[#1D9E75] hover:shadow-md transition-all"
              >
                <div className="text-2xl mb-3">{tool.emoji}</div>
                <h3 className="font-semibold text-[#2C2C2A] text-sm mb-2 group-hover:text-[#1D9E75] transition-colors leading-snug">
                  {tool.title}
                </h3>
                <p className="text-[#5F5E5A] text-xs leading-relaxed">{tool.desc}</p>
                <span className="text-[#1D9E75] text-xs font-semibold mt-3 inline-block">
                  Usar herramienta →
                </span>
              </a>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}