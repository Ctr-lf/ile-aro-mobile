import { supabase } from "./supabase";
import type { CartLine } from "./cart";

/** One cart line priced by the database (quote_cart), the same as the web cart. */
export type QuoteLine = {
  product_id: string;
  slug: string | null;
  name: string | null;
  unit: string | null;
  colour: string | null;
  technique: string | null;
  image_alt: string | null;
  image_url: string | null;
  group_name: string | null;
  price_ngn: number | null;
  stock: number;
  quantity: number;
  available: boolean;
  line_total_ngn: number;
};

export type CartQuote = {
  lines: QuoteLine[];
  subtotal_ngn: number;
  /** null until the delivery state is known (unless delivery is free) */
  delivery_fee_ngn: number | null;
  delivery_fee_from_ngn: number;
  free_delivery_over_ngn: number;
};

/** Current prices, stock and totals for a cart, worked out by the database. Prices on the phone are never trusted. */
export async function fetchQuote(lines: CartLine[], state: string | null = null): Promise<CartQuote> {
  const { data, error } = await supabase.rpc("quote_cart", {
    items: lines.map((l) => ({ product_id: l.productId, quantity: l.quantity })),
    state: state ?? undefined,
  });
  if (error) throw new Error(error.message);
  return data as unknown as CartQuote;
}
