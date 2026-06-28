# AR Commerce — Migration Brief

> **Generated for workspace handoff.** Safe to commit — contains no secret values.

---

## 1. Directory Manifest

```
artifacts/mobile/                        # Expo React Native app (@workspace/mobile)
│
├── app.json                             # Expo config — bundle IDs, permissions, plugins
├── package.json                         # Dependencies (Expo 54, React Native 0.81)
├── babel.config.js                      # Babel + React Compiler
├── metro.config.js                      # Metro bundler config
├── tsconfig.json                        # TypeScript config (extends workspace base)
│
├── app/                                 # Expo Router file-based routes
│   ├── _layout.tsx                      # Root layout — QueryClient, fonts, contexts
│   ├── +not-found.tsx                   # 404 screen
│   ├── viewer.tsx                       # Route A: AR Viewer (deep link target)
│   ├── (tabs)/
│   │   ├── _layout.tsx                  # Tab bar config (Discover, Scan)
│   │   ├── index.tsx                    # Route B: Consumer Discovery Hub
│   │   ├── scanner.tsx                  # QR code scanner → launches viewer
│   │   └── profile.tsx                  # Recently viewed + user info
│   └── merchant/
│       ├── _layout.tsx                  # Merchant stack layout
│       ├── login.tsx                    # Route C: Merchant Login
│       └── dashboard.tsx               # Route C: Merchant Dashboard
│
├── components/
│   ├── ARProductViewer.tsx              # AR overlay UI (camera + 3D orbit canvas)
│   ├── NativeARSession.tsx             # ← NEW: Native ARKit/ARCore integration surface
│   ├── ColorSwatch.tsx                 # Variant color dot selector
│   ├── ErrorBoundary.tsx               # React error boundary
│   ├── ErrorFallback.tsx               # Fallback UI for errors
│   ├── KeyboardAwareScrollViewCompat.tsx
│   ├── ProductCard.tsx                 # Trending grid card
│   └── ShimmerCard.tsx                 # Skeleton loading placeholder
│
├── constants/
│   ├── colors.ts                        # Light/dark color tokens
│   └── products.ts                      # Seed/fallback products (used when Supabase fails)
│
├── context/
│   ├── AuthContext.tsx                  # Merchant auth state (hardcoded demo credentials)
│   └── RecentlyViewedContext.tsx        # Recently viewed product IDs (AsyncStorage)
│
├── hooks/
│   ├── useColors.ts                     # Color scheme hook
│   └── useProducts.ts                   # React Query hooks: useProductById, useTrendingProducts
│
├── services/
│   ├── supabase.ts                      # Supabase client + TypeScript DB interfaces
│   └── productService.ts               # Data layer: fetchProductById, fetchTrendingProducts,
│                                        #   trackEvent — queries products, assets,
│                                        #   product_variants, merchants, analytics_events
│
├── assets/images/
│   ├── icon.png
│   └── splash.png
│
├── server/
│   ├── serve.js                         # Static file server for web build output
│   └── templates/landing-page.html     # Deep-link landing page for QR codes
│
└── scripts/
    └── build.js                         # Web build script (esbuild)

artifacts/api-server/                    # Express 5 API (@workspace/api-server)
lib/                                     # Shared workspace libs
scripts/                                 # Workspace-level utility scripts
```

---

## 2. Environment Variables

All variables use the `EXPO_PUBLIC_` prefix to be bundled into the Expo client.

| Variable | Required | Purpose |
|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | ✅ | Supabase project REST API base URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anonymous/public API key |
| `SESSION_SECRET` | API only | Express session signing secret |

Set these in Replit Secrets (Settings → Secrets) or a `.env` file in `artifacts/mobile/`.

---

## 3. Live Connection State

### Supabase

- **Project host**: `tcujcbwkginjfqworinz.supabase.co`
- **Auth mode**: Anonymous (anon key), no user auth on the consumer app
- **REST endpoint**: `https://tcujcbwkginjfqworinz.supabase.co/rest/v1/`
- **Edge function**: `https://tcujcbwkginjfqworinz.supabase.co/functions/v1/track-event`

### Verified tables (public schema)

| Table | Status | Notes |
|---|---|---|
| `products` | ✅ Accessible | 3 live rows confirmed; columns: `id`, `name`/`title`, `description`, `merchant_id`, `category`, `checkout_url`, `thumbnail_color` |
| `merchants` | ✅ Accessible | Joined via `products.merchant_id`; confirmed columns: `id`, `name`, `slug` |
| `assets` | ⚠️ Needs `GRANT SELECT ON assets TO anon` | Contains GLB/USDZ URLs; expected columns: `id`, `product_id`, `file_url`, `glb_url`, `usdz_url`, `file_type`, `platform` |
| `product_variants` | ⚠️ Needs `GRANT SELECT ON product_variants TO anon` | Color swatches; expected columns: `id`, `product_id`, `name`, `color_hex`, `hex`, `base_color_r/g/b/a` |
| `analytics_events` | ✅ Write confirmed | Receives `event_type`, `product_id`, `merchant_slug`, `variant_id`, `platform`, `occurred_at` |
| `user_roles` | Not used | — |
| `processing_jobs` | Not used | — |

### SQL to run in Supabase to unblock assets + variants

```sql
GRANT SELECT ON assets TO anon;
GRANT SELECT ON product_variants TO anon;

-- If RLS is enabled on those tables:
CREATE POLICY IF NOT EXISTS "public read assets"
  ON assets FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "public read variants"
  ON product_variants FOR SELECT USING (true);
```

---

## 4. Deep Link Scheme

```
arcommerce://viewer?product_id=<UUID>&merchant_slug=<slug>
```

Triggers `app/viewer.tsx` which resolves the product from Supabase and opens `ARProductViewer`.

---

## 5. Native AR — Next Steps

`components/NativeARSession.tsx` is the integration surface. It renders a step-by-step setup guide in Expo Go and activates the real ARKit/ARCore pipeline in a native build.

**To enable world-tracking AR:**

1. Move to a native workspace (macOS for iOS, any for Android)
2. `pnpm add @viro-community/react-viro`
3. `npx expo prebuild --clean`
4. `npx pod-install` (iOS)
5. Replace the stub body in `NativeARSession.tsx` with the `ViroARSceneNavigator` implementation documented in the file's header comment
6. Import and render `<NativeARSession>` from within `ARProductViewer.tsx` in place of the existing 3D orbit canvas

**Bundle IDs are already set:**
- iOS: `com.rapidify.arsaas`
- Android: `com.rapidify.arsaas`

---

## 6. Demo / Test Credentials

- **Merchant login** (hardcoded in `context/AuthContext.tsx`): `demo@merchant.com` / `demo1234`
- **Playground product** (seed data fallback): `id: "astronaut"` — no Supabase lookup
