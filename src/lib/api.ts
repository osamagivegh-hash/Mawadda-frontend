const API_BASE =
  process.env.NEXT_PUBLIC_API ??
  "http://localhost:3000/api";

async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      (data && (data.message || data.error)) ?? "حدث خطأ غير متوقع";
    throw new Error(Array.isArray(message) ? message.join("، ") : message);
  }
  return data as T;
}

export async function register(payload: Record<string, unknown>) {
  const response = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
}

export async function login(payload: Record<string, unknown>) {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
}

export async function fetchWithToken<T>(
  endpoint: string,
  token: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers ?? {}),
    },
  });
  return handleResponse<T>(response);
}

export function getDashboardSummary(token: string) {
  return fetchWithToken("/dashboard/summary", token);
}

export function getConsultants(token: string, includeInactive = false) {
  const query = includeInactive ? "?includeInactive=true" : "";
  return fetchWithToken(`/consultants${query}`, token);
}

export function getConsultantHighlight(token: string, limit = 3) {
  return fetchWithToken(`/consultants/highlight?limit=${limit}`, token);
}

export function getMembershipPlans(token: string) {
  return fetchWithToken("/membership/plans", token);
}

export function getCurrentMembership(token: string) {
  return fetchWithToken("/membership", token);
}

export function selectMembership(token: string, planId: string) {
  return fetchWithToken(
    "/membership/select",
    token,
    {
      method: "POST",
      body: JSON.stringify({ planId }),
    },
  );
}

export function upgradeMembership(token: string, planId: string) {
  return fetchWithToken(
    "/membership/upgrade",
    token,
    {
      method: "POST",
      body: JSON.stringify({ planId }),
    },
  );
}

// Exam API functions
export function getAvailableExams(token: string) {
  return fetchWithToken("/exams", token);
}

export function getExamPreview(token: string, examId: string) {
  return fetchWithToken(`/exams/${examId}/preview`, token);
}

export function purchaseExam(token: string, examId: string) {
  return fetchWithToken(
    `/exams/${examId}/purchase`,
    token,
    {
      method: "POST",
    },
  );
}

export function getUserPurchasedExams(token: string) {
  return fetchWithToken("/exams/my-exams", token);
}

export function getExamContent(token: string, examId: string) {
  return fetchWithToken(`/exams/${examId}`, token);
}

export function submitExam(token: string, examId: string, answers: Record<string, number>) {
  return fetchWithToken(
    `/exams/${examId}/submit`,
    token,
    {
      method: "POST",
      body: JSON.stringify({ answers }),
    },
  );
}

export function getFavorites(token: string) {
  return fetchWithToken("/favorites", token);
}

export async function uploadProfilePhoto<T = unknown>(
  token: string,
  userId: string,
  file: File,
): Promise<T> {
  const formData = new FormData();
  formData.append("photo", file);

  const response = await fetch(`${API_BASE}/profiles/${userId}/photo`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  return handleResponse<T>(response);
}

export function addFavorite(token: string, targetUserId: string) {
  return fetchWithToken(
    "/favorites",
    token,
    {
      method: "POST",
      body: JSON.stringify({ targetUserId }),
    },
  );
}

export function removeFavorite(token: string, targetUserId: string) {
  return fetchWithToken(
    `/favorites/${targetUserId}`,
    token,
    {
      method: "DELETE",
    },
  );
}

