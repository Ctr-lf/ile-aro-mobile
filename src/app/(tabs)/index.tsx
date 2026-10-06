import { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Image } from "expo-image";
import { ArrowRight, Headphones, RotateCcw, Search, ShieldCheck, Truck } from "lucide-react-native";
import { getCategories, getFeaturedProducts, getNewArrivals, getProducts, type Product } from "@/lib/catalog";
import { colors, fonts, gutter, radius } from "@/lib/theme";
import { Body, Eyebrow, Heading } from "@/components/Text";
import { Button, IconButton } from "@/components/Button";
import { ErrorState, Loading, SectionHeading } from "@/components/Layout";
import { ProductCard } from "@/components/ProductCard";

const trust = [
  { icon: Truck, title: "Free shipping", text: "On orders over ₦150,000" },
  { icon: RotateCcw, title: "Easy returns", text: "14-day return policy" },
  { icon: ShieldCheck, title: "Secure payment", text: "Protected by Paystack" },
  { icon: Headphones, title: "Support", text: "We're here to help" },
];

// Category cards on the home screen: a category slug, or a whole group (same as the web).
const categoryCards = [
  { name: "Adire Eleko", category: "adire-eleko" },
  { name: "Adire Oniko", category: "adire-oniko" },
  { name: "Batik and Kampala", category: "adire-batik" },
  { name: "Ready-to-Wear", category: "adire-ready-to-wear" },
  { name: "Aso Oke", group: "Aso Oke" },
  { name: "Sets and Accessories", category: "aso-oke-sets" },
];

