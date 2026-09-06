package com.media.storage.controller;

import com.media.storage.dto.MediaFileDTO;
import com.media.storage.dto.UploadResponse;
import com.media.storage.model.Group;
import com.media.storage.model.MediaType;
import com.media.storage.model.User;
import com.media.storage.service.GroupService;
import com.media.storage.service.AuthenticatedUserService;
import com.media.storage.service.MediaFileService;
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
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/media")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class MediaFileController {
    private final MediaFileService mediaFileService;
    private final GroupService groupService;
    private final AuthenticatedUserService authenticatedUserService;

    private Long getCurrentUserId() {
        String userId = authenticatedUserService.getCurrentUserId();
        return userId != null ? Long.valueOf(userId) : null;
    }

    private User getCurrentUser() {
        User user = new User();
        user.setId(getCurrentUserId());
        user.setUsername(authenticatedUserService.getCurrentUsername());
        user.setEmail(authenticatedUserService.getCurrentUserEmail());
        return user;
    }

    @PostMapping("/upload")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam("groupId") Long groupId,
            @RequestParam(value = "description", required = false) String description) {
        try {
            Long userId = getCurrentUserId();
            User user = getCurrentUser();

            if (!groupService.userHasAccessToGroup(userId, groupId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(UploadResponse.builder()
                                .success(false)
                                .message("You don't have access to this group")
                                .build());
            }

            Group group = new Group();
            group.setId(groupId);

            MediaFileDTO uploadedFile = mediaFileService.uploadFile(file, description, group, user);
            return ResponseEntity.ok(UploadResponse.builder()
                    .success(true)
                    .message("File uploaded successfully")
                    .file(uploadedFile)
                    .build());
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(UploadResponse.builder()
                            .success(false)
                            .message("Failed to upload file: " + e.getMessage())
                            .build());
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(UploadResponse.builder()
                            .success(false)
                            .message(e.getMessage())
                            .build());
        }
    }

    @GetMapping("/{groupId}")
    public ResponseEntity<?> getGroupFiles(
            @PathVariable Long groupId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        try {
            Long userId = getCurrentUserId();

            if (!groupService.userHasAccessToGroup(userId, groupId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("You don't have access to this group");
            }

            Group group = new Group();
            group.setId(groupId);

            return ResponseEntity.ok(mediaFileService.getGroupFiles(group, page, size));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/{groupId}/type/{type}")
    public ResponseEntity<?> getGroupFilesByType(
            @PathVariable Long groupId,
            @PathVariable MediaType type,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        try {
            Long userId = getCurrentUserId();

            if (!groupService.userHasAccessToGroup(userId, groupId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("You don't have access to this group");
            }

            Group group = new Group();
            group.setId(groupId);

            return ResponseEntity.ok(mediaFileService.getGroupFilesByType(group, type, page, size));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/{groupId}/search")
    public ResponseEntity<?> searchGroupFiles(
            @PathVariable Long groupId,
            @RequestParam String filename,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        try {
            Long userId = getCurrentUserId();

            if (!groupService.userHasAccessToGroup(userId, groupId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("You don't have access to this group");
            }

            Group group = new Group();
            group.setId(groupId);

            return ResponseEntity.ok(mediaFileService.searchGroupFiles(group, filename, page, size));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/{groupId}/file/{id}")
    public ResponseEntity<?> getFileById(@PathVariable Long groupId, @PathVariable Long id) {
        try {
            Long userId = getCurrentUserId();

            if (!groupService.userHasAccessToGroup(userId, groupId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("You don't have access to this group");
            }

            Group group = new Group();
            group.setId(groupId);

            return ResponseEntity.ok(mediaFileService.getFileById(id, group));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/{groupId}/file/{id}/download")
    public ResponseEntity<?> downloadFile(@PathVariable Long groupId, @PathVariable Long id) {
        try {
            Long userId = getCurrentUserId();

            if (!groupService.userHasAccessToGroup(userId, groupId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("You don't have access to this group");
            }

            Group group = new Group();
            group.setId(groupId);

            Resource fileContent = mediaFileService.downloadFile(id, group);
            MediaFileDTO file = mediaFileService.getFileById(id, group);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\"" + file.getOriginalFilename() + "\"")
                    .header(HttpHeaders.CONTENT_TYPE, file.getFileType())
                    .body(fileContent);
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to download file: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(e.getMessage());
        }
    }

    @GetMapping("/{groupId}/file/{id}/stream")
    public ResponseEntity<ResourceRegion> streamFile(
            @PathVariable Long groupId,
            @PathVariable Long id,
            HttpServletRequest request) {
        try {
            Long userId = getCurrentUserId();

            if (!groupService.userHasAccessToGroup(userId, groupId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }

            Group group = new Group();
            group.setId(groupId);

            MediaFileDTO file = mediaFileService.getFileById(id, group);
            List<HttpRange> ranges = HttpRange.parseRanges(request.getHeader(HttpHeaders.RANGE));
            return MediaStreamingUtil.stream(file.getFilePath(), file.getFileType(), ranges);
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    @DeleteMapping("/{groupId}/file/{id}")
    public ResponseEntity<?> deleteFile(@PathVariable Long groupId, @PathVariable Long id) {
        try {
            Long userId = getCurrentUserId();

            if (!groupService.userHasAccessToGroup(userId, groupId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("You don't have access to this group");
            }

            Group group = new Group();
            group.setId(groupId);

            mediaFileService.deleteFile(id, group);
            return ResponseEntity.ok("File deleted successfully");
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to delete file: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(e.getMessage());
        }
    }
}
