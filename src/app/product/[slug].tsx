import { useCallback, useEffect, useState } from "react";
import { FlatList, Linking, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { ChevronLeft, PackageSearch, ShoppingBag } from "lucide-react-native";
import { getProduct, getRelatedProducts, stockLabel, type Product } from "@/lib/catalog";
import { useCartLines } from "@/lib/cart";
import { formatNaira } from "@/lib/format";
import { colors, fonts, gutter, radius } from "@/lib/theme";
import { Body, Caption, Eyebrow, Heading } from "@/components/Text";
import { Button, IconButton } from "@/components/Button";
import { EmptyState, ErrorState, Loading, SectionHeading } from "@/components/Layout";
import { ProductCard } from "@/components/ProductCard";
import { ProductImage } from "@/components/ProductImage";
import { QuantityStepper } from "@/components/QuantityStepper";
import { useToast } from "@/components/Toast";

export default function ProductScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const insets = useSafeAreaInsets();
  const { add } = useToast();
  const [product, setProduct] = useState<Product | null | undefined>(undefined);
  const [related, setRelated] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const inCart = useCartLines().find((l) => l.productId === product?.id)?.quantity ?? 0;

  const show = useCallback((result: { product: Product | null; related: Product[] }) => {
    setProduct(result.product);
    setRelated(result.related);
    setError(null);
  }, []);
  const fail = useCallback(() => setError("We could not load this piece. Check your connection and try again."), []);
  const load = () => fetchProduct(slug).then(show, fail);

  useEffect(() => {
    let active = true;
    fetchProduct(slug).then(
      (r) => active && show(r),
      () => active && fail(),
    );
    return () => {
      active = false;
    };
  }, [slug, show, fail]);

  const back = () => (router.canGoBack() ? router.back() : router.replace("/"));
  const backButton = (
    <IconButton label="Back" onPress={back} style={{ position: "absolute", top: insets.top + 8, left: gutter }}>
      <ChevronLeft size={22} color={colors.ink} />
    </IconButton>
  );

  if (error && product === undefined) {
    return (
      <View style={{ flex: 1, paddingTop: insets.top + 64 }}>
        {backButton}
        <ErrorState message={error} onRetry={load} />
      </View>
    );
  }
  if (product === undefined) return <Loading />;
  if (product === null) {
    return (
      <View style={{ flex: 1, paddingTop: insets.top + 64 }}>
        {backButton}
        <EmptyState icon={PackageSearch} title="Piece not found" text="It may have sold out or been removed." actionLabel="Back to the shop" onAction={() => router.navigate("/shop")} />
      </View>
    );
  }

  const stock = stockLabel(product.stock);
  const left = Math.max(product.stock - inCart, 0);
  const details = [
    ["Technique", product.technique],
    ["Motif", product.motif],
    ["Colour", product.colour],
    ["Material", product.material],
    ["Occasion", product.occasion?.join(", ")],
  ].filter(([, v]) => v) as [string, string][];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <ProductImage product={product} size="large" />
        {product.image_credit ? (
          <Text
            accessibilityRole={product.image_credit_url ? "link" : "text"}
            onPress={product.image_credit_url ? () => Linking.openURL(product.image_credit_url!) : undefined}
            style={{ fontFamily: fonts.body, fontSize: 11, color: colors.muted, paddingHorizontal: gutter, paddingTop: 6, textDecorationLine: product.image_credit_url ? "underline" : "none" }}
          >
            Photo: {product.image_credit}
          </Text>
        ) : null}

        <View style={{ paddingHorizontal: gutter, paddingTop: 18, gap: 14 }}>
          <View style={{ gap: 8 }}>
            <Eyebrow>{product.category?.name}</Eyebrow>
            <Heading size={30}>{product.name}</Heading>
            <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 22, color: colors.ink }}>
              {formatNaira(product.price_ngn)}
              {product.unit ? <Text style={{ fontFamily: fonts.body, fontSize: 15, color: colors.muted }}> / {product.unit}</Text> : null}
            </Text>
            <Body size={13} color={stock.tone === "in" ? colors.muted : colors.accent} weight="medium">
              {stock.text}
              {inCart > 0 ? `  ·  ${inCart} in your cart` : ""}
            </Body>
          </View>

          {product.description ? <Body color={colors.inkSoft}>{product.description}</Body> : null}

          {product.meaning ? (
            <View style={{ backgroundColor: colors.sand, borderRadius: radius.md, padding: 16, gap: 6 }}>
              <Eyebrow>Meaning{product.motif ? ` · ${product.motif}` : ""}</Eyebrow>
              <Text style={{ fontFamily: fonts.headingItalic, fontSize: 18, lineHeight: 26, color: colors.ink }}>{product.meaning}</Text>
            </View>
          ) : null}

          <View style={{ borderTopWidth: 1, borderTopColor: colors.line }}>
            {details.map(([label, value]) => (
              <View key={label} style={{ flexDirection: "row", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.line, gap: 12 }}>
                <Caption style={{ width: 92, paddingTop: 2 }}>{label}</Caption>
                <Body size={14} style={{ flex: 1 }}>
                  {value}
                </Body>
              </View>
            ))}
          </View>
        </View>

        {related.length > 0 && (
          <View style={{ marginTop: 32 }}>
            <SectionHeading title="You may also" accent="like" />
            <FlatList
              horizontal
              data={related}
              keyExtractor={(p) => p.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: gutter, gap: 12, paddingBottom: 4, alignItems: "flex-start" }}
              renderItem={({ item }) => <ProductCard product={item} rail />}
            />
          </View>
        )}
      </ScrollView>

      {backButton}

      {/* Sticky add-to-cart bar */}
      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          paddingHorizontal: gutter,
          paddingTop: 12,
          paddingBottom: insets.bottom + 12,
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.line,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        }}
      >
        {left > 0 && <QuantityStepper value={Math.min(quantity, left)} max={left} onChange={setQuantity} />}
        <Button
          title={stock.tone === "out" ? "Sold out" : left === 0 ? "All in your cart" : "Add to cart"}
          icon={<ShoppingBag size={17} color={colors.white} />}
          disabled={left === 0}
          onPress={() => {
            const added = add({ id: product.id, name: product.name, stock: product.stock }, Math.min(quantity, left));
            if (added > 0) setQuantity(1);
          }}
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
}

async function fetchProduct(slug: string) {
  const product = await getProduct(slug);
  return { product, related: product ? await getRelatedProducts(product) : [] };
}
