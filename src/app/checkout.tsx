import { useEffect, useMemo, useState } from "react";
import { FlatList, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Switch, Text, TextInput, View, type TextInputProps } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Check, ChevronDown, Lock, ShoppingBag } from "lucide-react-native";
import { profileOf, useAuth } from "@/lib/auth";
import { clearLocalCart, flushSaves, refreshFromServer, useCartLines } from "@/lib/cart";
import { fetchQuote, type CartQuote } from "@/lib/quote";
import { openPayment, placeOrder, type Delivery, type ShortItem } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { nigerianStates } from "@/lib/orders";
import { formatNaira } from "@/lib/format";
import { colors, fonts, gutter, radius } from "@/lib/theme";
import { Body, Caption, Heading } from "@/components/Text";
import { Button } from "@/components/Button";
import { Card, EmptyState, Loading, SummaryRow } from "@/components/Layout";
import { useToast } from "@/components/Toast";

type Field = "fullName" | "phone" | "address" | "city" | "state" | "note";
// place_order returns errors keyed by its argument names.
const serverField: Record<string, Field> = { full_name: "fullName", phone: "phone", address: "address", city: "city", state: "state", note: "note" };

export default function CheckoutScreen() {
  const insets = useSafeAreaInsets();
  const { user, signInWithGoogle } = useAuth();
  const { show } = useToast();
  const lines = useCartLines();
  const [form, setForm] = useState<Delivery>({ fullName: "", phone: "", address: "", city: "", state: "", note: "", saveAddress: true });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [short, setShort] = useState<ShortItem[]>([]);
  const [fetched, setQuote] = useState<CartQuote | null>(null);
  const quote = lines.length ? fetched : null;
  const [statePicker, setStatePicker] = useState(false);
  const [placing, setPlacing] = useState(false);

  // Prefill from the saved default address (same table the website uses), else the Google name.
  useEffect(() => {
    if (!user) return;
    supabase
      .from("addresses")
      .select("*")
      .eq("is_default", true)
      .maybeSingle()
      .then(({ data }) => {
        setForm((f) => ({
          ...f,
          fullName: f.fullName || data?.full_name || profileOf(user).name,
          phone: f.phone || data?.phone || "",
          address: f.address || data?.line1 || "",
          city: f.city || data?.city || "",
          state: f.state || data?.state || "",
        }));
      });
  }, [user]);

  // Totals and delivery fee from the database, for the chosen state.
  useEffect(() => {
    if (!lines.length) return;
    let cancelled = false;
    fetchQuote(lines, form.state || null).then((q) => !cancelled && setQuote(q)).catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [lines, form.state]);

  const set = (key: Field) => (value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validate = () => {
    const e: Partial<Record<Field, string>> = {};
    if (!form.fullName.trim()) e.fullName = "Enter the name of the person receiving the order.";
    const digits = form.phone.replace(/\D/g, "");
    if (digits.length < 10 || digits.length > 14 || !/^[0-9+()\s-]+$/.test(form.phone.trim())) e.phone = "Enter a phone number we can call, for example 0803 123 4567.";
    if (!form.address.trim()) e.address = "Enter the street address.";
    if (!form.city.trim()) e.city = "Enter the town or city.";
    if (!form.state) e.state = "Choose a state.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    setShort([]);
    if (!validate()) return;
    setPlacing(true);
    try {
      // Make sure every cart change has reached the database: the order is built from it.
      await flushSaves();
      const result = await placeOrder(form);
      if (!result.ok) {
        if (result.reason === "invalid") {
          const mapped: Partial<Record<Field, string>> = {};
          for (const [k, v] of Object.entries(result.errors)) mapped[serverField[k] ?? "note"] = v;
          setErrors(mapped);
        } else if (result.reason === "out_of_stock") {
          setShort(result.items);
          refreshFromServer();
        } else {
          show("warning", result.message, false);
        }
        return;
      }

      // The order is placed and the saved cart emptied by the database.
      clearLocalCart();
      if (result.paymentUrl) await openPayment(result.paymentUrl);
      else if (result.message) show("warning", result.message, false);
      router.replace({ pathname: "/orders/[id]", params: { id: result.orderId, from: "checkout" } });
    } finally {
      setPlacing(false);
    }
  };

  if (!user) {
    return (
      <EmptyState
        icon={Lock}
        title="Sign in to check out"
        text="Use the same Google account as the website, so your order shows up on both."
        actionLabel="Continue with Google"
        onAction={() => signInWithGoogle()}
      />
    );
  }
  if (!lines.length && !placing) {
    return <EmptyState icon={ShoppingBag} title="Your cart is empty" actionLabel="Explore the collection" onAction={() => router.navigate("/shop")} />;
  }
  if (!quote) return <Loading />;

  const fee = quote.delivery_fee_ngn;
  const total = quote.subtotal_ngn + (fee ?? 0);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={{ padding: gutter, paddingBottom: 32, gap: 18 }} keyboardShouldPersistTaps="handled">
        <View style={{ gap: 4 }}>
          <Heading size={24} accent="details">
            Delivery
          </Heading>
          <Body size={13} color={colors.muted}>
            We deliver anywhere in Nigeria. We will call this number when your order is on its way.
          </Body>
        </View>

        {short.length > 0 && (
          <Card style={{ padding: 14, borderColor: colors.accent, gap: 4 }}>
            <Body weight="medium" color={colors.accent}>
              Some pieces just sold out
            </Body>
            {short.map((s) => (
              <Body key={s.product_id} size={13}>
                {s.name}: you asked for {s.requested}, {s.available} left.
              </Body>
            ))}
            <Body size={13} color={colors.muted}>
              Update your cart, then try again.
            </Body>
          </Card>
        )}

        <Input label="Full name" value={form.fullName} onChangeText={set("fullName")} error={errors.fullName} autoComplete="name" textContentType="name" />
        <Input label="Phone" value={form.phone} onChangeText={set("phone")} error={errors.phone} keyboardType="phone-pad" autoComplete="tel" placeholder="0803 123 4567" />
        <Input label="Street address" value={form.address} onChangeText={set("address")} error={errors.address} autoComplete="street-address" />
        <Input label="Town or city" value={form.city} onChangeText={set("city")} error={errors.city} />

        <View style={{ gap: 6 }}>
          <Caption>State</Caption>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`State: ${form.state || "not chosen"}`}
            onPress={() => setStatePicker(true)}
            style={[fieldStyle, { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, errors.state ? { borderColor: colors.accent } : null]}
          >
            <Text style={{ fontFamily: fonts.body, fontSize: 16, color: form.state ? colors.ink : colors.muted }}>{form.state || "Choose a state"}</Text>
            <ChevronDown size={18} color={colors.muted} />
          </Pressable>
          {errors.state ? <FieldError text={errors.state} /> : null}
        </View>

        <Input label="Note for delivery (optional)" value={form.note} onChangeText={set("note")} error={errors.note} multiline style={{ minHeight: 80, textAlignVertical: "top" }} />

        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <Body size={14} style={{ flex: 1 }}>
            Save as my default address
          </Body>
          <Switch
            value={form.saveAddress}
            onValueChange={(v) => setForm((f) => ({ ...f, saveAddress: v }))}
            trackColor={{ true: colors.ink, false: colors.line }}
            thumbColor={colors.white}
          />
        </View>

        <Card style={{ padding: 16, gap: 2 }}>
          <Heading size={20} style={{ marginBottom: 8 }}>
            Order summary
          </Heading>
          {quote.lines.map((l) => (
            <View key={l.product_id} style={{ flexDirection: "row", justifyContent: "space-between", gap: 12, paddingVertical: 3 }}>
              <Body size={14} style={{ flex: 1 }} numberOfLines={2}>
                {l.quantity} × {l.name}
              </Body>
              <Body size={14} weight="medium">
                {formatNaira(l.line_total_ngn)}
              </Body>
            </View>
          ))}
          <View style={{ height: 1, backgroundColor: colors.line, marginVertical: 8 }} />
          <SummaryRow label="Subtotal" value={formatNaira(quote.subtotal_ngn)} />
          <SummaryRow label="Delivery" value={fee === null ? "Choose a state" : fee === 0 ? "Free" : formatNaira(fee)} />
          <SummaryRow label="Total" value={formatNaira(total)} strong />
        </Card>
      </ScrollView>

      <View style={{ paddingHorizontal: gutter, paddingTop: 12, paddingBottom: insets.bottom + 12, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.line, gap: 6 }}>
        <Button title={`Pay ${formatNaira(total)} with Paystack`} icon={<Lock size={16} color={colors.white} />} loading={placing} onPress={submit} />
        <Body size={11} color={colors.muted} style={{ textAlign: "center" }}>
          Test mode: use card 4084 0840 8408 4081, any future date, CVV 408.
        </Body>
      </View>

      <StatePicker
        visible={statePicker}
        selected={form.state}
        onClose={() => setStatePicker(false)}
        onSelect={(s) => {
          set("state")(s);
          setStatePicker(false);
        }}
      />
    </KeyboardAvoidingView>
  );
}

const fieldStyle = {
  minHeight: 50,
  borderRadius: radius.sm,
  borderWidth: 1,
  borderColor: colors.line,
  backgroundColor: colors.surface,
  paddingHorizontal: 14,
  paddingVertical: 12,
} as const;

function Input({ label, error, style, ...rest }: TextInputProps & { label: string; error?: string }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ gap: 6 }}>
      <Caption>{label}</Caption>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.muted}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[fieldStyle, { fontFamily: fonts.body, fontSize: 16, color: colors.ink }, focused && { borderColor: colors.ink }, error ? { borderColor: colors.accent } : null, style]}
        {...rest}
      />
      {error ? <FieldError text={error} /> : null}
    </View>
  );
}

