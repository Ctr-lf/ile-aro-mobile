import { useCallback, useState } from "react";
import { FlatList, RefreshControl } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Package } from "lucide-react-native";
import { supabase } from "@/lib/supabase";
import type { Order } from "@/lib/orders";
import { colors, gutter } from "@/lib/theme";
import { EmptyState, Loading } from "@/components/Layout";
import { OrderRow } from "@/components/OrderParts";

/** Every order the shopper has placed, on the website or in the app (Row Level Security: own orders only). */
export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
    setOrders(data ?? []);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (!orders) return <Loading />;

  return (
    <FlatList
      data={orders}
      keyExtractor={(o) => o.id}
      contentContainerStyle={{ padding: gutter, gap: 10, flexGrow: 1 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={async () => {
            setRefreshing(true);
            await load();
            setRefreshing(false);
          }}
          tintColor={colors.ink}
        />
      }
      renderItem={({ item }) => <OrderRow order={item} />}
      ListEmptyComponent={
        <EmptyState icon={Package} title="No orders yet" text="Orders you place here or on the website show up here." actionLabel="Explore the collection" onAction={() => router.navigate("/shop")} />
      }
    />
  );
}
