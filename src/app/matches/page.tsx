"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchWithToken } from "@/lib/api";
import { getStoredAuth, StoredAuth } from "@/lib/auth";

type MatchResponse = {
  id: string;
  status: string;
  compatibilityScore?: number;
  notes?: string;
  requester?: { id?: string; email?: string };
  target?: { id?: string; email?: string };
  createdAt?: string;
};

export default function MatchesPage() {
  const router = useRouter();
  const [auth, setAuth] = useState<StoredAuth | null>(null);
  const [matches, setMatches] = useState<MatchResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requesting, setRequesting] = useState(false);
  const [targetId, setTargetId] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const stored = getStoredAuth();
    if (!stored) {
      router.push("/auth/login");
      return;
    }
    setAuth(stored);
    loadMatches(stored);
  }, [router]);

  async function loadMatches(stored: StoredAuth) {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchWithToken<MatchResponse[]>(
        "/matches",
        stored.token,
      );
      setMatches(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!auth || !targetId.trim()) {
      return;
    }
    setRequesting(true);
    setError(null);
    try {
      await fetchWithToken<MatchResponse>("/matches", auth.token, {
        method: "POST",
        body: JSON.stringify({
          targetUserId: targetId.trim(),
          notes: notes.trim() || undefined,
        }),
      });
      setTargetId("");
      setNotes("");
      await loadMatches(auth);
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
    } finally {
      setRequesting(false);
    }
  }

  async function updateStatus(id: string, status: string) {
    if (!auth) {
      return;
    }
    try {
      await fetchWithToken(`/matches/${id}`, auth.token, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await loadMatches(auth);
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
    }
  }

  if (!auth) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="section-container space-y-8">
        <header>
          <h1 className="text-3xl font-bold text-slate-900">طلبات التوافق</h1>
          <p className="mt-2 text-sm text-slate-600">
            راجع الطلبات الحالية أو أرسل طلب تعارف جديد لأحد الأعضاء.
          </p>
        </header>

        <form
          onSubmit={handleCreate}
          className="grid gap-4 rounded-3xl border border-slate-100 bg-white p-6 shadow-soft md:grid-cols-[2fr_2fr_auto]"
        >
          <label className="flex flex-col gap-2 text-sm text-slate-600">
            رقم العضو المستهدف
            <input
              value={targetId}
              onChange={(event) => setTargetId(event.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-secondary-400 focus:outline-none focus:ring-2 focus:ring-secondary-100"
              placeholder="مثال: 64b0f1..."
              required
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-600 md:col-span-1">
            ملاحظات للطلب
            <input
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-secondary-400 focus:outline-none focus:ring-2 focus:ring-secondary-100"
              placeholder="رسالة للطرف الآخر (اختياري)"
            />
          </label>
          <button
            type="submit"
            disabled={requesting}
            className="self-end rounded-full bg-secondary-600 px-6 py-3 text-sm font-medium text-white transition-all hover:bg-secondary-500 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {requesting ? "جاري الإرسال..." : "إرسال طلب"}
          </button>
        </form>

        {error ? (
          <p className="rounded-3xl bg-rose-50 px-6 py-4 text-sm text-rose-600">
            {error}
          </p>
        ) : null}

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-800">قائمة الطلبات</h2>
          <div className="grid gap-4">
            {loading ? (
              <div className="rounded-3xl border border-slate-100 bg-white p-6 text-sm text-slate-600">
                جاري تحميل الطلبات...
              </div>
            ) : matches.length === 0 ? (
              <div className="rounded-3xl border border-slate-100 bg-white p-6 text-sm text-slate-600">
                لا توجد طلبات مطابقة حالياً.
              </div>
            ) : (
              matches.map((match) => (
                <div
                  key={match.id}
                  className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm text-slate-500">
                        رقم الطلب:{" "}
                        <span className="font-medium text-secondary-700">
                          {match.id}
                        </span>
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        الطرف الآخر:{" "}
                        <span className="font-medium">
                          {match.requester?.id === auth.user.id
                            ? match.target?.email ?? match.target?.id
                            : match.requester?.email ?? match.requester?.id}
                        </span>
                      </p>
                      {match.compatibilityScore ? (
                        <p className="text-sm text-slate-600">
                          درجة التوافق: {Math.round(match.compatibilityScore)}%
                        </p>
                      ) : null}
                      {match.notes ? (
                        <p className="text-sm text-slate-500">{match.notes}</p>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-secondary-100 px-3 py-1 text-xs font-semibold text-secondary-700">
                        {match.status}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateStatus(match.id, "approved")}
                        className="rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
                      >
                        قبول
                      </button>
                      <button
                        type="button"
                        onClick={() => updateStatus(match.id, "declined")}
                        className="rounded-full border border-rose-300 bg-rose-50 px-3 py-1 text-xs font-medium text-rose-600 hover:bg-rose-100"
                      >
                        رفض
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateStatus(match.id, "introduction_scheduled")
                        }
                        className="rounded-full border border-secondary-300 bg-secondary-50 px-3 py-1 text-xs font-medium text-secondary-600 hover:bg-secondary-100"
                      >
                        جدولة جلسة تعارف
                      </button>
                    </div>
                  </div>
                  {match.createdAt ? (
                    <p className="mt-3 text-xs text-slate-400">
                      تم الإنشاء في{" "}
                      {new Date(match.createdAt).toLocaleString("ar-SA")}
                    </p>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}





