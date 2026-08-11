# AR Commerce — Full Project Context & Codebase Analysis

> Complete technical analysis of the repository generated from a full codebase review.
> Covers every feature, integration, data flow, and architectural decision.

---

## 1. What This Project Is

**AR Commerce** is a multi-tenant B2B **Augmented Reality (AR) E-Commerce SaaS** mobile application. It is the native camera + rendering engine for a platform where merchants publish 3D product models (`.glb` / `.usdz`) that shoppers view **anchored in their real physical space** (floor/table) via ARKit (iOS) or ARCore (Android).

The consumer app is a **React Native / Expo (SDK 54)** application. It was originally specified as a Flutter app (see `attached_assets/`), but the delivered implementation is Expo + React Native + **ViroReact (react-viro)** for the native AR pipeline.

The product has **three entry states** (per the original system prompt in `attached_assets/Pasted--SYSTEM-PROMPT...txt`):

- **Route A — Consumer AR Viewport**: opened via deep link or QR scan (`arcommerce://viewer?product_id=...&merchant_slug=...`). Bypasses all onboarding and immediately opens the live camera + 3D model rendered in AR.
- **Route B — Consumer Discovery Hub**: the home screen (Discover tab) with AR Playground, Recently Viewed, Trending grid, and a floating QR-scan button.
- **Route C — Merchant Portal**: password-protected dashboard for merchants with scan-traffic metrics and an AI 3D generation queue.

---

## 2. Technology Stack

| Layer | Technology |
|---|---|
| Monorepo | pnpm workspaces (Node 24, TypeScript 5.9) |
| Mobile app | Expo SDK 54, React Native 0.81.5, React 19.1, Expo Router 6 |
| AR rendering | `@reactvision/react-viro` ^2.57 (ARKit / ARCore native pipeline) |
| Backend data | Supabase (Postgres) — REST + Auth + Edge Function |
| Server cache | React Query v5 (`@tanstack/react-query`) |
| Local storage | AsyncStorage |
| API server | Express 5 (ESM), Pino logging, esbuild bundle |
| Shared libs | `@workspace/api-spec` (OpenAPI) → Orval codegen → `@workspace/api-zod` + `@workspace/api-client-react` |
| DB layer | Drizzle ORM (schema scaffolded only, no tables yet) |
| Static deploy | Custom Metro static-build script + Node static server + landing page |
| OTA updates | EAS Update (Expo) |

---

## 3. Workspace / Directory Map

```
root
├── package.json                 # workspace scripts: build, typecheck
├── pnpm-workspace.yaml          # packages: artifacts/*, lib/*, scripts; "catalog:" dependencies
├── tsconfig.base.json           # shared TS config
├── .replit                      # Replit config: env secrets, ports (8080, 8081, 18115)
├── MIGRATION_BRIEF.md           # handoff doc (env vars, Supabase schema state, deep links)
├── replit.md                    # generic run instructions
├── attached_assets/             # original product requirement prompts (Flutter spec, native AR upgrade, infra export)
├── scripts/                     # workspace utility scripts + post-merge hook
├── artifacts/
│   ├── mobile/                  # ★ THE APP (@workspace/mobile)
│   │   ├── app.json             # Expo config: bundle IDs, camera permissions, plugins
│   │   ├── eas.json             # EAS build profiles (development/preview/production)
│   │   ├── package.json         # all RN/Expo deps
│   │   ├── babel.config.js      # babel-preset-expo (+ React Compiler experiment)
│   │   ├── metro.config.js      # default Expo metro config
│   │   ├── tsconfig.json        # extends workspace base, "@/*" alias → artifact root
│   │   ├── app/                 # Expo Router file-based routes
│   │   │   ├── _layout.tsx      # root layout: fonts, QueryClient, Auth, RecentlyViewed, RoleRouter
│   │   │   ├── viewer.tsx       # Route A: AR viewer screen (deep-link target)
│   │   │   ├── +not-found.tsx   # 404
│   │   │   ├── (tabs)/          # Route B: tab navigator
│   │   │   │   ├── _layout.tsx  # NativeTabs (liquid glass) or classic Tabs fallback
│   │   │   │   ├── index.tsx    # Discovery Hub (home)
│   │   │   │   ├── scanner.tsx  # QR scanner screen
│   │   │   │   └── profile.tsx  # Profile / settings screen
│   │   │   └── merchant/        # Route C: merchant portal
│   │   │       ├── _layout.tsx
│   │   │       ├── login.tsx    # merchant login
│   │   │       └── dashboard.tsx# merchant dashboard (mock metrics)
│   │   ├── components/
│   │   │   ├── ARProductViewer.tsx       # full-screen AR UI + multi-touch gesture system
│   │   │   ├── NativeARSession.tsx       # ViroReact AR scene (lights, PBR, 3D object, dial ring)
│   │   │   ├── ColorSwatch.tsx           # variant color dot selector
│   │   │   ├── ProductCard.tsx           # product grid card
│   │   │   ├── ShimmerCard.tsx           # skeleton loaders
│   │   │   ├── ErrorBoundary.tsx / ErrorFallback.tsx  # crash handling UI
│   │   │   └── KeyboardAwareScrollViewCompat.tsx
│   │   ├── constants/
│   │   │   ├── colors.ts         # light design tokens (accent #FF6B35)
│   │   │   └── products.ts       # Product/ColorVariant types + 6 seed products (fallback data)
│   │   ├── context/
│   │   │   ├── AuthContext.tsx          # Supabase auth session + role resolution
│   │   │   └── RecentlyViewedContext.tsx# last 10 viewed product IDs in AsyncStorage
│   │   ├── hooks/
│   │   │   ├── useColors.ts      # design-token hook (light/dark)
│   │   │   └── useProducts.ts    # React Query hooks: useProductById, useTrendingProducts
│   │   ├── services/
│   │   │   ├── supabase.ts       # Supabase client (AsyncStorage persistence) + raw DB types + profile fetch
│   │   │   └── productService.ts # data layer: product hydration, assets/variants/merchants joins, analytics
│   │   ├── server/
│   │   │   ├── serve.js          # zero-dep Node server for static Expo web build
│   │   │   └── templates/landing-page.html # QR-landing page (Expo Go install flow)
│   │   ├── scripts/build.js      # static Expo build pipeline (Metro bundle + manifest + assets)
│   │   ├── android/              # prebuilt Android native folder (gradle wrapper etc.)
│   │   └── assets/images/        # icon.png, splash.png
│   ├── api-server/               # Express 5 API (@workspace/api-server) — health check only
│   └── mockup-sandbox/           # web component preview sandbox (Vite + shadcn/ui library)
└── lib/
    ├── api-spec/                 # openapi.yaml + orval.config.ts (codegen source of truth)
    ├── api-zod/                  # generated Zod schemas from OpenAPI
    ├── api-client-react/         # generated React Query hooks + customFetch wrapper
    └── db/                       # Drizzle ORM setup (schema scaffold, no tables yet)
```

