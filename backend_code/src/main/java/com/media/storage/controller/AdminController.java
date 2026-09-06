package com.media.storage.controller;

import com.media.storage.dto.MediaFileDTO;
import com.media.storage.model.MediaType;
import com.media.storage.service.AdminService;
import com.media.storage.service.AuthenticatedUserService;
import com.media.storage.util.MediaStreamingUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.ResourceRegion;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpRange;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AdminController {
    private final AdminService adminService;
    private final AuthenticatedUserService authenticatedUserService;

    // ==================== Dashboard ====================

    @GetMapping("/dashboard")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getDashboard() {
        try {
            if (!authenticatedUserService.isSuperAdmin()) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Only super-admin can access dashboard"));
            }

            Map<String, Object> dashboard = new HashMap<>();
            dashboard.put("totalFiles", adminService.getTotalFileCount());
            dashboard.put("totalStorage", adminService.getTotalStorageUsed());
            dashboard.put("totalStorageMB", adminService.getTotalStorageUsed() / (1024 * 1024));
            dashboard.put("totalGroups", adminService.getGroupCount());
            dashboard.put("currentUser", authenticatedUserService.getCurrentUsername());
            dashboard.put("roles", authenticatedUserService.getUserRoles());

            return ResponseEntity.ok(dashboard);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ==================== View All Files ====================

    @GetMapping("/files")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getAllFiles(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        try {
            Page<MediaFileDTO> files = adminService.getAllFilesAcrossGroups(page, size);
            return ResponseEntity.ok(files);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/files/type/{type}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getFilesByType(
            @PathVariable MediaType type,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        try {
            Page<MediaFileDTO> files = adminService.getAllFilesOfType(type, page, size);
            return ResponseEntity.ok(files);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/files/search")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> searchAllFiles(
            @RequestParam String filename,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        try {
            Page<MediaFileDTO> files = adminService.searchAllFiles(filename, page, size);
            return ResponseEntity.ok(files);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // ==================== Download/Delete ====================

    @GetMapping("/files/{id}/download")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> downloadFile(@PathVariable Long id) {
        try {
            Resource fileContent = adminService.downloadFileAsAdmin(id);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_TYPE, "application/octet-stream")
                    .body(fileContent);
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to download file"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/files/{id}/stream")
    public ResponseEntity<ResourceRegion> streamFile(@PathVariable Long id, HttpServletRequest request) {
        try {
            MediaFileDTO file = adminService.getFileByIdAsAdmin(id);
            List<HttpRange> ranges = HttpRange.parseRanges(request.getHeader(HttpHeaders.RANGE));
            return MediaStreamingUtil.stream(file.getFilePath(), file.getFileType(), ranges);
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }

    @DeleteMapping("/files/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> deleteFile(@PathVariable Long id) {
        try {
            adminService.deleteFileAsAdmin(id);
            return ResponseEntity.ok(Map.of("message", "File deleted successfully"));
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to delete file"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // ==================== Info ====================

    @GetMapping("/info")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getAdminInfo() {
        Map<String, Object> info = new HashMap<>();
        info.put("username", authenticatedUserService.getCurrentUsername());
        info.put("email", authenticatedUserService.getCurrentUserEmail());
        info.put("roles", authenticatedUserService.getUserRoles());
        info.put("isSuperAdmin", authenticatedUserService.isSuperAdmin());
        info.put("isAdmin", authenticatedUserService.isAdmin());
        return ResponseEntity.ok(info);
    }
}
