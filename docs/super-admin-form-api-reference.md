# Super Admin — Form API Reference

API guide for **form management** endpoints in [`form.controller.ts`](../src/controllers/form.controller.ts) used by the super-admin UI. Create, update, and delete require `role: "superAdmin"`. List forms requires any authenticated admin or agent JWT.

> For other form endpoints (get by ID, submit, uploads, responses), see [frontend-api-reference.md](./frontend-api-reference.md).

---

## Quick start

| Item | Value |
|------|-------|
| Base URL (local) | `http://localhost:3000` |
| Base path | `/forms` |
| Auth | Admin JWT with `role: "superAdmin"` |
| Content-Type | `application/json` |
| Swagger UI | `GET /docs` |

```ts
const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
```

---

## Authentication

Obtain a super-admin token via `POST /admins/login`. The returned `admin.role` must be `"superAdmin"`.

```http
POST /admins/login
Content-Type: application/json

{
  "email": "superadmin@test.com",
  "password": "superpassword123"
}
```

Send the token on every request:

```http
Authorization: Bearer <accessToken>
```

**Rate limit:** 5 requests / minute on login.

| Status | When |
|--------|------|
| `401` | Missing, invalid, or expired token |
| `403` | Valid admin token but `role` is not `superAdmin` |

---

## Endpoints overview

| Method | Path | Summary | Auth | Rate limit |
|--------|------|---------|------|------------|
| `GET` | `/forms` | List all forms (summaries) | Authenticated | 60/min |
| `POST` | `/forms` | Create a new form schema | Super Admin | 60/min (global) |
| `PUT` | `/forms/:id` | Update / replace form schema | Super Admin | 60/min |
| `DELETE` | `/forms/:id` | Soft-delete form and all responses | Super Admin | 60/min |

Global default: **60 requests / minute** per IP. Exceeded → `429 Too Many Requests`.

---

## TypeScript types

```ts
type FormId = string;

type FieldType =
  | 'text'
  | 'textarea'
  | 'dropdown'
  | 'multi_dropdown'
  | 'radio'
  | 'multi_radio'
  | 'checkbox'
  | 'checkbox_group'
  | 'file';

type SubmissionUserType = 'agent' | 'user';

interface FieldValidation {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  allowedFileTypes?: string[];
  maxFileSizeMB?: number;
  errorMessage?: string;
}

interface FormField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  options?: string[];
  validation?: FieldValidation;
}

/** Returned by POST /forms and PUT /forms/:id */
interface Form {
  id: FormId;
  title: string;
  description: string | null;
  fields: FormField[];
  isPublished: boolean;
  submissionUserType: SubmissionUserType;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

/** Summary row from GET /forms (no fields array) */
interface FormSummary {
  id: FormId;
  title: string;
  description: string | null;
  isPublished: boolean;
  submissionUserType: SubmissionUserType;
  createdAt: string;
  updatedAt: string;
}
```

---

## `GET /forms` — List forms

List all forms. Returns summaries only (no `fields` array). Ordered by `updatedAt` descending. Soft-deleted forms are excluded.

**Auth:** Authenticated (admin or agent JWT). Super admins call this with their admin token.

**Success `200`:** `FormSummary[]`

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Contact Us",
    "description": "Reach out to our team",
    "isPublished": true,
    "submissionUserType": "agent",
    "createdAt": "2026-06-16T10:00:00.000Z",
    "updatedAt": "2026-06-16T10:00:00.000Z"
  }
]
```

**Errors:**

| Status | i18n key | English message |
|--------|----------|-----------------|
| `401` | `auth.*` | Missing/invalid token |

**cURL:**

```bash
curl -s "$VITE_API_URL/forms" \
  -H "Authorization: Bearer $TOKEN"