---

## 4. Feature-by-Feature Analysis

### 4.1 App Bootstrap & Global Infrastructure (`app/_layout.tsx`)

Order of operations at cold start:

1. `setBaseUrl(https://${EXPO_PUBLIC_DOMAIN})` — configures the generated API client (used for `/api/*` calls to the workspace API server).
2. `SplashScreen.preventAutoHideAsync()` — keeps splash up while fonts load.
3. **Fonts**: `@expo-google-fonts/inter` (4 weights) are loaded; splash is hidden only after fonts resolve/fail.
4. **Providers** (nesting order):
   - `SafeAreaProvider` (safe-area insets)
   - `ErrorBoundary` (class component → `ErrorFallback` UI with restart + dev-only error details modal)
   - `QueryClientProvider` (React Query, one global `QueryClient`)
   - `GestureHandlerRootView` (gestures)
   - `KeyboardProvider` (`react-native-keyboard-controller`)
   - `AuthProvider` (auth session)
   - `RecentlyViewedProvider` (view history)
5. **`RoleRouter`**: a null-rendering component that runs once after navigation is ready; if the logged-in user has role `merchant_owner`, it force-redirects to `/merchant/dashboard`.
6. **Stack** is defined: `(tabs)` (headerless), `viewer` as `fullScreenModal` with `slide_from_bottom`, and `merchant` group (headerless).

### 4.2 Route B — Discovery Hub (Home) (`app/(tabs)/index.tsx`)

Single scrollable screen with pull-to-refresh (`RefreshControl`) that invalidates the trending query:

- **Header**: "AR Commerce / Discover" + a briefcase button → merchant dashboard (if logged in as merchant) else login.
- **AR Playground card** (`PlaygroundCard`): animated gradient card with an "AR" badge, an isometric CSS cube illustration, and press-in/out spring scale animation. On tap: haptics + pushes `/viewer?product_id=astronaut&merchant_slug=ar-playground&is_playground=true`. Playground mode skips recently-viewed and analytics writes.
- **Recently Viewed row** (horizontal `FlatList` of `ProductCard`s, width 160) — only rendered when history is non-empty.
- **Trending Now** section: 2-column wrap grid of `ProductCard`s fed by `useTrendingProducts(8)`. While loading, four `ProductCardSkeleton` shimmer placeholders render.
- **Floating action button** (bottom-right): navigates to the scanner tab.

### 4.3 Route B — QR Scanner (`app/(tabs)/scanner.tsx`)

