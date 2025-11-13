import Link from "next/link";

const consultants = [
  {
    name: "د. جاسم المطوع",
    title: "استشاري أسري وتربوي",
    experience: "30+ سنة خبرة في التوافق الأسري",
  },
  {
    name: "أ. ندى السويلم",
    title: "مختصة في العلاقات والتواصل",
    experience: "قادت أكثر من 5000 جلسة نجاح",
  },
  {
    name: "أ. محمد الحربي",
    title: "مدرب تطوير شخصي",
    experience: "برامج تأهيل ما قبل الزواج",
  },
];

export function ConsultantsSection() {
  return (
    <section id="consultants" className="bg-white py-20">
      <div className="section-container">
        <div className="flex flex-col gap-12 lg:flex-row lg:items-center">
          <div className="flex-1 space-y-6">
            <span className="inline-flex items-center rounded-full bg-secondary-100 px-4 py-2 text-sm font-medium text-secondary-700">
              نخبة من الاستشاريين المعتمدين
            </span>
            <h2 className="text-3xl font-bold text-slate-900 lg:text-4xl">
              فريق استشاري متخصص يرافقك في كل خطوة
            </h2>
            <p className="text-lg text-slate-600">
              جميع المستشارين معتمدون ويحملون خبرات طويلة في الإرشاد الأسري،
              الشرعي، والمهني. يمكنك اختيار المستشار المناسب حسب احتياجك وحجز
              جلسات مباشرة عبر المنصة.
            </p>
            <div className="space-y-4 rounded-3xl border border-slate-100 bg-slate-50/60 p-6">
              <h3 className="text-lg font-semibold text-secondary-700">
                ما الذي يميز جلساتنا؟
              </h3>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>جلسات مرئية أو صوتية آمنة ومحمية بالكامل.</li>
                <li>تقارير تقييم مفصلة مع توصيات قابلة للتنفيذ.</li>
                <li>متابعة بعد الجلسة للتأكد من تحقيق أهدافك.</li>
              </ul>
              <Link
                href="/consultations"
                className="inline-flex items-center justify-center rounded-full bg-secondary-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-secondary-500"
              >
                استكشف رزنامة المستشارين
              </Link>
            </div>
          </div>
          <div className="flex-1 space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              {consultants.map((consultant) => (
                <div
                  key={consultant.name}
                  className="card-hover rounded-3xl border border-slate-100 bg-white p-6 text-right shadow-sm"
                >
                  <div className="text-3xl">🎓</div>
                  <h3 className="mt-4 text-lg font-semibold text-slate-800">
                    {consultant.name}
                  </h3>
                  <p className="text-sm text-secondary-600">
                    {consultant.title}
                  </p>
                  <p className="mt-3 text-sm text-slate-600">
                    {consultant.experience}
                  </p>
                </div>
              ))}
            </div>
            <div className="rounded-3xl border border-slate-100 bg-gradient-to-br from-secondary-600 to-primary-500 p-[1px]">
              <div className="rounded-[26px] bg-white p-6 text-sm text-slate-600">
                <h3 className="text-lg font-semibold text-secondary-700">
                  شاهد كيف نستعمل المنصة
                </h3>
                <p className="mt-3">
                  يقدم خبراؤنا فيديوهات توضيحية خطوة بخطوة تساعدك على استثمار
                  جميع مزايا المنصة لتحقيق زواج ناجح.
                </p>
                <div className="mt-4 aspect-video w-full overflow-hidden rounded-2xl bg-slate-200">
                  <div className="flex h-full items-center justify-center text-secondary-600">
                    فيديو توضيحي
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}





