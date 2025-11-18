"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { uploadProfilePhoto } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import { useProfileStore, type ProfileResponse } from "@/store/profile-store";

import countriesData from "@/data/countries.json";
import citiesData from "@/data/cities.json";
import {
  EDUCATION_LEVELS,
  OCCUPATIONS,
  ALL_MARITAL_STATUSES,
  MARRIAGE_TYPES,
  RELIGIOSITY_LEVELS,
  POLYGAMY_OPTIONS,
  COMPATIBILITY_OPTIONS,
} from "@/lib/profile-constants";

type CountryOption = { code: string; name: string };
type CityOption = { countryCode: string; name: string };

const COUNTRY_OPTIONS = countriesData as CountryOption[];
const CITY_OPTIONS = citiesData as CityOption[];
const EDUCATION_OPTIONS = EDUCATION_LEVELS;
const JOB_OPTIONS = OCCUPATIONS;
const MARITAL_STATUS_OPTIONS = ALL_MARITAL_STATUSES;
const MARRIAGE_TYPE_OPTIONS = MARRIAGE_TYPES;
const RELIGIOSITY_OPTIONS = RELIGIOSITY_LEVELS;
const POLYGAMY_OPTIONS_MEMO = POLYGAMY_OPTIONS;
const COMPATIBILITY_OPTIONS_MEMO = COMPATIBILITY_OPTIONS;

// useRef to track if request is in flight (prevents double submit)
// More reliable than state because it's synchronous

// ProfileResponse is now imported from profile-store

type FieldConfig = {
  name: keyof ProfileResponse;
  label: string;
  type?: string;
};

// Required fields matching backend CreateProfileDto
const requiredFields: Set<keyof ProfileResponse> = new Set([
  "gender",
  "dateOfBirth",
  "city",
  "nationality",
  "maritalStatus",
  "education",
  "occupation",
  "religiosityLevel",
]);

const baseFields: FieldConfig[] = [
  { name: "firstName", label: "الاسم الأول" },
  { name: "lastName", label: "الاسم الأخير" },
  { name: "gender", label: "الجنس" },
  { name: "dateOfBirth", label: "تاريخ الميلاد", type: "date" },
  { name: "nationality", label: "الجنسية" },
  { name: "city", label: "المدينة" },
  { name: "countryOfResidence", label: "بلد الإقامة" },
  { name: "education", label: "المؤهل الدراسي" },
  { name: "occupation", label: "الوظيفة" },
  { name: "religion", label: "الديانة" },
  { name: "religiosityLevel", label: "درجة الالتزام" },
  { name: "maritalStatus", label: "الحالة الاجتماعية" },
  { name: "marriageType", label: "نوع الزواج" },
  { name: "polygamyAcceptance", label: "تقبل/تقبلين بالتعدد" },
  { name: "compatibilityTest", label: "إختبار التوافق" },
];
const femaleGuardianFields: FieldConfig[] = [
  { name: "guardianName", label: "اسم ولي الأمر" },
  { name: "guardianContact", label: "وسيلة تواصل ولي الأمر" },
];