function FieldError({ text }: { text: string }) {
  return (
    <Body size={12} weight="medium" color={colors.accent} accessibilityLiveRegion="polite">
      {text}
    </Body>
  );
}

function StatePicker({ visible, selected, onSelect, onClose }: { visible: boolean; selected: string; onSelect: (s: string) => void; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState("");
  const list = useMemo(() => nigerianStates.filter((s) => s.toLowerCase().includes(filter.trim().toLowerCase())), [filter]);
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top + 8 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: gutter, paddingBottom: 10 }}>
          <Heading size={24}>Choose a state</Heading>
          <Pressable accessibilityRole="button" onPress={onClose} hitSlop={10}>
            <Body weight="medium">Close</Body>
          </Pressable>
        </View>
        <View style={{ paddingHorizontal: gutter, paddingBottom: 8 }}>
          <TextInput
            value={filter}
            onChangeText={setFilter}
            placeholder="Search states"
            placeholderTextColor={colors.muted}
            accessibilityLabel="Search states"
            style={[fieldStyle, { fontFamily: fonts.body, fontSize: 16, color: colors.ink, borderRadius: radius.pill }]}
          />
        </View>
        <FlatList
          data={list}
          keyExtractor={(s) => s}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ checked: item === selected }}
              onPress={() => onSelect(item)}
              style={({ pressed }) => ({
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingHorizontal: gutter,
                paddingVertical: 15,
                borderBottomWidth: 1,
                borderBottomColor: colors.line,
                backgroundColor: pressed ? colors.sand : colors.background,
              })}
            >
              <Body weight={item === selected ? "medium" : "regular"}>
                {item}
                {item === "Lagos" ? <Text style={{ color: colors.muted }}>  ·  ₦5,000 delivery</Text> : null}
              </Body>
              {item === selected && <Check size={18} color={colors.ink} />}
            </Pressable>
          )}
        />
      </View>
    </Modal>
  );
}
