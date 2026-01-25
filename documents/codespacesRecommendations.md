# Codespaces Authentication Recommendations

Lessons learned from developing with OAuth authentication in GitHub Codespaces.

## The Problem

OAuth redirects break in Codespaces because:
- The `x-forwarded-host` header includes port info (e.g., `workspace-abc.github.dev:443`)
- Naively building URLs causes duplicate ports or malformed redirect URLs
- OAuth callbacks fail when redirect URLs don't match configured values

## Solution Patterns

### 1. Server-Side: Strip Port from Host

In auth callback routes, always strip the port:

```typescript
import { headers } from 'next/headers'

const headersList = await headers()
const rawHost = headersList.get('x-forwarded-host')
  || headersList.get('host')
  || requestUrl.host

const host = rawHost.split(':')[0]  // Remove port
const protocol = headersList.get('x-forwarded-proto') || 'https'

return NextResponse.redirect(`${protocol}://${host}/dashboard`)
```

### 2. Client-Side: Use window.location.origin

For OAuth redirects on the client, never hardcode localhost:

```typescript
await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/auth/callback`
  }
})
```

### 3. Reusable Utility

```typescript
// lib/utils/url.ts
import { headers } from 'next/headers'

export async function getServerBaseUrl(fallbackUrl?: URL): Promise<string> {
  const headersList = await headers()
  const rawHost = headersList.get('x-forwarded-host')
    || headersList.get('host')
    || fallbackUrl?.host
    || 'localhost:3000'

  const host = rawHost.split(':')[0]
  const protocol = headersList.get('x-forwarded-proto') || 'http'

  return `${protocol}://${host}`
}

export function getClientBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
}
```

## Supabase Configuration

In Supabase Dashboard → Authentication → URL Configuration, add:

| Environment | Redirect URL |
|-------------|--------------|
| Local | `http://localhost:3000/auth/callback` |
| Codespaces | `https://*.github.dev/auth/callback` |
| Production | `https://yourdomain.com/auth/callback` |

Supabase supports wildcards - use `*.github.dev` for Codespaces.

## Debugging Checklist

When auth breaks in Codespaces:

1. **Check redirect URL** in browser network tab - look for duplicate ports or `localhost`
2. **Log headers** in callback route to see what Codespaces is sending
3. **Verify Supabase redirect URLs** include your Codespaces domain or wildcard
4. **Check port visibility** - Codespaces ports must be public for OAuth callbacks

## Quick Reference

| Scenario | Solution |
|----------|----------|
| Server redirects | Use `x-forwarded-*` headers + strip port |
| Client OAuth | Use `window.location.origin` |
| Supabase config | Add `*.github.dev` wildcard |
| Port visibility | Set to public/unlisted |
