# Deployment Checklist

Complete this checklist before deploying Media Storage to 192.168.1.100.

## 📋 Pre-Deployment

- [ ] Kubernetes cluster running on 192.168.1.100
- [ ] `kubectl` configured and connected to cluster
- [ ] Docker and docker-compose installed locally
- [ ] Node.js 16+ installed
- [ ] Java 17 JDK installed
- [ ] Maven 3.6+ installed
- [ ] Git repository cloned/initialized
- [ ] 50GB+ disk space available on server (PostgreSQL)
- [ ] 500GB+ disk space available on server (file uploads)

---

## 🐳 Docker Images

- [ ] Built backend image: `docker build -t your-registry/media-storage-backend:latest ./backend_code`
- [ ] Built frontend image: `docker build -t your-registry/media-storage-frontend:latest ./frontend_code`
- [ ] Pushed backend image to registry
- [ ] Pushed frontend image to registry
- [ ] Verified images are accessible from cluster nodes
- [ ] Tested backend image locally
- [ ] Tested frontend image locally

---

## 🔑 Secrets & Configuration

### Kubernetes Secrets

- [ ] Generated base64-encoded secrets:
  - [ ] PostgreSQL username: `postgres` → `cG9zdGdyZXM=`
  - [ ] PostgreSQL password: `postgres` → `cG9zdGdyZXM=`
  - [ ] Keycloak admin username: `admin` → `YWRtaW4=`
  - [ ] Keycloak admin password: `admin123` → `YWRtaW4xMjM=`
  - [ ] Keycloak client secret: (from Keycloak)

- [ ] Updated `k8s/02-secret.yaml` with correct base64 values
- [ ] **NOT** committed secrets to git (add `.env` to `.gitignore`)
- [ ] Verified secret format in YAML (no extra whitespace)

### Keycloak Setup

- [ ] Created Keycloak realm: `media-storage`
- [ ] Created OAuth2 client: `media-storage-backend`
- [ ] Obtained and saved client secret
- [ ] Created realm roles:
  - [ ] `super-admin`
  - [ ] `admin`
  - [ ] `user`
- [ ] Created test super admin user: `superadmin`
- [ ] Created test regular user: `user1`
- [ ] Configured valid redirect URIs:
  - [ ] `http://192.168.1.100:30080/*`
  - [ ] `http://media-storage.192.168.1.100.nip.io/*`
- [ ] Configured web origins
- [ ] Verified token endpoint is accessible from cluster

---

## 🛠️ Kubernetes Manifests

- [ ] Reviewed all K8s manifests in `k8s/` directory:
  - [ ] `00-namespace.yaml` - namespace created
  - [ ] `01-configmap.yaml` - config values correct
  - [ ] `02-secret.yaml` - secrets base64-encoded
  - [ ] `03-storage.yaml` - PV paths match server
  - [ ] `04-postgres.yaml` - database config correct
  - [ ] `05-keycloak.yaml` - Keycloak config correct
  - [ ] `06-backend.yaml` - backend image updated
  - [ ] `07-frontend.yaml` - frontend image updated
  - [ ] `08-ingress.yaml` - Ingress controller installed (if using)

- [ ] All image references updated to correct registry
- [ ] All namespace references are consistent (`media-storage`)
- [ ] PersistentVolume paths exist on node(s)
- [ ] Storage class matches cluster capability (hostPath for single-node)

---

## 📦 Deployment Steps

### Phase 1: Infrastructure

- [ ] Applied namespace: `kubectl apply -f k8s/00-namespace.yaml`
- [ ] Applied ConfigMap: `kubectl apply -f k8s/01-configmap.yaml`
- [ ] Applied Secrets: `kubectl apply -f k8s/02-secret.yaml`
- [ ] Applied Storage: `kubectl apply -f k8s/03-storage.yaml`
- [ ] Verified PVs created: `kubectl get pv -n media-storage`
- [ ] Verified PVCs bound: `kubectl get pvc -n media-storage`

### Phase 2: Data Layer

- [ ] Deployed PostgreSQL: `kubectl apply -f k8s/04-postgres.yaml`
- [ ] Waited for StatefulSet ready: `kubectl rollout status statefulset/postgres -n media-storage`
- [ ] Verified pod running: `kubectl get pod -n media-storage -l app=postgres`
- [ ] Tested database connection from any pod
- [ ] Verified database tables created (Hibernate auto-schema)

### Phase 3: Identity Provider

