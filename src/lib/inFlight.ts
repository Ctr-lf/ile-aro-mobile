/*
 * Google sign-in and Paystack both finish by redirecting to an app link
 * (auth-callback / payment-return). On Android that link is delivered twice:
 * to the in-app browser session that is waiting for it, and to the router,
 * which opens the matching screen. While a flow is in flight, those screens
 * just step aside and let the code that opened the browser handle the result.
 * The flag stays up a little after the browser closes, in case the router's
 * copy of the link arrives late.
 */
const flags = { signIn: false, payment: false };
const timers: Partial<Record<keyof typeof flags, ReturnType<typeof setTimeout>>> = {};

export async function runInFlight<T>(kind: keyof typeof flags, task: () => Promise<T>): Promise<T> {
  clearTimeout(timers[kind]);
  flags[kind] = true;
  try {
    return await task();
  } finally {
    timers[kind] = setTimeout(() => (flags[kind] = false), 2500);
  }
}

export const isInFlight = (kind: keyof typeof flags) => flags[kind];
