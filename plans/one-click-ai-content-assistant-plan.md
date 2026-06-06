# One-Click AI Content Assistant — Plan

## Overview

Build a dedicated "AI Assistant" page in the CMS admin that lets users upload a file (PDF, DOCX, TXT) or enter a URL, select a target language, and click **"Generate & Save as Draft"**. The backend extracts text, calls DeepSeek API to generate a complete article, **auto-saves it as a draft** in the CMS, and redirects the user to the content editor for final review/publishing.

This leverages existing infrastructure:
- [`scraperService.js`](backend/src/services/scraperService.js) — already handles URL scraping and PDF/TXT text extraction
- [`aiContentAssistantService.js`](backend/src/services/aiContentAssistantService.js) — already generates structured drafts via DeepSeek
- [`contentController.js`](backend/src/controllers/contentController.js) `createContent` — already saves content with translations, meta, taxonomies
- [`aiRoutes.js`](backend/src/routes/aiRoutes.js) — existing route pattern for AI endpoints
- [`apiClient`](frontend/src/api/axios.js) — existing axios instance with JWT auth

---

## Architecture

```mermaid
flowchart TD
    User[Admin User] --> UI[AIAssistant.vue]
    UI -->|POST /api/ai/generate-and-save| BE[Backend Endpoint]
    
    BE -->|sourceType=url| Scrape[scraperService.scrapeUrl]
    BE -->|sourceType=file| Extract[scraperService.extractFileText]
    
    Scrape -->|extracted text| Gen[aiContentAssistantService.generateDraft]
    Extract -->|extracted text| Gen
    
    Gen -->|structured draft| Save[contentController.createContent logic]
    Save -->|contentId| Response[{success, contentId, redirectUrl}]
    
    Response --> UI
    UI -->|router.push| Editor[ContentEditorPage.vue]
```

---

## Backend Changes

### 1. New Endpoint: `POST /api/ai/generate-and-save`

**Route**: Add to [`backend/src/routes/aiRoutes.js`](backend/src/routes/aiRoutes.js)

```
router.post('/generate-and-save', authenticate, checkAiAccess, upload.single('file'), aiContentAssistantController.generateAndSave);
```

**Request** (multipart/form-data when file, JSON when URL):
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `sourceType` | string | yes | `"url"` or `"file"` |
| `source` | string | conditional | URL string when `sourceType=url` |
| `file` | file | conditional | Uploaded file when `sourceType=file` |
| `targetLocale` | string | yes | `"en"`, `"sw"`, or `"pok"` |
| `additionalInstructions` | string | no | Extra instructions for DeepSeek |

**Backend Logic** (in [`aiContentAssistantController.js`](backend/src/controllers/aiContentAssistantController.js)):

1. Validate inputs — exactly one of URL or file, locale required
2. Extract text:
   - URL → `scraperService.scrapeUrl(url)`
   - File → save to media library via `mediaService.saveFile()`, then `scraperService.extractFileText(filePath, mimeType)`
3. Call `aiContentAssistantService.generateDraft(text, sourceUrl)` with the extracted text
4. **Auto-save** the generated draft as a CMS content entry using the same logic as `contentController.createContent`:
   - `type`: from draft (default `"page"`)
   - `slug`: from draft (auto-generated if empty)
   - `status`: `"draft"`
   - `author_id`: `req.user.id`
   - `translations`: from draft (filtered to `targetLocale` if only one locale generated, or keep all)
   - `meta`: from draft
5. Log usage to `llm_usage_logs`
6. Return `{ success: true, contentId, redirectUrl: "/cms/content/<id>/edit" }`

**Error Handling**:
- DeepSeek failure → 422 `{ error: "AI generation failed. Please try again." }`
- Text extraction failure → 422 `{ error: "Could not extract text from file/URL. ..." }`
- Validation errors → 400
- Rate limit → 429

### 2. Modify [`aiContentAssistantService.js`](backend/src/services/aiContentAssistantService.js)

Update `generateDraft` to accept an optional `targetLocale` and `additionalInstructions` parameter, and adjust the system prompt accordingly:

- If `targetLocale` is provided, instruct DeepSeek to generate the article **in that language** (English, Swahili, or Pokot)
- If `additionalInstructions` is provided, append it to the user prompt
- Keep the same JSON output structure (`type`, `slug`, `translations`, `meta`, `suggested_categories`)

### 3. Install `mammoth` for DOCX support

The existing [`scraperService.js`](backend/src/services/scraperService.js) `extractFileText` function returns a placeholder for DOCX files. Install `mammoth` and update the DOCX branch to extract actual text.

