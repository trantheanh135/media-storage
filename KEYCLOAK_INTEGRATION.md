# Keycloak Integration Guide

## Architecture

```
┌─────────────┐                    ┌──────────────┐
│   Frontend  │                    │   Backend    │
│   (React)   │◄──── OAuth2 ──────►│(Spring Boot) │
└─────────────┘                    └──────────────┘
       ▲                                   ▲
       │                                   │
       │          ┌──────────────┐         │
       └──────────│  Keycloak    │◄────────┘
                  │ (Realm Auth) │
                  └──────────────┘
                         │
                         ▼
                  ┌──────────────┐
                  │ PostgreSQL   │
                  │(Users, Roles)│
                  └──────────────┘
```

## Setup Steps

### 1. Start Services

```bash
cd backend_code
docker-compose -f docker-compose-backend.yml up -d
```

Wait for Keycloak to be ready:
```bash
docker-compose logs -f keycloak | grep "WARN  [org.jboss.as.server]"
```

### 2. Configure Keycloak

Follow `KEYCLOAK_SETUP.md` to:
- Access http://localhost:8081
- Create realm: `media-storage`
- Create client: `media-storage-backend`
- Create client: `media-storage-web`
- Create test users

### 3. Update Backend Configuration

In `backend_code/src/main/resources/application.properties`:

```properties
# Get client secret from Keycloak admin console
keycloak.credentials.secret=<your-client-secret>

# Point to your Keycloak instance
keycloak.auth-server-url=http://localhost:8081
spring.security.oauth2.resourceserver.jwt.issuer-uri=http://localhost:8081/realms/media-storage
```

### 4. Run Backend

```bash
cd backend_code
mvn spring-boot:run
```

### 5. Run Frontend

```bash
cd frontend_code
npm install
npm run dev
```

## How It Works

### Authentication Flow

1. **User opens app** → http://localhost:5173
2. **App initializes Keycloak** → `initKeycloak()`
3. **Keycloak checks SSO** → silent check-sso
4. **User not logged in** → Redirect to Keycloak login
5. **User enters credentials** → Keycloak validates
6. **Keycloak returns token** → Authorization Code Flow
7. **Frontend stores token** → In memory (not localStorage)
8. **Frontend redirects** → Back to app
9. **App shows Dashboard** → Groups, files, upload

### Token Management

```javascript
// Keycloak automatically manages tokens
import keycloak from './services/keycloak';

// Get current token
const token = keycloak.token;

// Refresh token (auto-refreshed by API interceptor)
await keycloak.refreshToken(30);

// Logout
keycloak.logout();
```

### API Request Flow

```
Frontend                     Backend
   │                          │
   ├─ GET /media/1            │
   │ (+ Authorization header)  │
   ├─────────────────────────►│
   │                          │
   │                     Validate JWT
   │                     Check token claims
   │                          │
   │       Return data        │
   │◄─────────────────────────┤
   │                          │
```

## Backend Implementation

### Security Configuration

```java
@Configuration
@EnableWebSecurity
public class SecurityConfiguration {
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) {
        return http
            .oauth2ResourceServer()
            .jwt()
            .jwtAuthenticationConverter(jwtAuthenticationConverter())
            .build();
    }
}
```

### Get Current User Info

```java
@Service
public class KeycloakUserService {
    
    public String getCurrentUsername() {
        Jwt jwt = (Jwt) SecurityContextHolder.getContext()
            .getAuthentication().getPrincipal();
        return jwt.getClaimAsString("preferred_username");
    }
    
    public String getCurrentUserId() {
        return jwt.getClaimAsString("sub");
    }
}
```

### API Endpoints (Keycloak-aware)

```java
@RestController
@RequestMapping("/media")
public class MediaFileController {
    
    @PostMapping("/upload")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> uploadFile(...) {
        // User info extracted from JWT token
        String username = keycloakUserService.getCurrentUsername();
        // ... upload logic
    }
}
```

## Frontend Implementation

### Initialize Keycloak

