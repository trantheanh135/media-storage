# Kubernetes Deployment Guide (192.168.1.100)

Complete guide to deploy Media Storage app to Kubernetes cluster on 192.168.1.100.

## 📋 Prerequisites

- Kubernetes cluster running on 192.168.1.100
- `kubectl` configured to access the cluster
- Docker registry (ECR, Docker Hub, or private registry)
- 50GB+ disk space for PostgreSQL
- 500GB+ disk space for uploads

## 🐳 Step 1: Build Docker Images

### 1.1 Build Backend Image

```bash
cd backend_code

# Build image
docker build -t your-registry/media-storage-backend:latest .

# Push to registry
docker push your-registry/media-storage-backend:latest
```

### 1.2 Build Frontend Image

```bash
cd frontend_code

# Build image
docker build -t your-registry/media-storage-frontend:latest .

# Push to registry
docker push your-registry/media-storage-frontend:latest
```

Replace `your-registry` with:
- `docker.io/yourname` (Docker Hub)
- `123456789.dkr.ecr.us-east-1.amazonaws.com` (AWS ECR)
- `registry.internal` (Private registry)

---

## 🔑 Step 2: Create Secrets

### 2.1 Update Secret Values (IMPORTANT!)

Edit `k8s/02-secret.yaml` and replace base64 values:

```bash
# Generate base64 encoded values
echo -n "postgres" | base64           # cG9zdGdyZXM=
echo -n "postgres" | base64           # cG9zdGdyZXM=
echo -n "admin" | base64              # YWRtaW4=
echo -n "admin123" | base64           # YWRtaW4xMjM=
echo -n "your-keycloak-secret" | base64  # YOUR ACTUAL SECRET!
```

### 2.2 Apply Secrets

```bash
kubectl apply -f k8s/02-secret.yaml
```

---

## 🚀 Step 3: Deploy to Kubernetes

### 3.1 Create Namespace

```bash
kubectl apply -f k8s/00-namespace.yaml
```

### 3.2 Apply ConfigMap

```bash
kubectl apply -f k8s/01-configmap.yaml
```

### 3.3 Create Storage

```bash
kubectl apply -f k8s/03-storage.yaml
```

Verify PVs created:
```bash
kubectl get pv -n media-storage
```

### 3.4 Deploy PostgreSQL

```bash
kubectl apply -f k8s/04-postgres.yaml

# Wait for StatefulSet
kubectl rollout status statefulset/postgres -n media-storage --timeout=5m
```

Verify:
```bash
kubectl get pods -n media-storage -l app=postgres
```

### 3.5 Deploy Keycloak

```bash
kubectl apply -f k8s/05-keycloak.yaml

# Wait for deployment
kubectl rollout status deployment/keycloak -n media-storage --timeout=5m
```

Verify:
```bash
kubectl get pods -n media-storage -l app=keycloak
```

### 3.6 Deploy Backend

**Important**: Update image in `k8s/06-backend.yaml` first!

```bash
# Edit the image line
kubectl set image deployment/backend \
  backend=your-registry/media-storage-backend:latest \
  -n media-storage

# Or manually edit:
# image: your-registry/media-storage-backend:latest

kubectl apply -f k8s/06-backend.yaml

# Wait for deployment
kubectl rollout status deployment/backend -n media-storage --timeout=5m
```

### 3.7 Deploy Frontend

**Important**: Update image in `k8s/07-frontend.yaml` first!

```bash
kubectl apply -f k8s/07-frontend.yaml

# Wait for deployment
kubectl rollout status deployment/frontend -n media-storage --timeout=5m
```

### 3.8 Apply Ingress (Optional)

```bash
kubectl apply -f k8s/08-ingress.yaml
```

---

## 🔍 Step 4: Verify Deployment

### 4.1 Check All Pods

```bash
# All pods should be Running
kubectl get pods -n media-storage

# Example output:
# NAME                        READY   STATUS    RESTARTS   AGE
# backend-5d4c8b9f7-abc12     1/1     Running   0          5m
# backend-5d4c8b9f7-def45     1/1     Running   0          5m
# frontend-7d9e8c2b3-ghi67    1/1     Running   0          5m
# frontend-7d9e8c2b3-jkl89    1/1     Running   0          5m
# keycloak-abc123def456       1/1     Running   0          10m
# postgres-0                  1/1     Running   0          15m
```

### 4.2 Check Services

```bash
kubectl get svc -n media-storage

# Example output:
# NAME                 TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)
# backend-service      ClusterIP   10.0.0.100      <none>        8080/TCP
# frontend-service     NodePort    10.0.0.101      <none>        80:30080/TCP
# keycloak-service     NodePort    10.0.0.102      <none>        8080:30081/TCP
# postgres-service     ClusterIP   10.0.0.103      <none>        5432/TCP
```

### 4.3 Check PersistentVolumes

```bash
kubectl get pv -n media-storage

# Example output:
# NAME             CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS
# postgres-pv      50Gi       RWO            Retain           Bound
# uploads-pv       500Gi      RWX            Retain           Bound
```

### 4.4 View Logs

