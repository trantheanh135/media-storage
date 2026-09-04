# 📸 Media Storage

A modern, full-stack application for uploading, managing, and sharing images and videos with Keycloak authentication and group-based access control.

**Deploy to:** 192.168.1.100 (Kubernetes) | Local development (Docker Compose)

## ✨ Features

- 🔐 **Keycloak Authentication** - Secure OAuth2-based user login
- 👥 **Group-Based Access Control** - Organize files into groups with member access
- 🔑 **Super Admin Role** - System-wide access to all files across all groups
- 📸 **Image Preview** - Full-screen image viewer with metadata display
- 🎬 **Video Playback** - Native HTML5 player with playback speed controls (0.5x - 2x)
- 📤 **Drag & Drop Upload** - Simple file upload with progress tracking
- 🔍 **Search & Filter** - Find files by name or filter by type (images/videos)
- ⬇️ **Download Files** - Download your media files with original names
- 🗑️ **Delete Files** - Remove files you no longer need
- 📁 **File Metadata** - View file size, upload date, description
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile
- 🎨 **Beautiful UI** - Modern interface with Tailwind CSS
- ⚡ **Fast Performance** - Optimized with pagination and lazy loading

## 🛠️ Tech Stack

### Backend
- **Java 17** - Modern Java with records and sealed classes
- **Spring Boot 3.2.0** - Rapid development with Spring ecosystem
- **Spring Security + OAuth2** - Keycloak integration
- **PostgreSQL 15** - Reliable relational database with group/user tables
- **Spring Data JPA** - Easy database operations
- **Lombok** - Reduce boilerplate code
- **Docker** - Containerized deployment

### Frontend
- **React 18** - Modern UI library
- **Vite 5** - Ultra-fast build tool
- **Tailwind CSS 3** - Utility-first CSS framework
- **React Router v6** - Client-side routing
- **Axios** - HTTP client with JWT interceptors
- **Keycloak.js** - OAuth2 authentication adapter
- **HTML5 Video API** - Native video playback with speed controls

### Identity & Access
- **Keycloak 23** - Open-source identity provider
- **JWT Tokens** - Stateless authentication
- **Realm Roles** - RBAC (super-admin, admin, user)
- **Groups** - Data isolation and access control

### Infrastructure
- **Kubernetes** - Orchestration on 192.168.1.100
- **Nginx** - Reverse proxy and static file serving
- **PersistentVolumes** - Data persistence for uploads and database
- **Docker Compose** - Local development setup

## 📋 Prerequisites

- Java 17+
- Node.js 16+
- Maven 3.6+
- Docker & Docker Compose

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/media-storage.git
cd media-storage
```

### 2. Start the Backend

```bash
cd backend_code

# Start PostgreSQL
docker-compose -f docker-compose-backend.yml up -d

# Build and run
mvn clean install
mvn spring-boot:run
```

Backend runs on: `http://localhost:8080`

### 3. Start the Frontend

```bash
cd frontend_code

# Install dependencies
npm install

# Start dev server
npm run dev
```

Frontend runs on: `http://localhost:5173`

## 📚 Project Structure

```
media-storage/
├── backend_code/              # Spring Boot REST API
│   ├── src/main/java/
│   ├── pom.xml
│   └── docker-compose-backend.yml
├── frontend_code/             # React + Vite application
│   ├── src/
│   ├── package.json
│   └── vite.config.js
├── CLAUDE.md                  # Detailed development guide
├── QUICKSTART.md              # Setup instructions
└── README.md                  # This file
```

## 🔌 API Endpoints

Base URL: `http://localhost:8080/api/media`

### Upload & Retrieve
- `POST /upload` - Upload a new file
- `GET /` - Get all files (paginated)
- `GET /{id}` - Get file details
- `GET /{id}/download` - Download file

### Filter & Search
- `GET /type/IMAGE` - Get all images
- `GET /type/VIDEO` - Get all videos
- `GET /search?filename=...` - Search by filename

### Delete
- `DELETE /{id}` - Delete a file

See `CLAUDE.md` for detailed API documentation.

## 🎯 Usage

1. Open `http://localhost:5173` in your browser
2. Drag and drop files into the upload area
3. Optionally add a description
4. Click "Search" to find files
5. Use filter buttons to show only images or videos
6. Click "Download" to save a file
7. Click "Delete" to remove a file

## 📁 File Storage

- **Location**: `backend_code/uploads/`
- **Max Size**: 500MB per file
- **Naming**: UUID-based to prevent collisions
- **Original Names**: Preserved in database for display

## 🔧 Configuration

### Backend (application.properties)

```properties
server.port=8080
spring.datasource.url=jdbc:postgresql://localhost:5432/media_storage_db
spring.datasource.username=postgres
spring.datasource.password=postgres
app.upload.dir=uploads/
spring.servlet.multipart.max-file-size=500MB
```

### Frontend (vite.config.js)

```javascript
server: {
  port: 5173,
  proxy: {
    '/api': {
      target: 'http://localhost:8080'
    }
  }
}
```

