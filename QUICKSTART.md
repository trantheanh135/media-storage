# Media Storage - Quick Start Guide

A simple and elegant application to upload, manage, and share images and videos.

## Project Structure

```
media-storage/
├── backend_code/          # Spring Boot REST API
│   ├── src/main/java/    # Java source code
│   ├── pom.xml           # Maven configuration
│   └── docker-compose-backend.yml
├── frontend_code/         # React + Vite + Tailwind CSS
│   ├── src/              # React components & pages
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
└── README.md
```

## Prerequisites

- **Java 17+**
- **Node.js 16+**
- **Maven 3.6+**
- **Docker & Docker Compose** (for PostgreSQL)

## Backend Setup

### 1. Start PostgreSQL Database

```bash
cd backend_code
docker-compose -f docker-compose-backend.yml up -d
```

Verify the database is running:
```bash
docker-compose -f docker-compose-backend.yml ps
```

### 2. Build and Run Backend

```bash
cd backend_code
mvn clean install
mvn spring-boot:run
```

The backend will start on `http://localhost:8080`

Check API endpoints:
- Health: `http://localhost:8080/api/media`
- Upload: `POST http://localhost:8080/api/media/upload`

## Frontend Setup

### 1. Install Dependencies

```bash
cd frontend_code
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

The frontend will start on `http://localhost:5173`

## Usage

1. Open your browser to `http://localhost:5173`
2. Use the upload area to drag & drop images or videos
3. Click buttons to:
   - **Search** files by name
   - **Filter** by type (Images/Videos)
   - **Download** files
   - **Delete** files

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/media/upload` | Upload a file |
| GET | `/api/media` | Get all files (paginated) |
| GET | `/api/media/type/{type}` | Filter by type (IMAGE/VIDEO) |
| GET | `/api/media/search?filename=...` | Search files |
| GET | `/api/media/{id}` | Get file details |
| GET | `/api/media/{id}/download` | Download file |
| DELETE | `/api/media/{id}` | Delete file |

## Build for Production

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

Output will be in `frontend_code/dist/`

## Troubleshooting

**Frontend can't connect to backend?**
- Make sure backend is running on port 8080
- Check CORS is enabled in `MediaFileController.java`

**Database connection error?**
- Verify PostgreSQL is running: `docker-compose -f docker-compose-backend.yml ps`
- Check credentials in `application.properties`

**Upload fails?**
- Maximum file size is 500MB
- Only images and videos are supported
- Check `uploads/` directory has write permissions

## Features

✅ Drag & drop file upload  
✅ Search by filename  
✅ Filter by media type (image/video)  
✅ Download files  
✅ Delete files  
✅ File metadata (size, upload date)  
✅ Pagination for large file lists  
✅ Responsive design (mobile-friendly)  

## Tech Stack

**Backend:**
- Java 17
- Spring Boot 3.2.0
- PostgreSQL 15
- Spring Data JPA
- Lombok

**Frontend:**
- React 18
- Vite 5
- Tailwind CSS 3
- React Router v6
- Axios

## Environment Variables

Create `.env` in `frontend_code/` if needed:
```
VITE_API_BASE_URL=http://localhost:8080/api
```

## Development Notes

- Backend stores files in `/home/uploads/` directory (persistent on host)
- Database only stores metadata (filename, size, type, path)
- Each file gets a unique UUID-based filename (prevents collisions)
- Original filename is preserved in database for display
- See `STORAGE_SETUP.md` for file storage configuration
- See `KEYCLOAK_SETUP.md` for Keycloak authentication setup

## License

MIT
