export type StoredAuth = {
  token: string;
  user: {
    id: string;
    email?: string;
    role?: string;
  };
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
  let user = storedUser ? JSON.parse(storedUser) : undefined;
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

