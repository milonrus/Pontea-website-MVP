# Arched - Polimi Architecture Exam Practice Platform

## Summary

Build a web platform for students preparing for the Polimi Architecture entrance exam, featuring full mock tests with server-side session management, practice mode, and admin content management.

**Top Priority:** Test reliability - timer accuracy, session persistence, zero lost progress.

---

## Tech Stack

- **Frontend:** Next.js 14+ (App Router)
- **Backend:** Next.js API routes + Supabase
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth (email/password, Google, Apple, magic link)
- **Storage:** Supabase Storage (question images)
- **Math Rendering:** KaTeX
- **Deployment:** Vercel (EU region)

---

## Core Features

### 1. Arched Test (Full Mock Exam)
- 5 sections with admin-configurable question counts
- 20 minutes per section, **locked** (cannot go back to previous sections)
- Fixed question order, 4 MCQ options (A/B/C/D)
- Scoring: +1 correct, -0.25 wrong, 0 blank
- Collapsible timer (for test anxiety)
- Next/Previous navigation only (no flagging)
- Auto-submit & advance when section time expires
- Block multiple browser tabs
- Unlimited retakes, session persists indefinitely
- **Server-side state is the source of truth**

### 2. Practice Mode
- Filters: topic, difficulty, count, exclude previously answered
- 3 difficulty levels: Easy/Medium/Hard
- Untimed, immediate feedback with explanations
- Full analytics tracking

### 3. Admin Interface
- Question CRUD (single + batch CSV with image URLs)
- Fully flexible test assembly
- Full test preview before publishing
- Basic stats dashboard (users, tests, scores, completion)

### 4. User Experience
- Minimal & clean design (Notion/Linear style)
- Fully responsive (desktop, tablet, mobile)
- English only, no onboarding tour
- SEO-optimized landing page (critical)
- Transactional emails only

---

## Database Schema (Key Tables)

```sql
-- User profiles (extends Supabase auth)
profiles (id, email, full_name, role, created_at)

-- Questions bank
questions (id, topic_id, difficulty, question_text, question_image_url,
           option_a/b/c/d, correct_answer, explanation, is_active)

-- Test templates (admin-configurable)
test_templates (id, name, status [draft/published/archived])
test_sections (id, template_id, name, section_order, question_count, time_limit_seconds)

-- Test attempts (CRITICAL: server-side session state)
test_attempts (id, user_id, template_id, status, current_section,
               current_question_index, section_started_at, total_score)
attempt_questions (id, attempt_id, question_id, section_number,
                   question_order, user_answer, is_correct, points_earned)
attempt_sections (id, attempt_id, section_number, started_at, completed_at, section_score)

-- Practice sessions
practice_sessions (id, user_id, topic_id, difficulty, total_questions, correct_answers)
practice_answers (id, session_id, question_id, user_answer, is_correct)
```

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                    # SEO landing page
│   ├── (auth)/                     # Login, signup, password reset
│   ├── (dashboard)/                # Dashboard, results, practice setup, settings
│   ├── (test)/test/[attemptId]/    # Active test session
│   ├── (admin)/admin/              # Admin dashboard, questions, tests, stats
│   └── api/
│       ├── test/                   # start, resume, answer, next-section, sync, complete
│       ├── practice/               # start, answer, complete
│       └── admin/                  # questions, questions/import, tests, stats
├── components/
│   ├── test/                       # timer, question-display, answer-options, navigation
│   ├── practice/                   # setup, question, feedback
│   ├── admin/                      # question-form, csv-uploader, test-builder
│   └── shared/                     # katex-renderer, image-display
├── hooks/
│   ├── use-test-session.ts         # Main test state orchestration
│   └── use-timer.ts                # Server-synced timer
└── lib/
    ├── supabase/                   # client, server, middleware
    └── test/
        ├── timer-manager.ts        # Server time calculations
        └── scoring.ts              # Score calculations
