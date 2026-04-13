import type { Theme } from "@/lib/themes";

// Load Google Fonts for the theme via <link> tags
// This avoids bundling all 5 font families — only the active theme's fonts load
export function ThemeFonts({ theme }: { theme: Theme }) {
  const families = new Set<string>();

  if (theme.fonts.display !== "system" && theme.fonts.display !== "Inter") {
    families.add(theme.fonts.display);
  }
  if (theme.fonts.body !== "system" && theme.fonts.body !== "Inter") {
    families.add(theme.fonts.body);
  }

  if (families.size === 0) return null;

  const familyParam = [...families]
    .map((f) => `family=${f.replace(/ /g, "+")}:wght@400;500;600;700`)
    .join("&");

  return (
    <link
      rel="stylesheet"
      href={`https://fonts.googleapis.com/css2?${familyParam}&display=swap`}
    />
  );
}
