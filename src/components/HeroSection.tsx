import Link from "next/link";

const stats = [
  { label: "أعضاء موثوقون", value: "240,000+" },
  { label: "استشارة ناجحة", value: "65,000+" },
  { label: "قصص زواج سعيدة", value: "18,500+" },
];

export function HeroSection() {
  return (
    <section className="bg-hero-gradient relative overflow-hidden pb-20 pt-16">
      <div className="section-container grid gap-12 lg:grid-cols-[1.2fr_1fr] lg:items-center">
        <div className="space-y-8">
          <span className="inline-flex items-center rounded-full bg-secondary-100 px-4 py-2 text-sm font-medium text-secondary-700">
            تطبيق زواج آمن بمنهجية علمية معتمدة
          </span>
          <div className="space-y-5">
            <h1 className="text-4xl font-extrabold leading-[1.3] text-slate-900 lg:text-5xl">
              رحلة زواجك تبدأ بثقة، بدعم خبراء متخصصين وإجراءات حماية شاملة
            </h1>
            <p className="max-w-xl text-lg text-slate-600">
              صممنا مَوَدَّة لتمنحك بيئة تحترم الخصوصية وتقدم تجربة تعارف
              علمية، من التسجيل والتحقق حتى التوفيق والاستشارة الشخصية مع
              اختصاصيين موثوقين.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm font-medium">
            <Link
              href="/auth/register"
              className="rounded-full bg-primary-600 px-8 py-3 text-white shadow-soft transition-transform duration-200 hover:-translate-y-0.5 hover:bg-primary-500"
            >
              ابدأ الآن
            </Link>
            <Link
              href="#journey"
              className="rounded-full border border-slate-200 px-8 py-3 text-secondary-700 transition-colors hover:border-secondary-400 hover:text-secondary-600"
            >
              تعرّف على آلية العمل
            </Link>
          </div>
          <div className="grid gap-6 text-center sm:grid-cols-3">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-white/80 bg-white/70 p-5 shadow-sm backdrop-blur"
              >
                <p className="text-2xl font-bold text-secondary-700">
                  {stat.value}
                </p>
                <p className="text-sm text-slate-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="relative isolate h-full">
          <div className="absolute -top-6 left-6 hidden h-32 w-32 rounded-full bg-primary-200 opacity-70 blur-3xl lg:block" />
          <div className="relative overflow-hidden rounded-3xl bg-white/90 p-6 text-right shadow-soft backdrop-blur">
            <div className="space-y-3">
              <h3 className="text-xl font-semibold text-secondary-700">
                جلسة تعريفية مجانية
              </h3>
              <p className="text-sm leading-7 text-slate-600">
                اختر وقتًا مناسبًا لحوار مباشر مع مستشار متخصص يرافقك في فهم
                الأهداف، تقييم التوافق، ووضع خارطة طريق واضحة لمسيرتك نحو
                الزواج.
              </p>
            </div>
            <div className="mt-6 rounded-2xl bg-gradient-to-br from-secondary-600 to-primary-500 p-[1px]">
              <div className="space-y-4 rounded-[14px] bg-white p-5 text-sm text-slate-600">
                <div className="flex items-center justify-between text-secondary-600">
                  <span>الخيار الأنسب لك</span>
                  <span className="rounded-full bg-secondary-100 px-3 py-1 text-xs font-semibold text-secondary-700">
                    مجاني
                  </span>
                </div>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="mt-1 inline-flex h-2 w-2 flex-none rounded-full bg-secondary-500" />
                    <span>تقييم شامل لوضعك الأسرى والاجتماعي</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 inline-flex h-2 w-2 flex-none rounded-full bg-secondary-500" />
                    <span>توصيات خاصة بالتفضيلات والمطابقة المحتملة</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 inline-flex h-2 w-2 flex-none rounded-full bg-secondary-500" />
                    <span>خطة متابعة مع فريق الدعم المتواجد على مدار اليوم</span>
                  </li>
                </ul>
                <Link
                  href="/consultations"
                  className="block rounded-full bg-secondary-600 px-5 py-3 text-center text-white transition-colors hover:bg-secondary-500"
                >
                  حجز جلسة التعارف
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}





