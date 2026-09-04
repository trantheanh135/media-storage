# CLAUDE.md - Media Storage Project

Detailed guidance for developing the Media Storage application.

## Project Overview

Media Storage is a full-stack web application for uploading, managing, and sharing images and videos.

**Tech Stack:**
- **Backend**: Java 17, Spring Boot 3.2.0, PostgreSQL, Spring Data JPA
- **Frontend**: React 18, Vite 5, Tailwind CSS, React Router v6, Axios

## Quick Start Commands

### Backend
```bash
cd backend_code

# Start PostgreSQL
docker-compose -f docker-compose-backend.yml up -d

# Build and run
mvn clean install
mvn spring-boot:run

# Run tests
mvn test
```

### Frontend
```bash
cd frontend_code

# Install dependencies
npm install

# Start dev server (http://localhost:5173)
npm run dev

# Build for production
npm run build
```

## Project Structure

### Backend (Spring Boot)

```
backend_code/
├── src/main/java/com/media/storage/
│   ├── controller/       # REST API endpoints
│   │   └── MediaFileController.java
│   ├── service/          # Business logic
│   │   └── MediaFileService.java
│   ├── repository/       # Database access
│   │   └── MediaFileRepository.java
│   ├── model/            # JPA entities
│   │   ├── MediaFile.java
│   │   └── MediaType.java
│   ├── dto/              # Request/response objects
│   │   ├── MediaFileDTO.java
│   │   └── UploadResponse.java
│   └── MediaStorageApplication.java
├── src/main/resources/
│   └── application.properties
├── pom.xml
└── docker-compose-backend.yml
```

**Architecture:**
- **Controller**: HTTP request/response handling (`@RestController`)
- **Service**: Business logic, file validation, database operations
- **Repository**: JPA data access layer
- **Entity**: `MediaFile` - represents a file record in database
- **DTO**: `MediaFileDTO`, `UploadResponse` for API contracts

### Frontend (React + Vite)

```
frontend_code/
├── src/
│   ├── pages/
│   │   └── Dashboard.jsx          # Main page with upload & gallery
│   ├── components/
│   │   ├── Layout.jsx              # Page wrapper
│   │   ├── Header.jsx              # Navigation header
│   │   ├── UploadZone.jsx          # File upload area
│   │   └── MediaCard.jsx           # Individual file display
│   ├── services/
│   │   └── api.js                  # Axios API client
│   ├── App.jsx                     # Root component
│   ├── main.jsx                    # Entry point
│   └── index.css                   # Tailwind imports
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── postcss.config.js
```

**Pages & Components:**
- **Dashboard**: Main page - upload zone, filters, file gallery, search
- **Layout**: Header + page content wrapper
- **Header**: Title and navigation
- **UploadZone**: Drag-drop and description input
- **MediaCard**: Display single file with download/delete buttons

## Database Schema

### media_files table
```sql
CREATE TABLE media_files (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  original_filename VARCHAR(255) NOT NULL,
  stored_filename VARCHAR(255) NOT NULL UNIQUE,
  file_type VARCHAR(50) NOT NULL,
  media_type VARCHAR(20) NOT NULL ENUM('IMAGE', 'VIDEO'),
  file_size BIGINT NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  description TEXT
);
```

**Key Fields:**
- `original_filename`: User-visible name
- `stored_filename`: UUID-based name (prevents collisions)
- `media_type`: Enum - IMAGE or VIDEO
- `file_size`: Bytes
- `file_path`: Location on server filesystem

## API Endpoints

All endpoints are prefixed with `/api/media`

### File Operations

| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| POST | `/upload` | Upload file | multipart/form-data: file, description |
| GET | `/` | List all files (paginated) | Query: page, size |
| GET | `/{id}` | Get file details | - |
| GET | `/{id}/download` | Download file | - |
| DELETE | `/{id}` | Delete file | - |

### Filtering & Search

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/type/IMAGE` | Get images only |
| GET | `/type/VIDEO` | Get videos only |
| GET | `/search?filename=...` | Search by filename |

### Response Format

**Success (200 OK):**
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "file": {
    "id": 1,
    "originalFilename": "photo.jpg",
    "storedFilename": "550e8400-e29b-41d4-a716-446655440000.jpg",
    "fileType": "image/jpeg",
    "mediaType": "IMAGE",
    "fileSize": 2048576,
    "filePath": "uploads/550e8400-e29b-41d4-a716-446655440000.jpg",
    "createdAt": "2026-09-03T10:30:00",
    "updatedAt": "2026-09-03T10:30:00",
    "description": "My photo"
  }
}
```

**Error (400 Bad Request):**
```json
{
  "success": false,
  "message": "File size exceeds maximum limit of 500MB"
}
```

## Code Patterns

### Backend (Java/Spring Boot)

