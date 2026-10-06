import { useCallback, useEffect, useRef, useState } from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { CircleCheck, CircleX, Clock, PackageSearch } from "lucide-react-native";
import { supabase } from "@/lib/supabase";
import { openPayment, startOrderPayment } from "@/lib/api";
import { canPay, orderSteps, statusLabels, type Order, type OrderItem, type OrderStatus } from "@/lib/orders";
import { formatDate, formatNaira } from "@/lib/format";
import { colors, gutter, radius } from "@/lib/theme";
import { Body, Caption, Eyebrow, Heading } from "@/components/Text";
import { Button } from "@/components/Button";
import { Card, EmptyState, Loading, SummaryRow } from "@/components/Layout";
import { useToast } from "@/components/Toast";

type History = { status: string; changed_at: string };

export default function OrderScreen() {
  const { id, from } = useLocalSearchParams<{ id: string; from?: string }>();
  const { show } = useToast();
  const [order, setOrder] = useState<Order | null | undefined>(undefined);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [history, setHistory] = useState<History[]>([]);
  const [paying, setPaying] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const polls = useRef(0);

  const load = useCallback(async () => {
    const [o, i, h] = await Promise.all([
      supabase.from("orders").select("*").eq("id", id).maybeSingle(),
      supabase.from("order_items").select("*").eq("order_id", id).order("id"),
      supabase.from("order_status_history").select("status, changed_at").eq("order_id", id).order("changed_at"),
    ]);
    setOrder(o.data ?? null);
    setItems(i.data ?? []);
    setHistory(h.data ?? []);
    return o.data ?? null;
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  // Just back from Paystack: the payment is usually recorded already, but give
  // the webhook a few seconds in case it is still on its way.
  const pollForPayment = useCallback(async () => {
    polls.current = 0;
    while (polls.current < 6) {
      const fresh = await load();
      if (!fresh || fresh.payment_status !== "unpaid") return;
      polls.current++;
      await new Promise((r) => setTimeout(r, 2000));
    }
  }, [load]);

  useEffect(() => {
    if (from) pollForPayment();
  }, [from, pollForPayment]);

  const pay = async () => {
    setPaying(true);
    const result = await startOrderPayment(id);
    if (result.ok && result.paymentUrl) {
      await openPayment(result.paymentUrl);
      await pollForPayment();
    } else {
      show("warning", result.message ?? "Payment could not be started.", false);
    }
    setPaying(false);
  };

  if (order === undefined) return <Loading />;
  if (order === null) {
    return <EmptyState icon={PackageSearch} title="Order not found" actionLabel="My orders" onAction={() => router.replace("/orders")} />;
  }

  const paid = order.payment_status === "paid";
  const failed = order.payment_status === "failed";
  const cancelled = order.status === "cancelled";
  const reached = (status: OrderStatus) => history.some((h) => h.status === status) || orderSteps.findIndex((s) => s.status === order.status) >= orderSteps.findIndex((s) => s.status === status);
  const Icon = paid ? CircleCheck : failed || cancelled ? CircleX : Clock;

  return (
    <ScrollView
      contentContainerStyle={{ padding: gutter, paddingBottom: 40, gap: 16 }}
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
    >
      <View style={{ backgroundColor: colors.sand, borderRadius: radius.lg, padding: 22, alignItems: "center", gap: 8 }}>
        <Icon size={38} color={colors.ink} strokeWidth={1.5} />
        {paid && <Eyebrow>Thank you</Eyebrow>}
        <Heading size={26} style={{ textAlign: "center" }}>
          {cancelled
            ? "This order was cancelled"
            : paid
              ? from
                ? "Your order is confirmed"
                : statusLabels[order.status as OrderStatus]
              : failed
                ? "Payment did not go through"
                : "Waiting for your payment"}
        </Heading>
        <Body size={14} color={colors.inkSoft} style={{ textAlign: "center" }}>
          Order <Body size={14} weight="semibold">{order.order_number}</Body> · {formatDate(order.created_at, true)}
          {!paid && !cancelled ? (failed ? "\nYour order is saved and no money was taken." : "\nIf you have just paid, this can take a minute.") : ""}
        </Body>
        {canPay(order) && <Button title={failed ? "Try payment again" : "Pay now"} loading={paying} onPress={pay} style={{ alignSelf: "stretch", marginTop: 8 }} />}
      </View>

      {!cancelled && (
        <Card style={{ padding: 16 }}>
          <Heading size={20} style={{ marginBottom: 12 }}>
            Progress
          </Heading>
          {orderSteps.map((step, i) => {
            const done = reached(step.status);
            const when = history.find((h) => h.status === step.status)?.changed_at;
            return (
              <View key={step.status} style={{ flexDirection: "row", gap: 12 }}>
                <View style={{ alignItems: "center" }}>
                  <View style={{ width: 14, height: 14, borderRadius: 7, marginTop: 3, backgroundColor: done ? colors.ink : colors.surface, borderWidth: 1.5, borderColor: done ? colors.ink : colors.line }} />
                  {i < orderSteps.length - 1 && <View style={{ width: 1.5, flex: 1, minHeight: 22, backgroundColor: done ? colors.ink : colors.line }} />}
                </View>
                <View style={{ flex: 1, paddingBottom: 14 }}>
                  <Body size={14} weight={done ? "medium" : "regular"} color={done ? colors.ink : colors.muted}>
                    {step.label}
                  </Body>
                  <Body size={12} color={colors.muted}>
                    {when ? formatDate(when, true) : step.help}
                  </Body>
                </View>
              </View>
            );
          })}
        </Card>
      )}

      <Card style={{ padding: 16, gap: 2 }}>
        <Heading size={20} style={{ marginBottom: 8 }}>
          Items
        </Heading>
        {items.map((it) => (
          <View key={it.id} style={{ flexDirection: "row", justifyContent: "space-between", gap: 12, paddingVertical: 4 }}>
            <View style={{ flex: 1 }}>
              <Body size={14}>
                {it.quantity} × {it.product_name}
              </Body>
              {it.unit ? <Body size={12} color={colors.muted}>{it.unit} · {formatNaira(it.unit_price_ngn)} each</Body> : null}
            </View>
            <Body size={14} weight="medium">
              {formatNaira(it.line_total_ngn)}
            </Body>
          </View>
        ))}
        <View style={{ height: 1, backgroundColor: colors.line, marginVertical: 8 }} />
        <SummaryRow label="Subtotal" value={formatNaira(order.subtotal_ngn)} />
        <SummaryRow label="Delivery" value={order.delivery_fee_ngn === 0 ? "Free" : formatNaira(order.delivery_fee_ngn)} />
        <SummaryRow label="Total" value={formatNaira(order.total_ngn)} strong />
      </Card>

      <Card style={{ padding: 16, gap: 4 }}>
        <Heading size={20} style={{ marginBottom: 6 }}>
          Delivery
        </Heading>
        <Body size={14} weight="medium">
          {order.delivery_name}
        </Body>
        <Body size={14} color={colors.inkSoft}>
          {order.delivery_address}, {order.delivery_city}, {order.delivery_state}
        </Body>
        <Body size={14} color={colors.inkSoft}>
          {order.delivery_phone}
        </Body>
        {order.note ? (
          <>
            <Caption style={{ marginTop: 8 }}>Note</Caption>
            <Body size={14} color={colors.inkSoft}>
              {order.note}
            </Body>
          </>
        ) : null}
      </Card>

      {paid && order.paystack_reference ? (
        <Body size={12} color={colors.muted} style={{ textAlign: "center" }}>
          Paystack reference: {order.paystack_reference}
        </Body>
      ) : null}

      {from ? <Button title="Continue shopping" variant="secondary" onPress={() => router.dismissTo("/shop")} /> : null}
    </ScrollView>
  );
}
