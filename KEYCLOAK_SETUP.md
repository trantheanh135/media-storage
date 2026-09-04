# Keycloak Setup Guide

## Quick Start

### 1. Start Keycloak & PostgreSQL

```bash
cd backend_code
docker-compose -f docker-compose-backend.yml up -d
```

Wait for services to start (30-60 seconds):
```bash
docker-compose -f docker-compose-backend.yml logs -f keycloak
```

### 2. Access Keycloak Admin Console

- URL: http://localhost:8081
- Username: `admin`
- Password: `admin123`

### 3. Create Realm

1. Click on dropdown "Master" (top-left)
2. Click "Create Realm"
3. Fill in:
   - Name: `media-storage`
   - Click "Create"

### 4. Create Client (Backend)

1. Go to Clients → Create client
2. Fill in:
   - Client ID: `media-storage-backend`
   - Client type: `OpenID Connect`
   - Click "Next"
3. Enable:
   - ✓ Standard flow
   - ✓ Direct access grants
   - Click "Next"
4. Set Valid redirect URIs:
   - `http://localhost:8080/*`
   - `http://localhost:5173/*`
5. Click "Save"

### 5. Get Client Secret

1. Go to Clients → `media-storage-backend`
2. Click "Credentials" tab
3. Copy the secret
4. Update `application.properties`:
   ```properties
   keycloak.credentials.secret=<paste-here>
   ```

### 6. Create Client (Frontend)

1. Go to Clients → Create client
2. Fill in:
   - Client ID: `media-storage-web`
   - Client type: `Single-Page Application`
   - Click "Create"
3. Set Valid redirect URIs:
   - `http://localhost:5173/*`
   - `http://localhost:3000/*`
4. Set Web origins:
   - `http://localhost:5173`
   - `http://localhost:3000`
5. Click "Save"

### 7. Create Test Users

1. Go to Users → Create new user
2. Fill in:
   - Username: `testuser1`
   - Email: `test1@example.com`
   - First name: `Test`
   - Last name: `User`
   - Click "Create"
3. Go to "Credentials" tab
4. Set Password:
   - Password: `Test123!`
   - Confirm: `Test123!`
   - Toggle OFF "Temporary"
   - Click "Set password"

Repeat for more users (e.g., testuser2, testuser3)

### 8. Create Groups (Optional)

1. Go to Groups → New
2. Create:
   - `admins`
   - `users`
   - `developers`
3. Add users to groups

## Verify Setup

### Test Login (Manual)

1. Go to: http://localhost:8081/realms/media-storage/account
2. Login with `testuser1 / Test123!`
3. You should see the account management console

### Test Backend

```bash
# Get token
curl -X POST \
  'http://localhost:8081/realms/media-storage/protocol/openid-connect/token' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'client_id=media-storage-backend' \
  -d 'client_secret=<your-secret>' \
  -d 'username=testuser1' \
  -d 'password=Test123!' \
  -d 'grant_type=password'

# Use token (replace TOKEN)
curl -X GET 'http://localhost:8080/api/auth/me' \
  -H 'Authorization: Bearer TOKEN'
```

### Test Frontend

- Frontend will redirect to Keycloak login automatically
- Try: http://localhost:5173

## Troubleshooting

### Keycloak not starting
```bash
docker-compose logs keycloak
# Check PostgreSQL is running
docker-compose logs postgres
```

### "Invalid client id" error
- Verify client ID in Keycloak matches `application.properties`
- Check realm name is correct

### CORS errors
- Verify `Web origins` in client settings includes your frontend URL
- Check security configuration CORS settings

### Token validation fails
- Ensure `spring.security.oauth2.resourceserver.jwt.issuer-uri` is correct
- Check JWT endpoint: http://localhost:8081/realms/media-storage/.well-known/openid-configuration

## Database

Keycloak uses PostgreSQL for:
- Users
- Realms
- Clients
- Groups
- Sessions

Data persists in `postgres_data` volume.

To reset:
```bash
docker-compose down -v  # Remove volumes
docker-compose up -d     # Start fresh
```

## Production Checklist

- [ ] Change admin password from `admin123`
- [ ] Use HTTPS (not HTTP)
- [ ] Set `KC_DB_URL` to external PostgreSQL
- [ ] Enable `KC_HTTPS_REQUIRED=all`
- [ ] Set proper `KEYCLOAK_ADMIN` credentials
- [ ] Configure email (SMTP)
- [ ] Enable user registration approval
- [ ] Set up backup strategy

## Resources

- Keycloak Docs: https://www.keycloak.org/documentation
- OpenID Connect: https://openid.net/connect/
- JWT Tokens: https://jwt.io
