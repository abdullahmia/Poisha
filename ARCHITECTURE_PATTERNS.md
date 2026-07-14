# Architecture Patterns

Extracted from this codebase for reuse when restructuring another React Native / Expo project.
Each section shows: file naming rule, the actual shape used here, and a copy-paste template.

---

## 1. Component Layer (`lib/components/<feature>/`)

**File name:** `<feature>.component.tsx` for the screen-level component, `<sub-part>.component.tsx` for a piece it's broken into (e.g. `feature-card.component.tsx`, `settings-row.component.tsx`). One folder per feature/domain, matching the route group it backs (`auth`, `home`, `settings`, `profile`, `providers`).

**Rules observed:**
- `app/**/*.tsx` route files are *thin* — they just import and render the matching `lib/components/<feature>/<name>.component.tsx`. No logic lives in `app/`.
- Component is a named export (`export const Home: React.FC = () => ...`), never `export default`. Route files do the `export default`.
- Type the component with `React.FC` (no props) or `React.FC<Props>`. Import React only as `import type React from 'react'` — no runtime React import needed with the new JSX transform.
- Props type is declared right above the component as `type <Name>Props = { ... }`, not exported unless another file needs it.
- Data fetching/mutation hooks are called at the top of the component (`useCurrentUser()`, `useSignIn()`), never wrapped in extra local state unless it's pure UI state (modal visibility, focus, etc).
- Screens that need translations call `useTranslation('<namespace>')` matching the feature's i18n namespace; a second namespace is pulled with an alias (`const { t: tc } = useTranslation('common')`).
- Styling is 100% via NativeWind `className`, no `StyleSheet.create` except for things `className` can't express (e.g. shadows/elevation in `app/_layout.tsx`).
- Composition: parent screen component imports and arranges child `*.component.tsx` files from the same feature folder (`Settings` composes `SettingsSection` + `SettingsRow`); cross-feature reuse is done via relative import to the other feature folder (`Profile` reuses `settings/settings-row.component.tsx`) rather than promoting shared bits to `lib/ui`.
- Forms: build with `react-hook-form`'s `useForm<TFormData>({ resolver: zodResolver(schema) })`, pass `form.control` down into `Input`/`Checkbox`/`OtpInput` from `lib/ui`, submit via `form.handleSubmit(onSubmit)`.

**Template:**
```tsx
import type React from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from '@/lib/hooks';

type WidgetProps = {
    title: string;
    onPress?: () => void;
};

export const Widget: React.FC<WidgetProps> = ({ title, onPress }) => {
    const { t } = useTranslation('widget');

    return (
        <View className="rounded-card bg-white p-4">
            <Text className="text-body-m text-base-black-100">{title}</Text>
        </View>
    );
};
```

---

## 2. Types (`lib/types/`)

**File name:** `<domain>.types.ts` (`auth.types.ts`, `user.types.ts`, `api.types.ts`). Barrel `index.ts`.

