# User Referral Flow — API Reference

Public API guide for the end-user referral onboarding flow: profile submission, state/city selection, agent listing, and agent assignment.

> For admin/agent management, see [api-reference.md](./api-reference.md). For form builder endpoints, see [frontend-api-reference.md](./frontend-api-reference.md).

---

## Quick start

| Item | Value |
|------|-------|
| Base URL (local) | `http://localhost:3000` |
| API prefix | **None** — routes are under `/users` |
| Swagger UI | `GET /docs` (tag: **users**) |
| Content-Type | `application/json` on JSON bodies |
| Authentication | **None** — all endpoints below are public |
| CORS | Enabled for all origins (`*`) |

```ts
const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
```

---

## Recommended flow

Call the endpoints in this order:

1. **`POST /users`** — create user profile; store returned `id`
2. **`GET /users/states`** — populate state dropdown
3. **`GET /users/states/:stateId/cities`** — populate city dropdown after state selection
4. **`GET /users/agents?stateId=&cityId=`** — list agents for the selected location
5. **`PATCH /users/:id/agent`** — assign the chosen agent to the user

```mermaid
flowchart LR
  fillForm["POST /users"]
  selectState["GET /users/states"]
  selectCity["GET /users/states/:stateId/cities"]
  listAgents["GET /users/agents"]
  assignAgent["PATCH /users/:id/agent"]
  fillForm --> selectState --> selectCity --> listAgents --> assignAgent
```

**Location matching:** Agent records store `state` and `city` as **name strings** (e.g. `"Gujarat"`, `"Ahmedabad"`). The public APIs accept numeric `stateId` and `cityId` from the lookup tables; the server resolves those IDs to names before filtering or validating agents.

---

## Internationalization

Send `Accept-Language` on requests for localized error messages:

| Code | Language |
|------|----------|
| `en` | English (default) |
| `hi` | Hindi |
| `gu` | Gujarati |

```http
Accept-Language: hi
```

See [api-reference.md](./api-reference.md#internationalization) for full i18n behavior.

---

## Rate limiting

| Endpoint | Limit |
|----------|-------|
| Global (all routes) | 60 / minute per IP |
| `POST /users` | 10 / minute |
| `PATCH /users/:id/agent` | 10 / minute |

Exceeded limits return `429 Too Many Requests`.

---

## Types

### `User`

Returned by `POST /users` and `PATCH /users/:id/agent`.

```ts
type User = {
  id: string;              // uuid
  firstName: string;
  lastName: string;
  phoneNumber: string;     // exactly 10 digits, no country code
  email: string;
  agentId: string | null;  // null until PATCH /users/:id/agent
  createdAt: string;       // ISO 8601
  updatedAt: string;       // ISO 8601
};
```

### `State`

```ts
type State = {
  id: number;
  name: string;
  stateCode: string;       // e.g. "GJ"
};
```

### `City`

```ts
type City = {
  id: number;
  name: string;
  stateId: number;
};
```

### `Agent` (public list)

Returned by `GET /users/agents`. Password and internal auth fields are omitted.

```ts
type PublicAgent = {
  id: string;
  agentLoginId: string;
  name: string;
  phone: string | null;
  email: string | null;
  isActive: boolean;
  state: string | null;
  city: string | null;
  lastLogin: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
};
```

---

## Endpoints

### `POST /users`

Create a user profile (referral form step 1).

**Auth:** Public  
**Rate limit:** 10 / minute

**Request body:**

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "9876543210",
  "email": "john@example.com"
}
```

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `firstName` | `string` | Yes | 1–255 chars |
| `lastName` | `string` | Yes | 1–255 chars |
| `phoneNumber` | `string` | Yes | Exactly **10 digits**, no country code, spaces, or symbols |
| `email` | `string` | Yes | Valid email, max 255 chars |

**Success `201`:**

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "9876543210",
  "email": "john@example.com",
  "agentId": null,
  "createdAt": "2026-06-17T17:00:00.000Z",
  "updatedAt": "2026-06-17T17:00:00.000Z"
}
```

**Validation errors (`400`):**

| Input | Example message key |
|-------|---------------------|
| Invalid phone | `Phone number must be exactly 10 digits with no country code` |
| Missing first name | `First name is required` |
| Invalid email | `Invalid email address` |

**Example:**

```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "phoneNumber": "9876543210",
    "email": "john@example.com"
  }'
```

---

### `GET /users/states`

List all states for the location picker.

**Auth:** Public

**Request body:** None

**Success `200`:**

```json
[
  {
    "id": 1,
    "name": "Gujarat",
    "stateCode": "GJ"
  },
  {
    "id": 2,
    "name": "Maharashtra",
    "stateCode": "MH"
  }
]
```

Results are ordered by `name` ascending.

**Example:**

```bash
curl http://localhost:3000/users/states
```

---

### `GET /users/states/:stateId/cities`

List cities for a selected state.

**Auth:** Public

**Path parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `stateId` | `number` | Yes | State ID from `GET /users/states` |

**Success `200`:**

```json
[
  {
    "id": 10,
    "name": "Ahmedabad",
    "stateId": 1
  },
  {
    "id": 11,
    "name": "Surat",
    "stateId": 1
  }
]
```

Results are ordered by `name` ascending.

**Errors:**

| Status | When |
|--------|------|
| `404` | State not found |
| `400` | `stateId` is not a valid integer |

