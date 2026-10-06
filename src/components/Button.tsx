import { ActivityIndicator, Pressable, Text, View, type PressableProps, type StyleProp, type ViewStyle } from "react-native";
import { colors, fonts, radius } from "@/lib/theme";

type ButtonProps = Omit<PressableProps, "style" | "children"> & {
  title: string;
  variant?: "primary" | "secondary";
  loading?: boolean;
  icon?: React.ReactNode;
  /** Icon after the label instead of before it. */
  iconAfter?: boolean;
  style?: StyleProp<ViewStyle>;
  size?: "md" | "lg";
};

/** The web shop's pill buttons: btn-primary (black) and btn-secondary (white, thin border). */
export function Button({ title, variant = "primary", loading, icon, iconAfter, disabled, style, size = "lg", ...rest }: ButtonProps) {
  const primary = variant === "primary";
  const off = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!off, busy: !!loading }}
      disabled={off}
      style={({ pressed }) => [
        {
          minHeight: size === "lg" ? 52 : 44,
          paddingHorizontal: 22,
          borderRadius: radius.pill,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: primary ? colors.ink : colors.surface,
          borderWidth: primary ? 0 : 1,
          borderColor: colors.line,
          opacity: off ? 0.5 : pressed ? 0.85 : 1,
        },
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={primary ? colors.white : colors.ink} />
      ) : (
        <View style={{ flexDirection: iconAfter ? "row-reverse" : "row", alignItems: "center", gap: 8 }}>
          {icon}
          <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 15, color: primary ? colors.white : colors.ink }}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

/** Round icon-only button (header actions, back button over photos). */
export function IconButton({
  children,
  label,
  onPress,
  style,
  size = 40,
}: {
  children: React.ReactNode;
  label: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  size?: number;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      onPress={onPress}
      style={({ pressed }) => [
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.line,
          opacity: pressed ? 0.7 : 1,
        },
        style,
      ]}
    >
      {children}
    </Pressable>
  );
}

/** The web shop's chip / chip-active. */
export function Chip({ label, active, onPress }: { label: string; active?: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      onPress={onPress}
      style={({ pressed }) => ({
        paddingHorizontal: 14,
        height: 36,
        justifyContent: "center",
        borderRadius: radius.pill,
        borderWidth: 1,
        borderColor: active ? colors.ink : colors.line,
        backgroundColor: active ? colors.ink : colors.surface,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 14, color: active ? colors.white : colors.ink }}>{label}</Text>
    </Pressable>
  );
}
