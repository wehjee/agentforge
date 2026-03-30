import { cookies } from "next/headers";

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) return null;

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/v1/auth/me`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      }
    );

    if (!res.ok) return null;

    const json = await res.json();
    return json.data;
  } catch {
    return null;
  }
}

export function getToken(): string | undefined {
  if (typeof window === "undefined") return undefined;
  return document.cookie
    .split("; ")
    .find((c) => c.startsWith("token="))
    ?.split("=")[1];
}
