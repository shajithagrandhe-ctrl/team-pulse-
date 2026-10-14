export const theme = {
  colors: {
    background: "#F3F6F9",
    surface: "#FFFFFF",
    surfaceMuted: "#EAF0F5",
    ink: "#10233F",
    muted: "#607083",
    subtle: "#8B98A8",
    primary: "#246BFD",
    primaryDark: "#174EC4",
    navigation: "#102A4C",
    navigationAlt: "#173E69",
    accent: "#D6A83E",
    teal: "#167D78",
    border: "#D8E0E8",
    borderStrong: "#BCC9D5",
    available: "#1F8A55",
    advance: "#C57918",
    sold: "#C53D47",
    danger: "#C53D47",
    warningSurface: "#FFF5DE",
    successSurface: "#E8F6EE",
    dangerSurface: "#FCECEE",
    infoSurface: "#EAF2FF",
    white: "#FFFFFF"
  },
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 40 },
  radius: { sm: 4, md: 6, lg: 8 },
  shadow: {
    shadowColor: "#10233F",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3
  }
} as const;

export const roleTone = {
  ADMIN: { background: "#EDEBFF", foreground: "#5A4AB8" },
  EMPLOYEE: { background: theme.colors.infoSurface, foreground: theme.colors.primaryDark },
  AGENT: { background: "#E5F6F4", foreground: theme.colors.teal },
  CUSTOMER: { background: theme.colors.successSurface, foreground: theme.colors.available }
} as const;
