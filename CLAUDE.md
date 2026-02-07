# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Pontea is a Next.js-based educational platform built with React 19, TypeScript, and Tailwind CSS. It uses Supabase for backend services and authentication. The app serves both students (practice and timed tests) and admins (question management).

## Common Development Commands

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run end-to-end tests
npm run test:e2e

# Run tests in UI mode
npm run test:e2e:ui

# Install Playwright browsers
npm run test:e2e:install
```

**Environment Setup:** Requires `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and optionally `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`.

## Project Architecture

### Directory Structure

- **`src/app/`** - Next.js App Router pages organized by route: `(admin)`, `(auth)`, `(dashboard)`, `(test)`, `api/`
- **`src/components/`** - Reusable React components
- **`src/views/`** - Page-level view components (DashboardPage, student flows, etc.)
- **`src/contexts/`** - React context providers (AuthContext for auth state)
- **`src/lib/`** - Core utilities:
  - `supabase/client.ts` - Client-side Supabase instance
  - `supabase/server.ts` - Server-side Supabase client and auth helpers
  - `db.ts` - Database CRUD operations and mappers (snake_case DB ↔ camelCase models)
  - `test/timer-manager.ts` - Server-sync timer logic for proctored tests
  - `test/scoring.ts` - Test scoring calculations
- **`src/hooks/`** - Custom React hooks (useTestSession, useTimer, useAuth, useTabBlocking)
- **`src/types/`** - Central TypeScript type definitions
- **`src/utils/`** - General utility functions
- **`src/data/`** - Static data/constants

### Key Architectural Patterns

#### 1. **Data Models & Database Mapping**
Content hierarchy: Subject → Topic → Question. User progression tracked via StudentProgress and test attempts via TestAttempt.
Database uses snake_case columns; `src/lib/db.ts` exports mapper functions (mapSubject, mapQuestion, etc.) that convert to camelCase TypeScript models. Always use these mappers when reading from Supabase.

#### 2. **Authentication & Authorization**
`AuthContext` wraps the app and provides `useAuth()` hook. On initialization, fetches authenticated Supabase user, then queries the `users` table to populate UserProfile. Falls back gracefully if profile creation fails. Admin role checked via `userProfile.role === 'admin'`.

#### 3. **Server-Synced Test Timers**
The `useTestSession` hook manages timed tests with server-side validation. Key features:
- **Timer Sync**: Periodic requests to `/api/test/sync` keep local timers aligned with server time, preventing client-side cheating
- **Drift Detection**: Client-side timers that drift >10s from server are recalibrated
- **Section Locking**: Completed sections cannot be re-entered; future sections blocked until current completes
- **Tab Blocking**: Detects tab switches and re-syncs on visibility change
- **Auto-expiry**: Tests auto-complete when timer expires (configurable per session)

See `src/hooks/use-test-session.ts` for full hook implementation; test endpoints at `src/app/api/test/`.

#### 4. **API Routes Structure**
RESTful endpoints grouped by feature:
- `/api/test/*` - Test/quiz session lifecycle (start, answer, complete, sync, resume)
- `/api/practice/*` - Practice session endpoints
- `/api/admin/*` - Admin-only operations (question batch uploads, parsing)
- `/api/templates/*` - Test template endpoints

All API routes use `getAuthUser()` from `src/lib/supabase/server.ts` to validate Bearer token from Authorization header.

#### 5. **Question Import Workflow**
Two-stage import for admin-created questions:
1. **CSV Parsing** - Parse question metadata (text, options, correct answer, difficulty, subject/topic)
2. **Image Parsing** - OCR or ML parsing of question images (via Gemini API) to extract text and options

Related files: `src/views/admin/BulkImageImportPage.tsx`, `src/app/(admin)/admin/questions/import-images/`, admin question APIs.

### Type System

`src/types/index.ts` defines all domain models:
- **Content**: SubjectModel, TopicModel, QuestionModel
- **Users**: UserProfile, StudentProgress
- **Sessions**: TestAttempt, PracticeSession, ExerciseSet
- **Bulk Operations**: ParsedQuestion, ImageParseItem, BulkParseRequest/Response

Use these exported types throughout the codebase. Avoid inline type definitions.

### State Management

- **Global**: AuthContext (user & role state)
- **Page-level**: React useState for form state, answers, session data
- **Server State**: Supabase queries (no client-side cache layer; fresh queries on demand)
- **Session State**: useTestSession hook for complex test lifecycle

No Redux or global state beyond auth.

### Styling

Tailwind CSS with custom theme colors:
- Primary: `#01278b` (dark blue)
- Secondary: `#00154a` (darker blue)
- Accent: `#FFC857` (gold)
- Highlight: `#2563eb` (bright blue)
- Teal: `#4ecca3`

Custom font: "Mulish" (sans and display).

## Common Tasks

### Adding a New Question Type or Field
1. Update `QuestionModel` in `src/types/index.ts`
2. Add mapper logic in `src/lib/db.ts` (mapQuestion, mapQuestionUpdate)
3. Update API routes that handle questions
4. Update UI components that display/edit questions

### Implementing a New Test Feature
1. Define types in `src/types/index.ts` (TestAttempt, AttemptQuestion, etc.)
2. Create/update API route in `src/app/api/test/`
3. Add hook logic (or extend useTestSession) in `src/hooks/`
4. Connect UI in `src/views/` or `src/components/`

### Authentication/Authorization Checks
Use `useAuth()` hook in client components to get `currentUser`, `userProfile`, and `isAdmin` flag. For server-side (API routes), use `getAuthUser(request)` from `src/lib/supabase/server.ts`.

### Debugging Database Issues
Enable Supabase query logs in the browser console. Check snake_case/camelCase mapping in `src/lib/db.ts` if data looks wrong. Verify RLS policies on Supabase dashboard if permission errors occur.

## Key Files to Know

- **`src/lib/db.ts`** - Central data access layer (450+ lines); all CRUD operations and model mapping
- **`src/hooks/use-test-session.ts`** - Complex test session state machine (640+ lines); handles timer sync, section locking, answer submission
- **`src/contexts/AuthContext.tsx`** - Auth initialization and profile fetching (280+ lines); handles edge cases like profile creation
- **`src/app/layout.tsx`** - Root layout with AuthProvider
- **`src/types/index.ts`** - Single source of truth for all types
- **`next.config.mjs`** - Built with `reactStrictMode: false` and custom dist directory
- **`tailwind.config.cjs`** - Defines custom theme colors and fonts

## Notes

- React Strict Mode is disabled in Next.js config (see `next.config.mjs`)
- Supabase uses implicit auth flow (no refresh token endpoint needed)
- Questions are always fetched fresh; no caching layer
- Test timer validation relies on server time; clock skew between client and server is detected and corrected
- Admin role required for bulk imports and question management (enforced server-side via API route guards)
