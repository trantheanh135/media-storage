# Deployment Troubleshooting Guide

Solutions for common issues when deploying Media Storage to Kubernetes.

## 🔴 Common Issues

### Pods Not Starting

**Symptom**: Pods stuck in `Pending`, `CrashLoopBackOff`, or `ImagePullBackOff`

**Solutions**:

1. **Check pod status**:
```bash
kubectl describe pod <pod-name> -n media-storage
kubectl logs <pod-name> -n media-storage
```

2. **ImagePullBackOff**: Image not found in registry
```bash
# Verify image exists
docker images | grep media-storage

# Re-tag and push
docker tag media-storage-backend:latest your-registry/media-storage-backend:latest
docker push your-registry/media-storage-backend:latest

# Update deployment
kubectl set image deployment/backend backend=your-registry/media-storage-backend:latest -n media-storage
```

3. **CrashLoopBackOff**: Application crashing on startup
```bash
# View application logs
kubectl logs deployment/backend -n media-storage --tail=100
kubectl logs deployment/frontend -n media-storage --tail=100

# Common reasons:
# - Database not ready
# - Missing environment variables
# - Wrong configuration in ConfigMap
```

4. **Pending**: Waiting for resources
```bash
# Check node capacity
kubectl describe nodes

# Check PV/PVC status
kubectl get pv,pvc -n media-storage

# Try describing the pod
kubectl describe pod <pod-name> -n media-storage
# Look for "Events" section for resource issues
```

---

### PostgreSQL Not Connecting

**Symptom**: Backend throws connection timeout or refused errors

**Check connectivity**:

```bash
# Port-forward to PostgreSQL
kubectl port-forward svc/postgres-service 5432:5432 -n media-storage

# In another terminal, test connection
psql -h localhost -U postgres -d media_storage_db

# If psql not available, test from pod
kubectl exec -it deployment/backend -n media-storage -- nc -zv postgres-service 5432

# Expected output: "succeeded!"
```

**Solutions**:

1. **PostgreSQL pod not running**:
```bash
kubectl get pod -n media-storage -l app=postgres
kubectl logs statefulset/postgres -n media-storage
```

2. **Wrong credentials in Secret**:
```bash
# Check secret values (they're base64-encoded)
kubectl get secret db-secret -n media-storage -o yaml

# Decode to verify
echo "cG9zdGdyZXM=" | base64 -d
# Should output: postgres
```

3. **PersistentVolume issues**:
```bash
kubectl get pvc,pv -n media-storage
kubectl describe pvc postgres-pvc -n media-storage

# Check if path exists on node
ssh user@192.168.1.100
ls -la /var/lib/postgresql/data
```

---

### Keycloak Not Starting

**Symptom**: Keycloak pod stuck in pending or crashing

**Check logs**:

```bash
kubectl logs deployment/keycloak -n media-storage --tail=200
```

**Common issues**:

1. **Database not ready**:
   - Wait for PostgreSQL to be ready first
   - PostgreSQL must exist before Keycloak starts

2. **Configuration error**:
```bash
# Check ConfigMap values
kubectl get configmap keycloak-config -n media-storage -o yaml

# Verify KEYCLOAK_DB_* variables are correct
```

3. **Port conflict** (if 8080 already in use):
```bash
# Check port availability on node
ssh user@192.168.1.100
netstat -tuln | grep 8080
```

**Force restart**:

```bash
# Delete pod to trigger recreation
kubectl delete pod -l app=keycloak -n media-storage

# Wait for new pod
kubectl rollout status deployment/keycloak -n media-storage
```

---

### Backend Can't Connect to Keycloak

**Symptom**: 401 Unauthorized, "Invalid token" errors

**Check connectivity**:

```bash
# From backend pod, test Keycloak
kubectl exec -it deployment/backend -n media-storage -- \
  curl http://keycloak-service:8080/realms/media-storage

# Should return realm info
```

**Solutions**:

1. **Client secret mismatch**:
```bash
# Verify secret in Kubernetes matches Keycloak
kubectl get secret keycloak-secret -n media-storage -o yaml | grep KEYCLOAK_CLIENT_SECRET

# Compare with Keycloak admin console
# Admin → Clients → media-storage-backend → Credentials → Client Secret
```

2. **Update client secret**:
```bash
# Get new secret from Keycloak
# Base64 encode it
echo -n "new-secret-value" | base64

# Update Secret
kubectl set env deployment/backend KEYCLOAK_CLIENT_SECRET=new-secret-value -n media-storage

# Restart backend
kubectl rollout restart deployment/backend -n media-storage
```

