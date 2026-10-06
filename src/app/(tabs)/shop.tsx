import { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, Modal, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowDownUp, Check, PackageSearch, Search } from "lucide-react-native";
import {
  getCategories,
  getNewArrivals,
  getProducts,
  groups,
  sortOptions,
  type Category,
  type Product,
  type SortKey,
} from "@/lib/catalog";
import { colors, fonts, gutter, radius } from "@/lib/theme";
import { Body, Heading } from "@/components/Text";
import { Chip } from "@/components/Button";
import { EmptyState, ErrorState, Loading } from "@/components/Layout";
import { ProductCard } from "@/components/ProductCard";

export default function ShopScreen() {
  const insets = useSafeAreaInsets();
  // Home screen links set these (?group=Aso Oke / ?category=adire-eleko).
  const params = useLocalSearchParams<{ group?: string; category?: string }>();
  const [group, setGroup] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [sort, setSort] = useState<SortKey>("newest");
  const [sortOpen, setSortOpen] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[] | null>(null);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Links from the home screen: apply them once each time they change.
  const linkKey = `${params.group ?? ""}|${params.category ?? ""}`;
  const [appliedLink, setAppliedLink] = useState("|");
  if (linkKey !== appliedLink) {
    setAppliedLink(linkKey);
    setGroup(params.category ? "" : (params.group ?? ""));
    setCategory(params.category ?? "");
  }

  const show = useCallback((r: ShopData) => {
    setProducts(r.list);
    setCategories(r.categories);
    setNewIds(r.newIds);
    setError(null);
  }, []);
  const fail = useCallback(() => setError("We could not load the shop. Check your connection and try again."), []);
  const load = () => fetchShop(group, category, sort).then(show, fail);

  useEffect(() => {
    let active = true;
    fetchShop(group, category, sort).then(
      (r) => active && show(r),
      () => active && fail(),
    );
    return () => {
      active = false;
    };
  }, [group, category, sort, show, fail]);

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const categoryChips = useMemo(
    () => categories.filter((c) => !group || c.group_name === group),
    [categories, group],
  );
  const current = categories.find((c) => c.slug === category);

  const header = (
    <View style={{ gap: 14, paddingBottom: 14 }}>
      {current?.description ? (
        <Body size={14} color={colors.muted} style={{ paddingHorizontal: gutter }}>
          {current.description}
        </Body>
      ) : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: gutter, gap: 8 }}>
        <Chip label="All" active={!group && !category} onPress={() => { setGroup(""); setCategory(""); }} />
        {groups.map((g) => (
          <Chip key={g} label={g} active={group === g && !category} onPress={() => { setGroup(g); setCategory(""); }} />
        ))}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: gutter, gap: 8 }}>
        {categoryChips.map((c) => (
          <Chip key={c.slug} label={c.name} active={category === c.slug} onPress={() => setCategory(category === c.slug ? "" : c.slug)} />
        ))}
      </ScrollView>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: gutter }}>
        <Body size={13} color={colors.muted}>
          {products ? `${products.length} ${products.length === 1 ? "piece" : "pieces"}` : " "}
        </Body>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Sort: ${sortOptions.find((o) => o.key === sort)?.label}`}
          onPress={() => setSortOpen(true)}
          hitSlop={8}
          style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
        >
          <ArrowDownUp size={15} color={colors.ink} />
          <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.ink }}>
            {sortOptions.find((o) => o.key === sort)?.label}
          </Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: gutter, paddingBottom: 14, gap: 14 }}>
        <Heading size={32} accent={current ? undefined : "Collection"}>
          {current ? current.name : group ? `${group}` : "The"}
        </Heading>
        <Pressable
          accessibilityRole="search"
          accessibilityLabel="Search the shop"
          onPress={() => router.push("/search")}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            height: 46,
            paddingHorizontal: 14,
            borderRadius: radius.pill,
            borderWidth: 1,
            borderColor: colors.line,
            backgroundColor: colors.surface,
          }}
        >
          <Search size={18} color={colors.muted} />
          <Text style={{ fontFamily: fonts.body, fontSize: 15, color: colors.muted }}>Search motifs, colours, names</Text>
        </Pressable>
      </View>

      {error && !products ? (
        <ErrorState message={error} onRetry={load} />
      ) : !products ? (
        <Loading />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(p) => p.id}
          numColumns={2}
          ListHeaderComponent={header}
          columnWrapperStyle={{ gap: 12, paddingHorizontal: gutter }}
          contentContainerStyle={{ gap: 12, paddingBottom: 32 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.ink} />}
          renderItem={({ item, index }) => (
            <View style={{ flex: 1, maxWidth: index === products.length - 1 && products.length % 2 === 1 ? "48.5%" : undefined }}>
              <ProductCard product={item} isNew={newIds.has(item.id)} />
            </View>
          )}
          ListEmptyComponent={
            <EmptyState
              icon={PackageSearch}
              title="Nothing here yet"
              text="Try another category, or see the whole collection."
              actionLabel="Show everything"
              onAction={() => { setGroup(""); setCategory(""); }}
            />
          }
        />
      )}

      <Modal visible={sortOpen} transparent animationType="slide" onRequestClose={() => setSortOpen(false)}>
        <Pressable accessibilityLabel="Close" style={{ flex: 1, backgroundColor: colors.overlay }} onPress={() => setSortOpen(false)} />
        <View style={{ backgroundColor: colors.surface, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, paddingBottom: insets.bottom + 12, paddingTop: 10 }}>
          <View style={{ alignSelf: "center", width: 40, height: 4, borderRadius: 2, backgroundColor: colors.line, marginBottom: 12 }} />
          <Heading size={22} style={{ paddingHorizontal: 20, marginBottom: 6 }}>
            Sort by
          </Heading>
          {sortOptions.map((o) => (
            <Pressable
              key={o.key}
              accessibilityRole="radio"
              accessibilityState={{ checked: sort === o.key }}
              onPress={() => {
                setSort(o.key);
                setSortOpen(false);
              }}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: 20,
                paddingVertical: 16,
                backgroundColor: pressed ? colors.background : colors.surface,
              })}
            >
              <Body weight={sort === o.key ? "medium" : "regular"}>{o.label}</Body>
              {sort === o.key && <Check size={18} color={colors.ink} />}
            </Pressable>
          ))}
        </View>
      </Modal>
    </View>
  );
}

type ShopData = { list: Product[]; categories: Category[]; newIds: Set<string> };

async function fetchShop(group: string, category: string, sort: SortKey): Promise<ShopData> {
  const [list, categories, fresh] = await Promise.all([
    getProducts({ group: group || undefined, category: category || undefined, sort }),
    getCategories(),
    getNewArrivals(),
  ]);
  return { list, categories, newIds: new Set(fresh.map((p) => p.id)) };
}
