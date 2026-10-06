import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { supabase } from "./supabase";
import { runInFlight } from "./inFlight";

/*
 * Calls to the web shop's mobile API (https://ile-aro.vercel.app/api/mobile/*).
 * Only checkout and payment go through the website, because starting a
 * Paystack payment needs the secret key, which lives on the server. Everything
 * else talks to Supabase directly.
 */

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "https://ile-aro.vercel.app";

async function post<T>(path: string, body: unknown): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return { ok: false, reason: "signed_out", message: "Please sign in again." } as T;

  try {
    const res = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    return (await res.json()) as T;
  } catch {
    return { ok: false, reason: "error", message: "Could not reach the shop. Check your connection and try again." } as T;
  }
}

export type Delivery = {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  note: string;
  saveAddress: boolean;
};

export type ShortItem = { product_id: string; name: string; requested: number; available: number };

export type CheckoutResult =
  | { ok: true; orderId: string; paymentUrl: string | null; message?: string }
  | { ok: false; reason: "invalid"; errors: Record<string, string> }
  | { ok: false; reason: "out_of_stock"; items: ShortItem[] }
  | { ok: false; reason: "empty_cart" | "signed_out" | "not_ready" | "error"; message: string };

/** Where Paystack sends the shopper back to: this app (exp:// in Expo Go, ilearo:// once installed). */
const paymentReturnUrl = () => Linking.createURL("payment-return");

/** Places the order (prices, stock and delivery are worked out by the database) and starts Paystack. */
export function placeOrder(delivery: Delivery) {
  return post<CheckoutResult>("/api/mobile/checkout", { ...delivery, returnUrl: paymentReturnUrl() });
}

export function startOrderPayment(orderId: string) {
  return post<{ ok: boolean; paymentUrl?: string; message?: string }>(`/api/mobile/orders/${orderId}/pay`, {
    returnUrl: paymentReturnUrl(),
  });
}

/**
 * Opens Paystack's checkout in an in-app browser. Our server checks the payment
 * with Paystack and sends the shopper back to the app, which closes the browser.
 * The order screen reads the result from the database either way.
 */
export async function openPayment(paymentUrl: string) {
  await runInFlight("payment", () => WebBrowser.openAuthSessionAsync(paymentUrl, paymentReturnUrl()));
}
