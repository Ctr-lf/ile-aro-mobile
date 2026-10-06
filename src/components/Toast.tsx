import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Animated, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { CircleAlert, CircleCheck } from "lucide-react-native";
import { addToCart, quantityOf } from "@/lib/cart";
import { colors, fonts, radius } from "@/lib/theme";

type Tone = "success" | "warning";
type Toast = { id: number; tone: Tone; message: string; showCartLink: boolean };

type ToastValue = {
  show: (tone: Tone, message: string, showCartLink?: boolean) => void;
  /** Adds to the cart without going over stock, and shows a toast (same messages as the web). */
  add: (product: { id: string; name: string; stock: number }, quantity?: number) => number;
};

const ToastContext = createContext<ToastValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);
  const [opacity] = useState(() => new Animated.Value(0));
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const insets = useSafeAreaInsets();

  const hide = useCallback(() => {
    Animated.timing(opacity, { toValue: 0, duration: 160, useNativeDriver: true }).start(() => setToast(null));
  }, [opacity]);

  const show = useCallback(
    (tone: Tone, message: string, showCartLink = true) => {
      clearTimeout(timer.current);
      setToast({ id: Date.now(), tone, message, showCartLink });
      opacity.setValue(0);
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }).start();
      Haptics.notificationAsync(
        tone === "success" ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning,
      ).catch(() => {});
      timer.current = setTimeout(hide, 3500);
    },
    [opacity, hide],
  );

  useEffect(() => () => clearTimeout(timer.current), []);

  const add = useCallback(
    (product: { id: string; name: string; stock: number }, quantity = 1) => {
      const inCart = quantityOf(product.id);
      const added = addToCart(product.id, quantity, product.stock);
      if (product.stock <= 0) show("warning", `${product.name} is sold out.`, false);
      else if (added === 0) show("warning", `You already have all ${product.stock} in your cart.`);
      else if (added < quantity) show("warning", `Only ${product.stock} in stock. Added ${added}, you now have ${inCart + added}.`);
      else show("success", `Added ${added > 1 ? `${added} × ` : ""}${product.name} to your cart.`);
      return added;
    },
    [show],
  );

  return (
    <ToastContext.Provider value={{ show, add }}>
      {children}
      {toast && (
        <Animated.View
          pointerEvents="box-none"
          style={{ position: "absolute", left: 16, right: 16, bottom: insets.bottom + 76, opacity }}
        >
          <View
            accessibilityLiveRegion="polite"
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              backgroundColor: colors.ink,
              borderRadius: radius.md,
              paddingVertical: 14,
              paddingHorizontal: 16,
            }}
          >
            {toast.tone === "success" ? <CircleCheck size={20} color={colors.white} /> : <CircleAlert size={20} color={colors.white} />}
            <Text style={{ flex: 1, fontFamily: fonts.body, fontSize: 14, color: colors.white }}>{toast.message}</Text>
            {toast.showCartLink && (
              <Pressable
                accessibilityRole="link"
                hitSlop={8}
                onPress={() => {
                  hide();
                  router.navigate("/cart");
                }}
              >
                <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.white, textDecorationLine: "underline" }}>
                  View cart
                </Text>
              </Pressable>
            )}
          </View>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const value = useContext(ToastContext);
  if (!value) throw new Error("useToast must be used inside ToastProvider");
  return value;
}
