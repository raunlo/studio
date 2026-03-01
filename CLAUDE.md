# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**NestedCheck** - A nested checklist application built with Next.js 15, Firebase, and a Go backend. The app allows users to create checklists with nested sub-items, track completion, and sync in real-time via Server-Sent Events (SSE).

## Development Commands

### Essential Commands

```bash
npm run dev              # Start development server on port 9002 with Turbopack
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint
npm run typecheck        # Run TypeScript type checking (no emit)
npm run generate:api     # Generate API client from OpenAPI spec using Orval
```

### Environment Setup

Copy `.env.local.example` to `.env.local` and configure:

- Firebase config (NEXT*PUBLIC_FIREBASE*\*)
- Google OAuth (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET)
- JWT_SECRET for token generation
- NEXTAUTH_URL for OAuth callbacks
- PRIVATE_API_BASE_URL for backend proxy (required for production)

## Architecture

### Frontend Structure

- **Next.js 15 App Router** with React Server Components
- **Authentication**: Google OAuth with JWT tokens stored in httpOnly cookies
- **State Management**: SWR for data fetching and caching
- **Real-time Updates**: Server-Sent Events (SSE) for checklist item changes
- **i18n**: Supports English (en), Estonian (et), and Spanish (es)
- **UI Components**: Radix UI + Tailwind CSS + shadcn/ui patterns
- **Drag & Drop**: @hello-pangea/dnd for reordering checklist items

### API Architecture

#### Client-Side API Calls

- **Generated Client**: API client code is auto-generated from `openapi/api_v1.yaml` using Orval
- **Location**: `src/api/` (generated, do not edit manually)
- **Custom Instance**: Uses `src/lib/axios.ts` for custom Axios instance with auth
- **SWR Integration**: All API hooks use SWR for caching and revalidation

#### Backend Communication Patterns

1. **Direct Backend Calls** (from browser):
   - Uses `src/lib/axios.ts` custom Axios instance
   - Sends requests to `NEXT_PUBLIC_API_BASE_URL` (checklist-app-go service)
   - Includes httpOnly cookies automatically (`withCredentials: true`)
   - Token refresh happens in interceptors
   - Client ID header (`X-Client-Id`) added for request tracking

2. **Proxy API Routes** (from Next.js server):
   - `/api/proxy/[...path]` - Proxies requests to Go backend with GCP authentication
   - Used when server-side authentication is needed
   - Rewrites all `/api/*` requests to `/api/proxy/*` (see `next.config.ts`)

3. **Auth API Routes**:
   - `/api/auth/google` - Initiates Google OAuth flow
   - `/api/auth/callback/google` - Handles OAuth callback
   - `/api/auth/refresh` - Refreshes JWT token from httpOnly refresh_token cookie
   - `/api/auth/logout` - Clears auth cookies
   - `/api/auth/session` - Gets current session info

### Authentication Flow

1. User clicks "Sign in with Google" → redirects to `/api/auth/google`
2. Google OAuth flow → callback to `/api/auth/callback/google`
3. Backend validates Google token, creates user if new
4. JWT tokens (user_token, refresh_token) set as httpOnly cookies (Lax, Secure)
5. Frontend reads user_token for client info (not for Authorization header)
6. Axios interceptor checks token expiration, auto-refreshes via `/api/auth/refresh`
7. On 401 responses, retry once after refresh, else redirect to `/?error=session_expired`

### Key Files

**Authentication & Security**:

- `src/lib/jwt.ts` - JWT generation and verification (HS256, 24h expiry)
- `src/lib/axios.ts` - Axios instance with token refresh, client ID generation, logout guards
- `src/app/api/auth/*/route.ts` - OAuth and token management routes

**State Management**:

- `src/hooks/use-checklist.ts` - Main checklist hook with SWR + SSE updates
- `src/hooks/use-checklist-item-updates.ts` - SSE connection for real-time updates

**Components**:

- `src/components/checklist-manager.tsx` - Top-level checklist container with drag-drop
- `src/components/checklist-card.tsx` - Individual checklist with items
- `src/components/checklist-item.tsx` - Nested checklist items with sub-rows
- `src/components/ui/*` - Reusable shadcn/ui components

**API Integration**:

- `src/api/` - Generated API client (run `npm run generate:api` to regenerate)
- `src/lib/axios.ts` - Custom Axios mutator for Orval-generated hooks
- `orval.config.js` - Orval configuration for API generation

### Real-Time Updates (SSE)

- SSE endpoint: `GET /api/events/sse` with `?checklistId=N` param
- Events: `checklistItemAdded`, `checklistItemReordered`, `checklistItemRowAdded`, `checklistItemRowDeleted`
- Deduplication: Uses `recentlyAddedItemsRef` and `recentlyReorderedItemsRef` to prevent echo
- Auto-reconnect on disconnect with exponential backoff
- SWR cache is mutated optimistically + revalidated on SSE events

### Styling Guidelines

- **Primary color**: Calming blue (#64B5F6)
- **Background**: Light gray (#F0F4F8)
- **Accent**: Gentle green (#81C784) for completed tasks
- **Font**: Inter (sans-serif)
- Use outline-style icons, clear visual hierarchy with indentation
- Subtle animations for collapse/expand

## Important Notes

### TypeScript Configuration

- Build and linting currently ignore errors (`ignoreBuildErrors: true`, `ignoreDuringBuilds: true`)
- Run `npm run typecheck` to see actual type errors before committing

### Security

- JWT_SECRET must be set in production (used for HS256 signing)
- Tokens stored as httpOnly cookies (not localStorage) to prevent XSS
- Google OAuth requires GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, NEXTAUTH_URL
- Recent security updates resolved 27+ critical vulnerabilities (see SECURITY_REVIEW.md)

### API Generation

- Always run `npm run generate:api` after updating `openapi/api_v1.yaml`
- Do not manually edit files in `src/api/` - they are auto-generated
- Custom Axios instance in `src/lib/axios.ts` handles auth for all generated hooks

### Firebase Deployment

- Configure `PRIVATE_API_BASE_URL` in `apphosting.yaml` for App Hosting
- Multiple environments: production (`apphosting.prod.yaml`), UAT (`apphosting.uat.yaml`)
- Backend URL defaults to `https://checklist-app-go-qqzjtedwva-ez.a.run.app`

### i18n

- Translations in `src/i18n/locales/` (en.json, et.json, es.json)
- Language auto-detected from browser or localStorage
- Use `useStableTranslation` hook to prevent hydration mismatches

### Keep-Alive & Client IDs

- Axios uses HTTP keep-alive for better performance
- Each client gets persistent ID in localStorage (`checklist_client_id`)
- Client ID sent as `X-Client-Id` header for request tracking/deduplication