```

---

## `POST /forms` — Create form

Create a new form schema. The authenticated super admin is recorded as `createdById`.

**Auth:** Super Admin

**Body:**

```json
{
  "title": "Contact Us",
  "description": "Reach out to our team",
  "fields": [
    {
      "id": "full_name",
      "type": "text",
      "label": "Full Name",
      "placeholder": "Jane Doe",
      "validation": { "required": true, "minLength": 2, "maxLength": 100 }
    },
    {
      "id": "department",
      "type": "dropdown",
      "label": "Department",
      "options": ["Sales", "Support"],
      "validation": { "required": true }
    },
    {
      "id": "resume",
      "type": "file",
      "label": "Resume",
      "validation": {
        "required": true,
        "allowedFileTypes": ["application/pdf", ".pdf"],
        "maxFileSizeMB": 5
      }
    }
  ],
  "isPublished": true,
  "submissionUserType": "agent"
}
```

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `title` | `string` | Yes | 1–255 chars |
| `description` | `string` | No | Max 2000 chars |
| `fields` | `FormField[]` | No | Default `[]` |
| `isPublished` | `boolean` | No | Default `true` |
| `submissionUserType` | `'agent' \| 'user'` | Yes | Who may submit this form |

**Success `201`:** Full `Form` object. Save `id` as your `formId`.

**Errors:**

| Status | i18n key | English message |
|--------|----------|-----------------|
| `400` | `form.duplicateFieldId` | Duplicate field ID in schema |
| `400` | `form.optionsRequired` | This field type requires at least one option |
| `400` | `validation.*` | Zod validation |
| `401` | `auth.*` | Missing/invalid token |
| `403` | `auth.notAuthorized` | Not super admin |

**cURL:**

```bash
curl -s -X POST "$VITE_API_URL/forms" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"Contact Us","submissionUserType":"agent","fields":[{"id":"name","type":"text","label":"Name"}]}'
```

---

## `PUT /forms/:id` — Update form schema

Replace one or more properties on an existing form. At least one property is required in the body.

**Auth:** Super Admin

| Param | Type | Description |
|-------|------|-------------|
| `id` | `string` (UUID) | Form ID |

**Body** (all fields optional; send at least one):

```json
{
  "title": "Contact Us (updated)",
  "description": "Updated copy",
  "fields": [],
  "isPublished": false,
  "submissionUserType": "user"
}
```

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `title` | `string` | No | 1–255 chars |
| `description` | `string` | No | Max 2000 chars |
| `fields` | `FormField[]` | No | Full replacement when sent |
| `isPublished` | `boolean` | No | — |
| `submissionUserType` | `'agent' \| 'user'` | No | — |

**Success `200`:** Updated `Form`.

**Errors:**

| Status | i18n key | English message |
|--------|----------|-----------------|
| `400` | `form.duplicateFieldId` | Duplicate field ID in schema |
| `400` | `form.optionsRequired` | This field type requires at least one option |
| `400` | `validation.*` | Zod validation |
| `400` | `validation.atLeastOneField` | At least one field must be provided |
| `401` | `auth.*` | Missing/invalid token |
| `403` | `auth.notAuthorized` | Not super admin |
| `404` | `form.notFound` | Form not found |

**cURL:**

```bash
curl -s -X PUT "$VITE_API_URL/forms/$FORM_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"Contact Us (updated)","isPublished":false}'
```

---

## `DELETE /forms/:id` — Soft-delete form

Soft-deletes the form **and all its responses**. S3 files from responses are deleted in the background.

**Auth:** Super Admin

| Param | Type | Description |
|-------|------|-------------|
| `id` | `string` (UUID) | Form ID |

**Success `200`:**

```json
{
  "message": "Form deleted successfully"
}
```

After deletion:

- `GET /forms/:id` returns `404`
- The record remains in the DB with `deletedAt` set but is excluded from all API queries

**Errors:**

| Status | i18n key | English message |
|--------|----------|-----------------|
| `401` | `auth.*` | Missing/invalid token |
| `403` | `auth.notAuthorized` | Not super admin |
| `404` | `form.notFound` | Form not found |

**cURL:**

```bash
curl -s -X DELETE "$VITE_API_URL/forms/$FORM_ID" \
  -H "Authorization: Bearer $TOKEN"
```

---

## Field schema rules

| `type` | `options` required | Notes |
|--------|-------------------|-------|
| `text`, `textarea`, `checkbox` | No | — |
| `dropdown`, `multi_dropdown`, `radio`, `multi_radio`, `checkbox_group` | Yes | At least one option string |
| `file` | No | Use `validation.allowedFileTypes` and `validation.maxFileSizeMB` |

- Field `id` values must be unique within a form.
- When updating `fields`, the array replaces the entire schema (not a partial merge).

---

## Error response shape

```json
{
  "statusCode": 400,
  "message": "Human-readable message or array of validation messages",
  "error": "Bad Request"
}
```

Send `Accept-Language: en | hi | gu` for localized `message` text.

---

## Related docs

- [frontend-api-reference.md](./frontend-api-reference.md) — all form endpoints (authenticated + super admin)
- [api-reference.md](./api-reference.md) — full API including `/admins` and `/agents`
