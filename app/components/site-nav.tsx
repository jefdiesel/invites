import Link from "next/link";
import type { Theme } from "@/lib/themes";
import { getThemeVars } from "@/lib/theme-helpers";

type Page = "home" | "about" | "gallery" | "contact" | "accessibility" | "book";

export function SiteNav({
  biz,
  slug,
  theme,
  currentPage,
  hasReservations,
  hasMenu,
}: {
  biz: { name: string; logo_url: string };
  slug: string;
  theme: Theme;
  currentPage: Page;
  hasReservations: boolean;
  hasMenu?: boolean;
}) {
  const { t, displayFont, rBtn } = getThemeVars(theme);

  const links: { href: string; label: string; page: Page }[] = [
    ...(hasMenu !== false ? [{ href: `/r/${slug}#menu`, label: "Menu", page: "home" as Page }] : []),
    { href: `/r/${slug}/about`, label: "About", page: "about" },
    { href: `/r/${slug}/gallery`, label: "Gallery", page: "gallery" },
    { href: `/r/${slug}/contact`, label: "Contact", page: "contact" },
  ];

  const focusOutline = theme.navStyle === "light" ? t.accent : "#fff";

  return (
    <>
      {/* Skip to content */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:text-sm focus:font-bold"
        style={{ background: t.accent, color: "#fff", borderRadius: rBtn }}
      >
        Skip to content
      </a>

      <nav
        aria-label={`${biz.name} navigation`}
        className="sticky top-0 z-40 backdrop-blur"
        style={{
          background: t.navBg,
          borderBottom: theme.navStyle === "light" ? `1px solid ${t.border}` : "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <div className="max-w-4xl mx-auto px-6 flex items-center justify-between h-14">
          <Link
            href={`/r/${slug}`}
            className="flex items-center gap-3 focus-visible:outline-2 focus-visible:outline-offset-2 rounded"
            style={{ outlineColor: focusOutline }}
          >
            {biz.logo_url && <img src={biz.logo_url} alt="" className="h-8 w-auto" />}
            <span
              style={{ fontFamily: displayFont, color: theme.navStyle === "light" ? t.text : "#fff" }}
              className="text-xl"
            >
              {biz.name}
            </span>
          </Link>

          {/* Desktop */}
          <div className="hidden md:flex items-center gap-6 text-sm">
            {links.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 rounded"
                style={{
                  color: currentPage === link.page ? t.navTextHover : t.navText,
                  outlineColor: focusOutline,
                }}
                {...(currentPage === link.page && link.page !== "home" ? { "aria-current": "page" as const } : {})}
              >
                {link.label}
              </Link>
            ))}
            {hasReservations && (
              <Link
                href={`/r/${slug}/book`}
                className="px-5 py-1.5 text-sm font-bold text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{ background: t.accent, borderRadius: rBtn, outlineColor: focusOutline }}
              >
                Reserve
              </Link>
            )}
          </div>

          {/* Mobile reserve button */}
          {hasReservations && (
            <div className="flex md:hidden">
              <Link
                href={`/r/${slug}/book`}
                className="px-4 py-1.5 text-sm font-bold text-white transition-colors min-h-[44px] flex items-center"
                style={{ background: t.accent, borderRadius: rBtn }}
              >
                Reserve
              </Link>
            </div>
          )}
        </div>

        {/* Mobile section links */}
        <div className="flex md:hidden overflow-x-auto" style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          <div className="flex items-center gap-1 px-6 py-2 text-xs">
            {links.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="px-3 py-2 min-h-[44px] flex items-center transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 rounded"
                style={{
                  color: currentPage === link.page ? t.navTextHover : t.navText,
                  borderRadius: rBtn,
                  outlineColor: focusOutline,
                }}
                {...(currentPage === link.page && link.page !== "home" ? { "aria-current": "page" as const } : {})}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>
    </>
  );
}