3. **Realm not created**:
   - Access Keycloak admin console
   - Create realm: `media-storage`
   - Verify client exists

---

### Frontend Can't Connect to Backend

**Symptom**: CORS errors, 404 on API calls

**Check services**:

```bash
# Verify backend service exists
kubectl get svc backend-service -n media-storage

# Check if backend is accessible
curl http://backend-service:8080/api/auth/info -n media-storage

# If not working, port-forward
kubectl port-forward svc/backend-service 8080:8080 -n media-storage
curl http://localhost:8080/api/auth/info
```

**Solutions**:

1. **Backend service not created**:
```bash
# Check deployment
kubectl get deployment backend -n media-storage

# Recreate deployment
kubectl apply -f k8s/06-backend.yaml
```

2. **CORS configuration**:
   - Check backend logs for CORS errors
   - Verify `spring.web.cors.allowed-origins` in ConfigMap
   - Frontend URL must be listed

3. **API path incorrect**:
   - Frontend proxy in nginx config must be correct
   - Should proxy `/api` to `http://backend-service:8080`

---

### File Upload Failing

**Symptom**: Upload returns 500 error or "Permission denied"

**Check upload directory**:

```bash
# SSH to node
ssh user@192.168.1.100

# Check directory exists and is writable
ls -la /home/uploads
# Should have: drwxrwxrwx permissions

# Check PersistentVolume is mounted
df -h | grep /home/uploads
```

**Solutions**:

1. **Directory doesn't exist**:
```bash
# Create on node
mkdir -p /home/uploads
chmod 777 /home/uploads
```

2. **PVC not mounted in pod**:
```bash
# Check pod mounts
kubectl exec -it deployment/backend -n media-storage -- ls -la /home/uploads

# Should show upload directory
```

3. **Disk full**:
```bash
# Check disk usage
df -h

# If uploads-pv is full, need to delete old files or expand
```

4. **Backend pod can't write**:
```bash
# Check process user
kubectl exec -it deployment/backend -n media-storage -- id

# Test write permission
kubectl exec -it deployment/backend -n media-storage -- touch /home/uploads/test.txt
```

---

### Out of Memory / Resource Issues

**Symptom**: Pods evicted or killed unexpectedly

**Check resource usage**:

```bash
kubectl top pods -n media-storage
kubectl top nodes

# Describe pod for eviction details
kubectl describe pod <pod-name> -n media-storage
# Look for "Reason: Evicted"
```

**Solutions**:

1. **Increase resource requests in manifests**:
```yaml
# k8s/06-backend.yaml
resources:
  requests:
    memory: "512Mi"
    cpu: "500m"
  limits:
    memory: "1Gi"
    cpu: "1000m"
```

Then reapply:
```bash
kubectl apply -f k8s/06-backend.yaml
```

2. **Scale down other workloads** on the node
3. **Add more nodes** to cluster (if possible)

---

### Ingress Not Working

**Symptom**: Can't access via `media-storage.192.168.1.100.nip.io`

**Check ingress controller**:

```bash
# Verify controller is installed
kubectl get deployments -n ingress-nginx

# If not installed:
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.0/deploy/static/provider/baremetal/deploy.yaml

# Wait for controller ready
kubectl rollout status deployment/ingress-nginx-controller -n ingress-nginx
```

**Check ingress**:

```bash
kubectl get ingress -n media-storage
kubectl describe ingress media-storage-ingress -n media-storage

# Check ingress controller logs
kubectl logs -n ingress-nginx -l app.kubernetes.io/name=ingress-nginx --tail=50
```

**Solutions**:

1. **Ingress class mismatch**:
```bash
# Check available classes
kubectl get ingressclasses

# Update ingress manifest to use correct class
```

2. **DNS not resolving**:
   - `nip.io` should auto-resolve
   - Test: `ping media-storage.192.168.1.100.nip.io`
   - Should resolve to 192.168.1.100

3. **Services not found**:
```bash
# Verify services exist
kubectl get svc -n media-storage

# Verify backend/frontend services have correct ports
```

---

### Data Loss on Pod Restart

**Symptom**: Files or database missing after pod restart

**Solutions**:

1. **Check PersistentVolume is mounted**:
```bash
kubectl get pvc -n media-storage
# Status should be "Bound"

kubectl describe pvc uploads-pvc -n media-storage
```

