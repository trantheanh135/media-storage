# Getting Started with Media Storage

Welcome! This guide will help you get up and running with the Media Storage application.

## 🎯 Choose Your Path

### 1️⃣ Local Development (5 minutes)

Want to test locally first?

1. Read: [`QUICKSTART.md`](./QUICKSTART.md)
2. Commands:
   ```bash
   cd backend_code
   docker-compose -f docker-compose-backend.yml up -d
   mvn spring-boot:run
   
   # In another terminal
   cd frontend_code
   npm install
   npm run dev
   ```
3. Access: `http://localhost:5173`

---

### 2️⃣ Production Deployment (30-45 minutes)

Deploying to 192.168.1.100 Kubernetes?

**Follow these steps in order:**

#### Step 1: Understand the Architecture
Read: [`README.md`](./README.md) - Get overview of features and tech stack

#### Step 2: Prepare Docker Images
```bash
# Build images
docker build -t your-registry/media-storage-backend:latest ./backend_code
docker build -t your-registry/media-storage-frontend:latest ./frontend_code

# Push to your registry
docker push your-registry/media-storage-backend:latest
docker push your-registry/media-storage-frontend:latest
```

#### Step 3: Configure Keycloak
Read: [`KEYCLOAK_SETUP.md`](./KEYCLOAK_SETUP.md)
- Create realm and roles
- Create OAuth2 client
- Create test users
- Get client secret

#### Step 4: Review Deployment Checklist
Read: [`DEPLOYMENT_CHECKLIST.md`](./DEPLOYMENT_CHECKLIST.md)
- Pre-deployment checks
- Kubernetes manifest review
- Verification tests

#### Step 5: Deploy to Kubernetes

**Option A - Automated (Recommended):**
```bash
cd k8s
REGISTRY=your-docker-registry ./deploy.sh
```

**Option B - Manual:**
Read: [`K8S_DEPLOYMENT.md`](./K8S_DEPLOYMENT.md)
```bash
cd k8s
kubectl apply -f 00-namespace.yaml
kubectl apply -f 01-configmap.yaml
kubectl apply -f 02-secret.yaml
kubectl apply -f 03-storage.yaml
# ... continue with remaining manifests
```

#### Step 6: Verify Deployment
```bash
kubectl get pods -n media-storage
# All pods should be Running

# Test frontend
curl http://192.168.1.100:30080

# Test backend
curl http://192.168.1.100:30080/api/auth/info
```

#### Step 7: Access the Application
- **Frontend**: `http://192.168.1.100:30080` (or NodePort assigned)
- **Keycloak**: `http://192.168.1.100:30081` (or NodePort assigned)
- **API**: `http://192.168.1.100:30080/api`

#### Step 8: Login
1. Click "Login" on frontend
2. Redirected to Keycloak
3. Login with test user credentials created in Step 3
4. Dashboard loads with ability to create groups and upload files

---

## 📚 Documentation Map

### Setup & Deployment
| Document | Purpose | Read Time |
|----------|---------|-----------|
| [QUICKSTART.md](./QUICKSTART.md) | Local development setup | 5 min |
| [GETTING_STARTED.md](./GETTING_STARTED.md) | This file - decision guide | 3 min |
| [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) | Pre-deployment verification | 10 min |
| [K8S_DEPLOYMENT.md](./K8S_DEPLOYMENT.md) | Step-by-step Kubernetes guide | 15 min |
| [KEYCLOAK_SETUP.md](./KEYCLOAK_SETUP.md) | Identity provider configuration | 10 min |

### Operations & Reference
| Document | Purpose | Read Time |
|----------|---------|-----------|
| [DEPLOYMENT_TROUBLESHOOTING.md](./DEPLOYMENT_TROUBLESHOOTING.md) | Common issues & solutions | 20 min |
| [SUPER_ADMIN_GUIDE.md](./SUPER_ADMIN_GUIDE.md) | Admin features overview | 5 min |
| [STORAGE_SETUP.md](./STORAGE_SETUP.md) | File storage configuration | 5 min |
| [KEYCLOAK_ROLES_SETUP.md](./KEYCLOAK_ROLES_SETUP.md) | Role hierarchy details | 5 min |
| [CLAUDE.md](./CLAUDE.md) | Development guide & API docs | 20 min |
| [README.md](./README.md) | Project overview | 10 min |

---

## ✅ Quick Checklist

### For Local Development
- [ ] Java 17 JDK installed
- [ ] Node.js 16+ installed
- [ ] Maven 3.6+ installed
- [ ] Docker & Docker Compose installed
- [ ] Read [`QUICKSTART.md`](./QUICKSTART.md)
- [ ] Backend runs on `http://localhost:8080`
- [ ] Frontend runs on `http://localhost:5173`

### For Kubernetes Deployment
- [ ] Kubernetes cluster on 192.168.1.100
- [ ] `kubectl` configured
- [ ] Docker registry access
- [ ] 50GB+ disk for PostgreSQL
- [ ] 500GB+ disk for uploads
- [ ] Review [`DEPLOYMENT_CHECKLIST.md`](./DEPLOYMENT_CHECKLIST.md)
- [ ] Follow [`K8S_DEPLOYMENT.md`](./K8S_DEPLOYMENT.md)
- [ ] Configure Keycloak using [`KEYCLOAK_SETUP.md`](./KEYCLOAK_SETUP.md)

---

## 🎨 Features Overview

