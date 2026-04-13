import { cookies } from "next/headers";
import { redirect } from "next/navigation";

type Session = { role: "staff" | "admin"; slug: string };

export async function getSession(slug: string): Promise<Session | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(`session_${slug}`)?.value;
  if (!raw) return null;

  try {
    const session = JSON.parse(raw) as Session;
    if (session.slug !== slug) return null;
    return session;
  } catch {
    return null;
  }
}

export async function requireAuth(slug: string, minRole: "staff" | "admin"): Promise<Session> {
  const session = await getSession(slug);

  if (!session) {
    redirect(`/r/${slug}/login`);
  }

  if (minRole === "admin" && session.role !== "admin") {
    redirect(`/r/${slug}/login`);
  }

  return session;
}