- Uses `expo-camera`'s `CameraView` with `barcodeScannerSettings: { barcodeTypes: ["qr"] }`.
- **Permission flow**: `useCameraPermissions()`; if not granted, renders a `PermissionView` with a glassmorphism-style card explaining camera use + "Enable Camera" button.
- **Scan handling** (`handleBarcode`): on first scan — flash animation (orange overlay fade), success haptic, then parses the QR payload as a URL with `new URL(data)`. Reads `product_id` and `merchant_slug` query params and `router.push("/viewer", ...)`. Non-URL or missing `product_id` payloads reset the scanner.
- **UI overlay**: dimmed scan regions, four animated corner brackets (pulsing corner loop), close button, bottom info card ("Aim at a QR code..."), and a "Scan again" reset button after a hit.
- On **web** the camera is unavailable — renders a black placeholder instead (no crash).

### 4.4 Route A — AR Viewer Screen (`app/viewer.tsx`)

- Reads route params: `product_id`, `merchant_slug`, `is_playground`.
- `useProductById(params.product_id)` (React Query) fetches/hydrates the product from Supabase (falls back to seed data on errors).
- On success (and not playground): writes to Recently Viewed + fires a `product_view` analytics event.
- **States**: loading spinner ("Fetching product data...") / error ("Product not found") / success → renders `ARProductViewer`.
- Callbacks wire analytics: `color_change` (with `variant_id`) and `buy_now` events.

### 4.5 AR Product Viewer (`components/ARProductViewer.tsx`) — the core experience

This is a **camera-first AR screen** with a React Native **multi-touch gesture engine** layered over the native AR scene:

**Native AR layer (`NativeARSession`)** — full-screen `ViroARSceneNavigator`:
- `ViroARScene` with `onTrackingUpdated` → calls `onAnchorFound` when tracking state is `TRACKING_NORMAL`.
- Lighting rig: `ViroLightingEnvironment` (neutral.hdr), 1 ambient, 1 directional (with shadows, 1024 map), 2 spotlights, 2 omni lights (warm/cool ambient accents).
- `ViroMaterials.createMaterials`: `productPBR` (PBR, roughness 0.4, metalness 0.12 — the color-tint surface), `dialRing`, `dialRingGlow`.
- A `ViroNode` (position/rotation/scale from gesture state) containing:
  - `Viro3DObject` — source is **USDZ on iOS, GLB everywhere else** (`modelType` "VRX"/"GLB"); materials `["productPBR"]`; casts shadows; load-state callbacks drive the loading overlay.
  - A **dial ring** drawn with 3 `ViroQuad`s (horizontal ring under the object) — visual affordance for the rotation dial.
- Overlays (RN views above the AR scene): loading glass card while the mesh downloads, gesture-hint pills (Drag / Pinch / Twist / Dial) once loaded, and a "CAMERA LOCKED" badge while latched.
- **Note**: `NativeARSession` currently receives a hardcoded test GLB (`TEST_GLB_URL` — a treasure-chest model in a Supabase storage bucket) rather than the product's own `glbUrl`, and the `color` prop is not yet applied to the material at runtime (PBR tinting is the documented next step).

**Custom gesture system** (PanResponder over the whole screen, `pointerEvents="auto"` layer above Viro):
- **One finger, top 65% of screen** → pan: translates the model in X/Z (with smoothing `SMOOTHING = 0.12`, sensitivity 0.004).
- **One finger in bottom 35% "dial zone"** → rotation dial: horizontal drag rotates the model around Y (sensitivity 0.35), pulses a dial-ring indicator.
- **Hold 200ms without moving** → **latch**: haptic + `isLatched=true` with a "CAMERA LOCKED" indicator; a full-screen tap-anywhere overlay then exists to *un-latch* (so the user's physical walking around the object isn't fighting touch input).
- **Two fingers** → pinch (scale 0.2–2.0) + two-finger twist (rotates model around Y by the angle between the two touch points).
- Gesture state is mirrored in a ref (`gestureStateRef`) so the AR scene's `viroAppProps` always have the live position/scale/rotation.
- The `color` from the selected variant is passed to the AR scene (PBR base color swap is the designed — not yet fully applied — path).

**UI chrome (absolute overlay)**:
- Top bar: close button, merchant + product name, info button.
- Bottom panel (dark card): category, description, scan-count badge, divider, **color variant swatch tray** (`ColorSwatch` dots with labels), and an accent-colored **Buy Now** button.
- **Buy Now**: haptic + `onBuyNow` (analytics) + `WebBrowser.openBrowserAsync(product.checkoutUrl)` — opens the merchant checkout externally (native intent on device, in-app browser on web).

### 4.6 Color Tinting Philosophy (cost control)

