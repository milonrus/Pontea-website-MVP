# Parse Mode Plan

## Implementation Progress
- [x] Backend: Create `/api/admin/questions/parse` route (updated to gpt-4.1-mini)
- [x] Frontend: Add toggle switch component
- [x] Frontend: Add drag-and-drop upload zone
- [x] Frontend: Integrate parsing flow with form
- [ ] Testing: Manual verification (ready for testing)

### Files Modified
- `src/app/api/admin/questions/parse/route.ts` - Updated model to `gpt-4.1-mini`
- `src/views/admin/QuestionFormPage.tsx` - Added Parse Mode UI and logic

## Overview
Add a "Parse Mode" to the admin question create/edit page. In this mode, an admin uploads a screenshot (PNG/JPG up to 5MB). The system auto-parses the image via OpenAI and overwrites specific form fields. The admin can edit the parsed results in the existing form UI. Uploaded images are not stored.

## Current Form Fields (from `QuestionFormPage`)
- subjectId
- topicId
- difficulty
- questionText
- questionImageUrl
- options (a-d)
- correctAnswer
- explanation
- explanationImageUrl
- tags
- isActive

## Scope of Parsing (fields overwritten)
Only overwrite:
- questionText
- options (a-d)
- correctAnswer
- explanation

Leave unchanged:
- subjectId
- topicId
- difficulty
- tags
- questionImageUrl
- explanationImageUrl
- isActive

## UX Plan

### Mode Switch
- **Component:** Toggle switch with "Parse Mode" label at the top of the form.
- Default state: Off (Basic mode).

### Upload UI (visible only when Parse Mode is on)
- **Component:** Large drag-and-drop zone with click-to-browse fallback.
- Accept PNG/JPG, max 5MB.
- On file drop/selection, auto-trigger parsing immediately.

### During Parsing
- Show a loading spinner inside the upload zone.
- Display a thumbnail preview of the uploaded image while parsing.
- Disable all form inputs until parsing completes.

### After Parsing (Success)
- No toast or banner; the populated fields serve as implicit feedback.
- Clear the upload zone (ready for another upload if needed).
- Re-enable form inputs for editing.

### Re-parse Behavior
- If the user uploads a new image after already parsing, immediately parse and overwrite without confirmation.

### Error Handling UI
- Reuse the existing red error banner at the top of the form.
- Error copy style: Technical (e.g., "Failed to parse image. Please try again or enter manually.").

## Backend Plan (Next.js API Route)
Add an admin-only route:
- `POST /api/admin/questions/parse`
  - Input: `{ imageDataUrl: string }`
  - Output: `{ question: { questionText, options, correctAnswer, explanation } }`

### Authorization
- Use existing Supabase server auth + role check (admin only).

### OpenAI Integration
- Server-side call to avoid exposing key.
- **Model:** `gpt-4.1-mini` (chosen for better reasoning capabilities).
- Use OpenAI Responses API with JSON schema output.
- Prompt requirements:
  - Return JSON only.
  - Use `$$...$$` for LaTeX.
  - Options labeled `a`-`d`, text excludes the label.
  - If missing: empty string for questionText/explanation/correctAnswer.

### Response Normalization
- Always return 4 options in `a`-`d` order.
- If model output is missing/invalid:
  - Fill missing fields with empty strings.
  - Normalize invalid `correctAnswer` to empty string.

## Client Flow
1. User toggles "Parse" mode.
2. User uploads screenshot.
3. Convert image to data URL in the browser.
4. `POST /api/admin/questions/parse`.
5. On success, overwrite formData with parsed values.
6. On failure, show existing error banner with actionable message.

## Error Handling
- File validation errors: block parse, show error banner.
- Network/API errors: show error banner, keep existing form data unchanged.
- Parse errors: show error banner, allow retry by re-uploading.

## Security and Privacy
- API key stored in `OPENAI_API_KEY` in `.env.local`.
- Do not store or persist screenshots.
- Limit payload size by client-side validation (5MB) and server-side guardrails.

## Acceptance Criteria
- Basic mode remains unchanged when toggle is off.
- Toggle switch labeled "Parse Mode" visible at top of form.
- Drag-and-drop upload zone appears only when Parse Mode toggle is on.
- Upload auto-triggers parsing and overwrites only the specified fields.
- During parsing: spinner shown in upload zone, thumbnail preview of image displayed, form inputs disabled.
- On success: fields populated silently, upload zone cleared, form re-enabled.
- On error: red error banner with technical message, form data unchanged.
- Re-uploading immediately overwrites without confirmation.
- No uploaded image is stored on the server.

## Testing Plan
Manual:
- Toggle switch turns on/off Parse Mode; upload zone shows/hides accordingly.
- New question in Parse mode: drag-drop image -> spinner + thumbnail shown -> fields prefilled -> save.
- Edit question in Parse mode: upload -> fields overwritten -> save.
- Upload too-large file (>5MB) -> error banner, form unchanged.
- Upload invalid file type -> error banner, form unchanged.
- Bad image or parse failure -> error banner with technical message, form unchanged.
- Re-upload while fields populated -> immediate overwrite, no confirmation.
- Verify non-overwritten fields (subjectId, topicId, difficulty, tags, etc.) remain intact.
- Verify form inputs are disabled during parsing and re-enabled after.

## Resolved Decisions
- **Model:** `gpt-4.1-mini` selected for better reasoning.
- **Error copy:** Technical style - e.g., "Failed to parse image. Please try again or enter manually."
- **Mode switch:** Toggle switch component.
- **Upload UI:** Large drag-and-drop zone.
- **Loading indicator:** Inside the upload area with image thumbnail preview.
- **Success feedback:** None (populated fields are implicit feedback).
- **Re-parse behavior:** Overwrite without confirmation.