**Rules observed:**
- Object/entity shapes are prefixed `T` (`TUser`, `TSignInResponse`, `TRefreshTokenResponse`, `TOtpVerificationResponse`) — read as "Type X". This is the dominant convention; **use it consistently** (the codebase itself briefly slips into un-prefixed names like `SignUpResponseData` and `ApiResponse` — treat `T`-prefix as the rule going forward, not those exceptions).
- Discriminated unions for API error payloads (`ApiErrorData`) are keyed by a `code` literal field, matched against an `ApiErrorCode` string-literal union — extend both together when the backend adds an error code.
- Generic API envelope (`ApiResponse<T>`) and error envelope (`TErrorResponse`) live in `api.types.ts` since every domain response is wrapped in them.
- Domain response types (e.g. `TSignInResponse`) live in that domain's file (`auth.types.ts`) and import `TUser`/`ApiResponse` from the other type files rather than redefining shape.
- Module augmentation for third-party libraries (i18next resource typing, TanStack Query's default error type) lives beside the config it augments (`i18n.types.ts`, re-exported through `types/index.ts` via a side-effect import; `query-client.config.ts` does its own inline `declare module`). Don't scatter `declare module` blocks — one per concern, colocated with what it types.
- `lib/types/index.ts` barrel: plain `export * from './api.types'` plus a side-effect `import './i18n.types'` for augmentation-only files (they have no runtime exports, just ambient types).
- Form-data types are **not** kept here — they live next to their Zod schema in `lib/schemas/*.schemas.ts` as `z.infer<typeof schema>`, imported directly from the schema file by services/components (`import type { SignInFormData } from '@/lib/schemas/auth.schemas'`).

**Template:**
```ts
// lib/types/order.types.ts
import type { ApiResponse } from './api.types';

export type TOrder = {
    id: string;
    status: 'pending' | 'paid' | 'cancelled';
    total: number;
};

export type TOrderListResponse = ApiResponse<TOrder[]>;
```

---

## 3. Hooks (`lib/hooks/`)

**File name:** `use-<thing>.hook.ts`. Flat folder, no sub-folders. Barrel `index.ts` re-exports every hook (and any type the hook itself owns, e.g. `SupportedLanguage` from `use-language.hook.ts`).

**Rules observed:**
- These are **cross-cutting app hooks** (auth status, theme, language, translation namespace helper) — not data-fetching hooks. Data fetching hooks live in `lib/services/`, not here. Keep that split: `hooks/` = device/app state, `services/` = server state.
- Each hook returns a plain object literal (`{ isAuthenticated, isLoading }`, `{ isDark, colorScheme, toggleTheme, setTheme }`), never a class or a tuple (except where wrapping a library that already returns a tuple-like convention).
- A hook that owns a small enum-like union type (`SupportedLanguage = 'en' | 'ar' | 'bn' | 'es'`) declares and exports it from its own file, not from `lib/types/`, because the type only makes sense paired with the hook's logic. The barrel re-exports the type with `export type { X } from './x.hook'` (separate from the value export line).
- Thin wrapper hooks around a library (`use-translation.hook.ts` around `react-i18next`) exist purely to pin defaults (default namespace) — keep these one-liners rather than inlining the default across every call site.

**Template:**
```ts
// lib/hooks/use-network.hook.ts
import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

export const useNetwork = () => {
    const [isConnected, setIsConnected] = useState(true);

    useEffect(() => {
        return NetInfo.addEventListener((state) => setIsConnected(!!state.isConnected));
    }, []);

    return { isConnected };
};
```
```ts
// lib/hooks/index.ts
export { useNetwork } from './use-network.hook';
```

---

## 4. Config (`lib/config/`)

**File name:** `<concern>.config.ts`. Barrel `index.ts` with `export *` for every file.

**Rules observed:**
- `env.config.ts`: validate `process.env.EXPO_PUBLIC_*` with a Zod schema **at module load time**, `throw` synchronously with a formatted, readable error if invalid, then re-export a camelCased, narrow `env` object (`{ apiUrl }`) — nothing downstream ever touches `process.env` directly.
- `error.config.ts`: one custom `Error` subclass per cross-cutting error type (`ApiError`) exposing typed getters (`code`, `errorData`) derived from a raw `body` field, instead of scattering `error.body.data.code` narrowing at call sites.
- `api.config.ts`: a single class instantiated once and exported as a lowercase singleton (`export const api = new Api(env.apiUrl)`), with `get/post/put/delete` thin wrappers around one shared `request()` that centralizes header injection, the 401-refresh-and-retry dance, and response envelope unwrapping. New cross-cutting request behavior (logging, retry, additional headers) goes into that one `request()` method, not into individual call sites.
- `query-client.config.ts`: a single `QueryClient` singleton with app-wide defaults (`staleTime`, `gcTime`, `retry` policy that skips 4xx, `networkMode`) plus a `declare module '@tanstack/react-query' { interface Register { defaultError: ApiError } }` so every `useQuery`/`useMutation` call site gets a typed `error` without importing `ApiError` everywhere.
- Config files depend on each other (`api.config.ts` imports `env.config.ts` and `error.config.ts`) but nothing outside `lib/config/` should import a specific config file directly — always go through the `lib/config` barrel.

**Template:**
```ts
// lib/config/analytics.config.ts
import { env } from './env.config';

class Analytics {
    track(event: string, props?: Record<string, unknown>) {
        // ...
    }
}

export const analytics = new Analytics();
```

---

## 5. Constants (`lib/constants/`)

**File name:** `<domain>.constants.ts`. Barrel `index.ts` with `export *` for every file (note: this project's file is literally named `query-keys.contants.ts` — a typo; don't propagate that typo in a new project).

**Rules observed:**
- All-caps `SCREAMING_SNAKE` for the exported const name (`ENDPOINTS`, `AUTH_STORAGE_KEYS`, `QUERY_KEYS`, `FEATURES`, `STACK_BADGES`, `LANGUAGES`), holding a plain nested object/array literal — never a function, never computed at runtime.
- `endpoints.constants.ts`: nested object mirroring the backend's resource grouping (`ENDPOINTS.auth.signIn`, `ENDPOINTS.users.me`), used as the sole source of URL paths passed into `api.get/post/...`.
- `query-keys.contants.ts`: nested object mirroring the same domain grouping, values are key **arrays** (`QUERY_KEYS.users.me = ['user', 'me']`) for TanStack Query's array-key convention. Extend this object — don't inline `['user', 'me']` at call sites.
- `*.constants.ts` for static content or config-like data (e.g. `FEATURES`, `LANGUAGES`) uses `as const` on every literal field it needs to narrow (icon names, keys used for i18n lookups) so consumers get literal types instead of `string`.
- A constants file may import a type from `lib/hooks` when the constant is tightly coupled to that hook (`LANGUAGES` typed against `SupportedLanguage` from `use-language.hook.ts`) — cross-layer imports like this are fine when the coupling is real, don't force an artificial type re-declaration to avoid it.
- Storage keys (`AUTH_STORAGE_KEYS`) live here, not in `lib/storages/`, so both the storage wrapper and any consumer share the same literal key strings.

**Template:**
```ts
// lib/constants/orders.constants.ts
export const ORDER_STATUS_LABELS = {
    pending: 'Pending',
    paid: 'Paid',
    cancelled: 'Cancelled',
} as const;
```

---

## 6. UI (`lib/ui/`)

**File name:** `<primitive>.ui.tsx`. Flat folder (no sub-folders), barrel `index.ts` with `export *` for every file. These are **dumb, reusable, feature-agnostic** primitives — no `useTranslation`, no service imports, no navigation.

**Rules observed:**
- Variant-driven primitives (`Button`) use `class-variance-authority` (`cva`) to define a `<x>Variants` function per style axis (base container variants + a separate `labelVariants` when text needs different classes than the container), combine `variant`/`size`/`fullWidth`/`disabled` axes, and use `compoundVariants` for cases like "disabled + solid needs different classes than disabled + outline". Props type is `VariantProps<typeof xVariants> & { ...non-style props }`. Apply the computed class with `clsx(xVariants({ ... }))`, never string concatenation for variant classes.
- Form-bound primitives (`Input`, `Checkbox`, `OtpInput`) are **generic over the form** — `<T extends FieldValues>`, props include `control: Control<T>`, `name: Path<T>`, optional `rules?: RegisterOptions<T, Path<T>>`. Internally wrap in RHF's `<Controller control={control} name={name} render={({ field, fieldState: { error } }) => ...} />`. Return type is annotated `React.ReactElement` (not `React.FC`) because generic components can't use `React.FC`. Error display is always the same shape: `{error?.message && <Text className="text-body-s text-error">{error.message}</Text>}` directly under the field.
- Non-form primitives with simple controlled value/callback props (`Toggle`) use a plain non-generic `type XProps = { value; onValueChange; disabled? }` and `React.FC<XProps>`.
- Overlay primitives (`BottomSheet`) wrap a third-party lib, exposing a minimal `isOpen`/`onClose` boolean-controlled API instead of leaking the library's own ref/index API to callers; internally translate `isOpen` to the library's imperative `snapToIndex`/`close` via a `ref` + `useEffect`.
- Every UI primitive accepts sane defaults via destructuring defaults in the function signature (`size = 'lg'`, `disabled = false`), not `defaultProps`.
- Hardcoded hex colors (`#2752E7`, `#E53935`) appear directly in components that need a color prop for a third-party component that doesn't accept a className (e.g. `Ionicons color`, `ActivityIndicator color`) — these should mirror the Tailwind theme's actual token values so they stay in sync if the design system changes.

**Template:**
```tsx
// lib/ui/badge.ui.tsx
import { cva, type VariantProps } from 'class-variance-authority';
import { clsx } from 'clsx';
import type React from 'react';
import { Text, View } from 'react-native';

const badgeVariants = cva('rounded-pill px-3 py-1', {
    variants: {
        tone: { neutral: 'bg-base-20', success: 'bg-success-20', error: 'bg-error-20' },
    },
    defaultVariants: { tone: 'neutral' },
});

type BadgeProps = VariantProps<typeof badgeVariants> & { label: string };

export const Badge: React.FC<BadgeProps> = ({ label, tone = 'neutral' }) => (
    <View className={clsx(badgeVariants({ tone }))}>
        <Text className="text-body-s-md">{label}</Text>
    </View>
);
```

---

## 7. Services (`lib/services/<domain>/`)

**File name:** `use-<action>.service.ts` — **one TanStack Query hook per file**, not a shared service class/object. Folder per domain (`auth/`, `users/`), each with its own barrel `index.ts` (`export * from './use-x.service'` per file); domains do **not** share one root barrel — components import `from '@/lib/services/auth'` / `from '@/lib/services/users'` directly.

**Rules observed:**
- Mutations: `useMutation({ mutationFn: async (payload) => api.post<TResponse>(ENDPOINTS.domain.action, payload), onSuccess, onError })`. `mutationFn` always calls through the shared `api` singleton and the shared `ENDPOINTS` constant — never a raw `fetch`.
- Queries: `useQuery({ queryKey: QUERY_KEYS.domain.thing, queryFn: async () => { const { data } = await api.get<T>(ENDPOINTS.domain.thing); return data; } })` — unwrap the `ApiResponse` envelope inside `queryFn` so components consume the bare domain type.
- Side effects belong in `onSuccess`/`onError`, not the component: writing tokens/user to storage, `router.replace`/`router.push` navigation, and `showMessage` toasts all happen inside the hook. Components just call `mutateAsync` and read `isPending`.
- Error toasts are always `showMessage({ message: error.message, type: 'danger' })`; success toasts `showMessage({ message: <response.message from backend>, type: 'success' })` — reuse the backend's own `message` field rather than hardcoding UI copy when one is available in the response envelope.
- Optional caller-supplied callbacks: when a hook needs to let the caller hook into success/error without overriding the hook's own side effects, accept `options?: MutationOptions<TData, TVariables>` (from `lib/types/api.types.ts`) and invoke `options?.onSuccess?.(...)`/`options?.onError?.(...)` **after** the hook's own handling — see `use-otp-verification.service.ts`. Apply this pattern whenever a screen needs to react to the same mutation differently in different flows; don't apply it to every hook by default (most hooks here don't need it).
- A hook with nothing to do yet from a service (e.g. because the flow is unimplemented) is still stubbed as `export const useX = () => {};` so the barrel and import sites compile — replace the body when the endpoint/flow is built, don't delete the stub.
- Domain services import `ENDPOINTS`/types via `@/lib/constants`, `@/lib/schemas/<domain>.schemas`, `@/lib/types` — always the absolute `@/` alias, never relative paths across `lib/` boundaries.

