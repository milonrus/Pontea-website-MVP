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