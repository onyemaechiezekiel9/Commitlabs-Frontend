# Error Pages Documentation

This project includes comprehensive, user-friendly error pages for various error scenarios. All error pages follow the same design system with responsive layouts and clear call-to-action buttons.

## Available Error Pages

### 1. **404 Not Found Page** (`/not-found`)
- **File**: `src/app/not-found.tsx`
- **Styling**: `src/app/not-found.module.css`
- **Purpose**: Displayed when users navigate to a non-existent page
- **Features**:
  - Large "404" display
  - Search bar for site navigation
  - "Go Home" button
  - "Go Back" button to return to previous page
  - SVG error icon

**How it's triggered**:
- Next.js automatically shows this page for non-existent routes
- No additional configuration needed

---


### 2. **500 Server Error Page** (`/error`)
- **File**: `src/app/error.tsx`
- **Styling**: `src/app/error.module.css`
- **Purpose**: Displayed when server-side errors occur
- **Features**:
  - Large "500" display
  - Error message and details display
  - Error ID/digest for support
  - "Try Again" button (resets the component)
  - "Go Home" button
  - "Report Issue" link

# Error Pages Recovery Flows

This document is the source of truth for CommitLabs error surfaces in the App Router. It covers the visible UI, the user recovery path, and the behavior that the code currently implements so the docs can be checked against the actual components.

## Overview

| Surface | File | Route | Recovery focus |
| --- | --- | --- | --- |
| Generic app error boundary | `src/app/error.tsx` | App-level `error.tsx` boundary | Retry the segment, return home, report the issue |
| Not found page | `src/app/not-found.tsx` | App-level `not-found.tsx` boundary | Return home or go back |
| Network error page | `src/app/network-error/page.tsx` | `/network-error` | Probe connectivity, retry, or return home |
| Transaction error page | `src/app/transaction-error/page.tsx` | `/transaction-error` | Review state, retry, inspect explorer, or go to dashboard |

All four surfaces use the shared `ErrorLayout` and `ErrorButton` primitives from `src/components/` so the spacing, button styling, and overall framing stay consistent.

## 1. `error.tsx` Generic Error Page

### Purpose and triggers

`src/app/error.tsx` is the app-level error boundary UI. Next.js shows it when a server or client render error escapes the current route segment. In development, the Next.js overlay can still take precedence for compile-time/runtime debugging, but this file is the production recovery surface.

### UI copy and layout

- Large `500` code block
- Title: `Something Went Wrong`
- Body copy: `We're experiencing technical difficulties. Our team has been notified and is working to fix the issue.`
- Optional error details area that shows `error.message` and `error.digest`
- Three actions in order: `Try Again`, `Go Home`, `Report Issue`

Pseudo-screenshot:

```text
┌──────────────────────────────────┐
│ 500                              │
│ Something Went Wrong             │
│ We're experiencing technical...   │
│ Error ID: digest-if-present       │
│ [Try Again] [Go Home] [Report...] │
└──────────────────────────────────┘
```

### Recovery flow

- `Try Again` calls the App Router `reset()` callback so the segment can re-render.
- `Go Home` sends the user to `/`.
- `Report Issue` opens the Stellar contact page in a new tab.

### Behavior notes

- If `error.digest` exists, it is surfaced as an error ID for support triage.
- The page is intentionally generic and does not attempt to infer a route-specific recovery path.

## 2. `not-found.tsx` 404 Page

### When it is triggered

`src/app/not-found.tsx` renders when Next.js resolves a route to 404. It is the fallback for nonexistent pages and moved content.

### UI copy and behavior

- Large `404` code block
- Title: `Page Not Found`
- Body copy: `The page you're looking for doesn't exist or has been moved.`
- Search input with placeholder `Search the site...`
- Actions: `Go Home` and `Go Back`

Pseudo-screenshot:

```text
┌─────────────────────────────────┐
│ 404                             │
│ Page Not Found                  │
│ The page you're looking for...  │
│ [Search the site...]            │
│ [Go Home] [Go Back]             │
└─────────────────────────────────┘
```

### Recovery navigation

- `Go Home` routes to `/`.
- `Go Back` calls `router.back()`.
- The search input currently logs the query on Enter; it does not submit to a real search endpoint yet.

## 3. `network-error` Network Error Page

### When it displays

`src/app/network-error/page.tsx` is a manual recovery page, not an automatic Next.js boundary. The app can navigate here when a fetch or connectivity check fails and the UX wants to give the user an explicit retry path.

### UI copy and layout

- Large connection-themed icon
- Title: `Connection Error`
- Body copy: `Unable to connect to the network. Please check your internet connection and try again.`
- Troubleshooting checklist:
  - Check internet access
  - Disable VPN or proxy
  - Restart the router or mobile connection
  - Check whether other sites load
  - Clear browser cache and cookies
- Status line that switches between `No internet connection detected` and `Checking connection...`
- Actions: `Retry` and `Go Home`

Pseudo-screenshot:

```text
┌────────────────────────────────────┐
│ Connection Error                   │
│ Unable to connect to the network.  │
│ What you can do:                   │
│ • Check your connection            │
│ • Disable VPN/proxy                │
│ ...                                │
│ Status: Checking connection...     │
│ [Retry] [Go Home]                  │
└────────────────────────────────────┘
```

### Retry mechanism and countdown behavior

- `Retry` performs a `HEAD` request against `/`.
- While the check is in flight, the button label changes to `Retrying...` and the status line changes to `Checking connection...`.
- If the probe succeeds, the page reloads.
- If the probe fails, the retry state is cleared and the page stays put.
- There is no countdown timer in the current implementation; the recovery feedback is the live retry state text.

