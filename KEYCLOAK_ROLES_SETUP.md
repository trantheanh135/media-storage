# Keycloak Roles Setup

## Roles to Create

### 1. Navigate to Realm Roles

1. Go to Keycloak Admin: http://localhost:8081
2. Login as `admin / admin123`
3. Select Realm: `media-storage`
4. Left menu → Realm roles

### 2. Create super-admin Role

1. Click "Create role"
2. Role name: `super-admin`
3. Description: `Can access all files and manage system`
4. Click "Save"

### 3. Create admin Role

1. Click "Create role"
2. Role name: `admin`
3. Description: `Can manage groups`
4. Click "Save"

### 4. Create user Role

1. Click "Create role"
2. Role name: `user`
3. Description: `Regular user`
4. Click "Save"

---

## Assign Roles to Users

### 1. Go to Users

Realm → Users

### 2. Assign super-admin to test user

1. Click on user (e.g., testuser1)
2. Go to "Role mapping" tab
3. Click "Assign role"
4. Select: `super-admin`
5. Click "Assign"

### 3. Verify role was added

User should now appear under "Assigned roles"

---

## Verify JWT Token Contains Role

### 1. Get token

```bash
curl -X POST \
  'http://localhost:8081/realms/media-storage/protocol/openid-connect/token' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'client_id=media-storage-backend' \
  -d 'client_secret=<your-secret>' \
  -d 'username=testuser1' \
  -d 'password=Test123!' \
  -d 'grant_type=password'
```

Copy the token (everything after `"access_token":"`)

### 2. Decode JWT

Go to https://jwt.io and paste token

Look for:
```json
{
  "realm_access": {
    "roles": ["default-roles-media-storage", "user", "super-admin"]
  }
}
```

If you see `super-admin` in the roles, ✅ it's working!

---

## Quick Reference

| Role | Access | Can Do |
|------|--------|--------|
| super-admin | All files + groups | View all, manage users, delete files |
| admin | Assigned groups | Manage groups, users |
| user | Own groups | Upload, download |

---

## Troubleshooting

### Role not appearing in JWT

1. Check user has role assigned
2. Logout/Login to get new token
3. Clear browser cache
4. Check token at jwt.io

### Can't create role

- Must be logged in as admin
- Check realm is selected (media-storage)
- Try refresh page
