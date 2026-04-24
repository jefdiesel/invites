import Link from "next/link";
import type { Theme } from "@/lib/themes";
import { getThemeVars } from "@/lib/theme-helpers";

export function SiteFooter({
  biz,
  slug,
  theme,
}: {
  biz: { name: string; address: string; city: string; phone: string; email: string };
  slug: string;
  theme: Theme;
}) {
  const { t, displayFont } = getThemeVars(theme);

  return (
    <footer style={{ background: t.footerBg, borderTop: "1px solid rgba(255,255,255,0.1)" }} className="py-10">
      <div className="max-w-4xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
          <div>
            <span style={{ fontFamily: displayFont, color: t.footerText }} className="text-lg">{biz.name}</span>
            {biz.address && (
              <span className="text-sm ml-3" style={{ color: t.footerTextMuted }}>
                {biz.address}{biz.city ? `, ${biz.city}` : ""}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 text-sm" style={{ color: t.footerTextMuted }}>
            {biz.phone && (
              <a href={`tel:${biz.phone}`} className="underline underline-offset-2 transition-colors hover:opacity-80">
                {biz.phone}
              </a>
            )}
            {biz.email && (
              <a href={`mailto:${biz.email}`} className="underline underline-offset-2 transition-colors hover:opacity-80">
                {biz.email}
              </a>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs" style={{ color: t.footerTextMuted }}>
          <Link href={`/r/${slug}/about`} className="underline underline-offset-2 transition-colors hover:opacity-80">About</Link>
          <Link href={`/r/${slug}/gallery`} className="underline underline-offset-2 transition-colors hover:opacity-80">Gallery</Link>
          <Link href={`/r/${slug}/contact`} className="underline underline-offset-2 transition-colors hover:opacity-80">Contact</Link>
          <Link href={`/r/${slug}/accessibility`} className="underline underline-offset-2 transition-colors hover:opacity-80">Accessibility</Link>
        </div>
      </div>
    </footer>
  );
}