**Template:**
```ts
// lib/services/orders/use-cancel-order.service.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { showMessage } from 'react-native-flash-message';
import { api } from '@/lib/config';
import { ENDPOINTS, QUERY_KEYS } from '@/lib/constants';
import type { ApiResponse } from '@/lib/types';

export const useCancelOrder = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (orderId: string) =>
            api.post<ApiResponse>(ENDPOINTS.orders.cancel(orderId), {}),
        onSuccess: (response) => {
            showMessage({ message: response.message, type: 'success' });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orders.list });
        },
        onError: (error) => {
            showMessage({ message: error.message, type: 'danger' });
        },
    });
};
```

---

## 8. Storages (`lib/storages/`)

**File name:** `<backend>.storage.ts` (`secure.storage.ts`, `async.storage.ts`). Barrel `index.ts` with `export *` for both.

**Rules observed:**
- One tiny class per storage backend, wrapping the underlying library 1:1 (`setItem`/`getItem`/`removeItem`, plus whatever else the backend supports — `AsyncStorage` also exposes `clear`/`getAllKeys` since the underlying lib supports them cheaply; `SecureStorage` doesn't bother since it's only ever used for two token keys).
- Each class is instantiated exactly once and exported as a lowercase singleton (`export const secureStorage = new SecureStorage()`, `export const storage = new AsyncStorage()`) — call sites never `new` these themselves.
- No key namespacing/prefixing logic inside the storage class itself — that's the caller's job via `AUTH_STORAGE_KEYS` from `lib/constants`. The storage class stays a dumb key-value pass-through so it's trivially swappable (e.g. mocking in tests, or swapping AsyncStorage for MMKV later) without touching call sites.
- Choice of backend is by sensitivity: tokens → `secureStorage` (Expo SecureStore, encrypted), everything else cacheable-but-not-secret (e.g. the last-known user object for optimistic UI) → `storage` (AsyncStorage). Don't put tokens in AsyncStorage or bulk data in SecureStore (it's slow and size-limited).

