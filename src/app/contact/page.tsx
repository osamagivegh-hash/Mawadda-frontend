export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-accent-50 via-white to-primary-50 py-12">
      <div className="section-container space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-secondary-900">📞 تواصل معنا</h1>
          <p className="mt-4 text-lg text-secondary-600">
            نحن هنا لمساعدتك. تواصل معنا عبر أي من الطرق التالية
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Contact Form */}
          <div className="rounded-3xl border border-accent-100 bg-white p-8 shadow-lg">
            <h2 className="text-xl font-semibold text-secondary-800 mb-6">
              📝 أرسل لنا رسالة
            </h2>
            
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  الاسم الكامل
                </label>
                <input
                  type="text"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-accent-400 focus:outline-none focus:ring-2 focus:ring-accent-100"
                  placeholder="أدخل اسمك الكامل"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  البريد الإلكتروني
                </label>
                <input
                  type="email"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-accent-400 focus:outline-none focus:ring-2 focus:ring-accent-100"
                  placeholder="example@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  الموضوع
                </label>
                <select className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-accent-400 focus:outline-none focus:ring-2 focus:ring-accent-100">
                  <option value="">اختر الموضوع</option>
                  <option value="support">الدعم الفني</option>
                  <option value="consultation">استشارة</option>
                  <option value="complaint">شكوى</option>
                  <option value="suggestion">اقتراح</option>
                  <option value="other">أخرى</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  الرسالة
                </label>
                <textarea
                  rows={5}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-accent-400 focus:outline-none focus:ring-2 focus:ring-accent-100"
                  placeholder="اكتب رسالتك هنا..."
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-full bg-accent-600 px-6 py-3 text-sm font-medium text-white transition-all hover:bg-accent-700 hover:shadow-lg"
              >
                📤 إرسال الرسالة
              </button>
            </form>
          </div>

          {/* Contact Information */}
          <div className="space-y-6">
            <div className="rounded-3xl border border-accent-100 bg-white p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-secondary-800 mb-4">
                📍 معلومات التواصل
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="text-xl">📧</div>
                  <div>
                    <p className="font-medium text-secondary-800">البريد الإلكتروني</p>
                    <p className="text-sm text-secondary-600">info@mawadda.com</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-xl">📱</div>
                  <div>
                    <p className="font-medium text-secondary-800">رقم الهاتف</p>
                    <p className="text-sm text-secondary-600">+966 50 123 4567</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-xl">🕐</div>
                  <div>
                    <p className="font-medium text-secondary-800">ساعات العمل</p>
                    <p className="text-sm text-secondary-600">الأحد - الخميس: 9:00 ص - 6:00 م</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-accent-100 bg-white p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-secondary-800 mb-4">
                🚀 الدعم السريع
              </h3>
              
              <div className="space-y-3">
                <button className="w-full rounded-full border border-accent-200 px-4 py-3 text-accent-700 transition-colors hover:bg-accent-50">
                  💬 الدردشة المباشرة
                </button>
                
                <button className="w-full rounded-full border border-accent-200 px-4 py-3 text-accent-700 transition-colors hover:bg-accent-50">
                  📞 اتصال مباشر
                </button>
                
                <button className="w-full rounded-full border border-accent-200 px-4 py-3 text-accent-700 transition-colors hover:bg-accent-50">
                  📋 الأسئلة الشائعة
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