```bash
# Backend logs
kubectl logs -f deployment/backend -n media-storage

# Frontend logs
kubectl logs -f deployment/frontend -n media-storage

# Keycloak logs
kubectl logs -f deployment/keycloak -n media-storage

# PostgreSQL logs
kubectl logs -f statefulset/postgres -n media-storage
```

---

## 🌐 Step 5: Access Services

### Option A: NodePort (Simple, no Ingress)

```bash
# Get node port
kubectl get svc -n media-storage

# Frontend: http://192.168.1.100:30080
# Keycloak: http://192.168.1.100:30081
```

### Option B: Ingress (Requires Nginx Ingress Controller)

```bash
# Install Nginx Ingress Controller (if not already installed)
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.0/deploy/static/provider/baremetal/deploy.yaml

# Then apply ingress
kubectl apply -f k8s/08-ingress.yaml

# Access via:
# Frontend: http://media-storage.192.168.1.100.nip.io
# Keycloak: http://keycloak.192.168.1.100.nip.io
# Backend API: http://media-storage.192.168.1.100.nip.io/api
```

---

## 🔧 Step 6: Setup Keycloak

1. Access Keycloak at `http://192.168.1.100:30081` (or via Ingress)
2. Login: `admin / admin123`
3. Follow `KEYCLOAK_ROLES_SETUP.md` to:
   - Create realm: `media-storage`
   - Create clients
   - Create roles
   - Create users

---

## 📊 Step 7: Monitoring & Debugging

### Check Deployment Status

```bash
# Overall status
kubectl get deployments -n media-storage

# Detailed status
kubectl describe deployment backend -n media-storage

# Events
kubectl get events -n media-storage --sort-by='.lastTimestamp'
```

### Scale Replicas

```bash
# Scale backend to 3 replicas
kubectl scale deployment backend --replicas=3 -n media-storage

# Scale frontend to 3 replicas
kubectl scale deployment frontend --replicas=3 -n media-storage
```

### View Resource Usage

```bash
# Top pods
kubectl top pods -n media-storage

# Top nodes
kubectl top nodes
```

### Shell into Container

```bash
# Backend pod shell
kubectl exec -it deployment/backend -n media-storage -- /bin/sh

# Frontend pod shell
kubectl exec -it deployment/frontend -n media-storage -- /bin/sh

# PostgreSQL pod shell
kubectl exec -it statefulset/postgres -n media-storage -- /bin/bash
```

---

## 🔄 Updating Deployment

### Update Backend Image

```bash
# Update image
kubectl set image deployment/backend \
  backend=your-registry/media-storage-backend:v1.1.0 \
  -n media-storage

# Watch rollout
kubectl rollout status deployment/backend -n media-storage
```

### Update Frontend Image

```bash
# Update image
kubectl set image deployment/frontend \
  frontend=your-registry/media-storage-frontend:v1.1.0 \
  -n media-storage

# Watch rollout
kubectl rollout status deployment/frontend -n media-storage
```

### Rollback if Needed

```bash
# Rollback backend
kubectl rollout undo deployment/backend -n media-storage

# Rollback frontend
kubectl rollout undo deployment/frontend -n media-storage
```

---

## 💾 Backup & Recovery

### Backup PostgreSQL

```bash
# Create backup
kubectl exec -it statefulset/postgres -n media-storage -- \
  pg_dump -U postgres media_storage_db > backup.sql

# Restore backup
kubectl exec -it statefulset/postgres -n media-storage -- \
  psql -U postgres media_storage_db < backup.sql
```

### Backup Uploads

```bash
# Copy uploads from PVC
kubectl cp media-storage/backend-5d4c8b9f7-abc12:/home/uploads ./uploads-backup
```

---

## ❌ Troubleshooting

### Pod not starting

```bash
# Check pod status and events
kubectl describe pod <pod-name> -n media-storage
kubectl logs <pod-name> -n media-storage
```

### PersistentVolume not mounting

```bash
# Check PV and PVC
kubectl get pv,pvc -n media-storage
kubectl describe pvc <pvc-name> -n media-storage
```

### Backend can't connect to database

```bash
# Test PostgreSQL connection from pod
kubectl exec -it deployment/backend -n media-storage -- \
  nc -zv postgres-service 5432
```

### Keycloak not accessible

```bash
# Check service
kubectl get svc keycloak-service -n media-storage

# Port forward for testing
kubectl port-forward svc/keycloak-service 8080:8080 -n media-storage
# Then access: http://localhost:8080
```

---

## 📋 Production Checklist

- [ ] Database backups configured
- [ ] Upload storage backups enabled
- [ ] Resource limits/requests set
- [ ] Health checks configured and passing
- [ ] Ingress controller installed
- [ ] SSL/TLS certificates configured
- [ ] Monitoring/alerting setup
- [ ] Log aggregation configured
- [ ] Network policies setup
- [ ] RBAC policies configured
- [ ] Update strategy tested (rolling updates work)
- [ ] Disaster recovery plan documented

---

## 🔗 Related Guides

- `KEYCLOAK_SETUP.md` - Keycloak configuration
- `STORAGE_SETUP.md` - File storage setup
- `SUPER_ADMIN_GUIDE.md` - Admin features
- `QUICKSTART.md` - Quick start guide

---

**Deployment complete! 🎉**
