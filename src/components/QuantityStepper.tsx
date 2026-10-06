import { Pressable, Text, View } from "react-native";
import { Minus, Plus } from "lucide-react-native";
import { colors, fonts, radius } from "@/lib/theme";

/** − 2 + pill, used on the product screen and in the cart. */
export function QuantityStepper({
  value,
  min = 1,
  max,
  onChange,
  label = "Quantity",
  compact = false,
}: {
  value: number;
  min?: number;
  max: number;
  onChange: (next: number) => void;
  label?: string;
  compact?: boolean;
}) {
  const size = compact ? 34 : 44;
  const button = (icon: React.ReactNode, a11y: string, disabled: boolean, next: number) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={a11y}
      disabled={disabled}
      hitSlop={4}
      onPress={() => onChange(next)}
      style={({ pressed }) => ({
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
        opacity: disabled ? 0.3 : pressed ? 0.6 : 1,
      })}
    >
      {icon}
    </Pressable>
  );

  return (
    <View
      accessibilityLabel={`${label}: ${value}`}
      style={{
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: colors.line,
        borderRadius: radius.pill,
        backgroundColor: colors.surface,
      }}
    >
      {button(<Minus size={16} color={colors.ink} />, "Decrease quantity", value <= min, value - 1)}
      <Text style={{ minWidth: 24, textAlign: "center", fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.ink }}>{value}</Text>
      {button(<Plus size={16} color={colors.ink} />, "Increase quantity", value >= max, value + 1)}
    </View>
  );
}