type HomeData = { products: Product[]; newArrivals: Product[]; featured: Product[]; categoryCount: number };

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<HomeData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fail = useCallback(() => setError("We could not load the shop. Check your connection and try again."), []);
  const load = () => fetchHome().then((d) => (setData(d), setError(null)), fail);

  useEffect(() => {
    let active = true;
    fetchHome().then(
      (d) => active && setData(d),
      () => active && fail(),
    );
    return () => {
      active = false;
    };
  }, [fail]);

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const newIds = new Set(data?.newArrivals.map((p) => p.id));
  const cards = categoryCards.map((card) => {
    const inCard = (data?.products ?? []).filter((p) =>
      card.group ? p.category?.group_name === card.group : p.category?.slug === card.category,
    );
    return { ...card, count: inCard.length, photo: inCard.find((p) => p.image_url) };
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          paddingTop: insets.top + 8,
          paddingBottom: 10,
          paddingHorizontal: gutter,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: colors.background,
        }}
      >
        <Text accessibilityRole="header" style={{ fontFamily: fonts.headingMedium, fontSize: 26, color: colors.ink, letterSpacing: -0.4 }}>
          Ilé Aró.
        </Text>
        <IconButton label="Search" onPress={() => router.push("/search")}>
          <Search size={19} color={colors.ink} strokeWidth={1.75} />
        </IconButton>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.ink} />}
      >
        {/* Hero */}
        <View style={{ marginHorizontal: gutter, marginTop: 4, backgroundColor: colors.sand, borderRadius: radius.lg, overflow: "hidden" }}>
          <View style={{ paddingHorizontal: 22, paddingTop: 28, paddingBottom: 22 }}>
            <Eyebrow>New collection 2026</Eyebrow>
            <Heading size={40} accent="Indigo" accentOnNewLine style={{ marginTop: 12 }}>
              The House of
            </Heading>
            <Body color={colors.inkSoft} style={{ marginTop: 12 }}>
              Hand-dyed Adire and hand-woven Aso oke from Yoruba makers, each piece with the meaning behind its motif.
            </Body>
            <Button
              title="Explore collection"
              icon={<ArrowRight size={16} color={colors.white} />}
              iconAfter
              onPress={() => router.navigate("/shop")}
              style={{ marginTop: 20 }}
            />
            {data && (
              <View style={{ flexDirection: "row", gap: 36, marginTop: 22 }}>
                <Stat value={data.products.length} label="pieces" />
                <Stat value={data.categoryCount} label="categories" />
              </View>
            )}
          </View>
          <View style={{ marginHorizontal: 12, marginBottom: 12, borderRadius: 18, overflow: "hidden", aspectRatio: 4 / 3 }}>
            <Image
              source={require("@/assets/images/hero.webp")}
              accessibilityLabel="Folded Adire cloth in purple and deep indigo, with large spirals and broken stripes"
              contentFit="cover"
              style={{ flex: 1 }}
            />
            <View style={{ position: "absolute", left: 12, bottom: 12, backgroundColor: colors.surface, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6 }}>
              <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.ink }}>Premium quality assured</Text>
            </View>
          </View>
        </View>

        {/* Trust bar */}
        <View
          style={{
            marginHorizontal: gutter,
            marginTop: 16,
            padding: 16,
            backgroundColor: colors.surface,
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: colors.line,
            flexDirection: "row",
            flexWrap: "wrap",
            rowGap: 16,
          }}
        >
          {trust.map(({ icon: Icon, title, text }) => (
            <View key={title} style={{ width: "50%", flexDirection: "row", gap: 10, paddingRight: 8 }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: colors.line, alignItems: "center", justifyContent: "center" }}>
                <Icon size={17} color={colors.ink} strokeWidth={1.5} />
              </View>
              <View style={{ flex: 1 }}>
                <Body size={13} weight="medium">
                  {title}
                </Body>
                <Body size={11} color={colors.muted} style={{ lineHeight: 15 }}>
                  {text}
                </Body>
              </View>
            </View>
          ))}
        </View>

        {error && !data ? (
          <ErrorState message={error} onRetry={load} />
        ) : !data ? (
          <Loading />
        ) : (
          <>
            {/* Shop by category */}
            <View style={{ marginTop: 36 }}>
              <SectionHeading title="Shop by" accent="Category" linkLabel="View all" onPressLink={() => router.navigate("/shop")} />
              <FlatList
                horizontal
                data={cards}
                keyExtractor={(c) => c.name}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: gutter, gap: 12 }}
                renderItem={({ item }) => (
                  <Pressable
                    accessibilityRole="link"
                    accessibilityLabel={`${item.name}, ${item.count} pieces`}
                    onPress={() =>
                      router.navigate(
                        item.group
                          ? { pathname: "/shop", params: { group: item.group, category: "" } }
                          : { pathname: "/shop", params: { category: item.category!, group: "" } },
                      )
                    }
                    style={({ pressed }) => ({ width: 150, height: 190, borderRadius: radius.md, overflow: "hidden", backgroundColor: colors.sand, opacity: pressed ? 0.9 : 1 })}
                  >
                    {item.photo?.image_url && (
                      <Image source={{ uri: item.photo.image_url }} contentFit="cover" style={{ position: "absolute", inset: 0 }} accessibilityIgnoresInvertColors />
                    )}
                    {/* The one gradient the design allows: a dark fade under text on a photo. */}
                    <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 90, experimental_backgroundImage: "linear-gradient(to bottom, rgba(28,25,23,0), rgba(28,25,23,0.72))" }} />
                    <View style={{ flex: 1, justifyContent: "flex-end", padding: 12 }}>
                      <Text style={{ fontFamily: fonts.heading, fontSize: 18, lineHeight: 22, color: item.photo ? colors.white : colors.ink }}>{item.name}</Text>
                      <Text style={{ fontFamily: fonts.body, fontSize: 12, marginTop: 2, color: item.photo ? "rgba(255,255,255,0.85)" : colors.muted }}>
                        {item.count} {item.count === 1 ? "piece" : "pieces"}
                      </Text>
                    </View>
                  </Pressable>
                )}
              />
            </View>

            {/* New arrivals: a swipeable row */}
            {data.newArrivals.length > 0 && (
              <View style={{ marginTop: 36 }}>
                <SectionHeading title="New" accent="Arrivals" linkLabel="View all" onPressLink={() => router.navigate({ pathname: "/shop", params: { group: "", category: "" } })} />
                <FlatList
                  horizontal
                  data={data.newArrivals}
                  keyExtractor={(p) => p.id}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: gutter, gap: 12, paddingBottom: 4, alignItems: "flex-start" }}
                  renderItem={({ item }) => <ProductCard product={item} isNew rail />}
                />
              </View>
            )}

            {/* Featured pieces: two-column grid */}
            {data.featured.length > 0 && (
              <View style={{ marginTop: 36 }}>
                <SectionHeading title="Featured" accent="Pieces" />
                <View style={{ paddingHorizontal: gutter, flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
                  {data.featured.slice(0, data.featured.length - (data.featured.length % 2)).map((p) => (
                    <View key={p.id} style={{ width: "48.2%" }}>
                      <ProductCard product={p} isNew={newIds.has(p.id)} />
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* The story of Adire */}
            <View style={{ marginHorizontal: gutter, marginTop: 36, backgroundColor: colors.sand, borderRadius: radius.lg, padding: 22, gap: 12 }}>
              <Heading size={28} accent="Adire">
                The story of
              </Heading>
              <Body color={colors.inkSoft}>
                Adire means &ldquo;tied and dyed&rdquo; in Yoruba. Women dyers in Abeokuta and Ibadan have resisted indigo with cassava paste, raffia
                ties and stitches for generations, drawing proverbs and prayers into the cloth.
              </Body>
              <Body color={colors.inkSoft}>
                Every piece in the house comes with its motif and what it means. Aso oke sits beside it: narrow hand-woven strips of Sanyan, Alaari and
                Etu for life&rsquo;s biggest days.
              </Body>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <View>
      <Text style={{ fontFamily: fonts.heading, fontSize: 28, color: colors.ink }}>{value}</Text>
      <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.muted }}>{label}</Text>
    </View>
  );
}

async function fetchHome(): Promise<HomeData> {
  const [products, newArrivals, featured, categories] = await Promise.all([
    getProducts(),
    getNewArrivals(),
    getFeaturedProducts(8),
    getCategories(),
  ]);
  return { products, newArrivals, featured, categoryCount: categories.length };
}
