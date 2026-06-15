# Referral System — API Reference

API reference for frontend development. All endpoints return JSON unless noted otherwise.

## Base URL

| Environment | URL |
|-------------|-----|
| Local (default) | `http://localhost:3000` |
| Production | Set via your deployment host |

There is **no global API prefix**. Routes are mounted at `/admins` and `/agents`.

Interactive docs (Swagger UI): `GET /docs`

---

## Internationalization

The API returns localized `message` and `error` fields based on the `Accept-Language` request header.

### Supported locales

| Code | Language |
|------|----------|
| `en` | English (default) |
| `hi` | Hindi |
| `gu` | Gujarati |

If the header is missing or contains an unsupported language, responses default to English.

### Usage

Send the header on every request:

```http
Accept-Language: hi
```

Regional tags are supported (`hi-IN`, `gu-IN`, `en-US`). When multiple languages are listed, the first supported match is used:

```http
Accept-Language: fr,hi;q=0.9,en;q=0.8
```

This resolves to Hindi (`hi`).

### Examples

**English (default)** — no header:

```bash
curl -X POST http://localhost:3000/admins/login \
  -H "Content-Type: application/json" \
  -d '{"email":"wrong@example.com","password":"wrong"}'
```

```json
{
  "message": "Invalid email or password",
  "statusCode": 401
}
```

**Hindi:**

```bash
curl -X POST http://localhost:3000/admins/login \
  -H "Content-Type: application/json" \
  -H "Accept-Language: hi" \
  -d '{"email":"wrong@example.com","password":"wrong"}'
```

```json
{
  "message": "अमान्य ईमेल या पासवर्ड",
  "statusCode": 401
}
```

**Validation error with `error` field (Gujarati):**

```bash
curl -X POST http://localhost:3000/admins/login \
  -H "Content-Type: application/json" \
  -H "Accept-Language: gu" \
  -d '{"email":"not-an-email","password":""}'
```

```json
{
  "message": [
    "email: અમાન્ય ઇમેઇલ સરનામું",
    "password: પાસવર્ડ જરૂરી છે"
  ],
  "error": "ખરાબ વિનંતી",
  "statusCode": 400
}
```

### Frontend integration

Store the user's language preference and attach it to all API calls:

```ts
const headers = {
  'Content-Type': 'application/json',
  'Accept-Language': userLocale, // 'en' | 'hi' | 'gu'
};
```

Success responses (`{ message: "..." }`) and error responses are both localized.

---

## Authentication

The API uses **Bearer JWT** tokens. Send the token on every protected request:

```http
Authorization: Bearer <accessToken>
```

### Admin tokens

Obtained from `POST /admins/login`.

JWT payload:

```json
{
  "id": "uuid",
  "role": "admin | superAdmin",
  "tokenVersion": 0
}
```

### Agent tokens

Obtained from `POST /agents/login`.

JWT payload:

```json
{
  "id": "uuid",
  "type": "agent",
  "tokenVersion": 0
}
```

> **Important:** Admin and agent tokens are not interchangeable. An admin token will be rejected on agent-only routes and vice versa.

### Token invalidation

Tokens are invalidated when:

- The user calls logout (`POST /admins/logout` or `POST /agents/logout`)
- Their password is changed or reset (by themselves or an admin)
- Their account is deactivated

On invalidation, the API returns `401` with message `"Invalid or expired token"`. The frontend should clear stored tokens and redirect to login.

### Access levels

| Level | Requirement | Used for |
|-------|-------------|----------|
| Public | None | Login, forgot/reset password |
| Admin | Valid admin JWT | Agent management, admin logout/password |
| Super Admin | Admin JWT + `role: "superAdmin"` | Admin CRUD and admin management |
| Agent | Valid agent JWT | Agent logout/password |

---

## Rate limiting

Global limit: **60 requests per minute** per IP.

Stricter limits on sensitive endpoints:

| Endpoint | Limit |
|----------|-------|
| `POST /admins/login` | 5 / minute |
| `POST /admins/forgot-password` | 3 / minute |
| `POST /admins/reset-password` | 5 / minute |
| `POST /agents/login` | 5 / minute |

Exceeded limits return `429 Too Many Requests`.

---

## Error responses

All errors follow this shape:

```json
{
  "statusCode": 400,
  "message": "Error description or array of validation messages",
  "error": "Bad Request"
}
```

| Field | Type | Notes |
|-------|------|-------|
| `statusCode` | `number` | HTTP status code |
| `message` | `string \| string[]` | Human-readable error(s) |
| `error` | `string` | Omitted for `401` and `500` |

