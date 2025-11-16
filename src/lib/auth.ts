export type StoredUser = {
  id: string;
  email?: string;
  role?: string;
  memberId?: string;
  status?: string;
  profileId?: string | null;
  preferences?: unknown[];
  requestedMatches?: unknown[];
  receivedMatches?: unknown[];
  memberConsultations?: unknown[];
  consultantConsultations?: unknown[];
  membershipPlanId?: string | null;
  // Allow forward-compatible extra fields without using `any`
  [key: string]: unknown;
};

export type StoredAuth = {
  token: string;
  user: StoredUser;
};


const decodeBase64 =
  typeof window === "undefined"
    ? (value: string) => Buffer.from(value, "base64").toString("binary")
    : (value: string) => window.atob(value);

function decodeJwt(token: string): { sub?: string; email?: string; role?: string } {
  try {
    const payload = token.split(".")[1];
    if (!payload) {
      return {};
    }
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = decodeBase64(normalized);
    return JSON.parse(decoded);
  } catch {
    return {};
  }
}

export function getStoredAuth(): StoredAuth | null {
  if (typeof window === "undefined") {
    return null;
  }

  const token = window.localStorage.getItem("mawaddahToken");
  if (!token) {
    return null;
  }

  const storedUser = window.localStorage.getItem("mawaddahUser");
  let user: StoredUser | undefined = storedUser
    ? (JSON.parse(storedUser) as StoredUser)
    : undefined;
  if (!user || !user.id) {
    const decoded = decodeJwt(token);
    user = {
      id: decoded.sub ?? "",
      email: decoded.email,
      role: decoded.role,
    };
  }

  if (!user.id) {
    return null;
  }

  return {
    token,
    user,
  };
}

export function clearStoredAuth() {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem("mawaddahToken");
  window.localStorage.removeItem("mawaddahUser");
}

