import { Text, View, type StyleProp, type ViewStyle } from "react-native";
import { Image } from "expo-image";
import { colors, fonts } from "@/lib/theme";

/**
 * Product photo (image_url from the product-images bucket), square by default.
 * Without a photo: a plain sand square with the product name, like the web shop.
 */
export function ProductImage({
  product,
  size = "card",
  style,
  aspectRatio = 1,
}: {
  product: { name: string | null; image_url: string | null; image_alt: string | null };
  size?: "thumb" | "card" | "large";
  style?: StyleProp<ViewStyle>;
  aspectRatio?: number;
}) {
  return (
    <View style={[{ aspectRatio, backgroundColor: colors.sand, overflow: "hidden" }, style]}>
      {product.image_url ? (
        <Image
          source={{ uri: product.image_url }}
          accessibilityLabel={product.image_alt ?? product.name ?? ""}
          contentFit="cover"
          transition={200}
          cachePolicy="memory-disk"
          style={{ flex: 1 }}
        />
      ) : (
        <View
          accessible
          accessibilityRole="image"
          accessibilityLabel={product.image_alt ?? product.name ?? ""}
          style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 12 }}
        >
          {size !== "thumb" && (
            <Text
              style={{
                fontFamily: fonts.headingItalic,
                fontSize: size === "large" ? 22 : 14,
                color: colors.muted,
                textAlign: "center",
              }}
            >
              {product.name}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}