### Recovery CTAs

- `Retry` is the primary recovery action.
- `Go Home` sends the user back to `/` if they prefer to exit the recovery surface.

## 4. `transaction-error` Transaction Error Handler

### Route-level behavior

`src/app/transaction-error/page.tsx` is a sharable route for transaction-specific recovery. It reads `category`, `code`, `message`, and `hash` from the query string and then chooses the appropriate recovery copy.

### Category selection rules

- `category=rejected` renders the rejection flow.
- `category=timed-out` renders the timeout flow.
- `category=failed` renders the failure flow.
- If `category` is missing, the page falls back to `code` mapping, then to `failed`.

### Route-level recovery copy and CTAs

| Category | Title | Primary recovery | Secondary recovery |
| --- | --- | --- | --- |
| `rejected` | `Transaction Rejected` | `Try Again` | `Go to Dashboard` |
| `timed-out` | `Transaction Status Unknown` | `Try Again` plus explorer check when a hash exists | `Go to Dashboard` |
| `failed` | `Transaction Failed` | `Try Again` | `Go to Dashboard` |

When a hash is present:

- `timed-out` shows `Check Explorer`.
- `failed` and `rejected` show `View on Explorer` when an explorer URL can be built.
- The page also shows a copy button for the transaction hash.

Pseudo-screenshot:

```text
┌────────────────────────────────────────────┐
│ Rejected / Timed out / Failed             │
│ Title and recovery summary                │
│ Transaction Hash: ... [Copy]              │
│ Error Code: ...                           │
│ [Try Again] [Go to Dashboard] [Explorer]  │
└────────────────────────────────────────────┘
```

### Error category to CTA mapping used by the transaction progress modal

The transaction flow also uses `src/app/TransactionProgressModal.tsx` for in-progress transaction outcomes. This is the richer category-to-CTA map that should stay in sync with the docs.

| Error code | Lead copy | Primary CTA | Secondary CTA | Recovery behavior |
| --- | --- | --- | --- | --- |
| `USER_REJECTED` | `Signature Canceled` | `Try Again` | `Close` | Calls the retry handler; no funds are moved |
| `INSUFFICIENT_BALANCE` | `Insufficient Balance` | `Fund Wallet` | `Close` | Currently closes the modal; intended for wallet-funding recovery |
| `NETWORK_CONGESTION` | `Network is Busy` | `Try Again` | `Close` | Calls the retry handler after a short wait |
| `RPC_TIMEOUT` | `Status Unknown (Timeout)` | `Check Explorer ↗` | `Close` | Opens the explorer when a hash exists, then avoids duplicate submission |
| `SLIPPAGE_EXCEEDED` | `Price Changed` | `Update Price` | `Cancel` | Returns to the price-edit flow |
| `CONTRACT_REVERTED` | `Contract Execution Failed` | `View Details` | `Close` | Surfaces the failure context for review |
| `UNKNOWN_ERROR` | `Unexpected Error` | `Try Again` | `Contact Support` | Default fallback when no specific mapping exists |

### UX flow by category

- Rejected errors ask the user to confirm the wallet prompt or review the changed parameters before retrying.
- Timeout errors bias toward explorer inspection first, because the transaction may still settle on-chain.
- Execution failures keep the retry path available, but the copy encourages checking the chain error first.
- Wallet and support-oriented actions are explicit in the modal, while the route-level page keeps the dashboard and explorer paths visible.

## Shared components

### `ErrorLayout` (`src/components/ErrorLayout.tsx`)

Provides the outer container that centers error content and keeps the error pages visually consistent.

### `ErrorButton` (`src/components/ErrorButton.tsx`)

Renders an internal link, external link, or button depending on props. The error pages use it for all recovery CTAs so labels stay easy to audit.

## Environment-specific behavior

- Development can show the Next.js overlay before `error.tsx` for build and runtime diagnostics.
- Production uses the documented error surfaces directly.
- The network error page is manual and only appears when the app navigates there.
- The transaction error route is query-string driven and is safe to link to from async flows or support docs.

## Example usage

### Navigate to the network error page

```tsx
import { useRouter } from 'next/navigation'

export default function MyComponent() {
  const router = useRouter()

  const fetchData = async () => {
    try {
      const response = await fetch('/api/data')
      if (!response.ok) throw new Error('Failed to fetch')
    } catch {
      router.push('/network-error')
    }
  }

  return <button onClick={fetchData}>Load Data</button>
}
```

### Navigate to the transaction error page

```tsx
router.push(
  `/transaction-error?message=${encodeURIComponent('Transaction failed')}&hash=${txHash}&code=${errorCode}`,
)
```

## Drift-guard expectation

If a new error surface is added under `src/app`, update this document at the same time. The drift-guard test compares the documented surfaces against the actual route files so that new error pages do not silently bypass review.

## File Structure

```
src/
├── app/
│   ├── error.tsx                          # 500 error page
│   ├── error.module.css
│   ├── not-found.tsx                      # 404 error page
│   ├── not-found.module.css
│   ├── network-error/
│   │   ├── page.tsx
│   │   └── page.module.css
│   └── transaction-error/
│       ├── page.tsx
│       └── page.module.css
└── components/
    ├── ErrorLayout.tsx                    # Shared layout component
    ├── ErrorLayout.module.css
    ├── ErrorButton.tsx                    # Shared button component
    └── ErrorButton.module.css
```

---

## Notes

- All error pages are client-side compatible (using `'use client'`)
- Error pages are fully responsive and mobile-friendly
- SVG icons are inline for better performance
- Animation uses CSS for smooth 60fps performance
- All buttons have proper hover and active states
