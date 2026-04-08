"use client";

import { useState } from "react";

const ARL_RATES: Record<string, number> = {
  "I (0.522%)": 0.00522,
  "II (1.044%)": 0.01044,
  "III (2.436%)": 0.02436,
  "IV (4.350%)": 0.0435,
  "V (6.960%)": 0.0696,
};

function formatCOP(value: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

interface CalcResult {
  ibc: number;
  salud: number;
  pension: number;
  arl: number;
  total: number;
  ibcMinimo: boolean;
}

function calcularSeguridadSocial(
  ingresoBruto: number,
  arlNivel: string,
  smmlv: number
): CalcResult {
  const ibcCalculado = ingresoBruto * 0.4;
  const ibcMinimo = ibcCalculado < smmlv;
  const ibc = ibcMinimo ? smmlv : ibcCalculado;
  const arlRate = ARL_RATES[arlNivel] ?? 0.00522;
  const salud = ibc * 0.125;
  const pension = ibc * 0.16;
  const arl = ibc * arlRate;
  const total = salud + pension + arl;
  return { ibc, salud, pension, arl, total, ibcMinimo };
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
        data-ad-client={
          process.env.NEXT_PUBLIC_ADSENSE_ID ?? "ca-pub-XXXXXXXXXX"
        }
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}

export default function Page() {
  const [ingreso, setIngreso] = useState<string>("5000000");
  const [arlNivel, setArlNivel] = useState<string>("I (0.522%)");
  const [smmlv, setSmmlv] = useState<string>("1423500");
  const [result, setResult] = useState<CalcResult | null>(null);
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  function handleCalcular() {
    const ing = parseFloat(ingreso);
    const sal = parseFloat(smmlv);
    if (isNaN(ing) || isNaN(sal) || ing <= 0 || sal <= 0) return;
    const res = calcularSeguridadSocial(ing, arlNivel, sal);
    setResult(res);
    setVisible(false);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setVisible(true));
    });
  }

  function handleCopiar() {
    if (!result) return;
    const text = `Seguridad Social Independiente Colombia 2026\nIBC: ${formatCOP(result.ibc)}${result.ibcMinimo ? " (mínimo SMMLV aplicado)" : ""}\nSalud (12.5%): ${formatCOP(result.salud)}\nPensión (16%): ${formatCOP(result.pension)}\nARL (${arlNivel}): ${formatCOP(result.arl)}\nTotal: ${formatCOP(result.total)}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const faqs = [
    {
      q: "¿Cuánto pago de seguridad social como independiente si gano 3 millones?",
      a: "Con un ingreso bruto de $3.000.000, tu IBC es $1.200.000 (el 40%). Pero como ese valor está por debajo del SMMLV 2025 ($1.423.500), debes cotizar sobre el mínimo. Eso te da: salud $177.937 + pensión $227.760 + ARL Riesgo I $7.430 = total aproximado de $413.127 mensuales. Para 2026, el valor sube proporcionalmente según el nuevo mínimo que se decrete.",
    },
    {
      q: "¿El 40% del ingreso aplica para todos los independientes o solo para algunos?",
      a: "Aplica para independientes por cuenta propia y para quienes tienen contratos de prestación de servicios. La regla viene del artículo 135 de la Ley 1753 de 2015. Si eres independiente con contabilidad formal y puedes demostrar que tus costos reales superan el 60%, algunos contadores sugieren usar el ingreso neto real, pero eso requiere soportes contables sólidos. En la práctica, el 40% es la fórmula estándar que usa la UGPP para fiscalizar.",
    },
    {
      q: "¿Puedo pagar seguridad social como independiente sin tener RUT?",
      a: "No necesitas RUT para afiliarte a salud o pensión como independiente. Puedes acercarte a una EPS y a un fondo de pensiones con tu cédula y hacer la afiliación. Sin embargo, si estás facturando servicios necesitas RUT obligatoriamente, y en ese caso la DIAN ya tiene registro de tus ingresos. Lo recomendable es tener todo formalizado para evitar inconsistencias.",
    },
    {
      q: "¿Qué pasa si no pago seguridad social como independiente?",
      a: "La UGPP puede detectar que tienes ingresos y no cotizas, gracias a cruces con la DIAN, bancos y facturación electrónica. Te envían un requerimiento de información, luego una liquidación oficial con el cálculo de lo que debiste pagar, más intereses moratorios que pueden llegar al 30% anual. En casos extremos, pueden embargar cuentas bancarias. Además, sin pagos al día no puedes acceder a servicios de salud ni acumular semanas de pensión.",
    },
    {
      q: "¿Cuánto pago de pensión como independiente si gano el mínimo?",
      a: "Si tu ingreso es igual o menor a un valor donde el 40% no supera el SMMLV, cotizas pensión sobre el salario mínimo. En 2025 eso es $1.423.500 × 16% = $227.760 mensuales. Para 2026, con un mínimo estimado entre $1.550.000 y $1.600.000, el aporte de pensión estaría entre $248.000 y $256.000 al mes. Ese pago es obligatorio y no hay forma de reducirlo legalmente.",
    },
    {
      q: "¿Puedo descontar la seguridad social de la declaración de renta?",
      a: "Sí. Los aportes obligatorios a salud y pensión son deducibles en tu declaración de renta. El aporte de salud es un ingreso no constitutivo de renta, y la pensión obligatoria también se resta de tu base gravable. Esto puede reducir significativamente tu impuesto. Guarda todos los comprobantes de pago de tu operador PILA — los vas a necesitar al momento de declarar.",
    },
    {
      q: "¿Cada cuánto debo pagar la seguridad social como independiente?",
      a: "Mensualmente, a través de la planilla PILA (Planilla Integrada de Liquidación de Aportes). Los plazos dependen de los últimos dos dígitos de tu cédula y generalmente caen entre el 1 y el 15 del mes siguiente al período que estás pagando. Puedes hacer el pago en operadores como Aportes en Línea, SOI, Mi Planilla o Asopagos. Si pagas fuera de plazo, se generan intereses de mora automáticamente.",
    },
    {
      q: "¿Si tengo trabajo formal y además soy independiente, pago doble seguridad social?",
      a: "Depende. Si tu ingreso adicional como independiente supera 1 SMMLV (el 40% de lo que facturas), debes hacer una cotización adicional sobre ese IBC. En salud puedes pagar solo la diferencia porque ya tienes cobertura por tu empleo formal, pero en pensión sí se suman ambas cotizaciones. Lo ideal es consultar con un contador porque la doble cotización tiene reglas específicas según el Decreto 1273 de 2018.",
    },
  ];

  const mainContent = `<h2>¿Por qué tantos independientes en Colombia pagan mal su seguridad social?</h2><p>Hay un dato que debería preocuparnos más de lo que nos preocupa. Según la UGPP (Unidad de Gestión Pensional y Parafiscales), entre 2020 y 2024 se emitieron más de 300.000 requerimientos a trabajadores independientes por evasión o inexactitud en sus aportes a seguridad social. No estamos hablando de gente que no quería pagar — en muchos casos simplemente no sabían cuánto les correspondía.</p><p>El problema de fondo es que la regla del 40% confunde a casi todo el mundo. En los comentarios de YouTube, debajo de cualquier video que explique aportes para independientes, encuentras cosas como: «Entonces si gano 3 millones, ¿pago sobre 3 millones o sobre 1.200.000?». Y la respuesta correcta — sobre $1.200.000, que es el 40% — genera otra pregunta inmediata: «¿Y si ese 40% me da menos que el mínimo?».</p><h3>La regla del IBC explicada sin rodeos</h3><p>Piensa en tu ingreso bruto como una torta. El gobierno asume que el 60% se te va en costos operativos — arriendo de oficina, internet, transporte, insumos, lo que sea. Y el 40% restante es tu «ganancia», tu base real. Sobre ese 40% es que calculas salud, pensión y ARL.</p><p>Ahora bien, hay un piso. El IBC nunca puede ser inferior a 1 SMMLV. Para 2025, el salario mínimo es $1.423.500. Si el gobierno aprueba un incremento para 2026 (que históricamente ronda entre el 9% y el 12% dependiendo de la inflación y la negociación), podríamos estar hablando de un mínimo cercano a $1.550.000 o más. Eso significa que si tus ingresos brutos son de $3.500.000, tu IBC sería $1.400.000... pero como queda por debajo del mínimo estimado, tendrías que cotizar sobre el SMMLV vigente.</p><p>Este error es el más común que veo en grupos de independientes en Facebook. La gente calcula el 40%, ve que da un número bajito y paga sobre eso, sin verificar que esté por encima del mínimo. Después llega el requerimiento de la UGPP y toca pagar diferencias con intereses de mora.</p><h2>Cuánto pago de seguridad social como independiente 2026: desglose completo</h2><p>Vamos a lo concreto. Como independiente en Colombia, tus aportes obligatorios son tres:</p><h3>Salud: 12.5% del IBC</h3><p>Este porcentaje no ha cambiado en años y aplica igual para todos. A diferencia de un empleado — donde el empleador pone el 8.5% y el trabajador el 4% — como independiente te toca el 100%. Así de simple y así de duro. Si tu IBC es el mínimo ($1.423.500 en 2025), estás pagando $177.937 mensuales solo en salud.</p><h3>Pensión: 16% del IBC</h3><p>Mismo cuento. El empleado paga 4% y el empleador 12%. Tú como independiente asumes todo el 16%. Sobre el mínimo actual eso son $227.760 al mes. Y sí, es obligatorio. No es opcional. La UGPP tiene cruces de información con la DIAN, con las cuentas bancarias, con las facturas electrónicas. Si facturas y no cotizas, eventualmente te van a encontrar.</p><h3>ARL: varía según el riesgo</h3><p>La ARL (Administradora de Riesgos Laborales) es obligatoria para independientes desde la Ley 1562 de 2012, especialmente si tienes contratos de prestación de servicios con entidades públicas o privadas. Las tarifas van desde 0.522% en Riesgo I hasta 6.960% en Riesgo V. Un programador freelance que trabaja desde su casa es Riesgo I. Un técnico que instala redes eléctricas en alturas es Riesgo IV o V.</p><h2>¿Qué pasa si gano menos de un salario mínimo?</h2><p>Esta es quizás la pregunta más repetida en Quora en español y en grupos de WhatsApp de emprendedores. Si tus ingresos brutos del mes no alcanzan para que el 40% llegue a 1 SMMLV, igual debes cotizar sobre el mínimo. No hay vuelta. Si un mes te fue mal y facturaste $800.000, tu IBC teórico sería $320.000, pero la ley te obliga a cotizar sobre el mínimo completo.</p><p>Eso sí, si tus ingresos son tan bajos que realmente no puedes pagar, existe el régimen subsidiado de salud (Sisbén) y no estás obligado a cotizar pensión si demuestras que no tienes capacidad económica. Pero ojo: si estás facturando con RUT, la DIAN y la UGPP asumen que tienes ingresos y te van a cobrar.</p><h2>Cuánto pago de salud y pensión con el mínimo 2026</h2><p>Hagamos el ejercicio con el mínimo de 2025 ($1.423.500) como referencia, porque el de 2026 aún no se ha decretado oficialmente al momento de escribir esto. Los números cambian proporcionalmente, pero la lógica es idéntica:</p><p>Salud: $1.423.500 × 12.5% = $177.937<br/>Pensión: $1.423.500 × 16% = $227.760<br/>ARL Riesgo I: $1.423.500 × 0.522% = $7.430<br/><strong>Total: $413.127 al mes</strong></p><p>Si el mínimo 2026 sube a, digamos, $1.560.000 (un aumento del 9.6%), los aportes quedarían así:<br/>Salud: $195.000<br/>Pensión: $249.600<br/>ARL Riesgo I: $8.143<br/><strong>Total estimado: $452.743 al mes</strong></p><p>La diferencia de casi $40.000 mensuales puede no parecer mucho, pero al año son $480.000 adicionales. Para un independiente que gana justo el mínimo, eso pesa.</p><h2>Errores que te pueden salir carísimos</h2><p>Después de años leyendo las quejas en foros y hablando con contadores, estos son los errores más frecuentes que cometen los independientes al calcular cuánto pagan de seguridad social:</p><p><strong>Cotizar sobre el ingreso bruto completo.</strong> Algunos, por miedo a la UGPP, pagan sobre el 100% del ingreso en vez del 40%. No está mal en el sentido de que cotizas más pensión, pero estás regalando plata que no estás obligado a aportar. Si ganas 8 millones y pagas sobre 8 en vez de sobre 3.2, estás girando $850.000 de más cada mes.</p><p>El segundo error — y este es grave — es <strong>no pagar ARL pensando que es opcional</strong>. Desde 2012, si tienes contrato de prestación de servicios, es obligatoria. Y si te pasa algo trabajando sin ARL, el costo médico y de incapacidad sale de tu bolsillo.</p><p>El tercer error es <strong>pagar un mes sí y un mes no</strong> según cómo le vaya a uno. La cotización debe ser continua. Cada mes sin pago es un mes sin cobertura en salud (después de cierto período) y sin semanas cotizadas para la pensión.</p>`;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "Calculadora de Seguridad Social para Independientes Colombia 2026",
            url: "https://calcutools.online/calculadora-seguridad-social-independiente-colombia",
            description:
              "Calcula tus aportes a salud, pensión y ARL como trabajador independiente en Colombia 2026.",
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
            name: "Cómo calcular cuánto pago de seguridad social como independiente en Colombia 2026",
            description:
              "Calcula tus aportes a salud, pensión y ARL como trabajador independiente en Colombia usando tu ingreso mensual bruto.",
            step: [
              {
                "@type": "HowToStep",
                name: "Ingresa tu ingreso mensual bruto",
                text: "Escribe tu ingreso mensual bruto en pesos colombianos. Es lo que facturas o recibes antes de descontar gastos.",
              },
              {
                "@type": "HowToStep",
                name: "Selecciona tu nivel de riesgo ARL",
                text: "Elige tu nivel de riesgo ARL según tu actividad económica. La mayoría de independientes que trabajan desde casa son Riesgo I (0.522%).",
              },
              {
                "@type": "HowToStep",
                name: "Verifica el SMMLV 2026",
                text: "La calculadora trae precargado el salario mínimo vigente. Verifica que esté actualizado o ajústalo si necesitas simular con otro valor.",
              },
              {
                "@type": "HowToStep",
                name: "Calcula y revisa tus resultados",
                text: "Haz clic en Calcular para ver el desglose de tu aporte a salud, pensión, ARL y el total mensual de seguridad social.",
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
                name: "¿Cuánto pago de seguridad social como independiente si gano 3 millones?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Con un ingreso bruto de $3.000.000, tu IBC es $1.200.000 (el 40%). Pero como ese valor está por debajo del SMMLV 2025 ($1.423.500), debes cotizar sobre el mínimo. Eso te da: salud $177.937 + pensión $227.760 + ARL Riesgo I $7.430 = total aproximado de $413.127 mensuales.",
                },
              },
              {
                "@type": "Question",
                name: "¿El 40% del ingreso aplica para todos los independientes o solo para algunos?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Aplica para independientes por cuenta propia y para quienes tienen contratos de prestación de servicios. La regla viene del artículo 135 de la Ley 1753 de 2015.",
                },
              },
              {
                "@type": "Question",
                name: "¿Puedo pagar seguridad social como independiente sin tener RUT?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "No necesitas RUT para afiliarte a salud o pensión como independiente. Puedes acercarte a una EPS y a un fondo de pensiones con tu cédula y hacer la afiliación.",
                },
              },
              {
                "@type": "Question",
                name: "¿Qué pasa si no pago seguridad social como independiente?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "La UGPP puede detectar que tienes ingresos y no cotizas, gracias a cruces con la DIAN, bancos y facturación electrónica. Te envían un requerimiento de información, luego una liquidación oficial con intereses moratorios.",
                },
              },
              {
                "@type": "Question",
                name: "¿Cuánto pago de pensión como independiente si gano el mínimo?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Si tu ingreso es igual o menor a un valor donde el 40% no supera el SMMLV, cotizas pensión sobre el salario mínimo. En 2025 eso es $1.423.500 × 16% = $227.760 mensuales.",
                },
              },
              {
                "@type": "Question",
                name: "¿Puedo descontar la seguridad social de la declaración de renta?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Sí. Los aportes obligatorios a salud y pensión son deducibles en tu declaración de renta. El aporte de salud es un ingreso no constitutivo de renta.",
                },
              },
              {
                "@type": "Question",
                name: "¿Cada cuánto debo pagar la seguridad social como independiente?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Mensualmente, a través de la planilla PILA. Los plazos dependen de los últimos dos dígitos de tu cédula y generalmente caen entre el 1 y el 15 del mes siguiente.",
                },
              },
              {
                "@type": "Question",
                name: "¿Si tengo trabajo formal y además soy independiente, pago doble seguridad social?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Depende. Si tu ingreso adicional como independiente supera 1 SMMLV (el 40% de lo que facturas), debes hacer una cotización adicional sobre ese IBC.",
                },
              },
            ],
          }),
        }}
      />

      <div className="min-h-screen bg-white text-[#2C2C2A]">
        {/* HEADER */}
        <header className="bg-[#E1F5EE] border-b border-[#1D9E75]/20 px-4 py-6">
          <div className="max-w-3xl mx-auto">
            <nav aria-label="Breadcrumb" className="mb-3">
              <ol className="flex flex-wrap items-center gap-1 text-sm text-[#5F5E5A]">
                <li>
                  <a href="/" className="hover:text-[#1D9E75] transition-colors">
                    Inicio
                  </a>
                </li>
                <li aria-hidden="true" className="select-none">
                  /
                </li>
                <li>
                  <a
                    href="/calculadoras"
                    className="hover:text-[#1D9E75] transition-colors"
                  >
                    Calculadoras
                  </a>
                </li>
                <li aria-hidden="true" className="select-none">
                  /
                </li>
                <li
                  className="text-[#1D9E75] font-medium truncate max-w-[200px] sm:max-w-none"
                  aria-current="page"
                >
                  Seguridad Social Independientes
                </li>
              </ol>
            </nav>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#2C2C2A] leading-tight mb-2">
              Cuánto pago de seguridad social como independiente en Colombia 2026
            </h1>
            <p className="text-[#5F5E5A] text-base sm:text-lg leading-relaxed">
              Calcula tus aportes a salud, pensión y ARL según tu ingreso mensual
              real — sin sorpresas ni cuentas raras
            </p>
          </div>
        </header>

        {/* MAIN */}
        <main className="max-w-3xl mx-auto px-4 py-8">
          {/* WIDGET */}
          <section
            aria-label="Calculadora de seguridad social"
            className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6"
          >
            <div className="grid gap-5">
              {/* Input: Ingreso mensual bruto */}
              <div>
                <label
                  htmlFor="ingreso-bruto"
                  className="block text-sm font-semibold text-[#2C2C2A] mb-1"
                >
                  Ingreso mensual bruto (COP)
                </label>
                <p className="text-xs text-[#9C9B97] mb-2">
                  Lo que facturas o recibes antes de descontar gastos
                </p>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9C9B97] font-medium text-sm select-none">
                    $
                  </span>
                  <input
                    id="ingreso-bruto"
                    type="number"
                    min={1300000}
                    max={50000000}
                    step={100000}
                    value={ingreso}
                    onChange={(e) => setIngreso(e.target.value)}
                    aria-label="Ingreso mensual bruto en pesos colombianos"
                    className="w-full pl-7 pr-4 py-3 border border-gray-300 rounded-lg text-[#2C2C2A] text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75] focus:border-transparent transition"
                    placeholder="5000000"
                  />
                </div>
              </div>

              {/* Input: Nivel de riesgo ARL */}
              <div>
                <label
                  htmlFor="arl-nivel"
                  className="block text-sm font-semibold text-[#2C2C2A] mb-1"
                >
                  Nivel de riesgo ARL
                </label>
                <p className="text-xs text-[#9C9B97] mb-2">
                  Riesgo I para trabajo desde casa u oficina; mayor riesgo para
                  actividades de campo
                </p>
                <select
                  id="arl-nivel"
                  value={arlNivel}
                  onChange={(e) => setArlNivel(e.target.value)}
                  aria-label="Nivel de riesgo ARL para calcular el aporte"
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg text-[#2C2C2A] text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1D9E75] focus:border-transparent transition"
                >
                  {Object.keys(ARL_RATES).map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {/* Input: SMMLV 2026 */}
              <div>
                <label
                  htmlFor="smmlv"
                  className="block text-sm font-semibold text-[#2C2C2A] mb-1"
                >
                  Salario mínimo mensual vigente (COP)
                </label>
                <p className="text-xs text-[#9C9B97] mb-2">
                  Precargado con el SMMLV 2025 — ajusta si necesitas simular otro valor
                </p>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9C9B97] font-medium text-sm select-none">
                    $
                  </span>
                  <input
                    id="smmlv"
                    type="number"
                    min={1000000}
                    max={5000000}
                    step={10000}
                    value={smmlv}
                    onChange={(e) => setSmmlv(e.target.value)}
                    aria-label="Salario mínimo mensual vigente en pesos colombianos"
                    className="w-full pl-7 pr-4 py-3 border border-gray-300 rounded-lg text-[#2C2C2A] text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75] focus:border-transparent transition"
                    placeholder="1423500"
                  />
                </div>
              </div>

              {/* Botón calcular */}
              <button
                onClick={handleCalcular}
                aria-label="Calcular aportes de seguridad social"
                className="w-full py-3 px-6 bg-[#1D9E75] hover:bg-[#0F6E56] text-white font-bold rounded-xl text-sm transition-colors shadow-sm"
              >
                Calcular aportes
              </button>

              {/* Resultados */}
              <section
                role="status"
                aria-live="polite"
                className={`transition-opacity duration-300 ${visible && result ? "opacity-100" : "opacity-0 pointer-events-none"}`}
              >
                {result && (
                  <div className="bg-[#E1F5EE] rounded-xl p-5 space-y-3">
                    <h2 className="font-bold text-[#0F6E56] text-base mb-1">
                      Tus aportes mensuales
                    </h2>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="bg-white rounded-lg p-3">
                        <p className="text-[#9C9B97] text-xs mb-1">IBC base</p>
                        <p className="font-bold text-[#2C2C2A]">{formatCOP(result.ibc)}</p>
                        {result.ibcMinimo && (
                          <p className="text-xs text-[#9C9B97] mt-0.5">Mínimo SMMLV aplicado</p>
                        )}
                      </div>
                      <div className="bg-white rounded-lg p-3">
                        <p className="text-[#9C9B97] text-xs mb-1">Salud (12.5%)</p>
                        <p className="font-bold text-[#2C2C2A]">{formatCOP(result.salud)}</p>
                      </div>
                      <div className="bg-white rounded-lg p-3">
                        <p className="text-[#9C9B97] text-xs mb-1">Pensión (16%)</p>
                        <p className="font-bold text-[#2C2C2A]">{formatCOP(result.pension)}</p>
                      </div>
                      <div className="bg-white rounded-lg p-3">
                        <p className="text-[#9C9B97] text-xs mb-1">ARL ({arlNivel})</p>
                        <p className="font-bold text-[#2C2C2A]">{formatCOP(result.arl)}</p>
                      </div>
                    </div>
                    <div className="bg-[#1D9E75] rounded-xl p-4 text-white">
                      <p className="text-xs font-medium opacity-80 mb-1">Total mensual</p>
                      <p className="text-2xl font-extrabold">{formatCOP(result.total)}</p>
                    </div>
                    <button
                      onClick={handleCopiar}
                      className="w-full py-2 px-4 border border-[#1D9E75] text-[#1D9E75] rounded-lg text-sm font-medium hover:bg-[#E1F5EE] transition-colors"
                    >
                      {copied ? "¡Copiado!" : "Copiar resultado"}
                    </button>
                  </div>
                )}
              </section>
            </div>
          </section>

          <AdUnit id="ad-below-tool" slot="0000000000" />

          {/* ¿Cómo usar? */}
          <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
            <h2 className="font-bold text-[#2C2C2A] text-lg mb-4">
              ¿Cómo usar la calculadora?
            </h2>
            <ol className="space-y-3 text-sm text-[#5F5E5A]">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#E1F5EE] text-[#1D9E75] font-bold text-xs flex items-center justify-center">1</span>
                <span>Ingresa tu ingreso mensual bruto en pesos colombianos — lo que facturas antes de descontar gastos.</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#E1F5EE] text-[#1D9E75] font-bold text-xs flex items-center justify-center">2</span>
                <span>Selecciona tu nivel de riesgo ARL. La mayoría de independientes que trabajan desde casa son Riesgo I (0.522%).</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#E1F5EE] text-[#1D9E75] font-bold text-xs flex items-center justify-center">3</span>
                <span>Haz clic en <strong>Calcular aportes</strong> y revisa el desglose de salud, pensión, ARL y el total mensual.</span>
              </li>
            </ol>
          </section>

          {/* Contenido principal */}
          <section
            className="prose prose-sm max-w-none text-[#5F5E5A] bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6"
            dangerouslySetInnerHTML={{ __html: mainContent }}
          />

          <AdUnit id="ad-mid-content" slot="0000000001" />

          {/* FAQ */}
          <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
            <h2 className="font-bold text-[#2C2C2A] text-lg mb-4">
              Preguntas frecuentes
            </h2>
            <div className="space-y-2">
              {faqs.map((faq, idx) => (
                <div key={idx} className="border border-gray-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left text-sm font-semibold text-[#2C2C2A] hover:bg-gray-50 transition-colors"
                    aria-expanded={openFaq === idx}
                  >
                    <span>{faq.q}</span>
                    <span className="ml-2 text-[#1D9E75] flex-shrink-0">{openFaq === idx ? "−" : "+"}</span>
                  </button>
                  {openFaq === idx && (
                    <div className="px-4 pb-4 text-sm text-[#5F5E5A] border-t border-gray-100 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Herramientas relacionadas */}
          <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
            <h2 className="font-bold text-[#2C2C2A] text-base mb-3">
              Herramientas relacionadas
            </h2>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/calculadora-liquidacion-laboral-colombia" className="text-[#1D9E75] hover:underline">
                  Calculadora de Liquidación Laboral Colombia
                </a>
              </li>
              <li>
                <a href="/calculadora-nomina-colombia" className="text-[#1D9E75] hover:underline">
                  Calculadora de Nómina Colombia
                </a>
              </li>
              <li>
                <a href="/calculadora-retencion-fuente-colombia" className="text-[#1D9E75] hover:underline">
                  Calculadora de Retención en la Fuente Colombia
                </a>
              </li>
            </ul>
          </section>

          <AdUnit id="ad-bottom" slot="0000000002" />
        </main>
      </div>
    </>
  );
}