## 🧪 Testing

### Backend
```bash
cd backend_code
mvn test
```

### Frontend
```bash
cd frontend_code
npm test
```

## 📦 Build for Production

### Backend
```bash
cd backend_code
mvn clean package -DskipTests
```

### Frontend
```bash
cd frontend_code
npm run build
```

## 🐛 Troubleshooting

**Q: Frontend can't connect to backend**
- Ensure backend is running on port 8080
- Check proxy settings in `vite.config.js`

**Q: Database connection error**
- Verify PostgreSQL is running: `docker-compose ps`
- Check credentials in `application.properties`

**Q: Upload fails**
- Check file is under 500MB
- Ensure only images/videos are uploaded
- Verify `uploads/` directory exists

See `CLAUDE.md` for more troubleshooting tips.

## 📝 Development Notes

- **Drag & Drop**: Implemented with native HTML5 API
- **File Validation**: Server-side validation in `MediaFileService`
- **Pagination**: Frontend loads 12 files per page by default
- **Responsive**: Mobile-first design with Tailwind CSS breakpoints
- **Error Handling**: Comprehensive error messages for user feedback

## 🚢 Deployment

### Option 1: Kubernetes (Recommended for Production)

Deploy to 192.168.1.100 Kubernetes cluster with full HA setup:

**See: [`K8S_DEPLOYMENT.md`](./K8S_DEPLOYMENT.md)**

Complete guide covering:
- Building Docker images
- Pushing to registry
- Creating Kubernetes secrets
- Deploying all components (PostgreSQL, Keycloak, Backend, Frontend)
- Configuring Keycloak authentication
- Accessing via NodePort or Ingress

**Quick Start:**
```bash
cd k8s
REGISTRY=your-docker-registry ./deploy.sh
```

### Option 2: Local Development (Docker Compose)

For local testing and development:

```bash
# Backend
cd backend_code
docker-compose -f docker-compose-backend.yml up -d
mvn spring-boot:run

# Frontend (in new terminal)
cd frontend_code
npm install
npm run dev
```

Access at: `http://localhost:5173`

### Keycloak Setup

Before deploying to Kubernetes, configure Keycloak:

**See: [`KEYCLOAK_SETUP.md`](./KEYCLOAK_SETUP.md)**

Steps:
1. Create realm `media-storage`
2. Create roles (super-admin, admin, user)
3. Create OAuth2 client
4. Create test users
5. Update Kubernetes secrets

### Storage Configuration

**See: [`STORAGE_SETUP.md`](./STORAGE_SETUP.md)**

- Local storage: `/home/uploads/` (on 192.168.1.100)
- Kubernetes: PersistentVolume (500GB)
- Max file size: Configurable (default 500MB)

### Super Admin Features

**See: [`SUPER_ADMIN_GUIDE.md`](./SUPER_ADMIN_GUIDE.md)**

Super admins can:
- View all files across all groups
- Filter by media type (images/videos)
- Search across entire system
- Download/delete any file
- View system statistics

## 🔐 Security Considerations

- **CORS**: Currently allows all origins. Restrict in production.
- **File Validation**: Validates MIME type and file size
- **Filename Sanitization**: Uses UUID to prevent path traversal
- **Add Authentication**: Implement login for multi-user support

## 📚 Documentation

### Deployment & Infrastructure
- **[K8S_DEPLOYMENT.md](./K8S_DEPLOYMENT.md)** - Complete Kubernetes deployment guide (192.168.1.100)
- **[KEYCLOAK_SETUP.md](./KEYCLOAK_SETUP.md)** - Keycloak configuration and user setup
- **[KEYCLOAK_ROLES_SETUP.md](./KEYCLOAK_ROLES_SETUP.md)** - Realm roles and permissions hierarchy
- **[STORAGE_SETUP.md](./STORAGE_SETUP.md)** - File storage configuration
- **[k8s/deploy.sh](./k8s/deploy.sh)** - Automated deployment script

### Development
- **[CLAUDE.md](./CLAUDE.md)** - Detailed development guide and code patterns
- **[QUICKSTART.md](./QUICKSTART.md)** - Local development setup
- **[SUPER_ADMIN_GUIDE.md](./SUPER_ADMIN_GUIDE.md)** - Super admin features and usage

## 🤝 Contributing

1. Create a feature branch (`git checkout -b feature/amazing-feature`)
2. Commit changes (`git commit -m 'Add amazing feature'`)
3. Push to branch (`git push origin feature/amazing-feature`)
4. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 💡 Future Enhancements

- [ ] User authentication (login/register)
- [ ] File sharing (public links)
- [ ] Image resizing / thumbnails
- [ ] Folders / categories
- [ ] File comments
- [ ] Advanced analytics
- [ ] Dark mode theme
- [ ] WebP/HEIC format support

## 📧 Support

For issues and questions, please open an issue on GitHub.

---

**Built with ❤️ using Spring Boot & React**
