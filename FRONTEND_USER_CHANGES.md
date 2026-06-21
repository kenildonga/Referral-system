# Frontend Changes For User Auth

## What Changed

- User authentication endpoints are now available:
  - `POST /users/login`
  - `POST /users/logout`
- User role is now supported by backend role auth (`AllRoleAuthInterceptor`).
- Routes protected with `AllRoleAuthInterceptor(['all'])` now also accept a valid **user** token.

## API Details

### 1) User Login

- **Method/Path:** `POST /users/login`
- **Auth required:** No
- **Rate limit:** 5 requests/minute

**Request body**

```json
{
  "phoneNumber": "9876543210",
  "password": "Password123"
}
```

**Validation**

- `phoneNumber`: exactly 10 digits (no country code)
- `password`: required

**Success response**

```json
{
  "accessToken": "<jwt_token>",
  "user": {
    "id": "uuid",
    "agentId": null,
    "firstName": "John",
    "lastName": "Doe",
    "phoneNumber": "9876543210",
    "email": "john@example.com",
    "createdAt": "2026-06-21T12:00:00.000Z",
    "updatedAt": "2026-06-21T12:00:00.000Z"
  }
}
```

### 2) User Logout

- **Method/Path:** `POST /users/logout`
- **Auth required:** Yes (`Authorization: Bearer <token>`)

**Success response**

```json
{
  "message": "Logged out successfully"
}
```

## Frontend Implementation Checklist

1. Add user login screen submit call to `POST /users/login`.
2. Save `accessToken` securely after login.
3. Attach token in `Authorization` header for authenticated requests.
4. Implement logout action:
   - call `POST /users/logout`
   - clear local token/session state
   - redirect to login screen
5. Handle `401` globally by clearing session and forcing re-login.

## Important Behavior

- Logout invalidates current token on backend (`tokenVersion` bump).
- Any previously issued token becomes unusable after logout.
- Backend never returns `password` in user objects.

## Error Keys To Map In UI

- `auth.invalidUserPhoneNumberOrPassword`
- `auth.invalidOrExpiredToken`
- `auth.missingAuthHeader`
- `auth.invalidAuthFormat`
- `auth.notAuthorized`
- `ThrottlerException: Too Many Requests`

## Existing User Form API Note

`POST /users` (fill referral form) now requires `password` in request body.

Example:

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "9876543210",
  "email": "john@example.com",
  "password": "Password123"
}
```
