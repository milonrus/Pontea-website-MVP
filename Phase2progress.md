# Phase 2 Implementation Progress - Complete Context

## Status: Complete
**Last Updated:** 2026-01-26

---

## Project Overview

This is a Next.js 14 app with Supabase backend for a test/exam platform. Phase 2 implements:
- Admin UI for creating test templates with sections and questions
- Student flow: select template → start timed test → view results
- Server-authoritative timing with section-level timers
- Section locking (can't go back to completed sections)

### Tech Stack
- **Frontend:** Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Auth)
- **State:** React hooks, no external state management
- **UI:** Custom components, Lucide icons, Framer Motion

### Key Directories
```
src/
├── app/                    # Next.js App Router
│   ├── (admin)/admin/      # Admin pages (protected by AdminRoute)
│   ├── (dashboard)/        # Student pages (protected by ProtectedRoute)
│   ├── (test)/test/        # Test-taking pages
│   └── api/                # API routes
├── views/                  # Page-level components
│   ├── admin/              # Admin views
│   └── student/            # Student views
├── components/             # Reusable components
├── hooks/                  # Custom React hooks
├── lib/                    # Utilities and services
│   └── supabase/           # Supabase client/server
└── types/                  # TypeScript types
```

---

## Completed Tasks

### Task 1: Database Schema ✅

**File:** `supabase/migrations/20260125_test_templates.sql`

```sql
-- Core tables created:
CREATE TABLE test_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  time_limit_seconds INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE template_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES test_templates(id) ON DELETE CASCADE,
  section_index INTEGER NOT NULL,
  name TEXT NOT NULL,
  time_limit_seconds INTEGER,
  question_ids UUID[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(template_id, section_index)
);

-- Also adds columns to existing tables:
-- test_attempts.template_id
-- attempt_sections.name
-- attempt_sections.question_count
```

**NOTE:** Migration needs to be run on Supabase database.

---

### Task 2: Admin Template Management ✅

**Files Created:**

1. **`src/app/api/admin/templates/route.ts`** - List all templates, create new
2. **`src/app/api/admin/templates/[id]/route.ts`** - Get/update/delete single template
3. **`src/app/(admin)/admin/templates/page.tsx`** - Route wrapper
4. **`src/app/(admin)/admin/templates/[id]/page.tsx`** - Editor route wrapper
5. **`src/views/admin/TemplateListPage.tsx`** - Template list with toggle/delete
6. **`src/views/admin/TemplateEditorPage.tsx`** - Create/edit with question picker

**API Response Shapes:**

```typescript
// GET /api/admin/templates
{
  templates: [{
    id: string;
    name: string;
    description?: string;
    timeLimitSeconds?: number;
    isActive: boolean;
    createdAt: string;
    sections: [{
      id: string;
      sectionIndex: number;
      name: string;
      timeLimitSeconds?: number;
      questionIds: string[];
    }];
    sectionCount: number;
    totalQuestions: number;
  }]
}

// POST /api/admin/templates
// Body: { name, description?, timeLimitSeconds?, sections: [{ name, timeLimitSeconds?, questionIds }] }
```

---

### Task 3: Timed Test Start Page ✅

**Files Created:**

1. **`src/app/api/templates/route.ts`** - Student-facing, returns active templates without question IDs
2. **`src/app/(dashboard)/timed-test/page.tsx`** - Route wrapper
3. **`src/views/student/TimedTestStartPage.tsx`** - Template cards with section breakdown

**Student API Response:**
```typescript
// GET /api/templates (student-facing)
{
  templates: [{
    id: string;
    name: string;
    description?: string;
    timeLimitSeconds?: number;
    sectionCount: number;
    totalQuestions: number;
    totalSectionTime: number;
    sections: [{
      name: string;
      questionCount: number;
      timeLimitSeconds?: number;
    }]
  }]
}
```

---

### Task 4: Update /api/test/start ✅

**File Modified:** `src/app/api/test/start/route.ts`

**Key Changes:**
- Accepts `templateId` in request body
- Fetches template with sections
- Creates `test_attempts` with `question_ids` array
- Creates `attempt_sections` for each section
- Creates `attempt_questions` for all questions
- Returns section config with question indices

**Response Shape (template-based):**
```typescript
{
  attemptId: string;
  serverTime: string;
  attempt: TestAttempt;
  sectionRemainingTime: number | null;
  currentSectionIndex: 0;
  sections: [{
    index: number;
    name: string;
    questionStartIndex: number;
    questionEndIndex: number;
    timeLimitSeconds?: number;
    questionCount: number;
  }];
  totalQuestions: number;
}
```

