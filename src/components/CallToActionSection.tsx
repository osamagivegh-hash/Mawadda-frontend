import Link from "next/link";

export function CallToActionSection() {
  return (
    <section className="py-20">
      <div className="section-container">
        <div className="overflow-hidden rounded-[40px] bg-gradient-to-br from-secondary-600 to-primary-500 p-[1px] shadow-soft">
          <div className="rounded-[38px] bg-white/95 px-6 py-12 text-center md:px-16">
            <h2 className="text-3xl font-bold text-slate-900 lg:text-4xl">
              مستعدون لنرافقك نحو زواج ناجح؟
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
              احجز جلستك الأولى مجانًا أو أنشئ حسابك الآن للانضمام إلى آلاف
              الأعضاء الذين وجدوا شركاء حياتهم عبر منصة مَوَدَّة.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm font-medium">
              <Link
                href="/auth/register"
                className="rounded-full bg-secondary-600 px-7 py-3 text-white transition-colors hover:bg-secondary-500"
              >
                بدء التسجيل
              </Link>
              <Link
                href="/consultations"
                className="rounded-full border border-secondary-200 px-7 py-3 text-secondary-700 transition-colors hover:border-secondary-400 hover:text-secondary-600"
              >
                حجز استشارة أولية
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}





