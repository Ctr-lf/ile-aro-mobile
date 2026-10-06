import { Tabs } from "expo-router";
import { House, LayoutGrid, ShoppingBag, UserRound } from "lucide-react-native";
import { useCartCount } from "@/lib/cart";
import { colors, fonts } from "@/lib/theme";

/** Bottom tab bar: Home, Shop, Cart (with live count) and Account. */
export default function TabLayout() {
  const count = useCartCount();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.line },
        tabBarLabelStyle: { fontFamily: fonts.bodyMedium, fontSize: 11 },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => <House size={22} color={color} strokeWidth={focused ? 2 : 1.5} />,
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          title: "Shop",
          tabBarIcon: ({ color, focused }) => <LayoutGrid size={22} color={color} strokeWidth={focused ? 2 : 1.5} />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: "Cart",
          tabBarIcon: ({ color, focused }) => <ShoppingBag size={22} color={color} strokeWidth={focused ? 2 : 1.5} />,
          tabBarBadge: count > 0 ? (count > 99 ? "99+" : count) : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.accent, color: colors.white, fontFamily: fonts.bodySemibold, fontSize: 10 },
          tabBarAccessibilityLabel: count > 0 ? `Cart, ${count} item${count === 1 ? "" : "s"}` : "Cart",
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: "Account",
          tabBarIcon: ({ color, focused }) => <UserRound size={22} color={color} strokeWidth={focused ? 2 : 1.5} />,
        }}
      />
    </Tabs>
  );
}