**Service Layer:**
```java
@Service
@RequiredArgsConstructor
public class MediaFileService {
    private final MediaFileRepository mediaFileRepository;
    
    public MediaFileDTO uploadFile(MultipartFile file, String description) throws IOException {
        // Validate
        validateFileType(file.getContentType());
        validateFileSize(file.getSize());
        
        // Generate unique filename
        String storedFilename = UUID.randomUUID().toString() + getExtension(file);
        
        // Save to disk
        file.transferTo(new File(uploadDir + storedFilename));
        
        // Save to database
        MediaFile entity = MediaFile.builder()
            .originalFilename(file.getOriginalFilename())
            .storedFilename(storedFilename)
            .fileType(file.getContentType())
            .mediaType(determineMediaType(file.getContentType()))
            .fileSize(file.getSize())
            .filePath(uploadDir + storedFilename)
            .description(description)
            .build();
        
        entity = mediaFileRepository.save(entity);
        return convertToDTO(entity);
    }
}
```

**Controller:**
```java
@RestController
@RequestMapping("/media")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class MediaFileController {
    private final MediaFileService mediaFileService;
    
    @PostMapping("/upload")
    public ResponseEntity<?> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "description", required = false) String description) {
        try {
            MediaFileDTO uploaded = mediaFileService.uploadFile(file, description);
            return ResponseEntity.ok(UploadResponse.builder()
                .success(true)
                .message("File uploaded successfully")
                .file(uploaded)
                .build());
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(
                UploadResponse.builder()
                    .success(false)
                    .message(e.getMessage())
                    .build());
        }
    }
}
```

### Frontend (React)

**API Service (Axios):**
```javascript
export const mediaAPI = {
  uploadFile: async (file, description = '') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('description', description);
    
    return api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  
  getAllFiles: async (page = 0, size = 12) => {
    return api.get(`?page=${page}&size=${size}`);
  },
  
  deleteFile: async (id) => {
    return api.delete(`/${id}`);
  }
};
```

**Component (Upload):**
```jsx
const UploadZone = ({ onUploadSuccess }) => {
  const handleFile = async (file) => {
    try {
      const response = await mediaAPI.uploadFile(file, description);
      if (response.data.success) {
        onUploadSuccess(response.data.file);
      }
    } catch (error) {
      alert('Upload failed: ' + error.message);
    }
  };
  
  return (
    <div onDragOver={...} onDrop={handleDrop}>
      {/* UI */}
    </div>
  );
};
```

## Configuration

### Backend - application.properties

```properties
# Server
server.port=8080
server.servlet.context-path=/api

# Database
spring.datasource.url=jdbc:postgresql://localhost:5432/media_storage_db
spring.datasource.username=postgres
spring.datasource.password=postgres

# File Upload
spring.servlet.multipart.max-file-size=500MB
spring.servlet.multipart.max-request-size=500MB
app.upload.dir=uploads/

# JPA/Hibernate
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=false
```

### Frontend - Environment Variables

Create `frontend_code/.env` if needed:
```
VITE_API_BASE_URL=http://localhost:8080/api
```

## Development Workflow

### Adding a New Feature

1. **Backend:**
   - Add method to `MediaFileRepository` if querying differently
   - Add business logic to `MediaFileService`
   - Add endpoint to `MediaFileController`
   - Test with Postman or REST Client

2. **Frontend:**
   - Add API method to `services/api.js`
   - Create or update component in `src/components/`
   - Wire into page in `src/pages/`
   - Test in browser

### Example: Add file tagging

1. **Backend** - Add tags column, update entity
2. **Service** - Add tag filtering method
3. **Controller** - Add `/media/tag/{tagName}` endpoint
4. **Frontend** - Add tag input in UploadZone, add tag filter buttons

## Important Constraints

1. **File Storage**: Currently stores in `uploads/` directory on server
2. **Max File Size**: 500MB enforced by both Spring and browser
3. **Supported Types**: Images (JPEG, PNG, GIF, WebP) and Videos (MP4, WebM, OGV)
4. **CORS**: Currently allows all origins (`@CrossOrigin(origins = "*")`). Restrict in production
5. **Database Cleanup**: Deleted files aren't auto-removed from disk if deletion fails
6. **No Authentication**: Currently no user login. Add auth layer for multi-user support

## Deployment

### Docker (Backend)

```dockerfile
FROM openjdk:17-jdk
COPY target/media-storage-1.0.0.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]
```

### Vercel (Frontend)

Deploy `frontend_code/dist/` output to Vercel

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Only images and videos allowed" | Check `validateFileType()` in service |
| File not persisting after download | Verify `app.upload.dir` path exists and is writable |
| CORS errors in browser | Ensure `@CrossOrigin` is on controller |
| Database not found on startup | Run `docker-compose up -d` before starting backend |
| Frontend can't reach backend | Check proxy in `vite.config.js`, verify backend port |

## Performance Tips

- **Pagination**: Always load files with pagination (default 12 items per page)
- **Image preview**: Show thumbnail in gallery, full image on click
- **Lazy loading**: Use `loading="lazy"` on img tags
- **File compression**: Consider compressing images server-side
- **CDN**: Serve uploaded files through CDN in production

## Testing

### Backend Unit Tests

```bash
mvn test
```

### Frontend Component Tests

```bash
npm test
```

## Next Steps

- Add user authentication (login/register)
- Implement file sharing (generate public links)
- Add image resizing / thumbnails
- Support folders / categories
- Real-time file sync
- Analytics dashboard