### For All Users
- 📤 Upload images and videos (drag & drop)
- 📸 Preview images and videos in full-screen
- 🎬 Video playback with speed controls (0.5x - 2x)
- 🔍 Search and filter files
- ⬇️ Download files
- 👥 Group-based access control
- 🔐 OAuth2 authentication via Keycloak

### For Super Admins
- 🌍 View all files across all groups
- 📊 System statistics dashboard
- 👤 Manage users and groups
- 🔑 Full system access

### For Group Admins
- 📂 Create and manage groups
- 👥 Manage group members
- 📋 View group files

### For Regular Users
- 👥 Join groups
- 📤 Upload files to groups
- 📸 View/download group files

---

## 🚀 Common Next Steps

### After Local Setup
1. Explore the codebase: [`CLAUDE.md`](./CLAUDE.md)
2. Try the API: Use curl or Postman
3. Modify components in `frontend_code/src`
4. Add database migrations if needed

### After Kubernetes Deployment
1. Create test groups and users
2. Upload sample files
3. Test super admin dashboard
4. Configure monitoring/logging
5. Set up automated backups
6. Document custom configurations

### Production Hardening
1. [ ] Change all default passwords
2. [ ] Configure HTTPS/TLS
3. [ ] Set up monitoring and alerting
4. [ ] Configure log aggregation
5. [ ] Implement backup/restore procedures
6. [ ] Set up CI/CD pipeline
7. [ ] Configure auto-scaling

---

## 🆘 Need Help?

### Common Issues

**Can't start backend?**
→ Check [`DEPLOYMENT_TROUBLESHOOTING.md`](./DEPLOYMENT_TROUBLESHOOTING.md#pods-not-starting)

**Frontend can't connect to backend?**
→ Check [`DEPLOYMENT_TROUBLESHOOTING.md`](./DEPLOYMENT_TROUBLESHOOTING.md#frontend-cant-connect-to-backend)

**Keycloak login not working?**
→ Check [`KEYCLOAK_SETUP.md`](./KEYCLOAK_SETUP.md#troubleshooting) and [`DEPLOYMENT_TROUBLESHOOTING.md`](./DEPLOYMENT_TROUBLESHOOTING.md#keycloak-not-starting)

**File upload failing?**
→ Check [`DEPLOYMENT_TROUBLESHOOTING.md`](./DEPLOYMENT_TROUBLESHOOTING.md#file-upload-failing)

**Kubernetes pod issues?**
→ Check [`DEPLOYMENT_TROUBLESHOOTING.md`](./DEPLOYMENT_TROUBLESHOOTING.md)

---

## 📞 Support Resources

1. **Kubernetes**: [`K8S_DEPLOYMENT.md`](./K8S_DEPLOYMENT.md) - Complete guide
2. **Keycloak**: [`KEYCLOAK_SETUP.md`](./KEYCLOAK_SETUP.md) - Setup and configuration
3. **Troubleshooting**: [`DEPLOYMENT_TROUBLESHOOTING.md`](./DEPLOYMENT_TROUBLESHOOTING.md) - Common issues
4. **Development**: [`CLAUDE.md`](./CLAUDE.md) - Code patterns and architecture
5. **Admin**: [`SUPER_ADMIN_GUIDE.md`](./SUPER_ADMIN_GUIDE.md) - Admin features

---

## 📊 Architecture at a Glance

```
┌─────────────────────────────────────────────────────────┐
│                   192.168.1.100 (Kubernetes)             │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │  Frontend   │  │   Backend    │  │   Keycloak   │   │
│  │ (React)     │  │ (Spring Boot)│  │ (Identity)   │   │
│  │ :30080      │  │ :8080        │  │ :30081       │   │
│  └─────────────┘  └──────────────┘  └──────────────┘   │
│         ↓               ↓                   ↓             │
│  ┌─────────────────────────────────────────────────────┐ │
│  │           PostgreSQL Database :5432                 │ │
│  │        (Users, Groups, Files, Sessions)             │ │
│  └─────────────────────────────────────────────────────┘ │
│         ↓                                                 │
│  ┌─────────────────────────────────────────────────────┐ │
│  │        PersistentVolume /home/uploads               │ │
│  │         (500GB for file storage)                    │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                           │
└─────────────────────────────────────────────────────────┘

Typical Flow:
1. User accesses Frontend (React) on browser
2. Frontend redirects to Keycloak for login
3. Keycloak authenticates user
4. Frontend receives JWT token
5. Frontend makes API requests to Backend with token
6. Backend validates token with Keycloak
7. Backend accesses PostgreSQL for data
8. Backend reads/writes files to /home/uploads
```

---

## 🎓 Learning Resources

### For Beginners
1. Start with [`QUICKSTART.md`](./QUICKSTART.md) for local setup
2. Explore the frontend code in `frontend_code/src`
3. Check API endpoints in [`CLAUDE.md`](./CLAUDE.md)
4. Try uploading and managing files

### For DevOps/Infrastructure
1. Read [`K8S_DEPLOYMENT.md`](./K8S_DEPLOYMENT.md)
2. Review manifests in `k8s/` directory
3. Understand PersistentVolumes and Services
4. Follow the deployment checklist

### For Full-Stack Developers
1. Read [`CLAUDE.md`](./CLAUDE.md) for architecture
2. Explore backend code in `backend_code/src`
3. Explore frontend code in `frontend_code/src`
4. Understand Spring Boot + React patterns

---

## 🎉 You're Ready!

Pick your path above and follow the steps. Good luck! 🚀

**Questions?** Check the troubleshooting guide or review the detailed documentation for your scenario.

---

**Last updated**: 2026-09-04  
**Version**: 1.0 (Initial Release)
