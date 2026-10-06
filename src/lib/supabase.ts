import { storage } from "./storage";
import { AppState } from "react-native";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/*
 * The same Supabase project as the web shop (https://ile-aro.vercel.app).
 * Row Level Security and the database functions (quote_cart, merge_guest_cart,
 * search_products, place_order...) apply to the app exactly as to the website.
 * The publishable key is public by design; the secret key never leaves the server.
 */
export const supabase = createClient<Database>(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  {
    auth: {
      storage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      // Google sign-in comes back to the app with a one-time code (PKCE).
      flowType: "pkce",
    },
  },
);

// Only refresh the session while the app is in the foreground.
AppState.addEventListener("change", (state) => {
  if (state === "active") supabase.auth.startAutoRefresh();
  else supabase.auth.stopAutoRefresh();
});
