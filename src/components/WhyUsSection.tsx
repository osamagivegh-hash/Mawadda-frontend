const features = [
  {
    title: "أمان وخصوصية",
    description: "تقنيات تشفير متقدمة وفريق تدقيق بشري يضمن حماية بياناتك.",
    icon: "🛡️",
    gradient: "from-rose-500 to-rose-400",
  },
  {
    title: "تجربة عملاء متميزة",
    description:
      "مستشارون متفرغون يرافقونك خطوة بخطوة عبر قنوات دعم متعددة.",
    icon: "🤝",
    gradient: "from-purple-500 to-purple-400",
  },
  {
    title: "إدارة الوقت بكفاءة",
    description:
      "خوارزميات ذكية تمنع التعارض بين المواعيد وتربطك بالفرص الأنسب.",
    icon: "⏱️",
    gradient: "from-emerald-500 to-emerald-400",
  },
  {
    title: "حجز سريع وسهل",
    description: "واجهة عربية بسيطة لحجز جلساتك خلال دقائق وبكل شفافية.",
    icon: "📅",
    gradient: "from-sky-500 to-sky-400",
  },
];

export function WhyUsSection() {
  return (
    <section id="why-us" className="py-20">
      <div className="section-container">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-slate-900 lg:text-4xl">
            لماذا تختار مَوَدَّة؟
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            صممنا المنصة لتمنحك تجربة زواج متكاملة تجمع بين الموثوقية، الدعم
            الإنساني، والتقنيات الحديثة التي تحترم خصوصيتك بالكامل.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="card-hover flex h-full flex-col rounded-3xl border border-slate-100 bg-white p-6 shadow-sm"
            >
              <span
                className={`mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.gradient} text-2xl text-white`}
              >
                {feature.icon}
              </span>
              <h3 className="text-lg font-semibold text-slate-800">
                {feature.title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}





