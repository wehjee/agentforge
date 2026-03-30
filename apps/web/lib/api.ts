import type { ApiResponse, PaginatedResponse } from "@shared/types";

function getToken(): string | undefined {
  if (typeof window === "undefined") return undefined;
  return document.cookie
    .split("; ")
    .find((c) => c.startsWith("token="))
    ?.split("=")[1];
}

function getWorkspaceId(): string | undefined {
  if (typeof window === "undefined") return undefined;
  return localStorage.getItem("workspaceId") || undefined;
}

interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

export async function apiFetch<T>(
  path: string,
  options: FetchOptions = {}
): Promise<ApiResponse<T>> {
  const { params, headers: customHeaders, ...rest } = options;

  let url = path.startsWith("http")
    ? path
    : `${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1${path}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) searchParams.set(key, String(value));
    });
    const qs = searchParams.toString();
    if (qs) url += `?${qs}`;
  }

  const token = getToken();
  const workspaceId = getWorkspaceId();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...(workspaceId && { "x-workspace-id": workspaceId }),
    ...(customHeaders as Record<string, string>),
  };

  const res = await fetch(url, { ...rest, headers });

  let data: Record<string, unknown>;
  try {
    data = await res.json();
  } catch {
    throw new ApiError(
      `Server returned ${res.status} ${res.statusText}`,
      res.status,
      "PARSE_ERROR"
    );
  }

  if (!res.ok) {
    const err = data.error as Record<string, unknown> | undefined;
    throw new ApiError(
      (err?.message as string) || "Request failed",
      res.status,
      (err?.code as string) || "UNKNOWN"
    );
  }

  return data as unknown as ApiResponse<T>;
}

export async function apiFetchPaginated<T>(
  path: string,
  options: FetchOptions = {}
): Promise<PaginatedResponse<T>> {
  const result = await apiFetch<T[]>(path, options);
  return result as unknown as PaginatedResponse<T>;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: string
  ) {
    super(message);
  }
}