The original spec (attached assets) mandates: **one master mesh per product; color variants are material tint at render time** (`pbrMetallicRoughness.baseColorFactor`), never a re-download. The current code stores `baseColorFactor: [r,g,b,a]` per variant (in `constants/products.ts` and mapped from DB `base_color_r/g/b/a` columns in `productService.ts`), and passes `selectedVariant.color` into the AR session — so a future step is to wire that into the ViroMaterial per frame instead of re-fetching models.

### 4.7 Merchant Portal — Login (`app/merchant/login.tsx`)

- Email/password form with show/hide password, haptics, loading state, validation errors, and KeyboardAvoidingView.
- `login()` is **real Supabase auth** (`signInWithPassword`) — but for the demo there are **hardcoded demo credentials** documented in `MIGRATION_BRIEF.md` (`demo@merchant.com` / `demo1234`), resolved through the `profiles` table role check.
- Info hint copy: only accounts with `merchant_owner` role can enter.
- Redirects to `/merchant/dashboard` when authenticated as merchant (both via effect and `RoleRouter`).

### 4.8 Merchant Dashboard (`app/merchant/dashboard.tsx`) — currently mock data

- Guards: non-merchants are redirected to login; returns null while loading.
- Displays: welcome banner (name, email, logout), **4 metric cards** (Total Scans 12,847; Active Products 34; Conversion Rate 6.2%; Avg. Session 2m14s — **hardcoded constants**), a **7-day scan traffic bar chart** (hardcoded `scanData` array rendered with RN Views), a **Recent Scans** list (hardcoded), and a **"AI 3D Generation Queue"** with per-job progress bars and status badges (processing/queued/complete — hardcoded).
- ⚠️ All figures are static placeholders — no live query to `analytics_events` yet.

### 4.9 Profile (`app/(tabs)/profile.tsx`)

- Shows user card (avatar initials, name, email, role badge "Merchant Owner"/"AR Shopper") when signed in, else a generic "AR Shopper" card with products-viewed count.
- Settings rows: Merchant Portal / Management Console / Inventory Sync ("Live") / 3D Asset Capture (merchant-only rows), Sign Out (with confirm `Alert`), Recently Viewed count + Clear History, About (Version 1.0.0, Deep Link Format `mobile://viewer`).

---

## 5. Data Layer & Integrations (in depth)

### 5.1 Supabase Integration (`services/supabase.ts`)

