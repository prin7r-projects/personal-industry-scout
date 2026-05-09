const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export interface User {
  id: string;
  email: string;
  name: string | null;
}

interface AuthResponse {
  user: User;
  token: string;
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message =
      typeof body.error === "string"
        ? body.error
        : body.error?.[0]?.message ?? `${res.status} ${res.statusText}`;
    throw new Error(message);
  }

  return res.json();
}

export interface TenderMatch {
  id: string;
  score: number;
  seen: boolean;
  tender: {
    id: string;
    title: string;
    buyer: string;
    value: number | null;
  };
  createdAt: string;
}

export interface DashboardMetrics {
  tenders: {
    total: number;
    byStatus: Record<string, number>;
  };
  user: {
    watches: number;
    matches: {
      total: number;
      unseen: number;
      avgScore: number;
      recent: TenderMatch[];
      top: TenderMatch[];
    };
  };
}

export interface Bot {
  id: string;
  name: string;
  systemPrompt: string;
  businessHours: string;
  greeting: string;
  fallback: string;
  brandColor: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export const api = {
  register(data: { email: string; password: string; name?: string }) {
    return request<AuthResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  login(data: { email: string; password: string }) {
    return request<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  getDashboardMetrics() {
    return request<DashboardMetrics>("/api/dashboard/metrics");
  },
};
