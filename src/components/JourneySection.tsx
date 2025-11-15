const steps = [
  {
    title: "التسجيل والتحقق الذكي",
    description:
      "إنشاء حساب بخطوات بسيطة مع رفع المستندات والتحقق المتعدد لضمان جدية الأعضاء.",
  },
  {
    title: "استبيانات التوافق العميقة",
    description:
      "نماذج تقييم شاملة تغطي القيم والاهتمامات والخلفية الأسرية لتقديم توصيات دقيقة.",
  },
  {
    title: "مطابقة وإدارة الطلبات",
    description:
      "خوارزميات مطورة تقترح أفضل المرشحين وتمنع التعارضات مع إشعارات فورية.",
  },
  {
    title: "جلسات التعارف والاستشارة",
    description:
      "تنسيق جلسات مرئية ومكتوبة بإشراف مختصين وتوثيق كامل لمسار العلاقة.",
  },
];

export function JourneySection() {
  return (
    <section id="journey" className="bg-gradient-to-b from-accent-50/30 to-white py-20">
      <div className="section-container">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-secondary-900 lg:text-4xl">
            كيف نرافقك في رحلتك؟
          </h2>
          <p className="mt-4 text-lg text-secondary-600">
            نتعامل مع رحلة الزواج كمسار متكامل يبدأ بالاستعداد النفسي والمهني
            وينتهي بزواج ناجح ومستقر، مع وجود فريق مختص في كل مرحلة.
          </p>
        </div>
        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className="group relative overflow-hidden rounded-3xl border border-accent-100 bg-white p-8 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <span className="absolute -left-3 -top-3 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-accent-600 to-primary-500 text-lg font-bold text-white shadow-lg transition-transform group-hover:scale-110">
                {index + 1}
              </span>
              <h3 className="pr-12 text-xl font-semibold text-secondary-800">
                {step.title}
              </h3>
              <p className="mt-4 text-sm leading-7 text-secondary-600">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}





