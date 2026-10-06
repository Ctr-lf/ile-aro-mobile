import type { Tables } from "./database.types";

export type Order = Tables<"orders">;
export type OrderItem = Tables<"order_items">;
export type OrderStatus = "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";

/** The normal path an order takes, for the timeline (same as the web shop). */
export const orderSteps: { status: OrderStatus; label: string; help: string }[] = [
  { status: "pending", label: "Order placed", help: "Waiting for payment." },
  { status: "confirmed", label: "Confirmed", help: "Payment received. Thank you!" },
  { status: "processing", label: "Being prepared", help: "Your cloth is being folded and packed." },
  { status: "shipped", label: "On its way", help: "Handed to our delivery partner." },
  { status: "delivered", label: "Delivered", help: "Enjoy wearing it." },
];

export const statusLabels: Record<OrderStatus, string> = {
  pending: "Awaiting payment",
  confirmed: "Confirmed",
  processing: "Being prepared",
  shipped: "On its way",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

/** An order can be paid (or paid again) while it is pending and not yet paid. */
export function canPay(order: Pick<Order, "status" | "payment_status">) {
  return order.status === "pending" && order.payment_status !== "paid";
}

/** The 36 states of Nigeria and the Federal Capital Territory, for delivery forms. */
export const nigerianStates = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT (Abuja)", "Gombe",
  "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos",
  "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto",
  "Taraba", "Yobe", "Zamfara",
] as const;
