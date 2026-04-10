export interface Tool {
  slug: string;
  nombre: string;
  descripcion: string;
  categoria: "calculadora" | "conversor" | "generador";
  nicho: string;
  keyword: string;
  publicada: string; // ISO date
  status: "publicada" | "indexada" | "top10";
}

export const TOOLS_REGISTRY: Tool[] = [
  {
    slug: "calculadora-hipoteca-colombia",
    nombre: "Calculadora de Hipoteca Colombia",
    descripcion:
      "Calcula tu cuota mensual, total a pagar e intereses de un crédito hipotecario. Incluye tabla de amortización completa.",
    categoria: "calculadora",
    nicho: "financiero",
    keyword: "calculadora hipoteca colombia",
    publicada: "2026-04-07",
    status: "publicada",
  },
  {
    slug: "calculadora-seguridad-social-independiente-colombia",
    nombre: "Calculadora de Seguridad Social para Independientes Colombia 2026",
    descripcion: "Calcula cuánto pagas de seguridad social como independiente en Colombia 2026. Salud, pensión y ARL sobre tu ingreso real. Calculadora gratis online.",
    categoria: "calculadora",
    nicho: "financiero",
    keyword: "cuanto pago de seguridad social como independiente",
    publicada: "2026-04-08",
    status: "publicada",
  },
  {
    slug: "calculadora-rentabilidad-neobancos-colombia-2026",
    nombre: "Calculadora de Rentabilidad Neobancos Colombia 2026",
    descripcion: "Calcula y compara la rentabilidad de Nu, Lulo Bank, Pibank y Nequi en 2026. Ingresa tu capital y período y descubre cuánto ganarás en COP. ¡Úsala gratis!",
    categoria: "calculadora",
    nicho: "fintech",
    keyword: "calcular rentabilidad neobancos colombia 2026",
    publicada: "2026-04-09",
    status: "publicada",
  },
  {
    slug: "generador-link-cobro-nequi-daviplata",
    nombre: "Generador de Link y QR de Cobro Nequi / Daviplata",
    descripcion: "Genera gratis tu link de pago Nequi, Daviplata o Bancolombia con QR descargable. Copia el enlace, comparte por WhatsApp y cobra al instante.",
    categoria: "generador",
    nicho: "pagos_digitales",
    keyword: "generar link de pago nequi",
    publicada: "2026-04-10",
    status: "publicada",
  },
  {
    slug: "generador-cuenta-de-cobro-colombia",
    nombre: "Generador de Cuenta de Cobro Colombia",
    descripcion: "Genera tu cuenta de cobro en PDF gratis con retención en la fuente calculada (Art. 383 ET). Campos legales, vista previa y descarga sin registro. Colombia 2026.",
    categoria: "generador",
    nicho: "documentos",
    keyword: "generador cuenta de cobro",
    publicada: "2026-04-10",
    status: "publicada",
  },
  {
    slug: "generador-desprendible-nomina-colombia",
    nombre: "Generador de Desprendible de Nómina Colombia",
    descripcion: "Genera el desprendible de nómina colombiano en PDF gratis, sin Excel ni registro. Calcula salud, pensión y auxilio de transporte 2025 automáticamente.",
    categoria: "generador",
    nicho: "laboral",
    keyword: "desprendible de nomina colombia",
    publicada: "2026-04-10",
    status: "publicada",
  },
];

export const CATEGORIAS = [
  { slug: "calculadoras", label: "Calculadoras", descripcion: "Financieras, de salud y más" },
  { slug: "conversores",  label: "Conversores",  descripcion: "Documentos, imágenes y unidades" },
  { slug: "generadores",  label: "Generadores",  descripcion: "Facturas, hojas de vida y más" },
];
