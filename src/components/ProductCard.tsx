import { Pressable, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { router } from "expo-router";
import { Plus } from "lucide-react-native";
import { stockLabel, type Product } from "@/lib/catalog";
import { formatNaira } from "@/lib/format";
import { colors, fonts, radius, softShadow } from "@/lib/theme";
import { ProductImage } from "./ProductImage";
import { Caption } from "./Text";
import { useToast } from "./Toast";

/** Product card: photo, category, name, unit and price, with a quick "add one" button on the photo. */
export function ProductCard({ product, isNew = false, style }: { product: Product; isNew?: boolean; style?: StyleProp<ViewStyle> }) {
  const { add } = useToast();
  const stock = stockLabel(product.stock);

  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`${product.name}, ${formatNaira(product.price_ngn)}`}
      onPress={() => router.push({ pathname: "/product/[slug]", params: { slug: product.slug } })}
      style={({ pressed }) => [
        {
          flex: 1,
          backgroundColor: colors.surface,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: colors.line,
          overflow: "hidden",
          opacity: pressed ? 0.9 : 1,
        },
        softShadow,
        style,
      ]}
    >
      <View>
        <ProductImage product={product} />
        {isNew && (
          <View style={{ position: "absolute", left: 10, top: 10, backgroundColor: colors.ink, borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 4 }}>
            <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 10, letterSpacing: 0.8, color: colors.white }}>NEW</Text>
          </View>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={stock.tone === "out" ? `${product.name} is sold out` : `Add ${product.name} to cart`}
          disabled={stock.tone === "out"}
          hitSlop={8}
          onPress={() => add({ id: product.id, name: product.name, stock: product.stock })}
          style={({ pressed }) => ({
            position: "absolute",
            right: 10,
            top: 10,
            width: 34,
            height: 34,
            borderRadius: 17,
            backgroundColor: colors.surface,
            alignItems: "center",
            justifyContent: "center",
            opacity: stock.tone === "out" ? 0.5 : pressed ? 0.7 : 1,
          })}
        >
          <Plus size={18} color={colors.ink} strokeWidth={1.75} />
        </Pressable>
      </View>
      <View style={{ padding: 12, gap: 3, flex: 1 }}>
        <Caption numberOfLines={1}>{product.category?.name}</Caption>
        <Text numberOfLines={2} style={{ fontFamily: fonts.bodyMedium, fontSize: 14, lineHeight: 19, color: colors.ink }}>
          {product.name}
        </Text>
        {product.unit ? (
          <Text numberOfLines={1} style={{ fontFamily: fonts.body, fontSize: 12, color: colors.muted }}>
            {product.unit}
          </Text>
        ) : null}
        <View style={{ flex: 1 }} />
        <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", paddingTop: 6, gap: 6 }}>
          <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 15, color: colors.ink }}>{formatNaira(product.price_ngn)}</Text>
          {stock.tone !== "in" && <Text style={{ fontFamily: fonts.body, fontSize: 11, color: colors.muted }}>{stock.text}</Text>}
        </View>
      </View>
    </Pressable>
  );
}