```javascript
// App.jsx
import { initKeycloak, login } from './services/keycloak';

useEffect(() => {
    initKeycloak().then((authenticated) => {
        if (!authenticated) {
            login(); // Redirect to Keycloak login
        }
    });
}, []);
```

### Use Token in API Calls

```javascript
// api.js
import keycloak from './services/keycloak';

api.interceptors.request.use((config) => {
    config.headers.Authorization = `Bearer ${keycloak.token}`;
    return config;
});
```

### Auto-refresh Tokens

```javascript
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            await keycloak.refreshToken(30);
            // Retry request with new token
        }
    }
);
```

### Get User Info

```javascript
import { getUserInfo } from './services/keycloak';

const userInfo = getUserInfo();
console.log(userInfo.username, userInfo.email);
```

## Token Structure

When you decode a JWT from Keycloak, it looks like:

```json
{
  "exp": 1694836800,
  "iat": 1694836500,
  "auth_time": 1694836400,
  "jti": "abc123def456",
  "iss": "http://localhost:8081/realms/media-storage",
  "aud": "media-storage-web",
  "sub": "550e8400-e29b-41d4-a716-446655440000",
  "typ": "Bearer",
  "azp": "media-storage-web",
  "session_state": "xyz789",
  "acr": "1",
  "allowed-origins": ["http://localhost:5173"],
  "realm_access": {
    "roles": ["user", "admin"]
  },
  "resource_access": {
    "media-storage-web": {
      "roles": ["user"]
    }
  },
  "name": "Test User",
  "preferred_username": "testuser1",
  "given_name": "Test",
  "family_name": "User",
  "email": "testuser@example.com"
}
```

## Troubleshooting

### CORS Errors

**Problem**: "Access to XMLHttpRequest blocked by CORS policy"

**Solution**: 
1. Go to Keycloak admin console
2. Clients → `media-storage-web`
3. Set "Web origins": `http://localhost:5173`
4. Save

### Token Validation Fails

**Problem**: 401 Unauthorized on API requests

**Solution**:
1. Check `issuer-uri` in application.properties
2. Verify Keycloak is running: http://localhost:8081
3. Check token is valid: https://jwt.io
4. Verify client secret is correct

### User Not Logged In

**Problem**: Keeps redirecting to Keycloak login

**Solution**:
1. Clear browser cache/cookies
2. Check Keycloak is running
3. Verify client ID: `media-storage-web`
4. Check redirect URIs in client settings

### Keycloak Not Starting

**Problem**: Docker container exits

**Solution**:
```bash
docker-compose logs keycloak
# Check PostgreSQL is running
docker-compose logs postgres
# Reset everything
docker-compose down -v
docker-compose up -d
```

## Production Deployment

### Environment Variables

```bash
# Keycloak
KC_DB_URL=jdbc:postgresql://postgres.example.com/keycloak
KC_DB_USERNAME=keycloak_user
KC_DB_PASSWORD=secure_password
KEYCLOAK_ADMIN=admin
KEYCLOAK_ADMIN_PASSWORD=secure_password

# Frontend
VITE_KEYCLOAK_URL=https://auth.example.com
VITE_KEYCLOAK_REALM=media-storage
VITE_KEYCLOAK_CLIENT=media-storage-web

# Backend
keycloak.auth-server-url=https://auth.example.com
spring.security.oauth2.resourceserver.jwt.issuer-uri=https://auth.example.com/realms/media-storage
```

### SSL/TLS

```properties
# application.properties
keycloak.ssl-required=all
server.ssl.key-store=classpath:keystore.jks
server.ssl.key-store-password=changeit
```

### Keycloak Production Mode

```bash
# Replace 'start-dev' with 'start' in docker-compose
command: start --https-key-store-file=/etc/keycloak/keystore.jks
```

## References

- Keycloak Docs: https://www.keycloak.org/documentation
- OAuth 2.0 / OIDC: https://openid.net/connect/
- Spring Security OAuth2: https://spring.io/projects/spring-security-oauth2
- Keycloak JS Adapter: https://www.keycloak.org/docs/latest/securing_apps/#_javascript_adapter
