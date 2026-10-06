import { supabase } from "./supabase";
import type { Tables } from "./database.types";

/*
 * Catalog reads, the same queries as the web shop (src/lib/catalog.ts there).
 * Row Level Security only lets the app see categories and active products.
 */

export type Category = Tables<"categories">;
export type Product = Tables<"products"> & {
  category: Pick<Category, "slug" | "name" | "group_name"> | null;
};

export type GroupName = "Adire" | "Aso Oke";
export const groups: GroupName[] = ["Adire", "Aso Oke"];

export const sortOptions = [
  { key: "newest", label: "Newest" },
  { key: "price-asc", label: "Price: low to high" },
  { key: "price-desc", label: "Price: high to low" },
] as const;
export type SortKey = (typeof sortOptions)[number]["key"];

/** How many of the newest products count as "New" (home section and card badge). */
export const NEW_ARRIVALS_COUNT = 8;

const productSelect = "*, category:categories!inner(slug, name, group_name)";

function check<T>(result: { data: T | null; error: { message: string } | null }, what: string): T {
  if (result.error) throw new Error(`Could not load ${what}: ${result.error.message}`);
  return result.data as T;
}

export async function getCategories(): Promise<Category[]> {
  return check(await supabase.from("categories").select("*").order("sort_order"), "categories");
}

export async function getProducts(filters: { group?: string; category?: string; sort?: SortKey } = {}): Promise<Product[]> {
  let query = supabase.from("products").select(productSelect).eq("is_active", true);
  if (filters.group) query = query.eq("categories.group_name", filters.group);
  if (filters.category) query = query.eq("categories.slug", filters.category);
  if (filters.sort === "price-asc") query = query.order("price_ngn", { ascending: true });
  else if (filters.sort === "price-desc") query = query.order("price_ngn", { ascending: false });
  else query = query.order("created_at", { ascending: false });
  query = query.order("name");
  return check(await query, "products") as unknown as Product[];
}

export async function getFeaturedProducts(limit = 8): Promise<Product[]> {
  const result = await supabase
    .from("products")
    .select(productSelect)
    .eq("is_active", true)
    .eq("featured", true)
    .order("name")
    .limit(limit);
  return check(result, "featured products") as unknown as Product[];
}

export async function getNewArrivals(): Promise<Product[]> {
  const result = await supabase
    .from("products")
    .select(productSelect)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .order("name")
    .limit(NEW_ARRIVALS_COUNT);
  return check(result, "new arrivals") as unknown as Product[];
}

export async function getProduct(slug: string): Promise<Product | null> {
  const result = await supabase.from("products").select(productSelect).eq("slug", slug).eq("is_active", true).maybeSingle();
  return check(result, "product") as unknown as Product | null;
}

export async function getRelatedProducts(product: Product, limit = 6): Promise<Product[]> {
  const result = await supabase
    .from("products")
    .select(productSelect)
    .eq("is_active", true)
    .eq("category_id", product.category_id)
    .neq("id", product.id)
    .order("featured", { ascending: false })
    .limit(limit);
  return check(result, "related products") as unknown as Product[];
}

/** Search across name, motif, colour and tags (search_products in the database, same as the web). */
export async function searchProducts(q: string): Promise<Product[]> {
  if (!q.trim()) return [];
  const result = await supabase.rpc("search_products", { q }).select(productSelect);
  return check(result, "search results") as unknown as Product[];
}

export function stockLabel(stock: number) {
  if (stock <= 0) return { text: "Sold out", tone: "out" as const };
  if (stock <= 3) return { text: `Only ${stock} left`, tone: "low" as const };
  return { text: "In stock", tone: "in" as const };
}
