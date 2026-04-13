export type ThemeId = "modern" | "classic" | "rustic" | "playful" | "bright";

export type Theme = {
  id: ThemeId;
  label: string;
  description: string;
  fonts: {
    display: string;   // Google Fonts family name for headings
    body: string;       // Google Fonts family name for body (or "system")
  };
  colors: {
    bg: string;         // page background
    surface: string;    // card/section background
    surfaceAlt: string; // alternating section bg
    text: string;       // primary text
    textMuted: string;  // secondary text
    textLight: string;  // tertiary/placeholder text
    accent: string;     // primary action color
    accentHover: string;
    accentMuted: string; // accent at 10% opacity for badges
    border: string;     // borders/dividers
    navBg: string;      // nav background
    navText: string;    // nav link text
    navTextHover: string;
    heroBg: string;     // hero background (no-image fallback)
    heroText: string;
    heroTextMuted: string;
    footerBg: string;
    footerText: string;
    footerTextMuted: string;
  };
  radius: string;       // border-radius token: "none" | "sm" | "lg" | "full"
  texture: boolean;     // show subtle background texture
  menuStyle: "dots" | "line" | "clean"; // price leader style
  navStyle: "dark" | "light" | "transparent";
};

export const themes: Record<ThemeId, Theme> = {
  modern: {
    id: "modern",
    label: "Modern",
    description: "Minimal, monochrome, sharp. For contemporary restaurants.",
    fonts: { display: "Inter", body: "Inter" },
    colors: {
      bg: "#ffffff",
      surface: "#ffffff",
      surfaceAlt: "#f8f8f8",
      text: "#111111",
      textMuted: "#666666",
      textLight: "#737373",
      accent: "#111111",
      accentHover: "#333333",
      accentMuted: "rgba(17,17,17,0.08)",
      border: "#e5e5e5",
      navBg: "#ffffff",
      navText: "#666666",
      navTextHover: "#111111",
      heroBg: "#111111",
      heroText: "#ffffff",
      heroTextMuted: "rgba(255,255,255,0.6)",
      footerBg: "#111111",
      footerText: "#ffffff",
      footerTextMuted: "rgba(255,255,255,0.4)",
    },
    radius: "none",
    texture: false,
    menuStyle: "clean",
    navStyle: "light",
  },

  classic: {
    id: "classic",
    label: "Classic",
    description: "Warm, elegant, serif. For fine dining and bistros.",
    fonts: { display: "DM Serif Display", body: "system" },
    colors: {
      bg: "#f7f3ed",
      surface: "#ffffff",
      surfaceAlt: "#f7f3ed",
      text: "#1f1a14",
      textMuted: "#7a6a54",
      textLight: "#96836a",
      accent: "#c4703c",
      accentHover: "#d4884f",
      accentMuted: "rgba(196,112,60,0.1)",
      border: "#e8e0d4",
      navBg: "rgba(31,26,20,0.95)",
      navText: "#d4c8b8",
      navTextHover: "#ffffff",
      heroBg: "#1f1a14",
      heroText: "#ffffff",
      heroTextMuted: "rgba(255,255,255,0.6)",
      footerBg: "#1f1a14",
      footerText: "#ffffff",
      footerTextMuted: "rgba(255,255,255,0.4)",
    },
    radius: "sm",
    texture: true,
    menuStyle: "dots",
    navStyle: "dark",
  },

  rustic: {
    id: "rustic",
    label: "Rustic",
    description: "Earthy, textured, warm. For farm-to-table and country kitchens.",
    fonts: { display: "Libre Baskerville", body: "system" },
    colors: {
      bg: "#f4f1eb",
      surface: "#faf8f4",
      surfaceAlt: "#ebe6db",
      text: "#2d2a23",
      textMuted: "#6b6456",
      textLight: "#7d7568",
      accent: "#5a7a62",
      accentHover: "#4a6a52",
      accentMuted: "rgba(90,122,98,0.12)",
      border: "#d4cdc0",
      navBg: "#2d2a23",
      navText: "#b8b0a0",
      navTextHover: "#ffffff",
      heroBg: "#2d2a23",
      heroText: "#f4f1eb",
      heroTextMuted: "rgba(244,241,235,0.6)",
      footerBg: "#2d2a23",
      footerText: "#f4f1eb",
      footerTextMuted: "rgba(244,241,235,0.4)",
    },
    radius: "sm",
    texture: true,
    menuStyle: "line",
    navStyle: "dark",
  },

  playful: {
    id: "playful",
    label: "Playful",
    description: "Rounded, colorful, friendly. For casual spots and cafes.",
    fonts: { display: "Fredoka", body: "system" },
    colors: {
      bg: "#fef9f2",
      surface: "#ffffff",
      surfaceAlt: "#fff5eb",
      text: "#2d1b06",
      textMuted: "#7a5c3a",
      textLight: "#8a7355",
      accent: "#e85d3a",
      accentHover: "#d14e2d",
      accentMuted: "rgba(232,93,58,0.1)",
      border: "#f0e4d4",
      navBg: "#e85d3a",
      navText: "rgba(255,255,255,0.85)",
      navTextHover: "#ffffff",
      heroBg: "#e85d3a",
      heroText: "#ffffff",
      heroTextMuted: "rgba(255,255,255,0.75)",
      footerBg: "#2d1b06",
      footerText: "#fef9f2",
      footerTextMuted: "rgba(254,249,242,0.5)",
    },
    radius: "full",
    texture: false,
    menuStyle: "clean",
    navStyle: "dark",
  },

  bright: {
    id: "bright",
    label: "Bright",
    description: "Bold, saturated, high-energy. For modern bistros and bars.",
    fonts: { display: "Space Grotesk", body: "Space Grotesk" },
    colors: {
      bg: "#f0f0f0",
      surface: "#ffffff",
      surfaceAlt: "#f0f0f0",
      text: "#0a0a0a",
      textMuted: "#525252",
      textLight: "#737373",
      accent: "#2563eb",
      accentHover: "#1d4ed8",
      accentMuted: "rgba(37,99,235,0.08)",
      border: "#e0e0e0",
      navBg: "#0a0a0a",
      navText: "rgba(255,255,255,0.7)",
      navTextHover: "#ffffff",
      heroBg: "#0a0a0a",
      heroText: "#ffffff",
      heroTextMuted: "rgba(255,255,255,0.5)",
      footerBg: "#0a0a0a",
      footerText: "#ffffff",
      footerTextMuted: "rgba(255,255,255,0.4)",
    },
    radius: "lg",
    texture: false,
    menuStyle: "clean",
    navStyle: "dark",
  },
};

export function getTheme(id?: string | null): Theme {
  if (id && id in themes) return themes[id as ThemeId];
  return themes.classic;
}
