/*
 * Brand tokens, the same as the web shop (src/app/globals.css there): warm
 * neutrals, ink for actions, one copper accent used sparingly. Use these
 * instead of hard-coded colours in components.
 */
export const colors = {
  background: "#FAF7F2", // page
  sand: "#F3ECE2", // hero panel, soft sections
  surface: "#FFFFFF", // cards, header, inputs
  line: "#E7E0D6", // borders
  ink: "#1C1917", // text, primary buttons, prices
  muted: "#6E6863", // secondary text
  accent: "#A15528", // copper: one italic word in headings, eyebrow labels, "View all" links
  inkSoft: "rgba(28, 25, 23, 0.78)",
  overlay: "rgba(28, 25, 23, 0.45)",
  white: "#FFFFFF",
} as const;

/** Font family names, as loaded in the root layout. */
export const fonts = {
  heading: "PlayfairDisplay_400Regular",
  headingItalic: "PlayfairDisplay_400Regular_Italic",
  headingMedium: "PlayfairDisplay_500Medium",
  body: "Inter_400Regular",
  bodyMedium: "Inter_500Medium",
  bodySemibold: "Inter_600SemiBold",
} as const;

export const radius = { sm: 12, md: 16, lg: 24, pill: 999 } as const;

/** Side gutter for every screen. */
export const gutter = 16;

/** The one soft card shadow the web shop allows (shadow-soft). */
export const softShadow = {
  shadowColor: colors.ink,
  shadowOpacity: 0.06,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 1,
} as const;
