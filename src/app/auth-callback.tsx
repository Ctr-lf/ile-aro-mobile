import { useEffect } from "react";
import { router, useLocalSearchParams } from "expo-router";
import * as Linking from "expo-linking";
import { completeSignIn } from "@/lib/auth";
import { isInFlight } from "@/lib/inFlight";
import { Loading } from "@/components/Layout";

/**
 * Google sign-in returns to ilearo://auth-callback?code=...
 * Normally the sign-in button handles that code itself (see lib/auth.tsx), so
 * this screen just steps aside. If the app was reopened from the link instead,
 * it swaps the code for a session here.
 */
export default function AuthCallback() {
  const params = useLocalSearchParams<{ code?: string }>();

  useEffect(() => {
    const leave = () => (router.canGoBack() ? router.back() : router.replace("/account"));
    if (isInFlight("signIn") || !params.code) return leave();
    completeSignIn(Linking.createURL("auth-callback", { queryParams: { code: params.code } })).finally(leave);
  }, [params.code]);

  return <Loading />;
}