- [ ] Deployed Keycloak: `kubectl apply -f k8s/05-keycloak.yaml`
- [ ] Waited for deployment ready: `kubectl rollout status deployment/keycloak -n media-storage`
- [ ] Verified pod running: `kubectl get pod -n media-storage -l app=keycloak`
- [ ] Accessed Keycloak admin console
- [ ] Verified realm `media-storage` exists
- [ ] Verified client `media-storage-backend` exists
- [ ] Tested token endpoint: `curl http://192.168.1.100:30081/realms/media-storage/protocol/openid-connect/token`

### Phase 4: Application

- [ ] Deployed Backend: `kubectl apply -f k8s/06-backend.yaml`
- [ ] Waited for deployment ready: `kubectl rollout status deployment/backend -n media-storage`
- [ ] Verified pods running: `kubectl get pod -n media-storage -l app=backend`
- [ ] Checked backend logs: `kubectl logs deployment/backend -n media-storage`
- [ ] Verified health check passing: `curl http://192.168.1.100:30080/api/auth/info`

- [ ] Deployed Frontend: `kubectl apply -f k8s/07-frontend.yaml`
- [ ] Waited for deployment ready: `kubectl rollout status deployment/frontend -n media-storage`
- [ ] Verified pods running: `kubectl get pod -n media-storage -l app=frontend`
- [ ] Checked frontend logs: `kubectl logs deployment/frontend -n media-storage`

### Phase 5: Networking

- [ ] Applied Ingress (if controller available): `kubectl apply -f k8s/08-ingress.yaml`
- [ ] Verified services: `kubectl get svc -n media-storage`
- [ ] Noted NodePort for frontend and Keycloak
- [ ] Tested frontend access via NodePort
- [ ] Tested Keycloak access via NodePort

---

## ✅ Verification Tests

### Connectivity

- [ ] Frontend accessible at: `http://192.168.1.100:30080` (or NodePort)
- [ ] Keycloak accessible at: `http://192.168.1.100:30081` (or NodePort)
- [ ] Backend API responding: `curl http://192.168.1.100:30080/api/auth/info`

### Authentication

- [ ] Can login with `superadmin / superadmin123`
- [ ] Can login with `user1 / [user1-password]`
- [ ] JWT token obtained successfully
- [ ] Logout works correctly

### File Operations

- [ ] Super admin can upload files
- [ ] Super admin can view all files across all groups
- [ ] Super admin can create groups
- [ ] Regular user can create/join groups
- [ ] Regular user can upload files to groups
- [ ] Regular user can only see their group's files
- [ ] File download works
- [ ] Image preview loads
- [ ] Video playback works (all speeds)
- [ ] File deletion works

### Data Persistence

- [ ] Files persist after pod restart
- [ ] Database persists after pod restart
- [ ] File metadata correct in database
- [ ] File storage location correct on server

---

## 🔐 Security Verification

- [ ] HTTPS enabled (if production)
- [ ] JWT validation enabled
- [ ] CORS properly configured (not `*` in production)
- [ ] Secrets not exposed in logs
- [ ] Secrets not committed to git
- [ ] Admin credentials changed from defaults
- [ ] File permissions correct (no world-readable)
- [ ] Database credentials not in environment (use Secrets)
- [ ] Rate limiting configured (if applicable)

---

## 📊 Monitoring & Logs

- [ ] Logs aggregation configured (if applicable)
- [ ] Pod resource usage monitored
- [ ] Health checks passing
- [ ] No errors in pod logs
- [ ] Database connection pool healthy
- [ ] Keycloak token generation healthy

---

## 🚀 Post-Deployment

- [ ] Created backup of database
- [ ] Created backup of upload directory
- [ ] Documented access URLs
- [ ] Documented admin credentials (secure storage)
- [ ] Created runbook for common operations
- [ ] Tested scaling (if needed)
- [ ] Tested rolling updates
- [ ] Tested rollback procedure
- [ ] Configured monitoring/alerting
- [ ] Documented disaster recovery plan

---

## 📝 Sign-Off

- **Deployed By**: ________________  
- **Date**: ________________  
- **Production Environment**: ☐ Yes / ☐ No  
- **Notes**: 

```

```

---

## 🔗 Related Resources

- [K8S_DEPLOYMENT.md](./K8S_DEPLOYMENT.md) - Detailed deployment guide
- [KEYCLOAK_SETUP.md](./KEYCLOAK_SETUP.md) - Keycloak configuration
- [STORAGE_SETUP.md](./STORAGE_SETUP.md) - Storage configuration
- [SUPER_ADMIN_GUIDE.md](./SUPER_ADMIN_GUIDE.md) - Admin features

---

**Keep this checklist for deployment records and future reference!**