export default function ProfilePage() {
  const router = useRouter();
  
  // Use Zustand stores
  const { token, user, isAuthenticated, loading: authLoading, logout } = useAuthStore();
  const {
    profile,
    baseline,
    loading,
    saving,
    error,
    loadProfile,
    setField,
    saveProfile,
  } = useProfileStore();
  
  const [success, setSuccess] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoStatus, setPhotoStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const settingsRef = useRef<HTMLDivElement | null>(null);

  const availableCities = useMemo(() => {
    if (!profile?.countryOfResidence) {
      return CITY_OPTIONS;
    }
    const country = COUNTRY_OPTIONS.find(
      (c) => c.name === profile.countryOfResidence,
    );
    if (!country) return CITY_OPTIONS;
    return CITY_OPTIONS.filter((c) => c.countryCode === country.code);
  }, [profile?.countryOfResidence]);


  // Load profile on mount if authenticated
  useEffect(() => {
    if (authLoading) return; // Wait for auth to hydrate
    
    if (!isAuthenticated || !token) {
      router.push("/auth/login");
      return;
    }
    
    // Load profile using Zustand store
    loadProfile().catch((err) => {
      console.error("Failed to load profile:", err);
    });
  }, [authLoading, isAuthenticated, token, router, loadProfile]);

  function handleChange(name: keyof ProfileResponse, value: string) {
    setField(name, value);
    // Clear guardian fields if gender changes from female
    if (name === "gender" && value !== "female") {
      setField("guardianName", "");
      setField("guardianContact", "");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    
    // Prevent double submit
    if (saving) {
      console.warn('Profile submission already in progress, ignoring duplicate request');
      return;
    }
    
    if (!isAuthenticated || !token) {
      router.push("/auth/login");
      return;
    }
    
    setSuccess(null);
    
    try {
      // Use Zustand store's saveProfile which handles all the diffing logic
      await saveProfile();
      setSuccess("تم حفظ البيانات بنجاح.");
    } catch (err) {
      // Error is already set by the store
      console.error("Profile save error:", err);
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
    if (!profile?.photoUrl) return null;
    if (/^https?:\/\//i.test(profile.photoUrl)) {
      return profile.photoUrl;
    }
    const base = (process.env.NEXT_PUBLIC_API ?? "").replace(/\/$/, "");
    const path = profile.photoUrl.startsWith("/")
      ? profile.photoUrl
      : `/${profile.photoUrl}`;
    return `${base}${path}`;
  }, [profile?.photoUrl]);

  // Show loading state while auth is hydrating
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center text-slate-600">جاري التحميل...</div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!isAuthenticated || !token || !user) {
    return null; // useEffect will redirect
  }

  const displayName =
    profile?.firstName || profile?.lastName
      ? `${profile.firstName ?? ""} ${profile.lastName ?? ""}`.trim()
      : user.email ?? "عضو مَوَدّة";

  const isFemale = profile?.gender === "female";
  const renderedFields = isFemale
    ? [...baseFields, ...femaleGuardianFields]
    : baseFields;

  async function handlePhotoSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !token || !user) {
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
      const updated = await uploadProfilePhoto(
        token,
        user.id,
        file,
      );
      if (updated) {
        // Reload profile to get updated photo URL
        await loadProfile();
      }
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
              prefetch={false}
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
                  prefetch={false}
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
              logout();
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
            {user.memberId && (
              <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-medium">
                <span>🆔</span>
                <span>رقم العضوية: {user.memberId}</span>
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
            <form 
              ref={formRef} 
              onSubmit={handleSubmit} 
              className="mt-8 space-y-8"
              noValidate
            >
              {/* Required Fields Notice */}
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                <p className="font-medium mb-1">ملاحظة:</p>
                <p>الحقول المميزة بعلامة <span className="text-rose-600 font-bold">*</span> مطلوبة ولا يمكن تركها فارغة. يجب ملء جميع الحقول المطلوبة لإنشاء أو تحديث الملف الشخصي.</p>
              </div>

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
                {renderedFields.map((field) => {
                  const fieldValue = profile?.[field.name] ? String(profile[field.name]) : "";
                  const isRequired = requiredFields.has(field.name);
                  
                  // Handle select fields
                  if (field.name === "gender") {
                    return (
                      <label
                        key={field.name}
                        className="flex flex-col gap-2 text-sm text-slate-600"
                      >
                        <span className="flex items-center gap-1">
                          {field.label}
                          {isRequired && <span className="text-rose-500">*</span>}
                        </span>
                        <select
                          value={fieldValue}
                          onChange={(event) =>
                            handleChange(field.name, event.target.value)
                          }
                          className={`rounded-xl border ${
                            isRequired && !fieldValue
                              ? 'border-rose-300 bg-rose-50'
                              : 'border-slate-200 bg-slate-50'
                          } px-4 py-3 text-slate-900 focus:border-secondary-400 focus:outline-none focus:ring-2 focus:ring-secondary-100`}
                          required={isRequired}
                        >
                          <option value="">اختر الجنس</option>
                          <option value="male">ذكر</option>
                          <option value="female">أنثى</option>
                        </select>
                      </label>
                    );
                  }
                  
                  if (field.name === "nationality") {
                    return (
                      <label
                        key={field.name}
                        className="flex flex-col gap-2 text-sm text-slate-600"
                      >
                        <span className="flex items-center gap-1">
                          {field.label}
                          {isRequired && <span className="text-rose-500">*</span>}
                        </span>
                        <select
                          value={fieldValue}
                          onChange={(event) =>
                            handleChange(field.name, event.target.value)
                          }
                          className={`rounded-xl border ${
                            isRequired && !fieldValue
                              ? 'border-rose-300 bg-rose-50'
                              : 'border-slate-200 bg-slate-50'
                          } px-4 py-3 text-slate-900 focus:border-secondary-400 focus:outline-none focus:ring-2 focus:ring-secondary-100`}
                          required={isRequired}
                        >
                          <option value="">اختر الجنسية</option>
                          {COUNTRY_OPTIONS.map((country) => (
                            <option key={country.code} value={country.name}>
                              {country.name}
                            </option>
                          ))}
                        </select>
                      </label>
                    );
                  }

                  if (field.name === "countryOfResidence") {
                    return (
                      <label
                        key={field.name}
                        className="flex flex-col gap-2 text-sm text-slate-600"
                      >
                        <span className="flex items-center gap-1">
                          {field.label}
                          {isRequired && <span className="text-rose-500">*</span>}
                        </span>
                        <select
                          value={fieldValue}
                          onChange={(event) =>
                            handleChange(field.name, event.target.value)
                          }
                          className={`rounded-xl border ${
                            isRequired && !fieldValue
                              ? 'border-rose-300 bg-rose-50'
                              : 'border-slate-200 bg-slate-50'
                          } px-4 py-3 text-slate-900 focus:border-secondary-400 focus:outline-none focus:ring-2 focus:ring-secondary-100`}
                        >
                          <option value="">اختر بلد الإقامة</option>
                          {COUNTRY_OPTIONS.map((country) => (
                            <option key={country.code} value={country.name}>
                              {country.name}
                            </option>
                          ))}
                        </select>
                      </label>
                    );
                  }

                  if (field.name === "city") {
                    return (
                      <label
                        key={field.name}
                        className="flex flex-col gap-2 text-sm text-slate-600"
                      >
                        <span className="flex items-center gap-1">
                          {field.label}
                          {isRequired && <span className="text-rose-500">*</span>}
                        </span>
                        <select
                          value={fieldValue}
                          onChange={(event) =>
                            handleChange(field.name, event.target.value)
                          }
                          className={`rounded-xl border ${
                            isRequired && !fieldValue
                              ? 'border-rose-300 bg-rose-50'
                              : 'border-slate-200 bg-slate-50'
                          } px-4 py-3 text-slate-900 focus:border-secondary-400 focus:outline-none focus:ring-2 focus:ring-secondary-100`}
                          required={isRequired}
                        >
                          <option value="">اختر المدينة</option>
                          {availableCities.map((city) => (
                            <option key={`${city.countryCode}-${city.name}`} value={city.name}>
                              {city.name}
                            </option>
                          ))}
                        </select>
                        {!profile?.countryOfResidence && (
                          <span className="text-xs text-slate-500">
                            يرجى اختيار بلد الإقامة أولاً للحصول على قائمة المدن المناسبة.
                          </span>
                        )}
                      </label>
                    );
                  }

                  if (field.name === "education") {
                    return (
                      <label
                        key={field.name}
                        className="flex flex-col gap-2 text-sm text-slate-600"
                      >
                        <span className="flex items-center gap-1">
                          {field.label}
                          {isRequired && <span className="text-rose-500">*</span>}
                        </span>
                        <select
                          value={fieldValue}
                          onChange={(event) =>
                            handleChange(field.name, event.target.value)
                          }
                          className={`rounded-xl border ${
                            isRequired && !fieldValue
                              ? 'border-rose-300 bg-rose-50'
                              : 'border-slate-200 bg-slate-50'
                          } px-4 py-3 text-slate-900 focus:border-secondary-400 focus:outline-none focus:ring-2 focus:ring-secondary-100`}
                          required={isRequired}
                        >
                          <option value="">اختر المؤهل الدراسي</option>
                          {EDUCATION_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </label>
                    );
                  }

                  if (field.name === "occupation") {
                    return (
                      <label
                        key={field.name}
                        className="flex flex-col gap-2 text-sm text-slate-600"
                      >
                        <span className="flex items-center gap-1">
                          {field.label}
                          {isRequired && <span className="text-rose-500">*</span>}
                        </span>
                        <select
                          value={fieldValue}
                          onChange={(event) =>
                            handleChange(field.name, event.target.value)
                          }
                          className={`rounded-xl border ${
                            isRequired && !fieldValue
                              ? 'border-rose-300 bg-rose-50'
                              : 'border-slate-200 bg-slate-50'
                          } px-4 py-3 text-slate-900 focus:border-secondary-400 focus:outline-none focus:ring-2 focus:ring-secondary-100`}
                          required={isRequired}
                        >
                          <option value="">اختر الوظيفة</option>
                          {JOB_OPTIONS.map((job) => (
                            <option key={job} value={job}>
                              {job}
                            </option>
                          ))}
                        </select>
                      </label>
                    );
                  }

                  if (field.name === "religion") {
                    return (
                      <label
                        key={field.name}
                        className="flex flex-col gap-2 text-sm text-slate-600"
                      >
                        <span className="flex items-center gap-1">
                          {field.label}
                          {isRequired && <span className="text-rose-500">*</span>}
                        </span>
                        <select
                          value={fieldValue}
                          onChange={(event) =>
                            handleChange(field.name, event.target.value)
                          }
                          className={`rounded-xl border ${
                            isRequired && !fieldValue
                              ? 'border-rose-300 bg-rose-50'
                              : 'border-slate-200 bg-slate-50'
                          } px-4 py-3 text-slate-900 focus:border-secondary-400 focus:outline-none focus:ring-2 focus:ring-secondary-100`}
                          required={isRequired}
                        >
                          <option value="">اختر الديانة</option>
                          <option value="الإسلام">الإسلام</option>
                          <option value="المسيحية">المسيحية</option>
                          <option value="أخرى">أخرى</option>
                        </select>
                      </label>
                    );
                  }
                  
                  if (field.name === "religiosityLevel") {
                    return (
                      <label
                        key={field.name}
                        className="flex flex-col gap-2 text-sm text-slate-600"
                      >
                        <span className="flex items-center gap-1">
                          {field.label}
                          {isRequired && <span className="text-rose-500">*</span>}
                        </span>
                        <select
                          value={fieldValue}
                          onChange={(event) =>
                            handleChange(field.name, event.target.value)
                          }
                          className={`rounded-xl border ${
                            isRequired && !fieldValue
                              ? 'border-rose-300 bg-rose-50'
                              : 'border-slate-200 bg-slate-50'
                          } px-4 py-3 text-slate-900 focus:border-secondary-400 focus:outline-none focus:ring-2 focus:ring-secondary-100`}
                          required={isRequired}
                        >
                          <option value="">اختر درجة الالتزام</option>
                          {RELIGIOSITY_OPTIONS.map((level) => (
                            <option key={level} value={level}>
                              {level}
                            </option>
                          ))}
                        </select>
                      </label>
                    );
                  }

                  if (field.name === "marriageType") {
                    return (
                      <label
                        key={field.name}
                        className="flex flex-col gap-2 text-sm text-slate-600"
                      >
                        {field.label}
                        <select
                          value={fieldValue}
                          onChange={(event) =>
                            handleChange(field.name, event.target.value)
                          }
                          className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-secondary-400 focus:outline-none focus:ring-2 focus:ring-secondary-100"
                        >
                          <option value="">اختر نوع الزواج</option>
                          {MARRIAGE_TYPE_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </label>
                    );
                  }
                  
                  if (field.name === "polygamyAcceptance") {
                    return (
                      <label
                        key={field.name}
                        className="flex flex-col gap-2 text-sm text-slate-600"
                      >
                        {field.label}
                        <select
                          value={fieldValue}
                          onChange={(event) =>
                            handleChange(field.name, event.target.value)
                          }
                          className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-secondary-400 focus:outline-none focus:ring-2 focus:ring-secondary-100"
                        >
                          <option value="">اختر</option>
                          {POLYGAMY_OPTIONS_MEMO.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </label>
                    );
                  }
                  
                  if (field.name === "compatibilityTest") {
                    return (
                      <label
                        key={field.name}
                        className="flex flex-col gap-2 text-sm text-slate-600"
                      >
                        {field.label}
                        <select
                          value={fieldValue}
                          onChange={(event) =>
                            handleChange(field.name, event.target.value)
                          }
                          className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-secondary-400 focus:outline-none focus:ring-2 focus:ring-secondary-100"
                        >
                          <option value="">اختر</option>
                          {COMPATIBILITY_OPTIONS_MEMO.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </label>
                    );
                  }
                  
                  if (field.name === "maritalStatus") {
                    return (
                      <label
                        key={field.name}
                        className="flex flex-col gap-2 text-sm text-slate-600"
                      >
                        <span className="flex items-center gap-1">
                          {field.label}
                          {isRequired && <span className="text-rose-500">*</span>}
                        </span>
                        <select
                          value={fieldValue}
                          onChange={(event) =>
                            handleChange(field.name, event.target.value)
                          }
                          className={`rounded-xl border ${
                            isRequired && !fieldValue
                              ? 'border-rose-300 bg-rose-50'
                              : 'border-slate-200 bg-slate-50'
                          } px-4 py-3 text-slate-900 focus:border-secondary-400 focus:outline-none focus:ring-2 focus:ring-secondary-100`}
                          required={isRequired}
                        >
                          <option value="">اختر الحالة الاجتماعية</option>
                          <option value="أعزب">أعزب</option>
                          <option value="مطلق - بدون أولاد">مطلق - بدون أولاد</option>
                          <option value="مطلق - مع أولاد">مطلق - مع أولاد</option>
                          <option value="منفصل بدون طلاق">منفصل بدون طلاق</option>
                          <option value="أرمل - بدون أولاد">أرمل - بدون أولاد</option>
                          <option value="أرمل - مع أولاد">أرمل - مع أولاد</option>
                        </select>
                      </label>
                    );
                  }
                  
                  // Default input field
                  return (
                    <label
                      key={field.name}
                      className="flex flex-col gap-2 text-sm text-slate-600"
                    >
                      <span className="flex items-center gap-1">
                        {field.label}
                        {isRequired && <span className="text-rose-500">*</span>}
                      </span>
                      <input
                        type={field.type ?? "text"}
                        value={fieldValue}
                        onChange={(event) =>
                          handleChange(field.name, event.target.value)
                        }
                        className={`rounded-xl border ${
                          isRequired && !fieldValue
                            ? 'border-rose-300 bg-rose-50'
                            : 'border-slate-200 bg-slate-50'
                        } px-4 py-3 text-slate-900 focus:border-secondary-400 focus:outline-none focus:ring-2 focus:ring-secondary-100`}
                        required={isRequired}
                      />
                    </label>
                  );
                })}
              </div>

              {/* About Section */}
              <label className="flex flex-col gap-2 text-sm text-slate-600">
                نبذة تعريفية
                <textarea
                  rows={4}
                  value={profile?.about ?? ""}
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
              prefetch={false}
              className="rounded-full border border-slate-200 px-4 py-2 transition-colors hover:bg-slate-50"
            >
              تغيير كلمة المرور
            </Link>
            <Link
              href="/settings/notifications"
              prefetch={false}
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