**Example:**

```bash
curl http://localhost:3000/users/states/1/cities
```

---

### `GET /users/agents`

List active agents for a state and city.

**Auth:** Public

**Query parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `stateId` | `number` | Yes | State ID from `GET /users/states` |
| `cityId` | `number` | Yes | City ID from `GET /users/states/:stateId/cities` |

The server resolves `stateId` / `cityId` to names and returns agents where `agent.state` and `agent.city` match those names and `isActive` is `true`.

**Success `200`:**

```json
[
  {
    "id": "agent-uuid-1",
    "agentLoginId": "AGT-X7K2M9",
    "name": "Jane Agent",
    "phone": "9876501234",
    "email": "jane@example.com",
    "isActive": true,
    "state": "Gujarat",
    "city": "Ahmedabad",
    "lastLogin": "2026-06-17T10:00:00.000Z",
    "createdById": "admin-uuid",
    "createdAt": "2026-06-01T09:00:00.000Z",
    "updatedAt": "2026-06-17T10:00:00.000Z"
  }
]
```

Returns an empty array `[]` when no matching active agents exist.

**Errors:**

| Status | When |
|--------|------|
| `404` | State or city not found, or city does not belong to the state |
| `400` | Missing or invalid `stateId` / `cityId` |

**Example:**

```bash
curl "http://localhost:3000/users/agents?stateId=1&cityId=10"
```

---

### `PATCH /users/:id/agent`

Assign an agent to a user (final step).

**Auth:** Public  
**Rate limit:** 10 / minute

**Path parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` (uuid) | Yes | User ID from `POST /users` |

**Request body:**

```json
{
  "agentId": "agent-uuid-1",
  "stateId": 1,
  "cityId": 10
}
```

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `agentId` | `string` (uuid) | Yes | Agent ID from `GET /users/agents` |
| `stateId` | `number` | Yes | Must match the state used when listing agents |
| `cityId` | `number` | Yes | Must match the city used when listing agents |

The server verifies:

1. User exists
2. Agent exists and is active
3. Agent's `state` / `city` names match the resolved names for `stateId` / `cityId`

**Success `200`:**

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "9876543210",
  "email": "john@example.com",
  "agentId": "agent-uuid-1",
  "createdAt": "2026-06-17T17:00:00.000Z",
  "updatedAt": "2026-06-17T17:05:00.000Z"
}
```

**Errors:**

| Status | When |
|--------|------|
| `404` | User not found, agent not found, state not found, or city not found |
| `400` | Agent is inactive, or agent location does not match `stateId` / `cityId` |

**Example:**

```bash
curl -X PATCH http://localhost:3000/users/a1b2c3d4-e5f6-7890-abcd-ef1234567890/agent \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "agent-uuid-1",
    "stateId": 1,
    "cityId": 10
  }'
```

---

## Full flow example

```bash
# 1. Create user
USER=$(curl -s -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "phoneNumber": "9876543210",
    "email": "john@example.com"
  }')
USER_ID=$(echo "$USER" | jq -r '.id')

# 2. List states
curl -s http://localhost:3000/users/states | jq

# 3. List cities for state 1
curl -s http://localhost:3000/users/states/1/cities | jq

# 4. List agents for state 1, city 10
AGENTS=$(curl -s "http://localhost:3000/users/agents?stateId=1&cityId=10")
AGENT_ID=$(echo "$AGENTS" | jq -r '.[0].id')

# 5. Assign agent
curl -s -X PATCH "http://localhost:3000/users/${USER_ID}/agent" \
  -H "Content-Type: application/json" \
  -d "{
    \"agentId\": \"${AGENT_ID}\",
    \"stateId\": 1,
    \"cityId\": 10
  }" | jq
```

---

## Error response shape

All errors follow the standard API format:

```json
{
  "statusCode": 404,
  "message": "User with ID abc not found",
  "error": "Not Found"
}
```

Validation failures (`400`) may return `message` as a string array:

```json
{
  "statusCode": 400,
  "message": [
    "phoneNumber: Phone number must be exactly 10 digits with no country code"
  ],
  "error": "Bad Request"
}
```

### User-flow error messages

| Key | English message |
|-----|-----------------|
| `user.notFound` | User with ID {{id}} not found |
| `user.agentNotFound` | Agent with ID {{id}} not found |
| `user.agentInactive` | Selected agent is not active |
| `user.agentLocationMismatch` | Selected agent does not match the provided state and city |
| `location.stateNotFound` | State with ID {{id}} not found |
| `location.cityNotFound` | City with ID {{id}} not found |
| `validation.phoneNumber.invalid` | Phone number must be exactly 10 digits with no country code |

---

## Endpoint summary

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/users` | Public | Create user profile |
| `GET` | `/users/states` | Public | List states |
| `GET` | `/users/states/:stateId/cities` | Public | List cities for a state |
| `GET` | `/users/agents?stateId=&cityId=` | Public | List active agents by location |
| `PATCH` | `/users/:id/agent` | Public | Assign agent to user |

---

## Prerequisites

- **States / cities data** must exist in the database (seed `states` and `cities` tables) for location endpoints to return results.
- **Agents** must have `state` and `city` name fields set (via admin `POST /agents` or `PATCH /agents/:id`) and must be active to appear in `GET /users/agents`.
