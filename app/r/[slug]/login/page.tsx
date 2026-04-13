import { getBusiness, hasAdmins } from "@/lib/restaurant-queries";
import { getTheme } from "@/lib/themes";
import { ThemeFonts } from "@/app/components/theme-fonts";
import { notFound } from "next/navigation";
import Link from "next/link";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const biz = await getBusiness(slug);
  if (!biz) return notFound();

  // Show setup banner if no admins, but don't block login
  const adminExists = await hasAdmins(biz.id);

  const theme = getTheme(biz.theme);
  const t = theme.colors;
  const displayFont = theme.fonts.display === "system" ? "var(--font-geist-sans)" : `'${theme.fonts.display}', serif`;
  const bodyFont = theme.fonts.body === "system" ? "var(--font-geist-sans)" : `'${theme.fonts.body}', sans-serif`;
  const rBtn = theme.radius === "full" ? "9999px" : theme.radius === "none" ? "0" : theme.radius === "sm" ? "0.375rem" : "0.75rem";

  return (
    <div style={{ background: t.heroBg, color: t.heroText, fontFamily: bodyFont }} className="min-h-screen flex flex-col items-center justify-center px-6">
      <ThemeFonts theme={theme} />

      <div className="w-full max-w-sm text-center">
        {biz.logo_url && <img src={biz.logo_url} alt="" className="h-12 mx-auto mb-6" />}
        <h1 style={{ fontFamily: displayFont }} className="text-3xl mb-2">{biz.name}</h1>
        <p className="text-sm mb-10" style={{ color: t.heroTextMuted }}>Login</p>

        <LoginForm slug={slug} accent={t.accent} radius={rBtn} heroBg={t.heroBg} heroText={t.heroText} heroTextMuted={t.heroTextMuted} />

        {!adminExists && (
          <Link href={`/r/${slug}/setup`} className="inline-block mt-6 text-sm font-medium transition-opacity opacity-70 hover:opacity-100" style={{ color: t.accent }}>
            First time? Set up your account &rarr;
          </Link>
        )}

        <a href={`/r/${slug}`} className="inline-block mt-4 text-sm transition-opacity opacity-50 hover:opacity-80">
          &larr; Back to site
        </a>
      </div>
    </div>
  );
}
