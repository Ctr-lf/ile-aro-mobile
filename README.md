# Ilé Aró mobile

The phone app for **Ilé Aró**, an online shop for hand-dyed Adire and hand-woven Aso oke. It is the mobile version of the web shop at **https://ile-aro.vercel.app** (code: [Ctr-lf/ile-aro](https://github.com/Ctr-lf/ile-aro)), built with React Native and Expo.

The app and the website share **one backend**: the same Supabase database, the same Google accounts, the same cart and the same orders. Sign in with the same Google account on both, and a piece added on the phone is in the website's cart within a second or two, and the other way round.

## What's in the app

- **Bottom tabs:** Home, Shop, Cart (with a live item count) and Account.
- **Home:** hero, "Shop by Category" photo cards, New Arrivals (swipe), Featured Pieces, the story of Adire.
- **Shop:** Adire / Aso Oke and category chips, sort sheet, two-column grid, pull to refresh, search.
- **Product:** full-width photo with credit, motif and its meaning, details, related pieces, and a sticky quantity and "Add to cart" bar.
- **Cart:** priced by the database (never by the phone), quantity steppers, delivery note. Checkout needs Google sign-in.
- **Checkout:** delivery form (prefilled from your saved address), state picker, delivery fee from the database, then Paystack (test mode) in an in-app browser.
- **Orders:** list, status timeline, items, delivery details, and "Pay now" for unpaid orders.
- Same look as the website: warm neutrals, black pill buttons, Playfair Display headings with one copper italic word, Inter body text, lucide icons.

## How it uses the web shop's backend

| What | How |
| --- | --- |
| Products, categories, search | Supabase directly (`products`, `categories`, `search_products`). Row Level Security only shows active products. |
| Cart | The same `cart_items` rows the website uses. Guests keep a cart on the phone; on sign-in it is merged in with `merge_guest_cart`. Prices come from `quote_cart`. |
| Live sync | Supabase Realtime on `cart_items`, plus a reload whenever the app comes back to the foreground. The website listens the same way. |
| Sign-in | Supabase Auth with Google, the same accounts as the website. The app opens Google in an in-app browser and returns via `ilearo://auth-callback`. |
| Checkout and payment | `POST /api/mobile/checkout` and `POST /api/mobile/orders/:id/pay` on the website. The app sends its Supabase access token; the website runs `place_order` as that shopper and starts Paystack with its secret key. Paystack returns to `/api/mobile/paystack-return`, which verifies the payment and sends the shopper back to the app. |
| Orders | Supabase directly (`orders`, `order_items`, `order_status_history`), own orders only. |

No new backend: the only additions to the web project were those three small API routes and turning on Realtime for `cart_items`.

## Run it on your phone with Expo Go

You need Node.js 20 or later on your computer, and **Expo Go** from the Play Store on your phone. Phone and computer must be on the **same Wi-Fi**.

1. Open a terminal in this folder and install everything (first time only):
   ```
   npm install
   ```
2. Start the development server:
   ```
   npx expo start
   ```
   A QR code appears in the terminal.
3. On your Android phone, open **Expo Go** and tap **Scan QR code**, then scan the code in the terminal. The app builds and opens (the first load takes a minute).

If the phone can't connect (different networks, or a firewall), stop the server with `Ctrl+C` and use a tunnel instead:
```
npx expo start --tunnel
```
The first time, it asks to install `@expo/ngrok`: press `Y`.

## Install the APK

Download the APK from the latest build on Expo, at https://expo.dev/accounts/ctrlf/projects/ile-aro-mobile/builds. Open the link on your phone, download, and allow "Install unknown apps" for your browser when Android asks.

To build a new APK:
```
npx eas-cli@latest build -p android --profile preview
```

## Test payment (Paystack test mode)

| Card | Expiry | CVV | PIN / OTP |
| --- | --- | --- | --- |
| 4084 0840 8408 4081 | any future date | 408 | 0000 / 123456 |

## Demo: web and mobile login and cart sync

1. On a computer, open https://ile-aro.vercel.app and sign in with Google.
2. On the phone, open the app, go to **Account**, tap **Continue with Google** and pick the **same** Google account.
3. On the phone, add a piece to the cart. The website's cart icon updates (switch to the tab if it is in the background).
4. On the website, add another piece or change a quantity. The phone's **Cart** tab badge updates.
5. Remove an item on either side; it disappears on the other.
6. Optional: check out on the phone with the test card, then open **Orders** on the website: the same order is there.

## Project layout

```
src/app/            screens (Expo Router)
  (tabs)/           Home, Shop, Cart, Account
  product/[slug]    product screen
  orders/           order list and order screen
  checkout, search  stack screens
  auth-callback, payment-return   app links from Google and Paystack
src/components/     shared UI (buttons, cards, product card, toast...)
src/lib/            Supabase client, cart store, catalog queries, API calls, theme
```

## Configuration

`.env` holds only public values: the Supabase URL, its publishable key (designed to be public; the website sends the same key to every browser) and the website address. Secret keys stay on the server, in the web project's Vercel settings.

## Scripts

```
npx expo start          # development server (scan with Expo Go)
npx tsc --noEmit        # type check
npx expo lint           # lint
```
