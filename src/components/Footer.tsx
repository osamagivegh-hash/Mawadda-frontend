import Link from "next/link";

const footerLinks = [
  { label: "سياسة الخصوصية", href: "#" },
  { label: "الشروط والأحكام", href: "#" },
  { label: "دليل الاستخدام", href: "#" },
  { label: "الأسئلة الشائعة", href: "#" },
];

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="section-container flex flex-col gap-6 py-8 text-sm text-slate-600 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="font-semibold text-secondary-700">مَوَدَّة</p>
          <p className="mt-1 text-slate-500">
            منصة زواج آمنة بمنهجية علمية لتحقيق حياة زوجية مستقرة.
          </p>
        </div>
        <nav className="flex flex-wrap items-center gap-4">
          {footerLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="transition-colors hover:text-secondary-600"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <p className="text-xs text-slate-400">
          © {new Date().getFullYear()} مَوَدَّة. جميع الحقوق محفوظة.
        </p>
      </div>
    </footer>
  );
}





