---
name: frontend-patterns
description: Write clean, maintainable frontend code following Next.js 15, SWR, Radix UI, and NestedCheck patterns. Use when writing new React components, hooks, pages, or integrating with the backend API.
allowed_tools: Read, Write, Edit, Grep, Glob, Bash
---

# Frontend Patterns for NestedCheck (Studio)

## Architecture

### Next.js 15 App Router

- Use App Router (`src/app/`) — not Pages Router
- Default to Server Components, add `"use client"` only when needed (hooks, interactivity, browser APIs)
- Use `loading.tsx` for suspense boundaries, `error.tsx` for error boundaries
- Route groups with `(groupName)` for layout organization
- Path alias: `@/` maps to `src/`

### Component Structure

```
src/components/
├── ui/              # Reusable primitives (button, input, dialog, etc.)
├── checklist/       # Checklist-specific components
├── checklist-item/  # Checklist item components
└── layout/          # Layout components (header, sidebar, etc.)
```

## Data Fetching

### SWR Hooks Pattern

```typescript
// Always use SWR for client-side data fetching
import useSWR from 'swr';
import { getChecklists } from '@/api/endpoints';

export function useChecklists() {
  return useSWR('checklists', () => getChecklists());
}
```

**Rules:**

- Use SWR for all client-side data fetching
- Use Orval-generated functions from `@/api/endpoints` — never write manual fetch/axios calls
- SWR key should be descriptive and unique
- Use `mutate()` for optimistic updates after mutations

### API Client (Orval)

- Generated from OpenAPI spec: `npm run generate:api`
- Source: `src/api/` — **NEVER edit these files manually**
- Custom Axios instance at `src/lib/axios.ts` with:
  - Cookie credentials (`withCredentials: true`)
  - Token refresh interceptor
  - X-Client-Id header injection

## Real-time Updates (SSE)

### SSE Hook Pattern

```typescript
// Follow existing pattern in src/hooks/use-sse.ts
useEffect(() => {
  const eventSource = new EventSource(
    `${API_URL}/v1/events/checklist-item-updates/${checklistId}?clientId=${clientId}`,
    { withCredentials: true },
  );

  eventSource.onmessage = (event) => {
    const { type, payload } = JSON.parse(event.data);
    // Handle: checklistItemCreated, checklistItemUpdated,
    //         checklistItemDeleted, checklistItemReordered,
    //         checklistItemRowAdded, checklistItemRowDeleted
  };

  return () => eventSource.close();
}, [checklistId, clientId]);
```

**Rules:**

- Always pass `clientId` to prevent echo
- Always clean up with `eventSource.close()` in useEffect cleanup
- Use SWR's `mutate()` to update cache when SSE event arrives
- Handle all event types defined in OpenAPI spec

## UI Components

### Radix UI + Tailwind

- Use Radix UI primitives from `@/components/ui/` (shadcn/ui pattern)
- Style with Tailwind CSS utility classes
- Available components: Button, Dialog, DropdownMenu, Checkbox, Input, Select, Tabs, Tooltip, etc.
- Use `cn()` utility for conditional class names

### Component Pattern

```typescript
"use client";

import { cn } from "@/lib/utils";

interface Props {
  className?: string;
  // ... other props
}

export function MyComponent({ className, ...props }: Props) {
  return (
    <div className={cn("base-classes", className)}>
      {/* content */}
    </div>
  );
}
```

## State Management

- **Server state**: SWR (data from API)
- **UI state**: React useState/useReducer (local component state)
- **No external state library** — SWR + React state is sufficient
- **Form state**: React Hook Form + Zod for validation

## i18n

- Translations in `src/i18n/locales/{en,et,es}/`
- Use `useTranslation()` hook in client components
- All user-facing strings must go through i18n
- Key naming: `namespace.section.key` (e.g., `checklist.header.title`)

## Error Handling

- Always handle loading, error, and empty states in components
- Use SWR's `{ data, error, isLoading }` pattern
- Show user-friendly error messages (not raw API errors)
- Toast notifications for mutation results (success/failure)

## Anti-Patterns to Avoid

- Writing manual fetch/axios calls instead of using Orval-generated client
- Editing files in `src/api/` (they are generated)
- Using external state management libraries (Redux, Zustand, etc.)
- Ignoring TypeScript errors (`@ts-ignore`, `any`)
- Not cleaning up SSE connections in useEffect
- Hardcoding API URLs instead of using environment variables
- Not handling all UI states (loading, error, empty)

## Checklist for New Code

- [ ] Uses existing Radix UI components from `@/components/ui/`
- [ ] Data fetching via SWR + Orval-generated client
- [ ] All user-facing strings through i18n
- [ ] Handles loading, error, and empty states
- [ ] SSE cleanup in useEffect (if real-time)
- [ ] TypeScript strict — no `any` or `@ts-ignore`
- [ ] Responsive design with Tailwind
- [ ] Accessible (Radix handles most, but check custom components)
