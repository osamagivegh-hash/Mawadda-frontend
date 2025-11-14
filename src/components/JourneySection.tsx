const steps = [
  {
    title: "الإرشيف والتوجيه الشخصي",
    description:
      "يرفق طلبك الدقيق على تعم البين رموش مع أحد كليا على المتدل وياراشتك",
  },
  {
    title: "السويسة ناقدجر للحلع",
    description:
      "إيلدت للمرأة ما مسلط قسيف امتيحده تعيية هدستم لنبوة واحدت",
  },
  {
    title: "برامج تأهيل للزواج",
    description:
      "راحم يحسب الموات أنواله الدورة بسيطل مجل الأواقف خلل المدموج",
  },
  {
    title: "مزايعة مستمرة دعم محصص",
    description:
      "خروج حمة حرامية على ناحية وطبوق دمل رنطيل السمعات رقيعة",
  },
];

export function JourneySection() {
  return (
    <section id="journey" className="bg-gradient-to-b from-accent-50/30 to-white py-20">
      <div className="section-container">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-secondary-900 lg:text-4xl">
            صدق يعرافقك نحو رحلتك
          </h2>
          <p className="mt-4 text-lg text-secondary-600">
            بدلايا تعيبة مصرو متخذة في كل خطوة منذ بدء نزرقم وحدى، وامجع على
            سفحة دعمهم غير مخوهيد
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