### Validation errors (`400`)

Zod validation failures return `message` as an array:

```json
{
  "statusCode": 400,
  "message": [
    "email: Invalid email address",
    "password: Password must be at least 8 characters"
  ],
  "error": "Bad Request"
}
```

### Common status codes

| Code | Meaning |
|------|---------|
| `400` | Validation error or bad request |
| `401` | Missing/invalid/expired token or wrong credentials |
| `403` | Authenticated but not authorized (e.g. non–super-admin) |
| `404` | Resource not found |
| `409` | Conflict (duplicate email, etc.) |
| `429` | Rate limit exceeded |
| `500` | Internal server error |

---

## Shared types

### `AdminRole`

```ts
type AdminRole = 'superAdmin' | 'admin';
```

### Password rules

Applies to admin passwords and agent password changes:

- Minimum 8 characters, maximum 255
- At least one letter (`a-z` or `A-Z`)
- At least one number (`0-9`)

### `Admin` (safe response)

Password and internal fields are never returned.

```ts
interface Admin {
  id: string;           // UUID
  name: string;
  email: string;
  role: AdminRole;
  isActive: boolean;
  lastLogin: string | null;  // ISO 8601 timestamp
  createdAt: string;         // ISO 8601 timestamp
  updatedAt: string;         // ISO 8601 timestamp
}
```

### `Agent` (safe response)

```ts
interface Agent {
  id: string;           // UUID
  agentLoginId: string; // e.g. "AGT-X7K2M9"
  name: string;
  phone: string | null;
  email: string | null;
  isActive: boolean;
  lastLogin: string | null;  // ISO 8601 timestamp
  createdById: string;       // UUID of creating admin
  createdAt: string;         // ISO 8601 timestamp
  updatedAt: string;         // ISO 8601 timestamp
}
```

### `AgentCredentials`

Returned only when an agent is created or their password is reset by an admin. **Show these once** — they are not retrievable later.

```ts
interface AgentCredentials {
  agentLoginId: string;
  password: string;
}
```

---

## Admin endpoints

Base path: `/admins`

### `POST /admins/login`

Authenticate an admin.

**Auth:** Public  
**Rate limit:** 5/min

**Request body:**

```json
{
  "email": "admin@example.com",
  "password": "password1"
}
```

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `email` | `string` | Yes | Valid email |
| `password` | `string` | Yes | Non-empty |

**Success `200`:**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "admin": { /* Admin */ }
}
```

**Errors:**

| Status | Message |
|--------|---------|
| `401` | `Invalid email or password` |

---

### `POST /admins/forgot-password`

Request a password-reset OTP. Always returns the same message whether or not the email exists (prevents email enumeration).

**Auth:** Public  
**Rate limit:** 3/min

**Request body:**

```json
{
  "email": "admin@example.com"
}
```

**Success `200`:**

```json
{
  "message": "If the email exists, an OTP has been sent"
}
```

> **Dev note:** OTP is currently hardcoded to `1111`. Expires in `OTP_EXPIRES_MINUTES` (default 10 minutes).

---

### `POST /admins/reset-password`

Reset password using OTP from forgot-password flow.

**Auth:** Public  
**Rate limit:** 5/min

**Request body:**

```json
{
  "email": "admin@example.com",
  "otp": "1111",
  "newPassword": "newpass1"
}
```

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `email` | `string` | Yes | Valid email |
| `otp` | `string` | Yes | Non-empty |
| `newPassword` | `string` | Yes | Password rules |

**Success `200`:**

```json
{
  "message": "Password reset successfully"
}
```

**Errors:**

| Status | Message |
|--------|---------|
| `400` | `Invalid or expired OTP` |
| `400` | `Maximum OTP attempts exceeded` |

---

### `POST /admins/logout`

Invalidate the current admin session.

**Auth:** Admin

**Request body:** None

**Success `200`:**

```json
{
  "message": "Logged out successfully"
}
```

---

### `PATCH /admins/me/password`

Change the authenticated admin's own password.

**Auth:** Admin

**Request body:**

```json
{
  "currentPassword": "oldpass1",
  "newPassword": "newpass1"
}
```

**Success `200`:**

```json
{
  "message": "Password changed successfully"
}
```

**Errors:**

| Status | Message |
|--------|---------|
| `401` | `Current password is incorrect` |

> Changing password invalidates all existing tokens for that admin.

---

### `POST /admins`

Create a new admin.

**Auth:** Super Admin

**Request body:**

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "securepass1",
  "role": "admin"
}
```

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `name` | `string` | Yes | 1–255 chars |
| `email` | `string` | Yes | Valid email, max 255 |
| `password` | `string` | Yes | Password rules |
| `role` | `AdminRole` | No | Default: `"admin"` |

