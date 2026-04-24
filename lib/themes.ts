export type ThemeId = "modern" | "classic" | "rustic" | "playful" | "bright";

export type Theme = {
  id: ThemeId;
  label: string;
  description: string;
  fonts: {
    display: string;
    body: string;
  };
  colors: {
    bg: string;
    surface: string;
    surfaceAlt: string;
    text: string;
    textMuted: string;
    textLight: string;
    accent: string;
    accentHover: string;
    accentMuted: string;
    accent2: string;         // secondary accent for variety
    border: string;
    navBg: string;
    navText: string;
    navTextHover: string;
    heroBg: string;
    heroText: string;
    heroTextMuted: string;
    footerBg: string;
    footerText: string;
    footerTextMuted: string;
  };
  radius: string;
  texture: boolean;
  menuStyle: "dots" | "line" | "clean";
  navStyle: "dark" | "light" | "transparent";
  heroStyle: "overlay" | "split" | "fullbleed" | "minimal"; // controls hero layout
  menuColumns: 1 | 2;       // menu layout
  sectionDivider: "border" | "none" | "accent-line"; // how sections separate
};

export const themes: Record<ThemeId, Theme> = {
  modern: {
    id: "modern",
    label: "Modern",
    description: "Stripped back, high contrast, nothing extra. Brutalist meets fine dining.",
    fonts: { display: "Inter", body: "Inter" },
    colors: {
      bg: "#ffffff",
      surface: "#ffffff",
      surfaceAlt: "#fafafa",
      text: "#0a0a0a",
      textMuted: "#525252",
      textLight: "#636363",
      accent: "#0a0a0a",
      accentHover: "#262626",
      accentMuted: "rgba(10,10,10,0.06)",
      accent2: "#0a0a0a",
      border: "#e5e5e5",
      navBg: "#ffffff",
      navText: "#636363",
      navTextHover: "#0a0a0a",
      heroBg: "#0a0a0a",
      heroText: "#ffffff",
      heroTextMuted: "rgba(255,255,255,0.6)",
      footerBg: "#0a0a0a",
      footerText: "#ffffff",
      footerTextMuted: "rgba(255,255,255,0.65)",
    },
    radius: "none",
    texture: false,
    menuStyle: "clean",
    navStyle: "light",
    heroStyle: "minimal",
    menuColumns: 1,
    sectionDivider: "border",
  },

  classic: {
    id: "classic",
    label: "Classic",
    description: "Warm, elegant, timeless. The candlelit dinner of web design.",
    fonts: { display: "DM Serif Display", body: "system" },
    colors: {
      bg: "#f7f3ed",
      surface: "#ffffff",
      surfaceAlt: "#f7f3ed",
      text: "#1f1a14",
      textMuted: "#6b5a44",
      textLight: "#7a6a54",
      accent: "#b5612e",
      accentHover: "#d4884f",
      accentMuted: "rgba(196,112,60,0.1)",
      accent2: "#8b5e3c",
      border: "#e8e0d4",
      navBg: "rgba(31,26,20,0.95)",
      navText: "#d4c8b8",
      navTextHover: "#ffffff",
      heroBg: "#1f1a14",
      heroText: "#ffffff",
      heroTextMuted: "rgba(255,255,255,0.65)",
      footerBg: "#1f1a14",
      footerText: "#ffffff",
      footerTextMuted: "rgba(255,255,255,0.65)",
    },
    radius: "sm",
    texture: true,
    menuStyle: "dots",
    navStyle: "dark",
    heroStyle: "overlay",
    menuColumns: 2,
    sectionDivider: "border",
  },

  rustic: {
    id: "rustic",
    label: "Rustic",
    description: "Rough edges, deep greens, woodsmoke. Built from the land.",
    fonts: { display: "Libre Baskerville", body: "system" },
    colors: {
      bg: "#f0ebe0",
      surface: "#f7f4ed",
      surfaceAlt: "#e8e1d3",
      text: "#2d2a23",
      textMuted: "#5c5647",
      textLight: "#6b6558",
      accent: "#3d6b47",
      accentHover: "#2d5435",
      accentMuted: "rgba(61,107,71,0.10)",
      accent2: "#8b6834",
      border: "#d0c7b6",
      navBg: "#2d2a23",
      navText: "#b8b0a0",
      navTextHover: "#f0ebe0",
      heroBg: "#2d2a23",
      heroText: "#f0ebe0",
      heroTextMuted: "rgba(240,235,224,0.70)",
      footerBg: "#2d2a23",
      footerText: "#f0ebe0",
      footerTextMuted: "rgba(240,235,224,0.65)",
    },
    radius: "sm",
    texture: true,
    menuStyle: "line",
    navStyle: "dark",
    heroStyle: "fullbleed",
    menuColumns: 1,
    sectionDivider: "accent-line",
  },

  playful: {
    id: "playful",
    label: "Playful",
    description: "Loud, round, unapologetic. Your favorite neighborhood spot.",
    fonts: { display: "Fredoka", body: "system" },
    colors: {
      bg: "#fef7ed",
      surface: "#ffffff",
      surfaceAlt: "#fff0de",
      text: "#1a1207",
      textMuted: "#5c4628",
      textLight: "#73592f",
      accent: "#cc3a18",
      accentHover: "#b5321a",
      accentMuted: "rgba(224,68,32,0.08)",
      accent2: "#f59e0b",
      border: "#f0dfc8",
      navBg: "#cc3a18",
      navText: "#ffffff",
      navTextHover: "#ffffff",
      heroBg: "#cc3a18",
      heroText: "#ffffff",
      heroTextMuted: "rgba(255,255,255,0.85)",
      footerBg: "#1a1207",
      footerText: "#fef7ed",
      footerTextMuted: "rgba(254,247,237,0.65)",
    },
    radius: "full",
    texture: false,
    menuStyle: "clean",
    navStyle: "dark",
    heroStyle: "fullbleed",
    menuColumns: 2,
    sectionDivider: "none",
  },

  bright: {
    id: "bright",
    label: "Bright",
    description: "Electric. Saturated. The restaurant is a brand and the brand hits hard.",
    fonts: { display: "Space Grotesk", body: "Space Grotesk" },
    colors: {
      bg: "#f5f0ff",
      surface: "#ffffff",
      surfaceAlt: "#ede5ff",
      text: "#0f0720",
      textMuted: "#4a3d6b",
      textLight: "#6b5f8a",
      accent: "#7c3aed",
      accentHover: "#6d28d9",
      accentMuted: "rgba(124,58,237,0.08)",
      accent2: "#ec4899",
      border: "#ddd5f0",
      navBg: "#0f0720",
      navText: "rgba(255,255,255,0.7)",
      navTextHover: "#ffffff",
      heroBg: "#0f0720",
      heroText: "#ffffff",
      heroTextMuted: "rgba(255,255,255,0.6)",
      footerBg: "#0f0720",
      footerText: "#ffffff",
      footerTextMuted: "rgba(255,255,255,0.65)",
    },
    radius: "lg",
    texture: false,
    menuStyle: "clean",
    navStyle: "dark",
    heroStyle: "fullbleed",
    menuColumns: 2,
    sectionDivider: "accent-line",
  },
};

export function getTheme(id?: string | null): Theme {
  if (id && id in themes) return themes[id as ThemeId];
  return themes.classic;
}
