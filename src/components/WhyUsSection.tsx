const features = [
  {
    title: "حملة وآمان",
    description: "نحو خبرة السعوديين المعايرة كيم ايروحات",
    icon: "🛡️",
    gradient: "from-accent-500 to-accent-400",
  },
  {
    title: "خدمة موثوقة",
    description:
      "ليعو البرتقال أشاهيف مد البدية وخلي كفيل و",
    icon: "🤝",
    gradient: "from-primary-500 to-primary-400",
  },
  {
    title: "تجربة متميزة",
    description:
      "مطا كيم ايزانية للي على امتياز لم ليلة وسهة دل تشتغيل",
    icon: "💖",
    gradient: "from-accent-600 to-primary-500",
  },
  {
    title: "الموعول نسوية",
    description: "بطلايد شارعالعم مع مخيسة من الدريسة تند معرفة اليلي",
    icon: "📱",
    gradient: "from-secondary-600 to-secondary-500",
  },
];

export function WhyUsSection() {
  return (
    <section id="why-us" className="bg-gradient-to-b from-white to-accent-50/30 py-20">
      <div className="section-container">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-secondary-900 lg:text-4xl">
            كيف نرافقك في رحلتك
          </h2>
          <p className="mt-4 text-lg text-secondary-600">
            نسعدك تلقي المودعل الى اليوم المترقم رايعتمادك والإطر بليك
            تفضيل أي تعمل عصرية أفية وموثوقة.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group flex h-full flex-col rounded-3xl border border-accent-100 bg-white p-6 shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-xl"
            >
              <span
                className={`mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.gradient} text-2xl text-white shadow-lg transition-transform group-hover:scale-110`}
              >
                {feature.icon}
              </span>
              <h3 className="text-lg font-semibold text-secondary-800">
                {feature.title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-secondary-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}





