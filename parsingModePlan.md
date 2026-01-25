# Parse Mode Plan

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
1. Add a mode switch at the top of the form: "Basic" (default) and "Parse".
2. When "Parse" is selected:
   - Show upload UI (visible only in parse mode).
   - Accept PNG/JPG, max 5MB.
   - On upload completion, auto-trigger parsing.
3. During parsing:
   - Disable form inputs and show a loading state.
   - Reuse the existing red error banner for failures.
4. After parsing:
   - Overwrite the fields listed above.
   - Allow edits using the existing form UI, no extra steps.

## Backend Plan (Next.js API Route)
Add an admin-only route:
- `POST /api/admin/questions/parse`
  - Input: `{ imageDataUrl: string }`
  - Output: `{ question: { questionText, options, correctAnswer, explanation } }`

### Authorization
- Use existing Supabase server auth + role check (admin only).

### OpenAI Integration
- Server-side call to avoid exposing key.
- Suggested model: `gpt-4o-mini` (cost-effective) or `gpt-4.1-mini` (better reasoning).
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
- Basic mode remains unchanged.
- Parse mode visible at top; upload UI appears only in parse mode.
- Upload auto-triggers parsing and overwrites only the specified fields.
- Form is disabled during parsing.
- Errors use the existing red error banner.
- No uploaded image is stored.

## Testing Plan
Manual:
- New question in Parse mode: upload -> fields prefilled -> save.
- Edit question in Parse mode: upload -> fields overwritten -> save.
- Upload too-large file -> error banner.
- Bad image or parse failure -> error banner.
- Verify non-overwritten fields remain intact.

## Open Questions
- Final model choice (`gpt-4o-mini` vs `gpt-4.1-mini`).
- Desired error copy text for parse failures.
