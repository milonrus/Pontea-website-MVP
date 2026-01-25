# Refactor Plan: Align Codebase with plan.md Architecture

## Decisions
- **Approach:** Full restructure (all at once)
- **Database:** Fresh start with new schema per plan.md
- **Output:** Save to `/workspaces/Pontea-website-MVP/refactorplan.md`

## Executive Summary

The current codebase ("Pontea") has a working foundation but needs significant restructuring to match the "Arched" architecture defined in `plan.md`. This refactor focuses on reorganizing the codebase for the test-taking platform with server-authoritative timer and session management.

---

## Current State Assessment

### What's Working Well ✅
- Next.js 15 App Router setup
- Supabase client configuration
- Tailwind CSS with custom theme
- Basic authentication with Supabase Auth
- KaTeX rendering (`LaTeXRenderer.tsx`)
- Component structure (auth guards, shared components)
- TypeScript types foundation

### Structural Gaps 🔴

| Aspect | Current | Target (plan.md) |
|--------|---------|------------------|
| Directory | `app/`, `components/`, `views/`, `services/` | `src/app/`, `src/components/`, `src/hooks/`, `src/lib/` |
| Routes | Flat (`/exercise/`, `/admin/`) | Route groups: `(auth)`, `(dashboard)`, `(test)`, `(admin)` |
| API Routes | None | `api/test/`, `api/practice/`, `api/admin/` |
| Terminology | "Exercise" | "Test" (mock) and "Practice" |
| State | Client-side | Server-authoritative |
| Timer | Basic hook | Server-synced with auto-advance |

### Database Schema Differences

**Current tables:**
- `users`, `subjects`, `topics`, `questions`, `question_reports`
- `student_progress`, `exercise_sets`, `exercise_responses`

**Target tables (plan.md):**
- `profiles`, `questions`, `test_templates`, `test_sections`
- `test_attempts`, `attempt_questions`, `attempt_sections`
- `practice_sessions`, `practice_answers`

---

## Refactor Phases

### Phase 1: Directory Restructure

**Goal:** Move to `src/` based structure matching plan.md

```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx            # SEO landing page
│   ├── (auth)/             # Login, signup, reset
│   ├── (dashboard)/        # Dashboard, results, settings
│   ├── (test)/             # Test session pages
│   ├── (admin)/            # Admin interface
│   └── api/                # API routes
├── components/
│   ├── test/               # Timer, question display, navigation
│   ├── practice/           # Practice-specific components
│   ├── admin/              # Admin components
│   └── shared/             # Reusable components
├── hooks/
│   ├── use-test-session.ts # Test state orchestration
│   └── use-timer.ts        # Server-synced timer
├── lib/
│   ├── supabase/           # Supabase clients
│   └── test/               # Timer manager, scoring
└── contexts/               # React contexts
```

**Tasks:**
1. Create `src/` directory
2. Move `app/` → `src/app/`
3. Move `components/` → `src/components/`
4. Move `hooks/` → `src/hooks/`
5. Move `contexts/` → `src/contexts/`
6. Rename `services/` → `src/lib/`
7. Move `views/` content into `src/app/` pages (eliminate views pattern)
8. Update `tsconfig.json` paths
9. Update `tailwind.config.cjs` content paths
10. Update all imports throughout codebase

### Phase 2: Route Group Organization

**Goal:** Organize routes using Next.js route groups

```
src/app/
├── page.tsx                        # Landing
├── (auth)/
│   ├── login/page.tsx
│   ├── signup/page.tsx
│   └── reset-password/page.tsx
├── (dashboard)/
│   ├── dashboard/page.tsx
│   ├── results/page.tsx
│   ├── practice/page.tsx           # Practice setup
│   └── settings/page.tsx
├── (test)/
│   └── test/[attemptId]/page.tsx   # Active test
├── (admin)/
│   └── admin/
│       ├── page.tsx
│       ├── questions/...
│       ├── tests/...
│       └── stats/page.tsx
```

**Tasks:**
1. Create route group directories
2. Migrate current routes to new structure
3. Update navigation links throughout app
4. Update auth redirects

### Phase 3: API Routes Setup

**Goal:** Create server-side API routes for test/practice/admin

