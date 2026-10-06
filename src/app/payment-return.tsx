import { useEffect } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { isInFlight } from "@/lib/inFlight";
import { Loading } from "@/components/Layout";

/**
 * Paystack returns here (via our server, which has already checked the
 * payment): ilearo://payment-return?order=...&status=paid
 * Normally the checkout or order screen that opened Paystack handles the
 * result, so this screen just steps aside. If the app was reopened from the
 * link instead, it opens the order.
 */
export default function PaymentReturn() {
  const { order } = useLocalSearchParams<{ order?: string; status?: string }>();

  useEffect(() => {
    if (isInFlight("payment") && router.canGoBack()) return router.back();
    if (order) router.replace({ pathname: "/orders/[id]", params: { id: order, from: "payment" } });
    else router.replace("/account");
  }, [order]);

  return <Loading />;
}
