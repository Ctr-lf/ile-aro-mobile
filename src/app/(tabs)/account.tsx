import { useCallback, useState } from "react";
import { Alert, Linking, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { Image } from "expo-image";
import { ChevronRight, Globe, LogOut, Package, ShoppingBag } from "lucide-react-native";
import Svg, { Path } from "react-native-svg";
import { profileOf, useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import type { Order } from "@/lib/orders";
import { colors, fonts, gutter, radius } from "@/lib/theme";
import { Body, Eyebrow, Heading } from "@/components/Text";
import { Button } from "@/components/Button";
import { AccentLink, Card, Loading } from "@/components/Layout";
import { OrderRow } from "@/components/OrderParts";
import { useToast } from "@/components/Toast";

const SITE_URL = process.env.EXPO_PUBLIC_API_URL ?? "https://ile-aro.vercel.app";

export default function AccountScreen() {
  const insets = useSafeAreaInsets();
  const { user, ready, signInWithGoogle, signOut } = useAuth();
  const { show } = useToast();
  const [signingIn, setSigningIn] = useState(false);

  const signIn = async () => {
    setSigningIn(true);
    const result = await signInWithGoogle();
    setSigningIn(false);
    if (result.ok) show("success", "Signed in. Your cart now matches the website.", false);
    else if (result.message && result.message !== "Sign-in was cancelled.") show("warning", result.message, false);
  };

  if (!ready) return <Loading />;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: gutter, paddingBottom: 12 }}>
        <Heading size={32}>Account</Heading>
      </View>
      {user ? (
        <SignedIn
          onSignOut={() =>
            Alert.alert("Sign out?", "Your cart stays saved in your account.", [
              { text: "Cancel", style: "cancel" },
              { text: "Sign out", style: "destructive", onPress: () => signOut() },
            ])
          }
        />
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: gutter, paddingBottom: 32 }}>
          <View style={{ backgroundColor: colors.sand, borderRadius: radius.lg, padding: 22, gap: 12 }}>
            <Eyebrow>Welcome</Eyebrow>
            <Heading size={30} accent="Ilé Aró">
              Sign in to
            </Heading>
            <Body color={colors.inkSoft}>
              Use the same Google account as the website. Your cart and orders follow you between your phone and{" "}
              <Text style={{ fontFamily: fonts.bodyMedium }}>ile-aro.vercel.app</Text>.
            </Body>
            <Button
              title="Continue with Google"
              variant="secondary"
              loading={signingIn}
              icon={<GoogleMark />}
              onPress={signIn}
              style={{ marginTop: 8 }}
            />
            <Body size={12} color={colors.muted}>
              We only use your name and email to manage your orders.
            </Body>
          </View>
          <View style={{ marginTop: 24, gap: 10 }}>
            <Row icon={ShoppingBag} label="Browse the collection" onPress={() => router.navigate("/shop")} />
            <Row icon={Globe} label="Open the website" onPress={() => Linking.openURL(SITE_URL)} />
          </View>
        </ScrollView>
      )}
    </View>
  );
}

function SignedIn({ onSignOut }: { onSignOut: () => void }) {
  const { user } = useAuth();
  const profile = profileOf(user);
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(3);
    setOrders(data ?? []);
  }, []);

  // Reload whenever the tab is shown, so a just-paid order shows its new status.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <ScrollView
      contentContainerStyle={{ paddingHorizontal: gutter, paddingBottom: 32, gap: 20 }}
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
      <Card style={{ flexDirection: "row", alignItems: "center", padding: 16, gap: 14 }}>
        {profile.avatar ? (
          <Image source={{ uri: profile.avatar }} style={{ width: 56, height: 56, borderRadius: 28 }} accessibilityIgnoresInvertColors />
        ) : (
          <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.sand, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontFamily: fonts.heading, fontSize: 22, color: colors.ink }}>{profile.name.slice(0, 1).toUpperCase()}</Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text numberOfLines={1} style={{ fontFamily: fonts.heading, fontSize: 20, color: colors.ink }}>
            {profile.name}
          </Text>
          <Body size={13} color={colors.muted} numberOfLines={1}>
            {profile.email}
          </Body>
        </View>
      </Card>

      <View>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 10 }}>
          <Heading size={22} accent="orders">
            Recent
          </Heading>
          {orders && orders.length > 0 && <AccentLink label="View all" onPress={() => router.push("/orders")} />}
        </View>
        {!orders ? (
          <Loading />
        ) : orders.length === 0 ? (
          <Card style={{ padding: 18, gap: 6 }}>
            <Body color={colors.muted}>No orders yet. When you check out, here or on the website, your orders show up here.</Body>
          </Card>
        ) : (
          <View style={{ gap: 10 }}>
            {orders.map((o) => (
              <OrderRow key={o.id} order={o} />
            ))}
          </View>
        )}
      </View>

      <View style={{ gap: 10 }}>
        <Row icon={Package} label="All orders" onPress={() => router.push("/orders")} />
        <Row icon={Globe} label="Open the website" onPress={() => Linking.openURL(SITE_URL)} />
        <Row icon={LogOut} label="Sign out" onPress={onSignOut} />
      </View>
    </ScrollView>
  );
}

function Row({ icon: Icon, label, onPress }: { icon: typeof Package; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
      <Card style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 15 }}>
        <Icon size={19} color={colors.ink} strokeWidth={1.6} />
        <Body style={{ flex: 1 }}>{label}</Body>
        <ChevronRight size={18} color={colors.muted} />
      </Card>
    </Pressable>
  );
}

/** Google's "G" mark (brand asset, drawn as SVG: no emoji, no extra package). */
function GoogleMark() {
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
    <Svg width={18} height={18} viewBox="0 0 48 48">
      <Path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <Path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <Path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <Path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </Svg>
    </View>
  );
}
