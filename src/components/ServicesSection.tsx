const services = [
  {
    title: "عيادات طبية",
    description: "150+ عيادة",
    color: "from-sky-500 to-sky-600",
    emoji: "🏥",
  },
  {
    title: "صالونات تجميل",
    description: "200+ صالون",
    color: "from-pink-500 to-pink-600",
    emoji: "💇‍♀️",
  },
  {
    title: "مراكز رياضية",
    description: "80+ مركز",
    color: "from-emerald-500 to-emerald-600",
    emoji: "💪",
  },
  {
    title: "مطاعم",
    description: "300+ مطعم",
    color: "from-orange-500 to-orange-600",
    emoji: "🍽️",
  },
  {
    title: "استشارات",
    description: "100+ مستشار",
    color: "from-violet-500 to-violet-600",
    emoji: "🧠",
  },
  {
    title: "خدمات أخرى",
    description: "500+ خدمة",
    color: "from-slate-500 to-slate-600",
    emoji: "🛠️",
  },
];

export function ServicesSection() {
  return (
    <section id="services" className="bg-white py-20">
      <div className="section-container">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-slate-900 lg:text-4xl">
            فئات الخدمات الداعمة
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            اكتشف شبكة من الشركاء الموثوقين المساندين لمسيرتك نحو الزواج، من
            الاستشارات المتخصصة حتى الخدمات اللوجستية.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <div
              key={service.title}
              className="card-hover rounded-3xl bg-slate-50 p-[1px]"
            >
              <div className="flex h-full flex-col rounded-[28px] bg-white p-6 shadow-sm">
                <span
                  className={`mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${service.color} text-2xl text-white`}
                >
                  {service.emoji}
                </span>
                <h3 className="text-lg font-semibold text-slate-800">
                  {service.title}
                </h3>
                <p className="mt-3 text-sm text-slate-600">
                  {service.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}





