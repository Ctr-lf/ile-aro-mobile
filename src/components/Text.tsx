import { Text, type TextProps, type TextStyle } from "react-native";
import { colors, fonts } from "@/lib/theme";

/*
 * Type styles shared by every screen: Playfair Display headings, large and
 * light, with one italic copper word where it fits; Inter for body text.
 */

type HeadingProps = TextProps & {
  size?: number;
  /** One italic copper word after the title, like the web shop ("Shop by *Category*"). */
  accent?: string;
  /** Put the accent word on its own line. */
  accentOnNewLine?: boolean;
};

export function Heading({ size = 28, accent, accentOnNewLine, style, children, ...rest }: HeadingProps) {
  return (
    <Text
      accessibilityRole="header"
      style={[{ fontFamily: fonts.heading, fontSize: size, lineHeight: Math.round(size * 1.15), color: colors.ink, letterSpacing: -0.3 }, style]}
      {...rest}
    >
      {children}
      {accent ? (
        <Text style={{ fontFamily: fonts.headingItalic, color: colors.accent }}>
          {accentOnNewLine ? "\n" : " "}
          {accent}
        </Text>
      ) : null}
    </Text>
  );
}

type BodyProps = TextProps & { size?: number; weight?: "regular" | "medium" | "semibold"; color?: string };

const weights = { regular: fonts.body, medium: fonts.bodyMedium, semibold: fonts.bodySemibold };

export function Body({ size = 15, weight = "regular", color = colors.ink, style, ...rest }: BodyProps) {
  return (
    <Text
      style={[{ fontFamily: weights[weight], fontSize: size, lineHeight: Math.round(size * 1.5), color }, style]}
      {...rest}
    />
  );
}

/** Small uppercase copper label above a heading. */
export function Eyebrow({ style, ...rest }: TextProps) {
  return <Text style={[eyebrow, style]} {...rest} />;
}

const eyebrow: TextStyle = {
  fontFamily: fonts.bodyMedium,
  fontSize: 11,
  letterSpacing: 2.2,
  textTransform: "uppercase",
  color: colors.accent,
};

/** Small uppercase muted label (category names on cards, field labels). */
export function Caption({ style, ...rest }: TextProps) {
  return (
    <Text
      style={[{ fontFamily: fonts.bodyMedium, fontSize: 11, letterSpacing: 0.8, textTransform: "uppercase", color: colors.muted }, style]}
      {...rest}
    />
  );
}