---

### Task 5: Resume API & TimedTestPage ✅

**Files Modified:**

1. **`src/app/api/test/resume/route.ts`** ✅ - Now returns `sectionConfig`
2. **`src/hooks/use-test-session.ts`** ✅ - Now has `sections` state, loads from resume
3. **`src/views/student/TimedTestPage.tsx`** ✅ - Updated to use hook-provided sections

**Resume API Response:**
```typescript
{
  serverTime: string;
  remainingTime: number | null;
  sectionRemainingTime: number | null;
  attempt: TestAttempt;
  questions: AttemptQuestion[];  // camelCase transformed
  sections: AttemptSection[];    // raw DB records
  sectionConfig: [{              // computed with indices
    index: number;
    name: string;
    questionStartIndex: number;
    questionEndIndex: number;
    timeLimitSeconds?: number;
    questionCount: number;
    status: string;
    startedAt?: string;
    completedAt?: string;
  }];
  completedSections: number[];
  currentSectionTimeLimit: number | null;
  totalQuestions: number;
}
```

---

## IMMEDIATE NEXT STEP: Update TimedTestPage.tsx ✅

TimedTestPage now uses hook-provided `sections` instead of local `sectionsConfig`.

---

## Pending Tasks

### Task 6: Update Results Page ✅

**File:** `src/views/student/TestResultsPage.tsx`

Now supports timed tests and practice exercises. Updates:

1. **Detect test type:** `/api/test/results` first, fallback to practice results
2. **Timed test data:** Loaded from `test_attempts` + `attempt_questions` + `attempt_sections`
3. **Section breakdown view:** Score, time used/allowed, expandable question list
4. **API endpoint:** `GET /api/test/results?attemptId=xxx`

---

### Task 7: Verify Resume/Refresh

**Files to test:**
- `src/views/student/TimedTestPage.tsx`
- `src/hooks/use-test-session.ts`

**Test scenarios:**
1. Refresh page mid-test → should restore position and timers
2. Close tab, reopen → should resume correctly
3. Section timer expires → should lock section
4. Complete section → should not allow going back

---

### Task 8: Dashboard Integration ✅

**File:** `src/views/DashboardPage.tsx`

Added "Timed Test" card to the dashboard grid after the "Practice Session" card. Users can now access timed tests directly from the dashboard.

---

## Type Definitions

### From `src/types/index.ts`:

```typescript
interface TestTemplate {
  id: string;
  name: string;
  description?: string;
  totalTimeMinutes: number;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
  sections?: TestSection[];
}

interface TestSection {
  id: string;
  templateId: string;
  name: string;
  description?: string;
  timeLimitMinutes?: number;
  questionCount: number;
  subjectId?: string;
  orderIndex: number;
}

interface TestAttempt {
  id: string;
  userId: string;
  templateId?: string;
  filters?: ExerciseFilters;
  status: TestAttemptStatus;
  startedAt: string;
  completedAt?: string;
  serverStartTime: string;
  timeLimitSeconds?: number;
  currentSectionIndex: number;
  currentQuestionIndex: number;
  score?: number;
  // ...
}

interface AttemptQuestion {
  id: string;
  attemptId: string;
  questionId: string;
  sectionIndex?: number;
  selectedAnswer?: OptionId;
  isCorrect?: boolean;
  timeSpent: number;
  answeredAt?: string;
}

interface AttemptSection {
  id: string;
  attemptId: string;
  sectionIndex: number;
  startedAt?: string;
  completedAt?: string;
  status: 'pending' | 'in_progress' | 'completed';
  timeLimitSeconds?: number;
}
```

### SectionConfig (used in hook):
```typescript
interface SectionConfig {
  index: number;
  name?: string;
  questionStartIndex: number;
  questionEndIndex: number;
  timeLimitSeconds?: number;
}
```

---

## Database Schema (Current State)

### test_attempts (existing, modified)
```sql
- id UUID PK
- user_id UUID FK
- template_id UUID FK (NEW)
- filters JSONB
- status TEXT
- started_at TIMESTAMPTZ
- completed_at TIMESTAMPTZ
- server_start_time TIMESTAMPTZ
- time_limit_seconds INTEGER
- current_section_index INTEGER
- current_question_index INTEGER
- question_ids UUID[] (NEW - stored for resume)
```

