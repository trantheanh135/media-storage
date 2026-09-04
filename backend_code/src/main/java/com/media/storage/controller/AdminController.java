package com.media.storage.controller;

import com.media.storage.dto.MediaFileDTO;
import com.media.storage.model.MediaType;
import com.media.storage.service.AdminService;
import com.media.storage.service.KeycloakUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AdminController {
    private final AdminService adminService;
    private final KeycloakUserService keycloakUserService;

    // ==================== Dashboard ====================

    @GetMapping("/dashboard")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getDashboard() {
        try {
            if (!keycloakUserService.isSuperAdmin()) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Only super-admin can access dashboard"));
            }

            Map<String, Object> dashboard = new HashMap<>();
            dashboard.put("totalFiles", adminService.getTotalFileCount());
            dashboard.put("totalStorage", adminService.getTotalStorageUsed());
            dashboard.put("totalStorageMB", adminService.getTotalStorageUsed() / (1024 * 1024));
            dashboard.put("totalGroups", adminService.getGroupCount());
            dashboard.put("currentUser", keycloakUserService.getCurrentUsername());
            dashboard.put("roles", keycloakUserService.getUserRoles());

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
            byte[] fileContent = adminService.downloadFileAsAdmin(id);
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
        info.put("username", keycloakUserService.getCurrentUsername());
        info.put("email", keycloakUserService.getCurrentUserEmail());
        info.put("roles", keycloakUserService.getUserRoles());
        info.put("isSuperAdmin", keycloakUserService.isSuperAdmin());
        info.put("isAdmin", keycloakUserService.isAdmin());
        return ResponseEntity.ok(info);
    }
}
