export function ContactSection() {
  return (
    <section id="contact" className="bg-white py-20">
      <div className="section-container grid gap-10 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-6">
          <h2 className="text-3xl font-bold text-slate-900">تواصل معنا</h2>
          <p className="text-lg text-slate-600">
            فريق الدعم الفني متواجد على مدار اليوم للإجابة عن استفساراتك
            وترتيب مواعيدك. يمكنك التواصل عبر القنوات التالية:
          </p>
          <div className="space-y-4 text-sm text-slate-600">
            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5">
              <p className="text-secondary-700">البريد الإلكتروني</p>
              <p className="mt-1 font-medium text-slate-800">
                support@mawaddah.sa
              </p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5">
              <p className="text-secondary-700">الهاتف الموحد</p>
              <p className="mt-1 font-medium text-slate-800">9200 1234 56</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5">
              <p className="text-secondary-700">مواعيد الدعم</p>
              <p className="mt-1 font-medium text-slate-800">
                يوميًا من 9 صباحًا حتى 11 مساءً
              </p>
            </div>
          </div>
        </div>
        <div className="overflow-hidden rounded-3xl border border-slate-100 bg-slate-50">
          <div className="h-[360px] w-full bg-[url('https://maps.googleapis.com/maps/api/staticmap?center=Riyadh,KSA&zoom=12&size=800x400&maptype=roadmap&markers=color:red%7CRiyadh')] bg-cover bg-center" />
          <div className="p-6 text-sm text-slate-600">
            <p className="font-medium text-secondary-700">موقعنا</p>
            <p className="mt-2">
              الرياض، المملكة العربية السعودية – مركز الأعمال الذكي، الطابق
              الثامن.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}