### attempt_sections (existing, modified)
```sql
- id UUID PK
- attempt_id UUID FK
- section_index INTEGER
- name TEXT (NEW)
- question_count INTEGER (NEW)
- time_limit_seconds INTEGER
- started_at TIMESTAMPTZ
- completed_at TIMESTAMPTZ
- status TEXT
```

### attempt_questions (existing)
```sql
- id UUID PK
- attempt_id UUID FK
- question_id UUID FK
- section_index INTEGER
- selected_answer TEXT
- is_correct BOOLEAN
- time_spent INTEGER
- answered_at TIMESTAMPTZ
```

---

## API Endpoints Summary

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/admin/templates` | GET | Admin | List all templates |
| `/api/admin/templates` | POST | Admin | Create template |
| `/api/admin/templates/[id]` | GET | Admin | Get single template |
| `/api/admin/templates/[id]` | PUT | Admin | Update template |
| `/api/admin/templates/[id]` | DELETE | Admin | Delete/deactivate template |
| `/api/templates` | GET | User | List active templates (student) |
| `/api/test/start` | POST | User | Start test (accepts templateId) |
| `/api/test/resume` | GET | User | Resume test with section config |
| `/api/test/answer` | POST | User | Submit answer |
| `/api/test/next-section` | POST | User | Advance to next section |
| `/api/test/complete` | POST | User | Complete test |
| `/api/test/sync` | GET | User | Sync timer with server |
| `/api/test/results` | GET | User | Timed test results + section breakdown |

---

## File Changes Summary

| Status | File | Action |
|--------|------|--------|
| ✅ | `supabase/migrations/20260125_test_templates.sql` | Created |
| ✅ | `src/app/api/admin/templates/route.ts` | Created |
| ✅ | `src/app/api/admin/templates/[id]/route.ts` | Created |
| ✅ | `src/app/(admin)/admin/templates/page.tsx` | Created |
| ✅ | `src/app/(admin)/admin/templates/[id]/page.tsx` | Created |
| ✅ | `src/views/admin/TemplateListPage.tsx` | Created |
| ✅ | `src/views/admin/TemplateEditorPage.tsx` | Created |
| ✅ | `src/app/api/templates/route.ts` | Created |
| ✅ | `src/app/(dashboard)/timed-test/page.tsx` | Created |
| ✅ | `src/views/student/TimedTestStartPage.tsx` | Created |
| ✅ | `src/app/api/test/start/route.ts` | Modified |
| ✅ | `src/app/api/test/resume/route.ts` | Modified |
| ✅ | `src/hooks/use-test-session.ts` | Modified |
| ✅ | `src/views/student/TimedTestPage.tsx` | Updated |
| ✅ | `src/views/student/TestResultsPage.tsx` | Updated |
| ✅ | `src/app/api/test/results/route.ts` | Created |
| ✅ | `src/views/DashboardPage.tsx` | Updated |

---

## Testing Checklist

After completing all tasks:

1. **Admin Flow:**
   - [ ] Go to `/admin/templates`
   - [ ] Create new template with 2+ sections
   - [ ] Add questions to each section
   - [ ] Save and verify in list
   - [ ] Edit template, change questions
   - [ ] Toggle active/inactive

2. **Student Start Flow:**
   - [ ] Go to `/timed-test`
   - [ ] See active templates with section breakdown
   - [ ] Click template to expand details
   - [ ] Click "Start Test" → redirects to `/test/[id]`

3. **During Test:**
   - [ ] Questions load correctly
   - [ ] Section timer counts down
   - [ ] Overall timer counts down
   - [ ] Can navigate within section
   - [ ] Cannot navigate to future sections
   - [ ] Section auto-advances on timer expiry

4. **Resume:**
   - [ ] Refresh page → same position, correct timers
   - [ ] Complete section → cannot go back
   - [ ] Tab blocking works

5. **Results:**
   - [ ] Complete test → redirects to results
   - [ ] Shows section breakdown
   - [ ] Shows time per section
   - [ ] Can review questions

---

## Commands to Run

```bash
# Start dev server
npm run dev

# Type check
npm run type-check

# If migrations need to be applied (Supabase CLI)
supabase db push
# OR manually run SQL in Supabase dashboard
```

---

## Resume Instructions

When continuing this work:

1. **First:** Test the full flow from `/timed-test` → test → complete
2. **Next:** Verify resume/refresh scenarios (Task 7)
3. **Then:** Implement Task 8 (Dashboard integration)
4. **Finally:** Full end-to-end testing

Timed test results now support section breakdowns; remaining work is dashboard integration and verification.
