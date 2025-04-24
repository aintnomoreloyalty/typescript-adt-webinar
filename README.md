
## Testing flow

### Step 1: Create First User (Self-Registration)

```bash
curl -X POST http://localhost:3000/api/user-registration \
  -H "Content-Type: application/json" \
  -d '{
    "kind": "self",
    "name": "Admin User",
    "email": "admin@example.com",
    "password": "SecurePassword123!",
    "team": "test-team",
    "recaptchaToken": "dummy-recaptcha-token-for-testing"
  }'
```

After this request completes, you'll need to extract the user ID and team slug from the response for the next step. The response should contain something like:
```
{
  "kind": "success",
  "value": {
    "user": { "id": "user_12345", ... },
    "team": { "slug": "test-team", ... }
  }
}
```

### Step 2: Create Invitation 

```bash
curl -X POST http://localhost:3000/api/invitations \
  -H "Content-Type: application/json" \
  -d '{
    "email": "invited@example.com"
  }'
```

From this response, extract the invitation token:
```
{
  "kind": "success",
  "value": {
    "invitation": {
      "token": "invite-abc123def456", 
      ...
    }
  }
}
```

### Step 3: Second User Registers Using Invitation

```bash
curl -X POST http://localhost:3000/api/user-registration \
  -H "Content-Type: application/json" \
  -d '{
    "kind": "invitation",
    "name": "Invited User",
    "password": "SecurePassword123!",
    "inviteToken": "invite-abc123def456",
    "recaptchaToken": "dummy-recaptcha-token-for-testing"
  }'
```

This completes the full flow from user creation → invitation → second user registration. Replace the placeholder values (user_12345, invite-abc123def456) with the actual values from the responses.
