import { useEffect, useState } from "react";
import { FlatList, Keyboard, Pressable, TextInput, View } from "react-native";
import { Search, X } from "lucide-react-native";
import { searchProducts, type Product } from "@/lib/catalog";
import { colors, fonts, gutter, radius } from "@/lib/theme";
import { Body, Caption } from "@/components/Text";
import { Chip } from "@/components/Button";
import { EmptyState, Loading } from "@/components/Layout";
import { ProductCard } from "@/components/ProductCard";

const suggestions = ["Indigo", "Kampala", "Gele", "Bridal", "Aso oke", "Purple"];

/** Search across name, motif, colour and tags, using the same database search as the website. */
export default function SearchScreen() {
  const [q, setQ] = useState("");
  const [found, setFound] = useState<{ term: string; items: Product[] } | null>(null);
  const term = q.trim();
  const results = term && found?.term === term ? found.items : null;
  const loading = !!term && found?.term !== term;

  useEffect(() => {
    if (!term) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      searchProducts(term).then(
        (items) => !cancelled && setFound({ term, items }),
        () => !cancelled && setFound({ term, items: [] }),
      );
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [term]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ paddingHorizontal: gutter, paddingBottom: 12 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            height: 48,
            paddingHorizontal: 14,
            borderRadius: radius.pill,
            borderWidth: 1,
            borderColor: colors.ink,
            backgroundColor: colors.surface,
          }}
        >
          <Search size={18} color={colors.muted} />
          <TextInput
            value={q}
            onChangeText={setQ}
            autoFocus
            placeholder="Search motifs, colours, names"
            placeholderTextColor={colors.muted}
            returnKeyType="search"
            onSubmitEditing={Keyboard.dismiss}
            accessibilityLabel="Search the shop"
            style={{ flex: 1, fontFamily: fonts.body, fontSize: 16, color: colors.ink, paddingVertical: 0 }}
          />
          {q ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Clear search" hitSlop={10} onPress={() => setQ("")}>
              <X size={18} color={colors.muted} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {!q.trim() ? (
        <View style={{ paddingHorizontal: gutter, gap: 12 }}>
          <Caption>Try</Caption>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {suggestions.map((s) => (
              <Chip key={s} label={s} onPress={() => setQ(s)} />
            ))}
          </View>
        </View>
      ) : loading && !results ? (
        <Loading />
      ) : (
        <FlatList
          data={results ?? []}
          keyExtractor={(p) => p.id}
          numColumns={2}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          columnWrapperStyle={{ gap: 12, paddingHorizontal: gutter }}
          contentContainerStyle={{ gap: 12, paddingBottom: 32 }}
          ListHeaderComponent={
            results ? (
              <Body size={13} color={colors.muted} style={{ paddingHorizontal: gutter }}>
                {results.length} {results.length === 1 ? "result" : "results"} for &ldquo;{q.trim()}&rdquo;
              </Body>
            ) : null
          }
          renderItem={({ item, index }) => (
            <View style={{ flex: 1, maxWidth: results && index === results.length - 1 && results.length % 2 === 1 ? "48.5%" : undefined }}>
              <ProductCard product={item} />
            </View>
          )}
          ListEmptyComponent={
            results ? <EmptyState icon={Search} title="No matches" text="Try a colour, a motif like Okoto, or a word like gele." /> : null
          }
        />
      )}
    </View>
  );
}
