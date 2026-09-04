# Super Admin Guide

## 🛡️ What is Super Admin?

A **Super Admin** account has:
- ✅ Access to **ALL files** across all groups
- ✅ Access to **ALL groups**
- ✅ View **system statistics** (total files, storage used, etc)
- ✅ **Download/Delete** any file
- ✅ **Admin Dashboard** with full system overview
- ✅ Can see all uploaded content regardless of group membership

Regular users only see their own groups and files.

---

## 📋 Setup Steps

### **Step 1: Create Realm Roles in Keycloak**

1. Go to Keycloak Admin: http://localhost:8081
2. Login: `admin / admin123`
3. Select Realm: `media-storage`
4. Left menu → **Realm roles**

### **Step 2: Create super-admin Role**

1. Click "Create role"
2. Role name: `super-admin`
3. Description: `Can access all files and manage system`
4. Click "Save"

### **Step 3: Assign Role to User**

1. Go to **Users**
2. Click on your test user (e.g., testuser1)
3. Tab: **Role mapping**
4. Click "Assign role"
5. Select: `super-admin`
6. Click "Assign"

### **Step 4: Verify Role in Token**

1. Logout and login again (to get new token with role)
2. Go to http://localhost:5173
3. Should now see **"🛡️ Admin Dashboard"** button

---

## 🚀 Using Admin Dashboard

### **Access Admin Panel**

On the main dashboard, click the **"🛡️ Admin Dashboard"** button (appears for super-admin only)

### **Dashboard Tab**

Shows system statistics:
- **Total Files**: All files across all groups
- **Storage Used**: Total disk space used
- **Total Groups**: Number of groups in system
- **Access Level**: Confirms super-admin status

Example:
```
📁 Total Files: 1,234
💾 Storage Used: 256.50 GB
👥 Total Groups: 45
🛡️ Access Level: Super Admin
```

### **All Files Tab**

Browse and manage all files in system:
- **Search**: Find files by name (searches ALL files)
- **Filter**: View only images or videos (system-wide)
- **Download**: Download any file from any group
- **Delete**: Delete any file from any group

---

## 🔍 Features

### **View All Files**

```
GET /admin/files?page=0&size=12
```

Shows all uploaded files across all groups with pagination.

### **Filter by Type**

```
GET /admin/files/type/IMAGE
GET /admin/files/type/VIDEO
```

View only images or videos system-wide.

### **Search All Files**

```
GET /admin/files/search?filename=photo
```

Search by filename across entire system.

### **Download Any File**

```
GET /admin/files/{id}/download
```

Download file from any group (normal users can only download from their groups).

### **Delete Any File**

```
DELETE /admin/files/{id}
```

Delete file from any group (normal users cannot do this).

### **System Statistics**

```
GET /admin/dashboard
```

Returns:
```json
{
  "totalFiles": 1234,
  "totalStorage": 274877906944,
  "totalStorageMB": 262144,
  "totalGroups": 45,
  "currentUser": "admin-user",
  "roles": ["default-roles-media-storage", "super-admin"]
}
```

---

## 👥 Multi-Role Example

### **User Permissions**

| Action | Super Admin | Group Owner | Group Member | Regular User |
|--------|------------|------------|--------------|--------------|
| View own group files | ✅ | ✅ | ✅ | ❌ |
| Download any file | ✅ | ❌ | ❌ | ❌ |
| Delete any file | ✅ | ❌ | ❌ | ❌ |
| View admin dashboard | ✅ | ❌ | ❌ | ❌ |
| Search all files | ✅ | ❌ | ❌ | ❌ |
| View system stats | ✅ | ❌ | ❌ | ❌ |
| Create groups | ✅ | ✅ | ✅ | ✅ |
| Manage group members | ✅ | ✅ | ❌ | ❌ |

---

## 🔒 Security Notes

### **Role is in JWT Token**

```json
{
  "realm_access": {
    "roles": ["default-roles-media-storage", "super-admin"]
  }
}
```

Backend **validates role** on every admin API request:

```java
@GetMapping("/admin/files")
public ResponseEntity<?> getAllFiles(...) {
    if (!keycloakUserService.isSuperAdmin()) {
        throw new RuntimeException("Only super-admin can access");
    }
    // ...
}
```

