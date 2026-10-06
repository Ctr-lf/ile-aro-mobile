import { useEffect } from "react";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  useFonts,
  PlayfairDisplay_400Regular,
  PlayfairDisplay_400Regular_Italic,
  PlayfairDisplay_500Medium,
} from "@expo-google-fonts/playfair-display";
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from "@expo-google-fonts/inter";
import { AuthProvider } from "@/lib/auth";
import { ToastProvider } from "@/components/Toast";
import { colors, fonts } from "@/lib/theme";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    PlayfairDisplay_400Regular,
    PlayfairDisplay_400Regular_Italic,
    PlayfairDisplay_500Medium,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync();
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ToastProvider>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: colors.background },
              headerShadowVisible: false,
              headerTintColor: colors.ink,
              headerTitleStyle: { fontFamily: fonts.heading, fontSize: 20, color: colors.ink },
              headerBackButtonDisplayMode: "minimal",
              contentStyle: { backgroundColor: colors.background },
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="product/[slug]" options={{ headerShown: false }} />
            <Stack.Screen name="search" options={{ title: "Search", animation: "fade_from_bottom" }} />
            <Stack.Screen name="checkout" options={{ title: "Checkout" }} />
            <Stack.Screen name="orders/index" options={{ title: "My orders" }} />
            <Stack.Screen name="orders/[id]" options={{ title: "Order" }} />
            <Stack.Screen name="auth-callback" options={{ headerShown: false }} />
            <Stack.Screen name="payment-return" options={{ headerShown: false }} />
          </Stack>
        </ToastProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