**Template:**
```ts
// lib/storages/mmkv.storage.ts
import { MMKV } from 'react-native-mmkv';

const mmkv = new MMKV();

export class MmkvStorage {
    setItem(key: string, value: string): void {
        mmkv.set(key, value);
    }
    getItem(key: string): string | null {
        return mmkv.getString(key) ?? null;
    }
    removeItem(key: string): void {
        mmkv.delete(key);
    }
}

export const fastStorage = new MmkvStorage();
```

---

## Cross-cutting rules (apply to all layers)

- **Barrel-first imports**: every `lib/<layer>/` folder has an `index.ts`; import from the folder, not the file, unless the file is intentionally not barrel-exported (e.g. a hook a constants file needs, imported directly to avoid a circular barrel import).
- **Absolute imports across layers** (`@/lib/...`), **relative imports within a feature folder** (`./feature-card.component`) — this is the actual split used throughout, not "always absolute" or "always relative".
- **Suffix = role, always.** `.component.tsx`, `.ui.tsx`, `.hook.ts`, `.service.ts`, `.schemas.ts`, `.constants.ts`, `.types.ts`, `.config.ts`, `.storage.ts`. This is what makes the codebase navigable without a deep folder tree — preserve it exactly when porting to a new project.
- **No default exports** anywhere in `lib/` — only route files under `app/` use `export default` (Expo Router requires it there).
- Formatting/linting is Biome, not ESLint/Prettier: single quotes, semicolons, 4-space indent, 100-char lines, import auto-organize on save — configure the new project's `biome.json` identically if you want zero-diff porting of these files.
