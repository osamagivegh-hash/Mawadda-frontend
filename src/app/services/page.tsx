export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-accent-50 via-white to-primary-50 py-12">
      <div className="section-container space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-secondary-900">🛍️ خدماتنا</h1>
          <p className="mt-4 text-lg text-secondary-600">
            نقدم مجموعة شاملة من الخدمات لمساعدتك في رحلة البحث عن شريك الحياة
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-3xl border border-accent-100 bg-white p-6 shadow-lg">
            <div className="text-3xl mb-4">💌</div>
            <h3 className="text-xl font-semibold text-secondary-800 mb-3">
              خدمة التوفيق
            </h3>
            <p className="text-secondary-600 text-sm leading-6">
              نساعدك في العثور على الشريك المناسب من خلال خوارزميات متقدمة ومعايير دقيقة
            </p>
          </div>

          <div className="rounded-3xl border border-accent-100 bg-white p-6 shadow-lg">
            <div className="text-3xl mb-4">👥</div>
            <h3 className="text-xl font-semibold text-secondary-800 mb-3">
              الاستشارات الزوجية
            </h3>
            <p className="text-secondary-600 text-sm leading-6">
              جلسات استشارية مع خبراء متخصصين لإرشادك في اتخاذ القرارات المناسبة
            </p>
          </div>

          <div className="rounded-3xl border border-accent-100 bg-white p-6 shadow-lg">
            <div className="text-3xl mb-4">🔒</div>
            <h3 className="text-xl font-semibold text-secondary-800 mb-3">
              الخصوصية والأمان
            </h3>
            <p className="text-secondary-600 text-sm leading-6">
              نضمن حماية بياناتك الشخصية وخصوصيتك بأعلى معايير الأمان
            </p>
          </div>

          <div className="rounded-3xl border border-accent-100 bg-white p-6 shadow-lg">
            <div className="text-3xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-secondary-800 mb-3">
              اختبارات التوافق
            </h3>
            <p className="text-secondary-600 text-sm leading-6">
              اختبارات علمية متخصصة لقياس مستوى التوافق مع الشركاء المحتملين
            </p>
          </div>

          <div className="rounded-3xl border border-accent-100 bg-white p-6 shadow-lg">
            <div className="text-3xl mb-4">⭐</div>
            <h3 className="text-xl font-semibold text-secondary-800 mb-3">
              العضوية المميزة
            </h3>
            <p className="text-secondary-600 text-sm leading-6">
              خدمات إضافية وميزات حصرية للأعضاء المميزين
            </p>
          </div>

          <div className="rounded-3xl border border-accent-100 bg-white p-6 shadow-lg">
            <div className="text-3xl mb-4">📞</div>
            <h3 className="text-xl font-semibold text-secondary-800 mb-3">
              الدعم المستمر
            </h3>
            <p className="text-secondary-600 text-sm leading-6">
              فريق دعم متاح على مدار الساعة لمساعدتك في أي استفسار
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
