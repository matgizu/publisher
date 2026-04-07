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
];

export const CATEGORIAS = [
  { slug: "calculadoras", label: "Calculadoras", descripcion: "Financieras, de salud y más" },
  { slug: "conversores",  label: "Conversores",  descripcion: "Documentos, imágenes y unidades" },
  { slug: "generadores",  label: "Generadores",  descripcion: "Facturas, hojas de vida y más" },
];
