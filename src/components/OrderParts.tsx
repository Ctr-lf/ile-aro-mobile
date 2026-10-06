import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import { formatDate, formatNaira } from "@/lib/format";
import { statusLabels, type Order, type OrderStatus } from "@/lib/orders";
import { colors, fonts, radius } from "@/lib/theme";
import { Body, Caption } from "./Text";
import { Card } from "./Layout";

export function OrderRow({ order }: { order: Order }) {
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`Order ${order.order_number}, ${statusLabels[order.status as OrderStatus] ?? order.status}`}
      onPress={() => router.push({ pathname: "/orders/[id]", params: { id: order.id } })}
      style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
    >
      <Card style={{ padding: 14, flexDirection: "row", alignItems: "center", gap: 12 }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 14, color: colors.ink }}>{order.order_number}</Text>
          <Body size={12} color={colors.muted}>
            {formatDate(order.created_at)} · {formatNaira(order.total_ngn)}
          </Body>
        </View>
        <StatusPill status={order.status} />
        <ChevronRight size={18} color={colors.muted} />
      </Card>
    </Pressable>
  );
}

export function StatusPill({ status }: { status: string }) {
  const pending = status === "pending" || status === "cancelled";
  return (
    <View
      style={{
        borderRadius: radius.pill,
        paddingHorizontal: 10,
        paddingVertical: 4,
        backgroundColor: pending ? colors.sand : colors.ink,
      }}
    >
      <Caption style={{ color: pending ? colors.ink : colors.white, fontSize: 10 }}>{statusLabels[status as OrderStatus] ?? status}</Caption>
    </View>
  );
}
