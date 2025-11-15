"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getCurrentMembership,
  getMembershipPlans,
  upgradeMembership,
} from "@/lib/api";
import { getStoredAuth } from "@/lib/auth";

type MembershipPlan = {
  id: string;
  name: string;
  subtitle?: string;
  description: string;
  price: number;
  currency: string;
  durationDays: number | null;
  features: string[];
  highlight?: string;
};

export default function MembershipPage() {
  const router = useRouter();
  const storedAuth = useMemo(() => getStoredAuth(), []);
  const token = storedAuth?.token ?? null;
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [currentPlanId, setCurrentPlanId] = useState<string>("basic");
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      router.push("/auth/login");
      return;
    }

    const load = async () => {
      try {
        const [plansData, currentData] = await Promise.all([
          getMembershipPlans(token),
          getCurrentMembership(token),
        ]);
        setPlans((plansData as MembershipPlan[]) ?? []);
        if (currentData && typeof currentData === "object") {
          const currentMembership = currentData as {
            membershipPlanId?: string;
            membershipExpiresAt?: string | null;
          };
          setCurrentPlanId(currentMembership.membershipPlanId ?? "basic");
          setExpiresAt(currentMembership.membershipExpiresAt ?? null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "تعذر تحميل بيانات العضوية.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [token, router]);

  const handleSelect = async (planId: string) => {
    if (!token) {
      router.push("/auth/login");
      return;
    }
    try {
      setProcessing(planId);
      setError(null);
      setSuccess(null);
      const response = (await upgradeMembership(token, planId)) as {
        message?: string;
        paymentUrl?: string;
        plan?: MembershipPlan;
        membershipPlanId?: string;
        membershipExpiresAt?: string | null;
      };

      // Check if payment is required
      if (response.paymentUrl) {
        // Show payment message and redirect to payment
        setError(null);
        setSuccess(response.message || "يجب إكمال الدفع لتفعيل العضوية الجديدة.");
        
        // Redirect to payment URL after a short delay
        setTimeout(() => {
          window.open(response.paymentUrl, '_blank');
        }, 2000);
      } else {
        // Direct upgrade (shouldn't happen with new system, but kept for compatibility)
        setCurrentPlanId(response.membershipPlanId ?? planId);
        setExpiresAt(response.membershipExpiresAt ?? null);
        setSuccess("تم ترقية عضويتك بنجاح!");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر تحديث العضوية");
    } finally {
      setProcessing(null);
    }
  };

  if (!token) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="section-container space-y-8">
        <header className="space-y-3">
          <h1 className="text-3xl font-bold text-slate-900">ترقية الاشتراك</h1>
          <p className="text-sm text-slate-600">
            اختر الباقة المناسبة لطموحاتك وتقدم بخطوات واثقة نحو الزواج الموفّق.
          </p>
        </header>

        {error ? (
          <p className="rounded-3xl bg-rose-50 px-6 py-4 text-sm text-rose-600">{error}</p>
        ) : null}
        {success ? (
          <p className="rounded-3xl bg-emerald-50 px-6 py-4 text-sm text-emerald-600">{success}</p>
        ) : null}

        {loading ? (
          <div className="rounded-3xl border border-slate-100 bg-white p-6 text-center text-sm text-slate-500">
            جار تحميل باقات العضوية...
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            {plans.map((plan) => {
              const isActive = plan.id === currentPlanId;
              const priceLabel = plan.price > 0 ? `${plan.price} ${plan.currency}` : "مجانًا";
              return (
                <div
                  key={plan.id}
                  className={`flex flex-col gap-4 rounded-3xl border p-6 shadow-sm transition-transform hover:-translate-y-1 ${
                    isActive
                      ? "border-secondary-300 bg-white"
                      : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <div>
                    <span className="rounded-full bg-secondary-100 px-4 py-1 text-xs font-semibold text-secondary-700">
                      {plan.name}
                    </span>
                    {plan.subtitle ? (
                      <p className="mt-2 text-sm text-slate-600">{plan.subtitle}</p>
                    ) : null}
                  </div>

                  <div className="text-3xl font-bold text-slate-900">{priceLabel}</div>
                  <p className="text-xs text-slate-500">
                    {plan.durationDays
                      ? `صالح لمدة ${plan.durationDays} يوم`
                      : "بلا مدة انتهاء"}
                  </p>

                  <p className="text-sm leading-7 text-slate-600">{plan.description}</p>

                  <ul className="space-y-2 text-xs text-slate-600">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-secondary-400" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {plan.highlight ? (
                    <p className="rounded-2xl bg-secondary-50 px-4 py-2 text-xs text-secondary-700">
                      {plan.highlight}
                    </p>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => handleSelect(plan.id)}
                    disabled={processing === plan.id || isActive}
                    className={`rounded-full px-5 py-3 text-sm font-medium transition-all ${
                      isActive
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-secondary-600 text-white hover:bg-secondary-500"
                    } disabled:cursor-not-allowed disabled:opacity-70`}
                  >
                    {isActive ? "الباقة الحالية" : "اختيار هذه الباقة"}
                  </button>

                  {isActive && expiresAt ? (
                    <p className="text-xs text-slate-500">
                      تنتهي صلاحية هذه الباقة في {new Date(expiresAt).toLocaleDateString("ar-SA")}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