2. **Check hostPath on node**:
```bash
ssh user@192.168.1.100
ls -la /home/uploads
# Should contain uploaded files
```

3. **PVC not mounting properly**:
```bash
# Check pod mounts
kubectl exec -it deployment/backend -n media-storage -- mount | grep uploads

# If not mounted, restart pod
kubectl delete pod -l app=backend -n media-storage
```

---

### Slow Performance

**Symptom**: Uploads/downloads slow, API responses slow

**Check resource bottleneck**:

```bash
# CPU/Memory usage
kubectl top pods -n media-storage

# Network connectivity
kubectl exec -it deployment/backend -n media-storage -- ping -c 5 postgres-service

# Disk I/O
ssh user@192.168.1.100
iostat -x 1 5
```

**Solutions**:

1. **Increase replica count**:
```bash
kubectl scale deployment backend --replicas=3 -n media-storage
kubectl scale deployment frontend --replicas=3 -n media-storage
```

2. **Enable compression** in nginx config

3. **Increase PV read/write cache** (if applicable)

4. **Monitor**:
```bash
# Watch metrics continuously
kubectl top pods -n media-storage --watch
```

---

### Log Inspection

**Get logs from any component**:

```bash
# Streaming logs
kubectl logs deployment/backend -n media-storage -f

# Last 100 lines
kubectl logs deployment/backend -n media-storage --tail=100

# From specific pod
kubectl logs <pod-name> -n media-storage

# From specific container (if multiple)
kubectl logs <pod-name> -c <container-name> -n media-storage

# Previous pod's logs (if pod crashed)
kubectl logs <pod-name> -n media-storage --previous
```

---

## 🔍 Debugging Tools

### Port Forward

```bash
# Access service directly
kubectl port-forward svc/backend-service 8080:8080 -n media-storage
# Now: http://localhost:8080/api/...

# Access pod directly
kubectl port-forward pod/<pod-name> 8080:8080 -n media-storage
```

### Shell into Pod

```bash
# Execute command in pod
kubectl exec -it deployment/backend -n media-storage -- /bin/sh

# Run specific command
kubectl exec deployment/backend -n media-storage -- env | grep KEYCLOAK
```

### Copy Files

```bash
# Copy from pod
kubectl cp media-storage/<pod-name>:/home/uploads ./local-uploads

# Copy to pod
kubectl cp ./file.txt media-storage/<pod-name>:/home/uploads/
```

### Event Logs

```bash
# See what happened in namespace
kubectl get events -n media-storage --sort-by='.lastTimestamp'

# Specific pod events
kubectl describe pod <pod-name> -n media-storage
# "Events" section shows history
```

---

## 🆘 Emergency Procedures

### Rollback Deployment

```bash
# Check rollout history
kubectl rollout history deployment/backend -n media-storage

# Rollback to previous version
kubectl rollout undo deployment/backend -n media-storage

# Rollback to specific revision
kubectl rollout undo deployment/backend --to-revision=2 -n media-storage
```

### Delete and Redeploy

```bash
# Delete deployment
kubectl delete deployment backend -n media-storage

# Reapply manifest
kubectl apply -f k8s/06-backend.yaml

# Watch status
kubectl rollout status deployment/backend -n media-storage
```

### Restart Everything

```bash
# Restart all deployments
kubectl rollout restart deployment -n media-storage

# Or restart specific
kubectl rollout restart deployment/backend -n media-storage
```

---

## 📞 Getting Help

1. **Check pod logs**: `kubectl logs <pod-name> -n media-storage`
2. **Describe pod**: `kubectl describe pod <pod-name> -n media-storage`
3. **Check events**: `kubectl get events -n media-storage`
4. **Check resource usage**: `kubectl top pods -n media-storage`
5. **Review manifests**: Verify all configs in `k8s/` directory

---

## 📝 Keep Logs

When troubleshooting, save relevant logs:

```bash
# Save all pod logs
for pod in $(kubectl get pods -n media-storage -o name); do
  echo "=== $pod ===" >> debug-logs.txt
  kubectl logs $pod -n media-storage >> debug-logs.txt 2>&1
done

# Save describe output
kubectl describe all -n media-storage > debug-describe.txt

# Share logs for support
cat debug-logs.txt
```

---

**Still stuck? Check the main deployment guide: [K8S_DEPLOYMENT.md](./K8S_DEPLOYMENT.md)**
