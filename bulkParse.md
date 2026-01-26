# Bulk Image Import Implementation Progress

## Summary
Implementing a bulk image import feature with AI parsing for Pontea. Users can upload multiple question screenshots, have them parsed by OpenAI Vision, review/edit results, and import all at once.

## Completed Tasks (4/8)

### ✅ Task #1: Types Added to src/types/index.ts
Added the following interfaces:
```typescript
export type ImageParseStatus = 'pending' | 'parsing' | 'success' | 'error';

export interface ImageParseItem {
  id: string;
  file: File;
  dataUrl: string;
  status: ImageParseStatus;
  error?: string;
  parsedQuestion?: ParsedImageQuestion;
}

export interface ParsedImageQuestion {
  questionText: string;
  options: QuestionOption[];
  correctAnswer: string;
  explanation: string;
  subjectId?: string;
  topicId?: string | null;
  difficulty?: QuestionDifficulty;
}

export interface BulkParseRequest {
  images: Array<{ id: string; dataUrl: string }>;
}

export interface BulkParseResult {
  id: string;
  success: boolean;
  question?: ParsedImageQuestion;
  error?: string;
}

export interface BulkParseResponse {
  results: BulkParseResult[];
}
```

### ✅ Task #2: API Route Created at src/app/api/admin/questions/parse-batch/route.ts
Features:
- Accepts array of images with client-generated IDs
- Processes with concurrency control (3 parallel calls)
- Exponential backoff retry for rate limits (3 attempts per image)
- Per-image timeout: 30s, total timeout: 5min implied
- Returns per-image success/failure status
- Reuses OpenAI Vision prompt from existing single parse route
- Admin authentication check
- Batch size validation (max 50 images)
- Full error handling with rate limit detection

Key implementation details:
- Uses `processWithConcurrency` helper for managing 3 parallel requests
- `parseImageWithRetry` handles individual image parsing with retry logic
- Uses the gpt-4.1-mini model with JSON schema validation
- Normalizes option order to a-d and handles missing/empty fields gracefully

### ✅ Task #3: BulkImageUploader Component at src/components/admin/BulkImageUploader.tsx
Features:
- Multi-file drag-and-drop with click fallback
- File validation: PNG/JPG only, max 5MB per file (configurable)
- Thumbnail previews with remove option
- Batch size enforcement (max 50, configurable)
- Grid display of selected images
- Clear all button
- Error display for validation failures
- FileList read as data URLs using FileReader API

Props:
```typescript
interface BulkImageUploaderProps {
  images: ImageParseItem[];
  onImagesChange: (images: ImageParseItem[]) => void;
  maxImages?: number;
  maxSizeMB?: number;
  disabled?: boolean;
}
```

### ✅ Task #4: ImageParseProgress Component at src/components/admin/ImageParseProgress.tsx
Features:
- Overall progress bar with percentage
- Per-image status display (pending/parsing/success/error)
- Status icons with animations
- Summary counts (pending, parsing, completed)
- Retry failed images button
- Color-coded status backgrounds
- Thumbnail grid showing progress

Props:
```typescript
interface ImageParseProgressProps {
  images: ImageParseItem[];
  onRetryFailed: () => void;
  isParsing: boolean;
}
```

## Remaining Tasks (4/8)

### ⏳ Task #5: ParsedQuestionEditor Component
**File:** src/components/admin/ParsedQuestionEditor.tsx

**What it needs:**
- Inline editable fields for parsed question data
- LaTeX preview support
- Per-question metadata dropdowns (subject, topic, difficulty)
- Delete button for removing questions from batch
- Field validation (highlight missing required fields)
- Expandable card layout
- Edit mode toggle

**Pseudocode:**
```typescript
interface ParsedQuestionEditorProps {
  items: ImageParseItem[];
  subjects: SubjectModel[];
  topics: TopicModel[];
  onItemsChange: (items: ImageParseItem[]) => void;
}

export const ParsedQuestionEditor: React.FC<ParsedQuestionEditorProps> = ...
// - Map through items
// - For each item, show expandable card with parsed question
// - Question text, options, explanation as editable fields
// - Metadata dropdowns for subject, topic, difficulty
// - Delete button
// - Validation indicators
// - LaTeX preview for fields
```

### ⏳ Task #6: BulkImageImportPage View
**File:** src/views/admin/BulkImageImportPage.tsx

**4-Step Wizard:**
1. **Upload Step**
   - Use BulkImageUploader component
   - Large drag-and-drop zone
   - "Start Parsing" button

2. **Parsing Step**
   - Use ImageParseProgress component
   - Call POST /api/admin/questions/parse-batch with all images
   - Handle success/error responses
   - Update ImageParseItem.status and parsedQuestion fields
   - Cannot proceed until all complete

