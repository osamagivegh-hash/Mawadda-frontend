"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchWithToken, uploadProfilePhoto } from "@/lib/api";
import {
  clearStoredAuth,
  getStoredAuth,
  StoredAuth,
} from "@/lib/auth";

type ProfileResponse = {
  id?: string;
  firstName?: string;
  lastName?: string;
  gender?: string;
  dateOfBirth?: string;
  nationality?: string;
  city?: string;
  education?: string;
  occupation?: string;
  religiosityLevel?: string;
  maritalStatus?: string;
  about?: string;
  guardianName?: string;
  guardianContact?: string;
  photoUrl?: string;
  photoStorage?: "cloudinary" | "local";
  photoPublicId?: string | null;
  isVerified?: boolean;
};

type FieldConfig = {
  name: keyof ProfileResponse;
  label: string;
  type?: string;
};

const baseFields: FieldConfig[] = [
  { name: "firstName", label: "الاسم الأول" },
  { name: "lastName", label: "الاسم الأخير" },
  { name: "gender", label: "الجنس" },
  { name: "dateOfBirth", label: "تاريخ الميلاد", type: "date" },
  { name: "nationality", label: "الجنسية" },
  { name: "city", label: "المدينة" },
  { name: "education", label: "المؤهل الدراسي" },
  { name: "occupation", label: "الوظيفة" },
  { name: "religiosityLevel", label: "درجة الالتزام" },
  { name: "maritalStatus", label: "الحالة الاجتماعية" },
];
const femaleGuardianFields: FieldConfig[] = [
  { name: "guardianName", label: "اسم ولي الأمر" },
  { name: "guardianContact", label: "وسيلة تواصل ولي الأمر" },
];