**Success `201`:**

```json
{ /* Admin */ }
```

**Errors:**

| Status | Message |
|--------|---------|
| `409` | `Admin with this email already exists` |
| `403` | `You are not authorized to perform this action` |

---

### `GET /admins`

List all admins except the requesting super admin.

**Auth:** Super Admin

**Success `200`:**

```json
[ /* Admin[] */ ]
```

---

### `GET /admins/:id`

Get a single admin by ID.

**Auth:** Super Admin

**Path params:**

| Param | Type | Description |
|-------|------|-------------|
| `id` | `string` | Admin UUID |

**Success `200`:**

```json
{ /* Admin */ }
```

**Errors:**

| Status | Message |
|--------|---------|
| `404` | `Admin with ID <id> not found` |

---

### `PATCH /admins/:id`

Update an admin's profile.

**Auth:** Super Admin

**Request body** (at least one field required):

```json
{
  "name": "Updated Name",
  "email": "newemail@example.com",
  "role": "admin"
}
```

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `name` | `string` | No | 1–255 chars |
| `email` | `string` | No | Valid email, max 255 |
| `role` | `AdminRole` | No | Cannot demote last active super admin |

**Success `200`:**

```json
{ /* Admin */ }
```

**Errors:**

| Status | Message |
|--------|---------|
| `409` | `Admin with this email already exists` |
| `403` | `Cannot demote the last active super admin` |

---

### `PATCH /admins/:id/reset-password`

Reset another admin's password (super admin action).

**Auth:** Super Admin

**Request body:**

```json
{
  "newPassword": "newpass1"
}
```

**Success `200`:**

```json
{
  "message": "Password reset successfully"
}
```

> Invalidates all existing tokens for that admin.

---

### `PATCH /admins/:id/status`

Activate or deactivate an admin account.

**Auth:** Super Admin

**Request body:**

```json
{
  "isActive": false
}
```

**Success `200`:**

```json
{ /* Admin */ }
```

**Errors:**

| Status | Message |
|--------|---------|
| `403` | `You cannot deactivate your own account` |
| `403` | `Cannot deactivate the last active super admin` |

---

## Agent endpoints

Base path: `/agents`

### `POST /agents/login`

Authenticate an agent.

**Auth:** Public  
**Rate limit:** 5/min

**Request body:**

```json
{
  "agentLoginId": "AGT-X7K2M9",
  "password": "aB3xY9kL2mN4"
}
```

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `agentLoginId` | `string` | Yes | Non-empty |
| `password` | `string` | Yes | Non-empty |

