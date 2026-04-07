import Link from "next/link";
import { Calculator, ExternalLink } from "lucide-react";

const FOOTER_LINKS = [
  { href: "/calculadoras", label: "Calculadoras" },
  { href: "/conversores", label: "Conversores" },
  { href: "/generadores", label: "Generadores" },
];

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-gray-50 border-t border-gray-100 mt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Calculator size={16} className="text-white" />
              </div>
              <span className="font-bold text-text-primary">
                Calcu<span className="text-primary">Tools</span>
              </span>
            </Link>
            <p className="text-sm text-text-muted leading-relaxed">
              Herramientas web gratuitas para Colombia, México y España.
              Sin registro, sin anuncios invasivos.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-3">Categorías</h3>
            <ul className="flex flex-col gap-2">
              {FOOTER_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-text-secondary hover:text-primary transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-3">Legal</h3>
            <ul className="flex flex-col gap-2">
              <li>
                <span className="text-sm text-text-muted">
                  Las calculadoras son orientativas. Para decisiones financieras
                  importantes, consulta a un asesor certificado.
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-text-muted">
            © {year} CalcuTools — Herramientas gratuitas en español
          </p>
          <p className="text-xs text-text-muted flex items-center gap-1.5">
            Hecho con ❤️ en Colombia
          </p>
        </div>
      </div>
    </footer>
  );
}