```
src/app/api/
├── test/
│   ├── start/route.ts      # POST - Create attempt
│   ├── sync/route.ts       # GET - Server time sync
│   ├── answer/route.ts     # POST - Save answer
│   ├── next-section/route.ts
│   ├── resume/route.ts     # GET - Session state
│   └── complete/route.ts
├── practice/
│   ├── start/route.ts
│   ├── answer/route.ts
│   └── complete/route.ts
└── admin/
    ├── questions/route.ts
    ├── questions/import/route.ts
    ├── tests/route.ts
    └── stats/route.ts
```

**Tasks:**
1. Create API route structure
2. Implement test session endpoints
3. Implement practice session endpoints
4. Implement admin endpoints
5. Add proper error handling

### Phase 4: Database Schema Migration

**Goal:** Align database with plan.md schema

**New tables to create:**
- `test_templates` - Admin-configurable test structures
- `test_sections` - Section definitions per template
- `test_attempts` - User test attempts with server state
- `attempt_questions` - Questions assigned to attempt
- `attempt_sections` - Section progress tracking
- `practice_sessions` - Practice session records
- `practice_answers` - Practice answers

**Migration approach:**
1. Create new tables alongside existing
2. Map existing `exercise_sets` → `practice_sessions`
3. Map existing `exercise_responses` → `practice_answers`
4. Add `test_*` tables fresh
5. Update RLS policies

### Phase 5: Core Test Engine

**Goal:** Implement server-authoritative test system

**Files to create:**
1. `src/lib/test/timer-manager.ts` - Server time calculations
2. `src/lib/test/scoring.ts` - Score calculation (+1/-0.25/0)
3. `src/hooks/use-test-session.ts` - Test state orchestration
4. `src/hooks/use-timer.ts` - Server-synced timer hook

**Key features:**
- Server time as source of truth
- 30-second sync interval
- Tab visibility re-sync
- Auto-advance on section expiry
- Tab blocking via BroadcastChannel

### Phase 6: Component Reorganization

**Goal:** Organize components per plan.md structure

**Move/rename:**
- Landing components → `src/components/landing/`
- Auth guards → `src/components/auth/`
- Shared components → `src/components/shared/`

**Create:**
- `src/components/test/` - Timer, QuestionDisplay, AnswerOptions, Navigation
- `src/components/practice/` - Setup, Question, Feedback
- `src/components/admin/` - QuestionForm, CSVUploader, TestBuilder

### Phase 7: Terminology Alignment

**Goal:** Rename "Exercise" to "Test/Practice" throughout

**Changes:**
- `/exercise/` routes → `/test/` and `/practice/`
- `ExerciseSet` type → `TestAttempt` / `PracticeSession`
- `exercise.ts` service → `test.ts` + `practice.ts`
- Component names and variables
- Database references

---

## Files to Modify

### Configuration
- `tsconfig.json` - Update paths for `src/`
- `tailwind.config.cjs` - Update content paths
- `next.config.mjs` - Add any needed config

### Root Level
- `supabase.ts` → `src/lib/supabase/client.ts`
- `types.ts` → `src/types/index.ts`

### New Files to Create
- `src/lib/supabase/server.ts` - Server-side Supabase client
- `src/lib/supabase/middleware.ts` - Auth middleware
- `src/lib/test/timer-manager.ts`
- `src/lib/test/scoring.ts`
- `src/hooks/use-test-session.ts`
- All API routes under `src/app/api/`
- Database migrations for new schema

---

## Verification Plan

After refactoring:
1. **Build Check:** `npm run build` succeeds
2. **Route Test:** All routes accessible and render
3. **Auth Flow:** Login/logout works correctly
4. **API Routes:** All endpoints return expected data
5. **Database:** Queries work with new schema
6. **Styling:** No visual regressions

---

## Execution Order

1. **Create `refactorplan.md`** in project root with this plan
2. **Phase 1:** Directory restructure (`src/` migration)
3. **Phase 2:** Route group organization
4. **Phase 3:** API routes setup
5. **Phase 4:** Fresh database schema (new tables)
6. **Phase 5:** Core test engine files
7. **Phase 6:** Component reorganization
8. **Phase 7:** Terminology alignment
9. **Verify:** Build, routes, auth, styling

## Notes

- Full restructure approach - all phases executed together
- Fresh database start - no data migration needed
- After refactor, codebase ready for Phase 2 (Test Engine) from plan.md
