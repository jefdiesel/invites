import type { Theme } from "./themes";

export function getThemeVars(theme: Theme) {
  const t = theme.colors;
  const displayFont = theme.fonts.display === "system" ? "var(--font-geist-sans)" : `'${theme.fonts.display}', serif`;
  const bodyFont = theme.fonts.body === "system" ? "var(--font-geist-sans)" : `'${theme.fonts.body}', sans-serif`;
  const r = theme.radius === "none" ? "0" : theme.radius === "sm" ? "0.375rem" : theme.radius === "lg" ? "0.75rem" : "9999px";
  const rBtn = theme.radius === "full" ? "9999px" : r;
  const rCard = theme.radius === "full" ? "1rem" : r;
  return { t, displayFont, bodyFont, r, rBtn, rCard };
}

export function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return m === 0 ? `${hour} ${ampm}` : `${hour}:${m.toString().padStart(2, "0")} ${ampm}`;
}