```

---

## Critical Implementation: Timer & Session Reliability

### Timer Approach (Server-Authoritative)
1. `section_started_at` stored on server when section begins
2. Frontend syncs with server every 30 seconds
3. Re-sync on tab visibility change (user returns to tab)
4. Calculate remaining time: `sectionTimeLimit - (serverTime - sectionStartedAt)`
5. Server auto-advances section if time expired on any API call

### Session Persistence
1. Every answer saved immediately (no batching)
2. `current_section` and `current_question_index` always updated
3. Resume API fetches fresh state on page load
4. Tab blocking via BroadcastChannel + localStorage

### Key API Endpoints
- `POST /api/test/start` - Create attempt, generate questions
- `GET /api/test/sync` - Return server time + remaining seconds
- `POST /api/test/answer` - Save answer, update position
- `POST /api/test/next-section` - Calculate section score, advance or complete
- `GET /api/test/resume` - Get full session state for reconnection

---

## CSV Import Format

```csv
topic,difficulty,question_text,option_a,option_b,option_c,option_d,correct_answer,explanation,image_url
Geometry,easy,"What is the area of a circle with radius 5?","25π","10π","5π","50π",A,"Area = πr² = π(5)² = 25π",https://storage.url/image.png
```

---

## Implementation Phases

### Phase 1: Foundation (Days 1-5)
- Next.js + Supabase setup
- Database schema + migrations
- Auth flow (email, social, magic link)
- Base UI components

### Phase 2: Test Engine (Days 6-12) **CRITICAL**
- Test session backend (start, answer, sync, advance, complete)
- Test-taking UI (timer, questions, navigation)
- Session reliability (tab blocking, auto-save, resume)
- Score calculation and results display

### Phase 3: Practice Mode (Days 13-15)
- Practice session backend
- Practice UI with immediate feedback

### Phase 4: Admin Interface (Days 16-20)
- Question CRUD + CSV import
- Test template builder + preview
- Admin dashboard with stats

### Phase 5: Polish & Launch (Days 21-25)
- Landing page + SEO
- Responsive design polish
- Testing & QA
- Deployment

---

## Critical Files to Implement

| File | Purpose |
|------|---------|
| `src/lib/test/timer-manager.ts` | Core timer logic with server sync |
| `src/app/api/test/sync/route.ts` | Timer sync endpoint |
| `src/hooks/use-test-session.ts` | Test state orchestration |
| `src/app/(test)/test/[attemptId]/page.tsx` | Main test-taking page |
| `supabase/migrations/00001_initial_schema.sql` | Database schema |

---

## Verification Plan

1. **Timer Accuracy:** Start test, note server time, wait 60 seconds, verify timer shows correct remaining time
2. **Session Persistence:** Start test, answer 3 questions, refresh page, verify exact position restored
3. **Tab Blocking:** Open test in two tabs, verify warning appears
4. **Auto-Advance:** Let section timer expire, verify automatic advance to next section
5. **Scoring:** Complete test, verify score matches expected (+1/-0.25/0 formula)
6. **Practice Mode:** Complete practice session, verify immediate feedback and analytics saved
7. **CSV Import:** Upload test CSV, verify questions created with correct data
8. **Responsive:** Test on mobile viewport, verify usable test-taking experience

---

## Current Status Assessment (Jan 2026)

### Phase 1: Foundation - ✅ COMPLETE
- [x] Next.js 14+ with App Router setup
- [x] Supabase database with all 13 tables (users, questions, test_templates, test_sections, test_attempts, attempt_questions, attempt_sections, practice_sessions, practice_answers, subjects, topics, student_progress, question_reports)
- [x] Auth flow (email/password, social, magic link via Supabase Auth)
- [x] Base UI components (Button, Modal, Header, ImageUpload, LaTeXRenderer)
- [x] RLS policies for all tables
- [x] AuthContext with role-based access (ProtectedRoute, AdminRoute, PublicRoute)

### Phase 2: Test Engine - ✅ COMPLETE
**Implemented:**
- [x] API routes: `/api/test/start`, `/api/test/answer`, `/api/test/sync`, `/api/test/next-section`, `/api/test/resume`, `/api/test/complete`
- [x] Timer manager (`src/lib/test/timer-manager.ts`) with server sync and drift detection
- [x] Test session hook (`src/hooks/use-test-session.ts`) with 30s sync interval
- [x] Scoring system (+1/-0.25/0 formula) in `src/lib/test/scoring.ts`
- [x] Test UI components (Timer, QuestionDisplay, AnswerOptions, Navigation)

**Missing (Critical):**
- [x] **Tab blocking** - ✅ Implemented in `src/hooks/use-tab-blocking.ts` using BroadcastChannel + sessionStorage
- [x] **Per-section time limits** - ✅ Implemented with `attempt_sections.time_limit_seconds` and section timers
- [x] **Auto-advance on section expiry** - ✅ Implemented via `autoAdvanceOnSectionExpiry` in `use-test-session.ts`
- [x] **Section locking** - ✅ Implemented via `completedSections` tracking and navigation guards

**Architecture:** ✅ Resolved
- `TimedTestPage.tsx` now uses the proper test engine (`use-test-session.ts` + `/api/test/*` routes)
- Template-based tests with admin UI at `/admin/templates`

### Phase 3: Practice Mode - ✅ COMPLETE
- [x] Practice API routes (`/api/practice/start`, `/api/practice/answer`, `/api/practice/complete`)
- [x] Practice setup with filters (subject, difficulty, question count)
- [x] Immediate feedback with explanations
- [x] Practice results summary
- [x] Exercise history with filtering

### Phase 4: Admin Interface - ⚠️ 95% COMPLETE
**Implemented:**
- [x] Admin dashboard with stats (questions, students, weekly additions, pending reports)
- [x] Question CRUD (`/admin/questions/`) with LaTeX preview
- [x] CSV bulk import (`/admin/questions/import/`)
- [x] Test template builder UI (`TestBuilder.tsx`)
- [x] Test template management (`/admin/templates/`) with full CRUD APIs
- [x] Student management (`/admin/students/`) with role editing
- [x] Subject/topic management
- [x] Question reports management

**Missing:**
- [ ] **Full test preview** - Cannot preview test before publishing

### Phase 5: Polish & Launch - ⚠️ 50% COMPLETE
**Implemented:**
- [x] Landing page with SEO elements, hero, pricing, FAQ, teacher testimonials
- [x] Responsive design throughout (mobile/tablet/desktop)
- [x] Framer Motion animations
- [x] Progress tracking dashboard with 14-day activity chart

**Missing:**
- [ ] **Signup page** - Directory exists (`/auth/signup/`) but view not implemented
- [ ] **Comprehensive testing & QA**
- [ ] **Production deployment verification**

---

## Database Tables Status

| Table | Status | Notes |
|-------|--------|-------|
| `users` | ✅ | Extends Supabase auth, has role/settings |
| `questions` | ✅ | Full schema with images, options, stats |
| `subjects` | ✅ | Subject hierarchy |
| `topics` | ✅ | Topics within subjects |
| `test_templates` | ✅ | Admin-configurable tests |
| `test_sections` | ✅ | Time limits, question counts, difficulty distribution |
| `test_attempts` | ✅ | Server-side session tracking |
| `attempt_questions` | ✅ | Answer tracking with correctness |
| `attempt_sections` | ⚠️ | Missing `started_at` column for per-section timing |
| `practice_sessions` | ✅ | With filtering and question selection |
| `practice_answers` | ✅ | Answer tracking with feedback |
| `student_progress` | ✅ | Progress tracking (not actively used yet) |
| `question_reports` | ✅ | Issue reporting system |

---

## Key Files Reference

| Component | Location | Status |
|-----------|----------|--------|
| Test Session Hook | `src/hooks/use-test-session.ts` | ✅ Complete, integrated |
| Timer Manager | `src/lib/test/timer-manager.ts` | ✅ Complete |
| Scoring | `src/lib/test/scoring.ts` | ✅ Complete |
| Test Page (timed) | `src/views/student/TimedTestPage.tsx` | ✅ Complete |
| Tab Blocking | `src/hooks/use-tab-blocking.ts` | ✅ Complete |
| Test API - start | `src/app/api/test/start/route.ts` | ✅ Complete |
| Test API - answer | `src/app/api/test/answer/route.ts` | ✅ Complete |
| Test API - sync | `src/app/api/test/sync/route.ts` | ✅ Complete |
| Test API - next-section | `src/app/api/test/next-section/route.ts` | ✅ Complete |
| Test API - results | `src/app/api/test/results/route.ts` | ✅ Complete |
| Practice Setup | `src/components/practice/PracticeSetup.tsx` | ✅ Complete |
| Admin Dashboard | `src/views/admin/AdminDashboard.tsx` | ✅ Complete |
| Test Builder | `src/components/admin/TestBuilder.tsx` | ✅ UI exists |

---

## Next Priority: Phase 5 Completion

Phase 2 (Test Engine) is now complete. Remaining work:

1. **Signup page** - Implement `/auth/signup/` view
2. **Test preview** - Add preview functionality in admin template editor
3. **Comprehensive QA** - Run through verification plan
4. **Production deployment** - Final deployment verification