- Client created from `EXPO_PUBLIC_SUPABASE_URL` + `EXPO_PUBLIC_SUPABASE_ANON_KEY` (bundled at build time).
- Auth storage customized: all session keys prefixed `ar_commerce_supabase_session_` and persisted via AsyncStorage (works on React Native where `localStorage` doesn't exist). `persistSession: true`, `autoRefreshToken: true`.
- Exposes typed interfaces that tolerate the **denormalized column naming** in the live DB (e.g. `name` OR `title`, `merchant_id` OR `merchant_slug`, `color_hex` OR `hex`...) — the schema is treated loosely because the DB has multiple naming variants.
- **Profile fetch** (`fetchProfile`): reads `profiles` table by user id, caches to AsyncStorage (`ar_commerce_profile_cache`), falls back to cache on network failure.
- Two cache helpers: `getCachedProfile`, `clearProfileCache`.

### 5.2 Product Service (`services/productService.ts`)

Data hydration strategy — **the client composes the product from 4 tables** with graceful degradation:

1. `fetchProductById(id)`: queries `products` (line by `id`), then in parallel:
   - `assets` (by `product_id`) → picks the best GLB URL (`resolveGlb`: prefers `file_type === 'glb'`, then android/all platform, then any `glb_url`, then first asset; falls back to seed GLB).
   - `product_variants` (by `product_id`) → maps each variant to a `ColorVariant` (name/color/baseColorFactor).
   - `merchants` (by `merchant_id`) → merchant name/slug.
2. `fetchTrendingProducts(limit)`: same parallel hydration applied to `products.limit(limit)` (top N rows, no trending-ness scoring).
3. `dbProductToLocal()`: the mapper that flattens rows to the app's `Product` model, applying field-to-field fallbacks every step; orphaned products get seed defaults (skeleton color, safe checkout URL, etc.).
4. **Fallback**: on *any* Supabase error or empty table → returns `SAMPLE_PRODUCTS` seed data (filtered to exclude the Demo category for trending). This means the app is fully demo-able offline.
5. `trackEvent(payload)`: **dual-write analytics**:
   - POSTs to the Supabase **Edge Function** `/functions/v1/track-event` with anon-key bearer + `platform` + ISO `timestamp`.
   - ALSO inserts directly into `analytics_events` table.
   - Both are fire-and-forget (try/catch swallow). Event types: `product_view`, `color_change`, `buy_now`, `qr_scan`.

### 5.3 React Query Hooks (`hooks/useProducts.ts`)

- `useProductById`: key `["product","v3",id]`, `staleTime: 0`, `gcTime: 0`, `retry: 2`; exposes `refetchProduct` (invalidate + refetch).
- `useTrendingProducts`: key `["trending","v3",limit]`, same config; exposes `refetchProducts` used by pull-to-refresh.
- The "v3" suffix in keys marks a schema generation — bumping it is the cheap cache-buster.

### 5.4 Auth Context (`context/AuthContext.tsx`)

- Restores session on boot: `supabase.auth.getSession()` → resolves the profile (role!) from the `profiles` table → builds `AppUser` → caches in AsyncStorage (`ar_commerce_user_cache`).
- Listens to `onAuthStateChange` (login/logout/token refresh): re-resolves profile or clears everything + profile cache.
- `login(email, password)` → `supabase.auth.signInWithPassword`, then `resolveProfile`.
- `logout()` → `signOut()` + clear caches.
- `profileRole` drives all role-gating (RoleRouter, dashboard guard, profile UI, header button). Defaults to `consumer` when no session.
- Resolution is guarded by a `resolvingRef` flag to avoid race conditions.

### 5.5 Recently Viewed Context (`context/RecentlyViewedContext.tsx`)

- Stores up to **10** product IDs in AsyncStorage (`ar_commerce_recently_viewed`), new-first, deduplicated.
- Resolves IDs to full products via the **seed catalog** (`getProductById`) — so recently-viewed items only render for seed products, not DB products (a limitation worth noting).
- `clearRecent()` wipes storage.

### 5.6 Deep Linking

- App scheme: `arcommerce` (in `app.json`). Canonical link: `arcommerce://viewer?product_id=<UUID>&merchant_slug=<slug>` — handled by Expo Router through the `viewer` route.
- QR codes produced by merchants encode this URL; the in-app scanner parses `product_id` + `merchant_slug` from any URL-style payload and routes to the same screen.
- The web landing page (`server/templates/landing-page.html`) is the QR destination for Expo Go: it shows store buttons + a generated QR to `exps://...` and auto-opens Expo Go on mobile.

### 5.7 API Server (`artifacts/api-server`) — health-only, scaffolded

- Express 5 ESM app: `pino-http` request logging (redacted auth headers, pretty in dev), `cors()`, JSON + urlencoded parsing, routes mounted at `/api`.
- Single route `GET /api/healthz` — validates the response with the **generated Zod schema** `HealthCheckResponse` from `@workspace/api-zod` (so the server is contract-tested against the OpenAPI spec).
- `index.ts` requires `PORT`, starts listener.
- **Current state**: skeleton. `@workspace/db` (Drizzle) is installed and wired but the schema files contain zero tables (just a comment template), `DATABASE_URL` is required at import time, and no business routes exist — the mobile app talks to **Supabase directly**, not to this server.

### 5.8 API Codegen Pipeline (`lib/`)

- `lib/api-spec/openapi.yaml` — the single source of truth (currently: `/api/healthz` → `HealthStatus` schema).
- `lib/api-spec/orval.config.ts` — two generation targets:
  1. **React client** (`@workspace/api-client-react`): `react-query` client, `mode: split`, baseUrl `/api`, custom **mutator** (`custom-fetch.ts` → `customFetch`) instead of fetch.
  2. **Zod schemas** (`@workspace/api-zod`): zod client with coercion for query/param/body/response, dates + bigint enabled.
- Regenerate with: `pnpm --filter @workspace/api-spec run codegen` (then add any new endpoints to the OpenAPI file first).
- `customFetch` (`lib/api-client-react/src/custom-fetch.ts`) is a robust fetch shim: module-level `setBaseUrl` (used by the mobile root layout) + optional bearer `setAuthTokenGetter`, automatic content-type inference, BOM stripping, JSON/text/blob response type detection, RN-safe body handling (no ReadableStream in RN), rich `ApiError` / `ResponseParseError` types.
- The mobile app currently imports `@workspace/api-client-react` only for `setBaseUrl` and doesn't call the generated `useHealthCheck` yet.

---

## 6. Build, Deploy & Run Pipeline

### 6.1 Local dev (Replit-oriented)
```
pnpm install
pnpm --filter @workspace/mobile run dev     # expo start with Replit env wiring ($PORT, REPLIT_DEV_DOMAIN, EXPO_PACKAGER_PROXY_URL)
pnpm --filter @workspace/api-server run dev # express dev server on $PORT
pnpm run typecheck                          # full workspace typecheck
pnpm run build                              # typecheck + build all packages
```
Required env (see `.replit` `[userenv.shared]`): `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, plus `REPLIT_DEV_DOMAIN`/`REPLIT_EXPO_DEV_DOMAIN`/`REPL_ID`/`PORT` provided by Replit; `DATABASE_URL` for the DB lib + API server.

### 6.2 Static web build (`artifacts/mobile/scripts/build.js`)
Custom pipeline (`pnpm --filter @workspace/mobile run build`) that:
1. Starts Metro in production mode (`--no-dev --minify --localhost`) on :8081.
2. Downloads the **iOS and Android JS bundles** from Metro (each platform's `expo-router` entry bundle).
3. Downloads both platform **manifests**.
4. Regex-extracts every asset `httpServerLocation` + `hash` from the bundles, copies the real asset files from disk into `static-build/<timestamp>/_expo/static/js/...`.
5. Rewrites bundle URLs to point at the deployment domain, rewrites manifest launch URLs/assets (`hostUri`, `debuggerHost`, `launchAsset.key`), writes `static-build/{ios,android}/manifest.json`.
Then `server/serve.js` (zero-dependency) serves it:
- `GET /` with `expo-platform: ios|android` header → the manifest JSON.
- `GET /` without → the branded landing page (placeholders `BASE_URL_PLACEHOLDER`, `EXPS_URL_PLACEHOLDER`, `APP_NAME_PLACEHOLDER`).
- Else → static files with MIME map + path-traversal guard.

### 6.3 EAS / OTA
- `eas.json` profiles: `development` (dev client + internal), `preview` (internal), `production`.
- `app.json` → `updates.url: https://u.expo.dev/com.rapidify.arsaas`, EAS projectId `91790adf-6d77-4396-b988-cfaaf3c72ddf`, owner `waa_ge`.
- `pnpm --filter @workspace/mobile run deploy:app` → `eas update --branch preview`.

### 6.4 Native AR builds
- Bundle IDs already set: iOS **`com.rapidify.arsaas`** (ARKit entitlement, `UIRequiredDeviceCapabilities: ["arkit","camera-flash"]`, camera/motion/photo permissions), Android **`com.rapidify.arsaas`** (CAMERA, RECORD_AUDIO, storage permissions; optional `android.hardware.camera.ar` ARCore feature).
- `android/` folder exists (prebuild output), plugins wired: `expo-router`, `expo-font`, `expo-web-browser`, `@reactvision/react-viro` (camera permission message), `expo-camera`.
- Experiments enabled: `typedRoutes`, `reactCompiler`.
- **Gap**: full native AR only works outside Expo Go (which blocks ARKit/ARCore binaries). Per the requirement docs, the next step is a native workspace (`npx expo prebuild --clean`, pod-install on macOS) — see section 9.

---

## 7. Data Model (observed via service layer + migration brief)

| Table | Role | Notes |
|---|---|---|
| `products` | catalog | 3 live rows; columns `id, name/title, description, merchant_id, category, checkout_url, thumbnail_color` (+ scan_count/views aliases) |
| `merchants` | merchant entities | `id, name, slug` (joined via `products.merchant_id`) |
| `assets` | 3D files | `id, product_id, file_url/glb_url/usdz_url, file_type (glb/usdz), platform (ios/android/all)` — **needs `GRANT SELECT` to anon** |
| `product_variants` | color variants | `id, product_id, name/label, color_hex/hex/color, base_color_r/g/b/a` — **needs `GRANT SELECT` to anon** |
| `analytics_events` | event log | write-confirmed: `event_type, product_id, merchant_slug, variant_id, platform, occurred_at` |
| `profiles` | auth roles | `id, email, full_name, role (merchant_owner/consumer), merchant_id, avatar_url, created_at` |
| `user_roles`, `processing_jobs` | reserved | not used by the app yet |

Supabase project: `tcujcbwkginjfqworinz.supabase.co`; REST `/rest/v1/`; edge function `/functions/v1/track-event`.

**Supabase SQL needed to fully unblock asset/variant reads:**
```sql
GRANT SELECT ON assets TO anon;
GRANT SELECT ON product_variants TO anon;
CREATE POLICY IF NOT EXISTS "public read assets" ON assets FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "public read variants" ON product_variants FOR SELECT USING (true);
```

---

## 8. Security & Compliance Notes

- No secrets in code: Supabase keys are injected via environment (`EXPO_PUBLIC_*` are public-by-design anon keys). `MIGRATION_BRIEF.md` is committed and contains no secrets.
- `pnpm-workspace.yaml` enforces `minimumReleaseAge: 1440` (supply-chain defense) — do **not** disable.
- Server logger redacts `authorization`/`cookie` headers.
- `serve.js` guards against path traversal; static scope locked to `static-build/`.
- Auth is *real* Supabase auth, but the demo merchant login predates a proper seeded account — the brief documents hardcoded demo credentials for testing.

---

## 9. Known Gaps, Gotchas & Next Steps

1. **Native AR must leave Expo Go**: ViroReact ARKit/ARCore needs a native build. Next steps per `MIGRATION_BRIEF.md`: native workspace → `pnpm add @reactvision/react-viro` → `npx expo prebuild --clean` → `npx pod-install` (iOS) → finalize `NativeARSession` wiring.
2. **Color tint not yet applied at runtime**: `selectedVariant.color`/`baseColorFactor` are passed inline but the `Viro3DObject` uses the static `productPBR` material; and `ARProductViewer` passes a hardcoded `TEST_GLB_URL` instead of `product.glbUrl`. Verify intent before relying on dynamic tinting per variant.
3. **Merchant dashboard is fully mocked** — metrics/queue data are constants; wiring to `analytics_events` + a processing-jobs API is the upcoming feature.
4. **DB grants**: `assets` / `product_variants` reads by the anon key require the GRANT statements from section 7, or every product silently falls back to seed GLBs/colors.
5. **Recently Viewed resolves IDs from the seed catalog only** — DB products viewed via QR/deep link won't appear in the row until it resolves against Supabase too.
6. **DB layer (Drizzle) is an empty scaffold** — `lib/db` throws unless `DATABASE_URL` is set, but the schema has no tables; the mobile app bypasses it entirely via Supabase JS.
7. **API server is health-only** (`/api/healthz`) — the OpenAPI codegen pipeline is ready; new endpoints must be added to `lib/api-spec/openapi.yaml` then regenerated (Orval).
8. `react-native-keyboard-controller`, `expo-glass-effect` (`isLiquidGlassAvailable()`), and `expo-symbols` are iOS-16+/latest-device-only features — the tab layout has a safe Classic fallback.
9. Web platforms degrade gracefully: scanner shows a black frame, tabs use classic styling — but the AR viewer on web relies on ViroReact's web support status.
10. `TrackEventPayload.platform` is set twice (payload default then `Platform.OS` override), and events fire-and-forget with no retry — acceptable for analytics, not for critical writes.

---

## 10. Git History (brief)

```
46f0431 AR enhancements: PBR materials, multi-touch gestures, dynamic lighting, MSAA, shadows, HDR environment
638a155 comit
32f1243 Bump @reactvision/react-viro version, clean build ready
1697dae Custom multi-touch gesture system via RN touch overlay (drag, pinch, twist)
4b25bde Remove incompatible expo-build-properties and expo-dev-client (SDK 54 compat)
8143c35 HD AR: PBR materials, multi-touch gestures, dynamic lighting, MSAA, shadows, HDR environment
3769e66 Add loading overlay to NativeARSession while 3D models download
475c92e Add expo-dev-client for live preview, fix versions
5450543 Integrate NativeARSession into ARProductViewer — replace CameraView with ViroReact AR scene
... (initial scaffold, EAS linking, config fixes)
```
The trajectory: Expo scaffold → QR/deep-link discovery app → ViroReact AR scene integration → multi-touch gesture system → PBR/lighting/MSAA quality pass.

---

## 11. Quick-Reference: Run Commands

| Task | Command |
|---|---|
| Install | `pnpm install` |
| Dev (mobile) | `pnpm --filter @workspace/mobile run dev` |
| Dev (API) | `pnpm --filter @workspace/api-server run dev` |
| Web/static build | `pnpm --filter @workspace/mobile run build` then `pnpm --filter @workspace/mobile run serve` |
| Typecheck all | `pnpm run typecheck` |
| Full build | `pnpm run build` |
| Regenerate API code | `pnpm --filter @workspace/api-spec run codegen` |
| Push DB schema | `pnpm --filter @workspace/db run push` |
| OTA update | `pnpm --filter @workspace/mobile run deploy:app` |
| Native Android | `pnpm --filter @workspace/mobile run android` |
| Native iOS | `pnpm --filter @workspace/mobile run ios` |

---

## 12. Platform Sync Audit & Implementation Log (Rapidify web ↔ mobile)

**Canonical backend:** `okoloionftfxyvscfvhh.supabase.co` (matches `artifacts/mobile/.env` and the
web platform's `.env`; same publishable key `sb_publishable_6DnT8yYOEAuZYnzo39XBCw_K9bq8S-A`).
Web repo (TanStack Start + Vite + Supabase) is the source of truth for the data contract.

### Verified web contract (from `ar-commerce-suite-new` migrations + server functions)

- `products`: `id, slug, title, description, price_cents, currency, thumbnail_url, image_url,
  model_glb_url, model_usdz_url, buy_url, status(enum draft|active|archived), merchant_id, business_id,
  external_sku, external_product_id`. Public read restricted to `status = 'active'` (or merchant member).
- `product_variants`: `name, color_hex, model_glb_url, model_usdz_url, thumbnail_url, sort_order`
  (public read when parent product is active). No `base_color_r/g/b/a`.
- `merchants`: `slug (unique), name, logo_url, brand_color (default #7c3aed), store_domain`, public read.
- `analytics_events`: `event_type, session_id, product_id, merchant_id, business_id, variant_id,
  metadata (jsonb), user_agent, created_at`. Public INSERT allowed (policy `WITH CHECK (true)`),
  reads restricted to merchant members. Web event names: `product_view, page_view, ar_widget_visible,
  ar_launch, ar_session_end, add_to_cart, purchase_completed, buy_click, qr_open, embed_open,
  variant_switch, session_start`. **There is no `merchant_slug` / `platform` / `occurred_at` column
  and no Supabase edge function — web tracks via a server fn that inserts directly.**
- Roles: `user_roles(app_role: admin|merchant)`, `merchant_members(merchant_id, user_id, role:
  owner|admin|member)`, helper `get_user_merchant_id(uuid)`. `profiles` has only
  `id, full_name, corporate_title` (no `role`, `merchant_id`, `avatar_url`, `email`).
- QR/deep-link contract: web QRs encode `https://<origin>/p/<slug>` (asset-meta resolver:
  `/api/public/asset-meta?sku|asin|external_sku|slug|merchant_slug`). Mobile scheme: `arcommerce://`.

### Changes applied (P0 + P1 scope)

| File | Change |
|---|---|
| `services/supabase.ts` | Rewritten types to real schema; `fetchProfile` derives role from `user_roles` + `merchant_members` + `get_user_merchant_id` RPC; profile fields aligned (`full_name`, `corporate_title`) |
| `services/productService.ts` | Rewritten: fetch by slug (primary, matches web QRs) or id; only `status='active'`; joins `merchants` + `product_variants` (sorted); `trackEvent` now writes `analytics_events` with web event names, `session_id`, `business_id`, `user_agent`, https-only URLs |
| `hooks/useProducts.ts` | Added `useProductBySlug`; query keys bumped to `v4` |
| `constants/products.ts` | `Product` extended with `merchantId, businessId, priceCents, currency, imageUrl` |
| `app/viewer.tsx` | Accepts `slug` param; events → `product_view`, `variant_switch`, `buy_click` with merchant/business ids |
| `components/ARProductViewer.tsx` | Removed hardcoded `TEST_GLB_URL`; uses `product.glbUrl`; "No AR model yet" state when a product has no model; Buy guarded to https URLs (alert otherwise) |
| `components/NativeARSession.tsx` | `isArSessionSupported()` guard (blocks Expo Go/web, which lack the Viro native runtime); materials init wrapped in try/catch; unsupported-runtime message UI |
| `context/AuthContext.tsx` | Role model widened to `admin / merchant_owner / merchant_admin / merchant_member / consumer`; passes email into profile fetch |
| `app/_layout.tsx`, `app/merchant/*` | Role gates now accept all `merchant_*` roles (web treats all members as workspace users) |
| `app/(tabs)/scanner.tsx` | Parses `/p/<slug>` QRs, `arcommerce://`/`mobile://` deep links, legacy `?product_id&merchant_slug`; emits `qr_open` |
| `context/RecentlyViewedContext.tsx` | Hydrates stored ids via Supabase (`fetchProductById`), drops dead seed-only ids |
| `app.json` | iOS `UIRequiredDeviceCapabilities` = `["arkit"]` (removed `camera-flash`, which made builds uninstallable on flash-less devices) |
| `.replit` | `userenv.shared` Supabase URL/anon key synced to canonical project |

### Verification

- `tsc -p artifacts/mobile/tsconfig.json --noEmit` — clean.
- `tsc -p artifacts/api-server/tsconfig.json --noEmit` — clean.
- `mockup-sandbox` has pre-existing type errors (`calendar.tsx`/`spinner.tsx`, duplicate `@types/react@19`
  + radix ref conflict) — untouched, unrelated to this work.
- Note: on Windows the root `preinstall` sh hook fails; run `tsc -p artifacts/mobile/tsconfig.json
  --noEmit` directly (after `tsc --build` at root for `lib/api-client-react` declarations).

### Backend / web needs (out of mobile scope)

1. Web: add `arcommerce://` deep-link links alongside `/p/:slug` QRs for true app-open UX.
2. `product_variants` carry their own model URLs — mobile still uses the product-level model; per-variant
   model swap is a follow-up.
3. Merchant dashboard (`app/merchant/dashboard.tsx`) metrics remain mock data — needs the web
   `analytics.functions.ts` dashboard queries ported (P2).
4. Web `.env` contains a real `SUPABASE_SERVICE_ROLE_KEY` + `RESEND_API_KEY` — rotate/scope them.
5. `mockup-sandbox` type errors + root `preinstall` sh hook block `pnpm run typecheck` on Windows.

---

*Generated from a full read-through of the repository: routes, components, contexts, hooks, services, libs, server, scripts, configs, and handoff docs (`MIGRATION_BRIEF.md`, `attached_assets/*`).*