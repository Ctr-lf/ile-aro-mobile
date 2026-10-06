import { storage } from "./storage";
import { AppState } from "react-native";
import { useSyncExternalStore } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "./supabase";

/*
 * The cart store, the same model as the web shop (src/lib/cart/store.ts there).
 *
 * Guests: the cart lives on the device, so it survives restarts.
 * Signed in: the cart lives in the cart_items table, the same rows the website
 * uses, so it is the same cart on the phone and on the web. On sign-in the guest
 * cart is merged in once (merge_guest_cart) and the device copy is cleared.
 * Changes show straight away and are saved in the background; a database
 * trigger caps quantities at stock. We listen for cart_items changes (Supabase
 * Realtime) and reload when the app comes back to the foreground, so a change
 * made on the website shows up here within a second or two.
 *
 * Only product ids and quantities are stored: names, prices and stock always
 * come fresh from the database (quote_cart).
 */

export type CartLine = { productId: string; quantity: number };

const STORAGE_KEY = "ile-aro:cart:v1";
const EMPTY: CartLine[] = [];
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

let lines: CartLine[] = readLocal();
let userId: string | null = null;
let syncing: Promise<void> = Promise.resolve();
let version = 0;
const listeners = new Set<() => void>();
const pendingSaves = new Set<Promise<void>>();
let channel: RealtimeChannel | null = null;
let liveTimer: ReturnType<typeof setTimeout> | undefined;

function emit(next: CartLine[]) {
  lines = next.length ? next : EMPTY;
  listeners.forEach((listener) => listener());
}

function clean(value: unknown): CartLine[] {
  if (!Array.isArray(value)) return [];
  const byId = new Map<string, number>();
  for (const item of value) {
    const productId = (item as CartLine)?.productId;
    const quantity = Math.floor(Number((item as CartLine)?.quantity));
    if (typeof productId !== "string" || !uuid.test(productId) || !(quantity > 0)) continue;
    byId.set(productId, (byId.get(productId) ?? 0) + quantity);
  }
  return [...byId].map(([productId, quantity]) => ({ productId, quantity: Math.min(quantity, 99) }));
}

function readLocal(): CartLine[] {
  try {
    return clean(JSON.parse(storage.getItem(STORAGE_KEY) ?? "[]"));
  } catch {
    return [];
  }
}

function writeLocal(next: CartLine[]) {
  try {
    if (next.length) storage.setItem(STORAGE_KEY, JSON.stringify(next));
    else storage.removeItem(STORAGE_KEY);
  } catch {
    // Storage unavailable: the cart still works until the app closes.
  }
}

type Row = { product_id: string; quantity: number };
const toLines = (rows: Row[]): CartLine[] => rows.map((r) => ({ productId: r.product_id, quantity: r.quantity }));

async function fetchRemote(): Promise<CartLine[]> {
  const { data, error } = await supabase.from("cart_items").select("product_id, quantity").order("added_at").order("id");
  if (error) throw error;
  return toLines(data);
}

async function saveQuantity(productId: string, quantity: number) {
  const { error } = await supabase
    .from("cart_items")
    .upsert({ user_id: userId!, product_id: productId, quantity }, { onConflict: "user_id,product_id" });
  if (error) throw error;
}

async function deleteRemote(productId: string) {
  const { error } = await supabase.from("cart_items").delete().eq("user_id", userId!).eq("product_id", productId);
  if (error) throw error;
}

/** Shows a change immediately, then persists it to the right place. */
function commit(next: CartLine[], save: () => Promise<void>) {
  version++;
  emit(next);
  if (!userId) {
    writeLocal(lines);
    return;
  }
  const saving = save().catch(() => refreshFromServer());
  pendingSaves.add(saving);
  saving.finally(() => pendingSaves.delete(saving));
}

export async function flushSaves() {
  await syncing;
  await Promise.all([...pendingSaves]);
}

export function quantityOf(productId: string) {
  return lines.find((l) => l.productId === productId)?.quantity ?? 0;
}

/** Adds up to `quantity`, never going past `stock`. Returns how many were added. */
export function addToCart(productId: string, quantity: number, stock: number) {
  const current = quantityOf(productId);
  const added = Math.max(0, Math.min(quantity, stock - current));
  if (added > 0) {
    const total = current + added;
    commit(
      current > 0
        ? lines.map((l) => (l.productId === productId ? { ...l, quantity: total } : l))
        : [...lines, { productId, quantity: total }],
      () => saveQuantity(productId, total),
    );
  }
  return added;
}

export function setQuantity(productId: string, quantity: number) {
  if (quantity <= 0) return removeFromCart(productId);
  commit(
    lines.map((l) => (l.productId === productId ? { ...l, quantity } : l)),
    () => saveQuantity(productId, quantity),
  );
}

export function removeFromCart(productId: string) {
  commit(
    lines.filter((l) => l.productId !== productId),
    () => deleteRemote(productId),
  );
}

/** Reloads a signed-in cart from the database (e.g. changed on the website). */
export async function refreshFromServer() {
  if (!userId) return;
  const forUser = userId;
  try {
    const fresh = await fetchRemote();
    if (userId === forUser) emit(fresh);
  } catch {
    // Offline: keep what we have.
  }
}

function onRemoteChange() {
  clearTimeout(liveTimer);
  liveTimer = setTimeout(async () => {
    await flushSaves();
    refreshFromServer();
  }, 300);
}

function listenForChanges(id: string) {
  if (channel) supabase.removeChannel(channel);
  // Row Level Security limits inserts and updates to this shopper's rows.
  // Deletes carry only the row id, so any delete just triggers a (cheap) reload.
  channel = supabase
    .channel(`cart:${id}`)
    .on("postgres_changes", { event: "*", schema: "public", table: "cart_items" }, onRemoteChange)
    .subscribe();
}

/** Called when a shopper signs in (or the app opens with a saved session). */
export function startUserSession(id: string) {
  if (userId === id) return syncing;
  userId = id;
  listenForChanges(id);
  syncing = loadUserCart(id);
  return syncing;
}

async function loadUserCart(id: string) {
  const guest = readLocal();
  const startedAt = version;
  try {
    let merged: CartLine[];
    if (guest.length) {
      const { data, error } = await supabase.rpc("merge_guest_cart", {
        items: guest.map((l) => ({ product_id: l.productId, quantity: l.quantity })),
      });
      if (error) throw error;
      merged = toLines(data);
      writeLocal([]);
    } else {
      merged = await fetchRemote();
    }
    if (version !== startedAt) {
      await Promise.all([...pendingSaves]);
      merged = await fetchRemote();
    }
    if (userId === id) emit(merged);
  } catch {
    if (userId === id) emit(guest);
  }
}

/** Called on sign out: the saved cart stays in the account, this device starts empty. */
export function endUserSession() {
  if (!userId) return;
  userId = null;
  clearTimeout(liveTimer);
  if (channel) supabase.removeChannel(channel);
  channel = null;
  writeLocal([]);
  emit([]);
}

/** Empties the cart shown on the device, e.g. after an order has been placed. */
export function clearLocalCart() {
  writeLocal([]);
  emit([]);
}

AppState.addEventListener("change", (state) => {
  if (state === "active") refreshFromServer();
});

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const getSnapshot = () => lines;

/** The cart lines, live. */
export function useCartLines() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function useCartCount() {
  return useCartLines().reduce((sum, line) => sum + line.quantity, 0);
}