**Success `200`:**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "agent": { /* Agent */ }
}
```

**Errors:**

| Status | Message |
|--------|---------|
| `401` | `Invalid agent login ID or password` |

---

### `POST /agents/logout`

Invalidate the current agent session.

**Auth:** Agent

**Request body:** None

**Success `200`:**

```json
{
  "message": "Logged out successfully"
}
```

---

### `PATCH /agents/me/password`

Change the authenticated agent's own password.

**Auth:** Agent

**Request body:**

```json
{
  "currentPassword": "oldpass1",
  "newPassword": "newpass1"
}
```

**Success `200`:**

```json
{
  "message": "Password changed successfully"
}
```

**Errors:**

| Status | Message |
|--------|---------|
| `401` | `Current password is incorrect` |

---

### `POST /agents`

Create a new agent. Login credentials are auto-generated.

**Auth:** Admin (any active admin)

**Request body:**

```json
{
  "name": "John Smith",
  "phone": "+1234567890",
  "email": "john@example.com"
}
```

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `name` | `string` | Yes | 1–255 chars |
| `phone` | `string` | No | Max 50 chars |
| `email` | `string` | No | Valid email, max 255 |

**Success `201`:**

```json
{
  "agent": { /* Agent */ },
  "credentials": {
    "agentLoginId": "AGT-X7K2M9",
    "password": "aB3xY9kL2mN4"
  }
}
```

> Display `credentials` to the admin immediately. The plain-text password cannot be retrieved again.

**Errors:**

| Status | Message |
|--------|---------|
| `409` | `Agent with this email already exists` |

---

### `GET /agents`

List all agents.

**Auth:** Admin

**Success `200`:**

```json
[ /* Agent[] */ ]
```

---

### `GET /agents/:id`

Get a single agent by ID.

**Auth:** Admin

**Path params:**

| Param | Type | Description |
|-------|------|-------------|
| `id` | `string` | Agent UUID |

**Success `200`:**

```json
{ /* Agent */ }
```

**Errors:**

| Status | Message |
|--------|---------|
| `404` | `Agent with ID <id> not found` |

---

### `PATCH /agents/:id`

Update an agent's profile.

**Auth:** Admin

**Request body** (at least one field required):

```json
{
  "name": "Updated Name",
  "phone": "+9876543210",
  "email": "newemail@example.com"
}
```

**Success `200`:**

```json
{ /* Agent */ }
```

**Errors:**

| Status | Message |
|--------|---------|
| `409` | `Agent with this email already exists` |

---

### `DELETE /agents/:id`

Permanently delete an agent.

**Auth:** Admin

**Success `200`:**

```json
{
  "message": "Agent deleted successfully"
}
```

---

### `PATCH /agents/:id/status`

Activate or deactivate an agent account.

**Auth:** Admin

**Request body:**

```json
{
  "isActive": false
}
```

**Success `200`:**

```json
{ /* Agent */ }
```

---

### `PATCH /agents/:id/reset-password`

Generate a new password for an agent.

**Auth:** Admin

**Request body:** None

**Success `200`:**

```json
{
  "message": "Password reset successfully",
  "credentials": {
    "agentLoginId": "AGT-X7K2M9",
    "password": "nEw9pAsSw0rD"
  }
}
```

> Display `credentials` immediately. Invalidates all existing agent tokens.

---

## Frontend integration notes

### Storing tokens

After login, persist `accessToken` (e.g. `localStorage`, `sessionStorage`, or an httpOnly cookie if proxied through your own BFF). Attach it to all authenticated requests via the `Authorization` header.

### Role-based UI

Decode the JWT client-side only for UI hints (show/hide super-admin menus). **Never trust client-side role checks for security** — the API enforces authorization server-side.

To check admin role from token payload:

```ts
const payload = JSON.parse(atob(accessToken.split('.')[1]));
const isSuperAdmin = payload.role === 'superAdmin';
```

### Handling `401` globally

Use an HTTP interceptor to catch `401` responses, clear the stored token, and redirect to the appropriate login page (admin vs agent).

### Date fields

All timestamp fields (`lastLogin`, `createdAt`, `updatedAt`) are ISO 8601 strings. Parse with `new Date(value)` or your date library of choice.

### Content-Type

Send `Content-Type: application/json` on all `POST` and `PATCH` requests with a body.

### Suggested API client setup (fetch)

```ts
const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

async function api<T>(
  path: string,
  options: RequestInit & { token?: string } = {},
): Promise<T> {
  const { token, headers, ...rest } = options;

  const res = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    throw { status: res.status, ...data };
  }

  return data as T;
}

// Example: admin login
const { accessToken, admin } = await api<{
  accessToken: string;
  admin: Admin;
}>('/admins/login', {
  method: 'POST',
  body: JSON.stringify({ email, password }),
});
```

### Route ordering note

Static routes like `/admins/me/password` and `/agents/me/password` are defined before `/:id` routes, so they will not be captured as ID parameters.

---

## Quick reference

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/admins/login` | Public | Admin login |
| `POST` | `/admins/forgot-password` | Public | Request reset OTP |
| `POST` | `/admins/reset-password` | Public | Reset password with OTP |
| `POST` | `/admins/logout` | Admin | Admin logout |
| `PATCH` | `/admins/me/password` | Admin | Change own password |
| `POST` | `/admins` | Super Admin | Create admin |
| `GET` | `/admins` | Super Admin | List admins |
| `GET` | `/admins/:id` | Super Admin | Get admin |
| `PATCH` | `/admins/:id` | Super Admin | Update admin |
| `PATCH` | `/admins/:id/reset-password` | Super Admin | Reset admin password |
| `PATCH` | `/admins/:id/status` | Super Admin | Toggle admin status |
| `POST` | `/agents/login` | Public | Agent login |
| `POST` | `/agents/logout` | Agent | Agent logout |
| `PATCH` | `/agents/me/password` | Agent | Change own password |
| `POST` | `/agents` | Admin | Create agent |
| `GET` | `/agents` | Admin | List agents |
| `GET` | `/agents/:id` | Admin | Get agent |
| `PATCH` | `/agents/:id` | Admin | Update agent |
| `DELETE` | `/agents/:id` | Admin | Delete agent |
| `PATCH` | `/agents/:id/status` | Admin | Toggle agent status |
| `PATCH` | `/agents/:id/reset-password` | Admin | Reset agent password |