3. **Review Step**
   - Use ParsedQuestionEditor component
   - Show parsed questions with metadata fields
   - Allow inline editing
   - Show validation status
   - Delete questions from batch
   - "Import" button when valid

4. **Import Step**
   - Call batchCreateQuestions from lib/db
   - Show progress during database insert
   - Success summary with count
   - Link back to questions list

**State management:**
```typescript
type WizardStep = 'upload' | 'parsing' | 'review' | 'import' | 'success';

const [step, setStep] = useState<WizardStep>('upload');
const [images, setImages] = useState<ImageParseItem[]>([]);
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
const [subjects, setSubjects] = useState<SubjectModel[]>([]);
const [topics, setTopics] = useState<TopicModel[]>([]);
const [user, setUser] = useState<UserProfile | null>(null);
```

**Key methods:**
- `handleStartParsing()`: POST to /api/admin/questions/parse-batch
- `handleRetryFailed()`: Retry only failed images
- `handleImport()`: batchCreateQuestions with completed items
- `validateBeforeProceed()`: Check all required fields

### ⏳ Task #7: Route Page at src/app/(admin)/admin/questions/import-images/page.tsx
Simple wrapper:
```typescript
"use client";

import BulkImageImportPage from '@/views/admin/BulkImageImportPage';
import AdminRoute from '@/components/auth/AdminRoute';

const Page = () => {
  return (
    <AdminRoute>
      <BulkImageImportPage />
    </AdminRoute>
  );
};

export default Page;
```

### ⏳ Task #8: Update QuestionsPage
**File:** src/views/admin/QuestionsPage.tsx

Add button in the button group (line 49-60):
```typescript
<Link href="/admin/questions/import-images">
  <Button variant="outline" className="flex items-center gap-2">
    <Upload className="w-4 h-4" /> Import Images
  </Button>
</Link>
```

Place it after the "Import CSV" button and before "Add Question" button.

## Implementation Notes

### API Behavior
- POST /api/admin/questions/parse-batch expects `images` array with `id` and `dataUrl` fields
- Returns `results` array with per-image status, parsed question, or error
- Concurrency: 3 parallel requests max
- Timeout per image: 30 seconds
- Retry logic: Exponential backoff up to 3 attempts (1s, 2s, 4s max 10s)
- Rate limit handling: Detects 429 status and retries

### Component Integration Flow
1. User navigates to `/admin/questions/import-images`
2. **Upload**: BulkImageUploader lets user select files
3. **Parsing**:
   - BulkImageImportPage calls `/api/admin/questions/parse-batch` with image data URLs
   - Updates ImageParseItem[] with status changes
   - ImageParseProgress shows real-time progress
4. **Review**:
   - ParsedQuestionEditor shows editable questions
   - User assigns subject/topic/difficulty per question
   - User can delete unwanted questions
5. **Import**:
   - BulkImageImportPage calls `batchCreateQuestions` from lib/db
   - Questions are saved to database with user as createdBy
   - Success message with count

### Validation Requirements
- File type: PNG, JPG only
- File size: 5MB max per image
- Batch size: 50 max
- Required parsed fields: questionText, options (4), correctAnswer, explanation
- Required metadata: subjectId, difficulty (topicId optional)

### LaTeX Support
- All parsed content already wrapped in LaTeX delimiters by OpenAI
- Use existing LaTeXRenderer component for preview
- Example: "$x^2 + y^2 = r^2$" for inline, "$$\\frac{a}{b}$$" for display

## Testing Plan
1. Navigate to `/admin/questions/import-images`
2. Upload 3-5 test question screenshots
3. Verify parsing progress shows correctly
4. Edit a parsed question in review step
5. Assign subject/topic/difficulty
6. Import and verify questions appear in question list

## Files Modified
- src/types/index.ts ✅

## Files Created
- src/app/api/admin/questions/parse-batch/route.ts ✅
- src/components/admin/BulkImageUploader.tsx ✅
- src/components/admin/ImageParseProgress.tsx ✅
- src/components/admin/ParsedQuestionEditor.tsx ⏳
- src/views/admin/BulkImageImportPage.tsx ⏳
- src/app/(admin)/admin/questions/import-images/page.tsx ⏳

## Database Notes
- Uses existing `questions` table
- `batchCreateQuestions` function already exists in lib/db.ts
- Must provide: subjectId, topicId (nullable), tags, difficulty, questionText, options, correctAnswer, explanation, createdBy, isActive
- Auto-generated: id, createdAt, updatedAt, stats

## Next Steps When Resuming
1. Create ParsedQuestionEditor component (Task #5)
2. Create BulkImageImportPage wizard (Task #6)
3. Create route page (Task #7)
4. Add button to QuestionsPage (Task #8)
5. Test full workflow