export default function ProfilePage() {
  const router = useRouter();
  const [auth, setAuth] = useState<StoredAuth | null>(null);
  const [profile, setProfile] = useState<ProfileResponse>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoStatus, setPhotoStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const settingsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const stored = getStoredAuth();
    if (!stored) {
      router.push("/auth/login");
      return;
    }
    setAuth(stored);
    fetchWithToken<ProfileResponse | null>(
      `/profiles/${stored.user.id}`,
      stored.token,
    )
      .then((data) => setProfile(data ?? {}))
      .catch(() => setProfile({}))
      .finally(() => setLoading(false));
  }, [router]);

  function handleChange(name: keyof ProfileResponse, value: string) {
    setProfile((prev) => {
      const next = {
        ...prev,
        [name]: value,
      };
      if (name === "gender" && value !== "female") {
        delete next.guardianName;
        delete next.guardianContact;
      }
      return next;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!auth) {
      router.push("/auth/login");
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const updated = await fetchWithToken<ProfileResponse>(
        `/profiles/${auth.user.id}`,
        auth.token,
        {
          method: "PATCH",
          body: JSON.stringify(profile),
        },
      );
      setProfile(updated ?? {});
      setSuccess("تم حفظ التعديلات بنجاح.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
    } finally {
      setSaving(false);
    }
  }

  const quickLinks = useMemo(
    () => [
      { href: "/", label: "الرئيسية" },
      { href: "/search", label: "ابحث عن شريك" },
      { href: "/matches", label: "طلبات التوافق" },
      { href: "/consultations", label: "جلسات الرؤية" },
      { href: "/favorites", label: "قائمة المفضلة" },
    ],
    [],
  );

  const scrollToRef = (ref: React.RefObject<HTMLElement | null>) => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const actionButtons = [
    {
      label: "تحديث بياناتي",
      description: "حدّث معلوماتك الشخصية الأساسية.",
      onClick: () => scrollToRef(formRef as React.RefObject<HTMLElement>),
    },
    {
      label: "رفع صورة شخصية",
      description: "أضف صورة واضحة لملفك لزيادة فرص التوافق.",
      onClick: () => {
        scrollToRef(formRef as React.RefObject<HTMLElement>);
        setTimeout(() => photoInputRef.current?.click(), 350);
      },
    },
    {
      label: "إعدادات الحساب",
      description: "إدارة كلمة المرور وتفضيلات الإشعارات.",
      onClick: () => scrollToRef(settingsRef as React.RefObject<HTMLElement>),
    },
  ];

  const resolvedPhotoUrl = useMemo(() => {
    if (!profile.photoUrl) return null;
    if (/^https?:\/\//i.test(profile.photoUrl)) {
      return profile.photoUrl;
    }
    const base = (process.env.NEXT_PUBLIC_API ?? "").replace(/\/$/, "");
    const path = profile.photoUrl.startsWith("/")
      ? profile.photoUrl
      : `/${profile.photoUrl}`;
    return `${base}${path}`;
  }, [profile.photoUrl]);

  if (!auth) return null;

  const displayName =
    profile.firstName || profile.lastName
      ? `${profile.firstName ?? ""} ${profile.lastName ?? ""}`.trim()
      : auth.user.email ?? "عضو مَوَدّة";

  const isFemale = profile.gender === "female";
  const renderedFields = isFemale
    ? [...baseFields, ...femaleGuardianFields]
    : baseFields;

  async function handlePhotoSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !auth) {
      return;
    }

    if (!/^image\/(jpeg|jpg|png|gif|webp)$/i.test(file.type)) {
      setPhotoStatus({
        type: "error",
        message: "يجب أن تكون الصورة بصيغة JPG أو PNG أو GIF أو WebP.",
      });
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setPhotoStatus({
        type: "error",
        message: "حجم الصورة يجب ألا يتجاوز 5 ميجابايت.",
      });
      event.target.value = "";
      return;
    }

    setPhotoStatus(null);
    setPhotoUploading(true);

    try {
      const updated = await uploadProfilePhoto<ProfileResponse>(
        auth.token,
        auth.user.id,
        file,
      );
      setProfile((prev) => ({ ...prev, ...(updated ?? {}) }));
      setPhotoStatus({
        type: "success",
        message: "تم تحديث صورتك الشخصية بنجاح.",
      });
    } catch (err) {
      setPhotoStatus({
        type: "error",
        message:
          err instanceof Error ? err.message : "تعذر رفع الصورة، حاول مجدداً.",
      });
    } finally {
      setPhotoUploading(false);
      event.target.value = "";
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* === Sticky Header === */}
      <header className="sticky top-0 z-50 border-b border-rose-100 bg-white/95 backdrop-blur">
        <div className="section-container flex flex-wrap items-center justify-between gap-4 py-4">
          {/* Left: Logo & Navigation */}
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="flex items-center gap-3 text-xl font-bold text-secondary-700"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-secondary-500 text-white font-display">
                م
              </span>
              <span className="leading-tight">
                مَوَدَّة
                <span className="block text-xs font-normal text-slate-500">
                  منصة زواج آمنة
                </span>
              </span>
            </Link>

            {/* Navigation Links */}
            <nav className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
              {quickLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-full border border-transparent px-3 py-1.5 transition hover:border-secondary-200 hover:text-secondary-600"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Right: Logout Button */}
          <button
            type="button"
            onClick={() => {
              clearStoredAuth();
              if (typeof window !== "undefined") {
                window.dispatchEvent(new Event("storage"));
              }
              router.push("/");
            }}
            className="rounded-full bg-gradient-to-r from-rose-500 to-secondary-500 px-6 py-2 text-sm font-medium text-white shadow-sm transition hover:opacity-90"
          >
            تسجيل الخروج
          </button>
        </div>
      </header>

      {/* === Hero Section === */}
      <section className="relative overflow-hidden bg-gradient-to-b from-secondary-600 via-secondary-500 to-rose-400 pb-16 pt-12 text-white">
        <div className="section-container relative z-10 space-y-8">
          <div className="max-w-2xl space-y-3">
            <p className="text-sm text-white/80">مرحباً بك في مَوَدَّة</p>
            <h1 className="text-3xl font-bold">
              أهلاً بك، {displayName || "عضونا العزيز"}
            </h1>
            {auth.user.memberId && (
              <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-medium">
                <span>🆔</span>
                <span>رقم العضوية: {auth.user.memberId}</span>
              </div>
            )}
            <p className="text-sm leading-7 text-white/75">
              يمكنك إدارة ملفك الشخصي، تعديل بياناتك، ورفع صورتك الشخصية
              بسهولة داخل المنصة.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {actionButtons.map((action) => (
              <button
                key={action.label}
                type="button"
                onClick={action.onClick}
                className="flex flex-col gap-2 rounded-2xl bg-white/15 px-6 py-5 text-right shadow-lg transition hover:bg-white/25"
              >
                <span className="text-sm font-semibold text-white">
                  {action.label}
                </span>
                <span className="text-xs leading-6 text-white/80">
                  {action.description}
                </span>
              </button>
            ))}
          </div>
        </div>
        <div className="absolute inset-0 bg-[url('/patterns/hero-shape.svg')] bg-cover bg-center opacity-10" />
      </section>

      {/* === Profile Form === */}
      <div className="section-container -mt-12 space-y-8">
        <div className="rounded-3xl border border-white/60 bg-white p-6 shadow-xl md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-6">
            <div>
              <h2 className="text-xl font-semibold text-secondary-700">
                بيانات حسابك الشخصية
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                قم بتحديث معلوماتك لزيادة دقة نتائج التوافق.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="mt-8 rounded-2xl border border-slate-100 bg-slate-50 p-6 text-center text-sm text-slate-600">
              جاري تحميل البيانات...
            </div>
          ) : (
            <form ref={formRef} onSubmit={handleSubmit} className="mt-8 space-y-8">
              <section className="flex flex-col gap-6 md:flex-row md:items-center">
                <div className="relative h-32 w-32 overflow-hidden rounded-3xl border border-slate-200 bg-slate-100">
                  {resolvedPhotoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={resolvedPhotoUrl}
                      alt="الصورة الشخصية"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-slate-200 text-sm text-slate-500">
                      لا توجد صورة
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      disabled={photoUploading}
                      className="rounded-full bg-secondary-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-secondary-500 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {photoUploading ? "جاري الرفع..." : "اختيار صورة جديدة"}
                    </button>
                    <span className="text-xs text-slate-500">
                      الصيغ المدعومة: ‎JPG، PNG، WebP حتى 5 ميجابايت.
                    </span>
                  </div>
                  {photoStatus ? (
                    <p
                      className={`text-xs ${
                        photoStatus.type === "success"
                          ? "text-emerald-600"
                          : "text-rose-600"
                      }`}
                    >
                      {photoStatus.message}
                    </p>
                  ) : null}
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    className="hidden"
                    onChange={handlePhotoSelected}
                  />
                </div>
              </section>

              <div className="grid gap-6 md:grid-cols-2">
                {renderedFields.map((field) => (
                  <label
                    key={field.name}
                    className="flex flex-col gap-2 text-sm text-slate-600"
                  >
                    {field.label}
                    <input
                      type={field.type ?? "text"}
                      value={
                        profile[field.name]
                          ? String(profile[field.name])
                          : ""
                      }
                      onChange={(event) =>
                        handleChange(field.name, event.target.value)
                      }
                      className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-secondary-400 focus:outline-none focus:ring-2 focus:ring-secondary-100"
                    />
                  </label>
                ))}
              </div>

              {/* About Section */}
              <label className="flex flex-col gap-2 text-sm text-slate-600">
                نبذة تعريفية
                <textarea
                  rows={4}
                  value={profile.about ?? ""}
                  onChange={(event) =>
                    handleChange("about", event.target.value)
                  }
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-secondary-400 focus:outline-none focus:ring-2 focus:ring-secondary-100"
                />
              </label>

              {/* Alerts */}
              {error && (
                <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600">
                  {error}
                </p>
              )}
              {success && (
                <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-600">
                  {success}
                </p>
              )}

              {/* Submit */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-full bg-secondary-600 px-8 py-3 text-sm font-medium text-white transition-all hover:bg-secondary-500 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {saving ? "جاري الحفظ..." : "حفظ التعديلات"}
                </button>
              </div>
            </form>
          )}
        </div>

        <div
          ref={settingsRef}
          className="rounded-3xl border border-white/60 bg-white p-6 shadow-xl md:p-8"
        >
          <h2 className="text-lg font-semibold text-secondary-700">إعدادات الحساب</h2>
          <p className="mt-2 text-sm text-slate-600">
            يمكنك من هنا إدارة كلمة المرور وتفضيلات الإشعارات وطرق التواصل.
            سنضيف المزيد من الخيارات قريباً.
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-500">
            <Link
              href="/settings/password"
              className="rounded-full border border-slate-200 px-4 py-2 transition-colors hover:bg-slate-50"
            >
              تغيير كلمة المرور
            </Link>
            <Link
              href="/settings/notifications"
              className="rounded-full border border-slate-200 px-4 py-2 transition-colors hover:bg-slate-50"
            >
              تفضيلات الإشعارات
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
