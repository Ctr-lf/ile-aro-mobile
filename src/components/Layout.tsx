import { ActivityIndicator, Pressable, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { ArrowRight, type LucideIcon } from "lucide-react-native";
import { colors, fonts, gutter, radius } from "@/lib/theme";
import { Body, Heading } from "./Text";
import { Button } from "./Button";

/** "New *Arrivals*" heading with a copper "View all" link, like the web shop's sections. */
export function SectionHeading({
  title,
  accent,
  linkLabel,
  onPressLink,
}: {
  title: string;
  accent?: string;
  linkLabel?: string;
  onPressLink?: () => void;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", paddingHorizontal: gutter, marginBottom: 14, gap: 12 }}>
      <Heading size={26} accent={accent} style={{ flexShrink: 1 }}>
        {title}
      </Heading>
      {linkLabel && onPressLink && <AccentLink label={linkLabel} onPress={onPressLink} />}
    </View>
  );
}

/** The web shop's link-accent: copper text with an arrow. */
export function AccentLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="link" hitSlop={8} onPress={onPress} style={{ flexDirection: "row", alignItems: "center", gap: 4, paddingBottom: 4 }}>
      <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.accent }}>{label}</Text>
      <ArrowRight size={15} color={colors.accent} />
    </Pressable>
  );
}

/** White card with a thin border (the web shop's .card). */
export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line }, style]}>
      {children}
    </View>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  text,
  actionLabel,
  onAction,
}: {
  icon: LucideIcon;
  title: string;
  text?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={{ alignItems: "center", paddingHorizontal: 32, paddingVertical: 48, gap: 10 }}>
      <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.sand, alignItems: "center", justifyContent: "center", marginBottom: 6 }}>
        <Icon size={26} color={colors.ink} strokeWidth={1.5} />
      </View>
      <Heading size={24} style={{ textAlign: "center" }}>
        {title}
      </Heading>
      {text ? (
        <Body color={colors.muted} style={{ textAlign: "center" }}>
          {text}
        </Body>
      ) : null}
      {actionLabel && onAction && <Button title={actionLabel} onPress={onAction} style={{ marginTop: 10, alignSelf: "stretch" }} />}
    </View>
  );
}

export function Loading() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 40 }}>
      <ActivityIndicator color={colors.ink} />
    </View>
  );
}

/** Shown when something could not load, with a retry. */
export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={{ alignItems: "center", padding: 32, gap: 14 }}>
      <Body color={colors.muted} style={{ textAlign: "center" }}>
        {message}
      </Body>
      <Button title="Try again" variant="secondary" size="md" onPress={onRetry} />
    </View>
  );
}

/** Label/value row for summaries (subtotal, delivery...). */
export function SummaryRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", paddingVertical: 4 }}>
      <Body size={strong ? 16 : 14} weight={strong ? "semibold" : "regular"} color={strong ? colors.ink : colors.muted}>
        {label}
      </Body>
      <Body size={strong ? 18 : 14} weight={strong ? "semibold" : "medium"}>
        {value}
      </Body>
    </View>
  );
}