**Admin endpoints are protected** - cannot be accessed without super-admin role.

---

## 📊 Admin Dashboard Layout

```
┌─────────────────────────────────────────────────────────┐
│              🛡️ Super Admin Dashboard                    │
│  Logged in as: admin-user | Roles: super-admin          │
└─────────────────────────────────────────────────────────┘

┌──────────────┬──────────────┬──────────────┬──────────────┐
│   📊         │   💾         │    👥        │    🛡️        │
│ Dashboard    │  All Files   │              │              │
└──────────────┴──────────────┴──────────────┴──────────────┘

Dashboard View:
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│     📁           │ │    💾            │ │     👥           │ │     🛡️           │
│  Total Files     │ │  Storage Used    │ │  Total Groups    │ │  Access Level    │
│     1,234        │ │    256.50 GB     │ │      45          │ │  Super Admin     │
└──────────────────┘ └──────────────────┘ └──────────────────┘ └──────────────────┘

All Files View:
[Search box] [Search] [Clear] | [All] [Images] [Videos]

┌──────────────────────────────────────────────────────────┐
│ File Card 1      │ File Card 2      │ File Card 3        │
├──────────────────┼──────────────────┼────────────────────┤
│ name             │ name             │ name               │
│ [⬇️Download]     │ [⬇️Download]     │ [⬇️Download]       │
│ [🗑️Delete]       │ [🗑️Delete]       │ [🗑️Delete]        │
└──────────────────┴──────────────────┴────────────────────┘

[Load More]
```

---

## 🚨 Troubleshooting

### **"Only super-admin can access" error**

**Problem**: Admin dashboard shows access denied

**Solution**:
1. Check user has `super-admin` role assigned
2. Logout completely
3. Clear browser cookies/cache
4. Login again
5. You should see new token with role

### **Admin button not showing**

**Problem**: No "🛡️ Admin Dashboard" button visible

**Solution**:
1. Check user has `super-admin` role in Keycloak
2. Verify role is in JWT token (jwt.io)
3. Refresh page (Ctrl+F5)
4. Check browser console for errors

### **Role not in JWT**

**Problem**: Token doesn't contain realm_access/roles

**Solution**:
1. Go to Keycloak
2. Users → Your user
3. Role mapping → Check `super-admin` is assigned
4. Logout and login again

---

## 📝 API Endpoints for Super Admin

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/dashboard` | System statistics |
| GET | `/admin/files` | All files paginated |
| GET | `/admin/files/type/{type}` | Files of type (IMAGE/VIDEO) |
| GET | `/admin/files/search?filename=...` | Search all files |
| GET | `/admin/files/{id}/download` | Download any file |
| DELETE | `/admin/files/{id}` | Delete any file |
| GET | `/admin/info` | Current admin info |

---

## 🔐 Implementation Details

### **Backend**

- **AdminService**: Business logic for admin operations
- **AdminController**: Admin API endpoints
- **KeycloakUserService**: Check if user has super-admin role

### **Frontend**

- **AdminDashboard.jsx**: Admin UI page
- **adminAPI**: API calls for admin endpoints
- App shows admin button if user has super-admin role

### **Security**

- Role is in JWT token from Keycloak
- Backend validates role on every request
- No permission escalation possible (cannot assign yourself roles)

---

## 🎯 Use Cases

### **Scenario 1: Manage Storage**
- Super admin views total storage used
- Identifies large old files
- Deletes unnecessary files to free space

### **Scenario 2: Audit Files**
- Super admin searches for specific files
- Verifies all uploads are appropriate
- Downloads for backup if needed

### **Scenario 3: System Maintenance**
- View total files and groups count
- Monitor storage usage trends
- Delete files when storage is full

### **Scenario 4: User Support**
- User loses file by accident
- Super admin can find and re-download it
- Or restore from backup if available

---

## 📚 Related Guides

- `KEYCLOAK_SETUP.md` - How to setup Keycloak and roles
- `KEYCLOAK_ROLES_SETUP.md` - Create realm roles
- `QUICKSTART.md` - Quick start guide
- `STORAGE_SETUP.md` - Storage configuration

---

**Everything is ready! Super Admin feature is live! 🎉**
