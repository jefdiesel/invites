import { NextRequest, NextResponse } from "next/server";

// Platform hostnames that should NOT be treated as custom domains
const PLATFORM_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "nat-iota.vercel.app",
  "itsremi.app",
  "www.itsremi.app",
]);

export async function middleware(request: NextRequest) {
  const host = request.headers.get("host")?.split(":")[0] ?? "";

  // Skip platform hosts — serve normally
  if (PLATFORM_HOSTS.has(host) || host.endsWith(".vercel.app")) {
    return NextResponse.next();
  }

  // Custom domain — look up the business slug
  const slug = await lookupSlug(host);
  if (!slug) {
    return NextResponse.next();
  }

  // Rewrite: chezlaurent.com/ → /r/chez-laurent
  //          chezlaurent.com/book → /r/chez-laurent/book
  const path = request.nextUrl.pathname;

  // Don't rewrite if already under /r/ (shouldn't happen on custom domain, but safety)
  if (path.startsWith("/r/")) {
    return NextResponse.next();
  }

  // Don't rewrite API routes or static files
  if (path.startsWith("/api/") || path.startsWith("/_next/") || path.startsWith("/favicon")) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = `/r/${slug}${path === "/" ? "" : path}`;
  return NextResponse.rewrite(url);
}

// Cache domain→slug lookups for 60 seconds to avoid hitting the DB on every request
const slugCache = new Map<string, { slug: string | null; expires: number }>();
const CACHE_TTL = 60_000;

async function lookupSlug(domain: string): Promise<string | null> {
  const cached = slugCache.get(domain);
  if (cached && cached.expires > Date.now()) {
    return cached.slug;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) return null;

  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/businesses?custom_domain=eq.${encodeURIComponent(domain)}&select=slug&limit=1`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    );
    const data = await res.json();
    const slug = data?.[0]?.slug ?? null;
    slugCache.set(domain, { slug, expires: Date.now() + CACHE_TTL });
    return slug;
  } catch {
    return null;
  }
}

export const config = {
  matcher: [
    // Match all paths except static files and Next internals
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
