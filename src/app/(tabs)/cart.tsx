import { useCallback, useEffect, useState } from "react";
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ArrowRight, ShoppingBag, Trash2 } from "lucide-react-native";
import { useAuth } from "@/lib/auth";
import { refreshFromServer, removeFromCart, setQuantity, useCartLines } from "@/lib/cart";
import { fetchQuote, type CartQuote } from "@/lib/quote";
import { formatNaira } from "@/lib/format";
import { colors, fonts, gutter, radius } from "@/lib/theme";
import { Body, Caption, Heading } from "@/components/Text";
import { Button } from "@/components/Button";
import { Card, EmptyState, Loading, SummaryRow } from "@/components/Layout";
import { ProductImage } from "@/components/ProductImage";
import { QuantityStepper } from "@/components/QuantityStepper";

export default function CartScreen() {
  const insets = useSafeAreaInsets();
  const { user, signInWithGoogle } = useAuth();
  const lines = useCartLines();
  const [fetched, setQuote] = useState<CartQuote | null>(null);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [signingIn, setSigningIn] = useState(false);

  // Re-price whenever the cart changes (here, on the website, or in another tab).
  useEffect(() => {
    if (!lines.length) return;
    let cancelled = false;
    fetchQuote(lines)
      .then((q) => !cancelled && (setQuote(q), setError(false)))
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
    };
  }, [lines]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await refreshFromServer();
    setRefreshing(false);
  }, []);

  const quote = lines.length ? fetched : null;
  const count = lines.reduce((sum, l) => sum + l.quantity, 0);
  const unavailable = quote?.lines.some((l) => !l.available || l.stock < l.quantity) ?? false;

  const goToCheckout = async () => {
    if (user) return router.push("/checkout");
    setSigningIn(true);
    const result = await signInWithGoogle();
    setSigningIn(false);
    if (result.ok) router.push("/checkout");
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: gutter, paddingBottom: 12 }}>
        <Heading size={32}>
          Your cart
        </Heading>
        {count > 0 && (
          <Body size={13} color={colors.muted} style={{ marginTop: 2 }}>
            {count} {count === 1 ? "item" : "items"}
            {user ? " · saved to your account" : ""}
          </Body>
        )}
      </View>

      {!lines.length ? (
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.ink} />}
        >
          <EmptyState
            icon={ShoppingBag}
            title="Your cart is empty"
            text={user ? "Anything you add on the website or here shows up in this cart." : "Sign in to keep your cart in step with the website."}
            actionLabel="Explore the collection"
            onAction={() => router.navigate("/shop")}
          />
        </ScrollView>
      ) : !quote ? (
        error ? <Body color={colors.muted} style={{ padding: gutter }}>We could not load your cart. Pull down to try again.</Body> : <Loading />
      ) : (
        <>
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: gutter, paddingBottom: 24, gap: 12 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.ink} />}
          >
            {quote.lines.map((line) => {
              const max = Math.max(line.stock, 1);
              const short = !line.available || line.stock < line.quantity;
              return (
                <Card key={line.product_id} style={{ flexDirection: "row", padding: 10, gap: 12 }}>
                  <Pressable
                    accessibilityRole="link"
                    accessibilityLabel={line.name ?? "Product"}
                    onPress={() => line.slug && router.push({ pathname: "/product/[slug]", params: { slug: line.slug } })}
                  >
                    <ProductImage product={line} size="thumb" style={{ width: 88, borderRadius: radius.sm }} />
                  </Pressable>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Caption numberOfLines={1}>{line.group_name}</Caption>
                    <Text numberOfLines={2} style={{ fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.ink }}>
                      {line.name ?? "No longer available"}
                    </Text>
                    {line.unit ? <Body size={12} color={colors.muted}>{line.unit}</Body> : null}
                    {short && (
                      <Body size={12} weight="medium" color={colors.accent}>
                        {!line.available || line.stock === 0 ? "Sold out. Remove to continue." : `Only ${line.stock} left.`}
                      </Body>
                    )}
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 6 }}>
                      {line.available && line.stock > 0 ? (
                        <QuantityStepper compact value={Math.min(line.quantity, max)} max={max} onChange={(q) => setQuantity(line.product_id, q)} />
                      ) : (
                        <View />
                      )}
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                        <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 14, color: colors.ink }}>{formatNaira(line.line_total_ngn)}</Text>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`Remove ${line.name ?? "item"}`}
                          hitSlop={10}
                          onPress={() => removeFromCart(line.product_id)}
                        >
                          <Trash2 size={18} color={colors.muted} />
                        </Pressable>
                      </View>
                    </View>
                  </View>
                </Card>
              );
            })}

            <Card style={{ padding: 16, marginTop: 4 }}>
              <SummaryRow label="Subtotal" value={formatNaira(quote.subtotal_ngn)} />
              <SummaryRow
                label="Delivery"
                value={quote.subtotal_ngn > quote.free_delivery_over_ngn ? "Free" : `From ${formatNaira(quote.delivery_fee_from_ngn ?? 5000)}`}
              />
              <Body size={12} color={colors.muted} style={{ marginTop: 4 }}>
                ₦5,000 in Lagos, ₦8,000 elsewhere. Free on orders over {formatNaira(quote.free_delivery_over_ngn)}.
              </Body>
            </Card>
          </ScrollView>

          <View
            style={{
              paddingHorizontal: gutter,
              paddingVertical: 12,
              backgroundColor: colors.surface,
              borderTopWidth: 1,
              borderTopColor: colors.line,
              gap: 8,
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
              <Body color={colors.muted}>Subtotal</Body>
              <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 20, color: colors.ink }}>{formatNaira(quote.subtotal_ngn)}</Text>
            </View>
            <Button
              title={user ? "Checkout" : "Sign in with Google to checkout"}
              icon={<ArrowRight size={16} color={colors.white} />}
              iconAfter
              loading={signingIn}
              disabled={unavailable}
              onPress={goToCheckout}
            />
          </View>
        </>
      )}
    </View>
  );
}
