# Storage Setup Guide - /home/uploads

## 📁 File Storage Architecture

Files (ảnh, video) sẽ được lưu tại: `/home/uploads/`

```
/home/
├── uploads/                    ← Tất cả files lưu ở đây
│   ├── 550e8400-e29b-41d4.jpg
│   ├── a8d4c5b9-3f2e-41a2.mp4
│   ├── 7f3a2b8c-5d9e-4c1a.png
│   └── ... (all uploaded files)
└── ... (other folders)
```

Database chỉ lưu metadata:
```
media_files table:
├── id: 1
├── original_filename: "vacation.jpg"
├── stored_filename: "550e8400-e29b-41d4.jpg"
├── file_path: "/home/uploads/550e8400-e29b-41d4.jpg"
├── file_size: 2548576
├── file_type: "image/jpeg"
├── media_type: "IMAGE"
└── ... (other fields)
```

---

## 🚀 Setup Steps

### **Step 1: Create /home/uploads directory**

```bash
# Linux/Mac
sudo mkdir -p /home/uploads
sudo chmod 777 /home/uploads  # Give read/write permission

# Or if using docker, create with ownership
sudo mkdir -p /home/uploads
sudo chown -R $USER:$USER /home/uploads
chmod 755 /home/uploads
```

### **Step 2: Verify permissions**

```bash
# Check directory exists and is writable
ls -la /home/ | grep uploads
# Should output: drwxr-xr-x  ... uploads

# Test write permission
touch /home/uploads/test.txt
rm /home/uploads/test.txt
echo "✅ Directory is writable"
```

### **Step 3: Backend configuration (already done)**

`application.properties`:
```properties
app.upload.dir=/home/uploads/
```

---

## 🐳 Running with Docker (Optional)

If you want backend to run in Docker, mount the volume:

### **Option A: Mount host directory to container**

```yaml
# docker-compose-backend.yml
services:
  backend:
    image: media-storage-backend:latest
    volumes:
      - /home/uploads:/home/uploads  # Mount host dir
    ports:
      - "8080:8080"
```

### **Option B: Named volume (persistent)**

```yaml
volumes:
  uploads:
    driver: local
```

---

## 📊 Disk Space Management

### **Monitor disk usage**

```bash
# Check directory size
du -sh /home/uploads/

# Check free space
df -h /home/

# Monitor real-time
watch 'du -sh /home/uploads/'
```

### **Cleanup old files (if needed)**

```bash
# Find files older than 90 days
find /home/uploads/ -mtime +90 -type f

# Delete files older than 90 days
find /home/uploads/ -mtime +90 -type f -delete

# Or delete by pattern
rm /home/uploads/*.old
```

---

## 🔒 Security

### **File Permissions**

```bash
# Owner can read/write
# Group can read
# Others cannot access
chmod 750 /home/uploads/

# Set ownership to backend user
sudo chown -R backend:backend /home/uploads/
```

### **Prevent direct access to /home/uploads**

Nginx configuration (if using Nginx):
```nginx
# Block direct access to uploads
location /home/uploads/ {
    deny all;
}

# Allow downloads through API only
location /api/media/download {
    proxy_pass http://backend:8080;
}
```

---

## 💾 Backup Strategy

### **Daily backup to external drive**

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/mnt/backup/uploads-$(date +%Y-%m-%d)"
mkdir -p "$BACKUP_DIR"

# Copy files
rsync -av /home/uploads/ "$BACKUP_DIR/"

# Keep last 30 days
find /mnt/backup -type d -name "uploads-*" -mtime +30 -exec rm -rf {} \;

echo "✅ Backup completed: $BACKUP_DIR"
```

Schedule with cron:
```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /home/backup.sh >> /home/backup.log 2>&1
```

### **Backup to cloud (optional)**

```bash
# AWS S3
aws s3 sync /home/uploads/ s3://my-backup-bucket/uploads/

# Google Cloud Storage
gsutil -m rsync -r -d /home/uploads/ gs://my-bucket/uploads/
```

---

## 📈 Scaling Considerations

### **Single Server (Current)**
- All files on `/home/uploads/`
- Simple but not redundant
- Max capacity: Disk size

### **Multiple Servers (Future)**
If you scale to multiple backend instances:

**Option 1: Shared NFS**
```bash
# Server A (NFS Server)
exportfs -a /home/uploads/

# Server B (NFS Client)
mount -t nfs server-a:/home/uploads /home/uploads
```

**Option 2: Sync across servers**
```bash
# Continuous sync with rsync
rsync -avz --delete /home/uploads/ server-b:/home/uploads/
```

**Option 3: Cloud storage (S3/GCS)**
Later migration without code change (just update config)

---

## 📋 Maintenance Checklist

- [ ] `/home/uploads` directory created
- [ ] Directory has correct permissions (755 or 750)
- [ ] Disk space monitored
- [ ] Backup strategy implemented
- [ ] Cleanup policy defined (if needed)
- [ ] Virus scanning setup (optional)
- [ ] HTTPS enabled for downloads

---

## 🔧 Troubleshooting

### **"No write permission" error**

```bash
# Check directory permissions
ls -la /home/ | grep uploads

# Fix: Grant write permission
chmod 755 /home/uploads
# or
chmod 777 /home/uploads
```

### **Disk space full**

```bash
# Find largest files
du -sh /home/uploads/* | sort -rh | head -10

# Check total size
du -sh /home/uploads/

# Delete old files
find /home/uploads -mtime +180 -delete
```

### **Docker container can't access directory**

```bash
# Check volume mount
docker inspect <container-id> | grep -A 5 Mounts

# Remount with correct path
docker-compose down
docker-compose up -d
```

### **Permission denied in container**

```bash
# Container user must have access
sudo chown -R 1000:1000 /home/uploads  # For user 1000 in container

# Or run container with current user
docker run --user $(id -u):$(id -g) ...
```

---

## 📊 Storage Statistics

Assuming 100 users, 10 groups, average 50MB per file:

```
Scenario 1: Conservative (10 files per group)
- Groups: 10
- Files per group: 10
- Average file size: 50MB
- Total: 10 × 10 × 50MB = 5GB

Scenario 2: Heavy use (50 files per group)
- Groups: 10
- Files per group: 50
- Average file size: 50MB
- Total: 10 × 50 × 50MB = 25GB

Scenario 3: Very heavy (500 files per group)
- Groups: 10
- Files per group: 500
- Average file size: 50MB
- Total: 10 × 500 × 50MB = 250GB
```

**Recommendation:** 
- Server disk: >= 500GB
- Monitor usage monthly
- Implement cleanup policy if needed

---

## 📚 Quick Reference

```bash
# Create uploads directory
mkdir -p /home/uploads
chmod 755 /home/uploads

# Start backend (uses /home/uploads)
cd backend_code
mvn spring-boot:run

# Check file storage
ls -lah /home/uploads/
du -sh /home/uploads/

# Backup files
rsync -av /home/uploads/ /backup/uploads-$(date +%Y-%m-%d)/

# Test upload
curl -X POST http://localhost:8080/api/media/upload \
  -H "Authorization: Bearer TOKEN" \
  -F "file=@photo.jpg" \
  -F "groupId=1"

# Verify file was saved
ls -la /home/uploads/ | grep photo
```

---

**Everything is set! Files will be stored in `/home/uploads/` 🎉**
