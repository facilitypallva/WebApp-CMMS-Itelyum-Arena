export const arenaTokens = {
  colors: {
    background: {
      app: "#FAFAF9",
      surface: "#F1EFE8",
      card: "#FFFFFF",
      sidebar: "#1C1B18",
    },
    text: {
      primary: "#1C1B18",
      secondary: "#5F5E5A",
      muted: "#888780",
      onDark: "#FAFAF9",
      onDarkMuted: "#A8A6A0",
    },
    border: {
      default: "#E5E4DF",
      strong: "#D3D1C7",
      onDark: "rgba(250, 250, 249, 0.10)",
    },
    primary: {
      default: "#2ECC71",
      hover: "#27B463",
      pressed: "#1F9651",
      text: "#0A3D1F",
      soft: "rgba(46, 204, 113, 0.14)",
    },
    success: {
      background: "#EAFBF1",
      text: "#1A7A3C",
      accent: "#2ECC71",
    },
    warning: {
      background: "#FFF3E8",
      text: "#A8531A",
      accent: "#E8782A",
    },
    error: {
      background: "#FFF0EE",
      text: "#A83228",
      accent: "#E24B4A",
    },
    sidebar: {
      background: "#1C1B18",
      border: "rgba(250, 250, 249, 0.10)",
      text: "#A8A6A0",
      textMuted: "#888780",
      textActive: "#FAFAF9",
      itemHover: "rgba(250, 250, 249, 0.07)",
      itemActive: "rgba(46, 204, 113, 0.14)",
      primary: "#2ECC71",
      primaryText: "#0A3D1F",
    },
    chart: {
      primary: "#2ECC71",
      warning: "#E8782A",
      error: "#A83228",
      success: "#1A7A3C",
      neutral: "#5F5E5A",
    },
    status: {
      neutral: {
        background: "#F1EFE8",
        text: "#5F5E5A",
        accent: "#888780",
        border: "#E5E4DF",
      },
      success: {
        background: "#EAFBF1",
        text: "#1A7A3C",
        accent: "#2ECC71",
        border: "rgba(46, 204, 113, 0.25)",
      },
      warning: {
        background: "#FFF3E8",
        text: "#A8531A",
        accent: "#E8782A",
        border: "rgba(232, 120, 42, 0.25)",
      },
      error: {
        background: "#FFF0EE",
        text: "#A83228",
        accent: "#E24B4A",
        border: "rgba(226, 75, 74, 0.25)",
      },
      active: {
        background: "rgba(46, 204, 113, 0.14)",
        text: "#0A3D1F",
        accent: "#2ECC71",
        border: "rgba(46, 204, 113, 0.25)",
      },
    },
  },
  radius: {
    xs: "4px",
    sm: "6px",
    md: "8px",
    lg: "10px",
    xl: "12px",
    "2xl": "16px",
    full: "9999px",
  },
  shadow: {
    none: "none",
    xs: "0 1px 2px 0 rgba(28, 27, 24, 0.04)",
    sm: "0 2px 4px 0 rgba(28, 27, 24, 0.05), 0 1px 2px 0 rgba(28, 27, 24, 0.04)",
    md: "0 4px 12px -2px rgba(28, 27, 24, 0.08), 0 2px 4px -2px rgba(28, 27, 24, 0.04)",
    lg: "0 12px 32px -8px rgba(28, 27, 24, 0.16), 0 4px 8px -4px rgba(28, 27, 24, 0.06)",
    focusPrimary: "0 0 0 3px rgba(46, 204, 113, 0.20)",
    focusError: "0 0 0 3px rgba(226, 75, 74, 0.20)",
  },
  font: {
    family: {
      sans: '"Inter", ui-sans-serif, system-ui, sans-serif',
      heading: '"Inter", ui-sans-serif, system-ui, sans-serif',
      mono: '"Inter", ui-sans-serif, system-ui, sans-serif',
    },
    weights: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    featureSettings: '"cv11", "ss01", "ss03"',
  },
} as const;

export const colors = arenaTokens.colors;
export const radius = arenaTokens.radius;
export const shadow = arenaTokens.shadow;
export const font = arenaTokens.font;

export type ArenaTokens = typeof arenaTokens;
export type ArenaColors = typeof colors;
export type ArenaStatusColor = keyof typeof arenaTokens.colors.status;
