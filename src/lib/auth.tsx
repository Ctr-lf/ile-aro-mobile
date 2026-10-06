import { createContext, useContext, useEffect, useState } from "react";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import * as cart from "./cart";
import { runInFlight } from "./inFlight";

WebBrowser.maybeCompleteAuthSession();

/*
 * Google sign-in through Supabase, the same account system as the web shop.
 * The app opens Google in an in-app browser; Supabase sends it back to
 * ilearo://auth-callback (or exp://.../--/auth-callback in Expo Go) with a
 * one-time code, which we swap for a session.
 */

type AuthValue = {
  session: Session | null;
  user: User | null;
  /** False until the saved session has been read from the device. */
  ready: boolean;
  signInWithGoogle: () => Promise<{ ok: boolean; message?: string }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

/** Swaps the one-time code in a sign-in redirect for a session. */
export async function completeSignIn(url: string) {
  const { queryParams } = Linking.parse(url);
  const code = typeof queryParams?.code === "string" ? queryParams.code : null;
  if (!code) return { ok: false, message: "Sign-in was cancelled." };
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  return error ? { ok: false, message: "We could not sign you in. Please try again." } : { ok: true };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next);
      const userId = next?.user?.id;
      // Defer cart work: Supabase calls made inside this callback can deadlock.
      setTimeout(() => {
        if (userId) cart.startUserSession(userId);
        else if (event === "SIGNED_OUT") cart.endUserSession();
      }, 0);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  async function signInWithGoogle() {
    const redirectTo = Linking.createURL("auth-callback");
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (error || !data.url) return { ok: false, message: "Google sign-in is not available right now." };

    const result = await runInFlight("signIn", () => WebBrowser.openAuthSessionAsync(data.url, redirectTo));
    if (result.type !== "success") return { ok: false, message: "Sign-in was cancelled." };
    return completeSignIn(result.url);
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, ready, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}

/** Display name and photo from the Google profile. */
export function profileOf(user: User | null) {
  const meta = (user?.user_metadata ?? {}) as Record<string, string | undefined>;
  return {
    name: meta.full_name ?? meta.name ?? user?.email?.split("@")[0] ?? "",
    email: user?.email ?? "",
    avatar: meta.avatar_url ?? meta.picture ?? null,
  };
}