---

## Frontend Changes

### 1. New Page: [`AIAssistant.vue`](frontend/src/views/admin/AIAssistant.vue)

A dedicated page at `/admin/ai-assistant` with:

**UI Sections**:
- **Source Input** (tab/radio toggle):
  - *URL tab*: Text input with `http://`/`https://` validation + "Fetch" button
  - *File tab*: Drag & drop zone + file picker, accepts `.pdf`, `.docx`, `.txt`, max 10MB, shows filename + size
- **Locale Selector**: Radio buttons — English / Swahili / Pokot
- **Additional Instructions** (optional): Textarea
- **Generate Button**: "Generate & Save as Draft" with loading spinner, disabled during processing

**Behavior**:
1. Validate: file XOR URL, locale selected, file ≤ 10MB, URL valid
2. Build FormData (for file) or JSON (for URL)
3. POST to `/api/ai/generate-and-save`
4. On success: show green toast → `router.push('/cms/content/' + contentId + '/edit')` after 2s
5. On error: show red toast with error message, keep form state

### 2. Add Route

In [`frontend/src/router/index.js`](frontend/src/router/index.js), add under the admin layout children (after existing CMS routes):

```javascript
{
  path: 'admin/ai-assistant',
  name: 'AIAssistant',
  component: () => import('../views/admin/AIAssistant.vue'),
  meta: { requiresAuth: true },
},
```

### 3. Add Sidebar Link

In [`frontend/src/layouts/AdminLayout.vue`](frontend/src/layouts/AdminLayout.vue), add an "AI Assistant" link in the admin-only section (around line 419-434), using the `Bot` or `Sparkles` icon from `@lucide/vue`.

---

## Files to Create/Modify

### Backend
| File | Action | Description |
|------|--------|-------------|
| [`backend/src/controllers/aiContentAssistantController.js`](backend/src/controllers/aiContentAssistantController.js) | **Modify** | Add `generateAndSaveHandler` function |
| [`backend/src/services/aiContentAssistantService.js`](backend/src/services/aiContentAssistantService.js) | **Modify** | Update `generateDraft` to accept `targetLocale` and `additionalInstructions` params |
| [`backend/src/services/scraperService.js`](backend/src/services/scraperService.js) | **Modify** | Add DOCX text extraction using `mammoth` |
| [`backend/src/routes/aiRoutes.js`](backend/src/routes/aiRoutes.js) | **Modify** | Add `POST /generate-and-save` route |
| [`backend/package.json`](backend/package.json) | **Modify** | Add `mammoth` dependency |

### Frontend
| File | Action | Description |
|------|--------|-------------|
| [`frontend/src/views/admin/AIAssistant.vue`](frontend/src/views/admin/AIAssistant.vue) | **Create** | Main AI Assistant page component |
| [`frontend/src/router/index.js`](frontend/src/router/index.js) | **Modify** | Add `/admin/ai-assistant` route |
| [`frontend/src/layouts/AdminLayout.vue`](frontend/src/layouts/AdminLayout.vue) | **Modify** | Add "AI Assistant" sidebar link |

---

## Implementation Steps

1. **Install `mammoth`** — `cd backend && npm install mammoth`
2. **Update `scraperService.js`** — Add DOCX text extraction using `mammoth.extractRawText()`
3. **Update `aiContentAssistantService.js`** — Add `targetLocale` and `additionalInstructions` params to `generateDraft`, adjust system prompt
4. **Add `generateAndSaveHandler` to `aiContentAssistantController.js`** — Orchestrate extract → generate → save → respond
5. **Add route** in `aiRoutes.js` — `POST /generate-and-save` with multer middleware
6. **Create `AIAssistant.vue`** — Full page with URL/file input, locale selector, generate button, success/error handling
7. **Add route** in `frontend/src/router/index.js` — `/admin/ai-assistant`
8. **Add sidebar link** in `AdminLayout.vue` — Under admin-only section with `Bot` icon
9. **Restart servers** and verify the full flow

---

## Key Design Decisions

- **Reuses existing `generateDraft`** rather than creating a new DeepSeek call — the existing prompt already produces structured JSON with translations, meta, and categories
- **Reuses existing `createContent` logic** inline (not via HTTP call) to avoid circular dependencies — the controller directly uses `Content.create()`, `ContentTranslation.create()`, etc.
- **FormData for file uploads** — the existing multer middleware already handles file parsing; for URL-only requests, send JSON with `Content-Type: application/json`
- **DOCX via `mammoth`** — lightweight library that extracts raw text from .docx files without needing Word or complex dependencies
