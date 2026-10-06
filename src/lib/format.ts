/** Formats a whole-naira integer as ₦42,000. Use this everywhere a price is shown. */
export function formatNaira(amount: number): string {
  const whole = Math.round(amount);
  const digits = Math.abs(whole).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${whole < 0 ? "-" : ""}₦${digits}`;
}

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "6 Oct 2026" (or "6 Oct 2026, 2:05 PM") in Lagos time (UTC+1 all year). */
export function formatDate(iso: string, withTime = false) {
  const d = new Date(new Date(iso).getTime() + 60 * 60 * 1000);
  const date = `${d.getUTCDate()} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
  if (!withTime) return date;
  const h = d.getUTCHours();
  const m = d.getUTCMinutes().toString().padStart(2, "0");
  return `${date}, ${h % 12 || 12}:${m} ${h < 12 ? "AM" : "PM"}`;
}
