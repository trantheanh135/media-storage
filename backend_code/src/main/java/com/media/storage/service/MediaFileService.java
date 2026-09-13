package com.media.storage.service;

import com.media.storage.dto.MediaFileDTO;
import com.media.storage.model.MediaFile;
import com.media.storage.model.MediaType;
import com.media.storage.model.Group;
import com.media.storage.model.User;
import com.media.storage.repository.MediaFileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;

@Service
@RequiredArgsConstructor
@Slf4j
public class MediaFileService {
    private final MediaFileRepository mediaFileRepository;
    private final GroupService groupService;

    @Value("${app.upload.dir}")
    private String uploadDir;

    private final ExecutorService backfillExecutor = Executors.newSingleThreadExecutor();
    private final AtomicBoolean backfillRunning = new AtomicBoolean(false);
    private final AtomicInteger backfillTotal = new AtomicInteger(0);
    private final AtomicInteger backfillProcessed = new AtomicInteger(0);
    private final AtomicInteger backfillFailed = new AtomicInteger(0);

    public MediaFileDTO uploadFile(MultipartFile file, String description, Group group, User uploadedBy) throws IOException {
        String contentType = file.getContentType();
        MediaType mediaType = determineMediaType(contentType);

        validateFileType(contentType);
        validateFileSize(file.getSize());

        String storedFilename = generateStoredFilename(file.getOriginalFilename());
        String filePath = uploadDir + storedFilename;

        // Tạo directory nếu chưa có
        File uploadDirectory = new File(uploadDir);
        if (!uploadDirectory.exists()) {
            boolean created = uploadDirectory.mkdirs();
            if (!created && !uploadDirectory.exists()) {
                throw new RuntimeException("Failed to create upload directory: " + uploadDir);
            }
        }

        // Kiểm tra write permission
        if (!uploadDirectory.canWrite()) {
            throw new RuntimeException("No write permission for upload directory: " + uploadDir);
        }

        file.transferTo(new File(filePath));

        String thumbnailPath = generateThumbnail(filePath, storedFilename, mediaType);

        MediaFile mediaFile = MediaFile.builder()
                .originalFilename(file.getOriginalFilename())
                .storedFilename(storedFilename)
                .fileType(contentType)
                .mediaType(mediaType)
                .fileSize(file.getSize())
                .filePath(filePath)
                .thumbnailPath(thumbnailPath)
                .description(description)
                .group(group)
                .uploadedBy(uploadedBy)
                .build();

        mediaFile = mediaFileRepository.save(mediaFile);
        log.info("File uploaded successfully: {} to group: {}", file.getOriginalFilename(), group.getName());
        return convertToDTO(mediaFile);
    }

    // Favorites first, then everything else in a fixed-but-random order
    // (see randomOrder on MediaFile) so pagination stays consistent.
    private static final Sort DISPLAY_ORDER = Sort.by(
            Sort.Order.desc("favorite"),
            Sort.Order.asc("randomOrder"));

    public Page<MediaFileDTO> getGroupFiles(Group group, int page, int size) {
        if (page == 0) {
            mediaFileRepository.reshuffleNonFavorites(group.getId());
        }
        Pageable pageable = PageRequest.of(page, size, DISPLAY_ORDER);
        return mediaFileRepository.findByGroup(group, pageable).map(this::convertToDTO);
    }

    public Page<MediaFileDTO> getGroupFilesByType(Group group, MediaType mediaType, int page, int size) {
        if (page == 0) {
            mediaFileRepository.reshuffleNonFavorites(group.getId());
        }
        Pageable pageable = PageRequest.of(page, size, DISPLAY_ORDER);
        return mediaFileRepository.findByGroupAndMediaType(group, mediaType, pageable).map(this::convertToDTO);
    }

    public Page<MediaFileDTO> searchGroupFiles(Group group, String filename, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, DISPLAY_ORDER);
        return mediaFileRepository.findByGroupAndOriginalFilenameContainingIgnoreCase(group, filename, pageable)
                .map(this::convertToDTO);
    }

    public MediaFileDTO getFileById(Long id, Group group) {
        return mediaFileRepository.findByIdAndGroup(id, group)
                .map(this::convertToDTO)
                .orElseThrow(() -> new RuntimeException("File not found with id: " + id));
    }

    public MediaFileDTO toggleFavorite(Long id, Group group) {
        MediaFile mediaFile = mediaFileRepository.findByIdAndGroup(id, group)
                .orElseThrow(() -> new RuntimeException("File not found with id: " + id));
        mediaFile.setFavorite(!Boolean.TRUE.equals(mediaFile.getFavorite()));
        mediaFile = mediaFileRepository.save(mediaFile);
        return convertToDTO(mediaFile);
    }

    public Resource downloadFile(Long id, Group group) throws IOException {
        MediaFile mediaFile = mediaFileRepository.findByIdAndGroup(id, group)
                .orElseThrow(() -> new RuntimeException("File not found with id: " + id));
        return new UrlResource(Paths.get(mediaFile.getFilePath()).toUri());
    }

    public void deleteFile(Long id, Group group) throws IOException {
        MediaFile mediaFile = mediaFileRepository.findByIdAndGroup(id, group)
                .orElseThrow(() -> new RuntimeException("File not found with id: " + id));

        Path filePath = Paths.get(mediaFile.getFilePath());
        Files.deleteIfExists(filePath);
        if (mediaFile.getThumbnailPath() != null) {
            Files.deleteIfExists(Paths.get(mediaFile.getThumbnailPath()));
        }

        mediaFileRepository.deleteById(id);
        log.info("File deleted successfully: {}", mediaFile.getOriginalFilename());
    }

    public Resource getThumbnail(Long id, Group group) throws IOException {
        MediaFile mediaFile = mediaFileRepository.findByIdAndGroup(id, group)
                .orElseThrow(() -> new RuntimeException("File not found with id: " + id));
        return loadThumbnailResource(mediaFile);
    }

    public Resource getThumbnailAsAdmin(Long id) throws IOException {
        MediaFile mediaFile = mediaFileRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("File not found with id: " + id));
        return loadThumbnailResource(mediaFile);
    }

    private Resource loadThumbnailResource(MediaFile mediaFile) throws IOException {
        if (mediaFile.getThumbnailPath() == null) {
            throw new RuntimeException("No thumbnail available for file: " + mediaFile.getId());
        }
        return new UrlResource(Paths.get(mediaFile.getThumbnailPath()).toUri());
    }

    private String thumbnailDir() {
        return uploadDir.endsWith("/") ? uploadDir + "thumbnails/" : uploadDir + "/thumbnails/";
    }

    // Generates a small JPEG thumbnail via ffmpeg: an extracted frame for
    // videos, a resized copy for images (ffmpeg decodes JPEG/PNG/GIF/WebP
    // alike, so this covers every accepted image type with one code path).
    // Returns null (instead of throwing) on any failure so a broken or
    // missing ffmpeg never blocks an upload - the file just has no thumbnail
    // until a retry/backfill.
    private String generateThumbnail(String sourceFilePath, String storedFilename, MediaType mediaType) {
        File thumbDirFile = new File(thumbnailDir());
        if (!thumbDirFile.exists() && !thumbDirFile.mkdirs() && !thumbDirFile.exists()) {
            log.warn("Could not create thumbnail directory: {}", thumbDirFile);
            return null;
        }

        String thumbFilename = storedFilename.substring(0, storedFilename.lastIndexOf('.')) + ".jpg";
        String thumbPath = thumbnailDir() + thumbFilename;

        List<String> command = new java.util.ArrayList<>(List.of("ffmpeg", "-y"));
        if (mediaType == MediaType.VIDEO) {
            command.addAll(List.of("-ss", "1"));
        }
        command.addAll(List.of(
                "-i", sourceFilePath,
                "-frames:v", "1",
                "-vf", "scale=320:-1",
                thumbPath));

        try {
            Process process = new ProcessBuilder(command)
                    .redirectErrorStream(true)
                    .start();

            boolean finished = process.waitFor(30, TimeUnit.SECONDS);
            if (!finished) {
                process.destroyForcibly();
                log.warn("ffmpeg timed out generating thumbnail for {}", sourceFilePath);
                return null;
            }
            if (process.exitValue() != 0 || !new File(thumbPath).exists()) {
                log.warn("ffmpeg failed to generate thumbnail for {} (exit {})", sourceFilePath, process.exitValue());
                return null;
            }
            return thumbPath;
        } catch (IOException | InterruptedException e) {
            if (e instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            log.warn("Error generating thumbnail for {}: {}", sourceFilePath, e.getMessage());
            return null;
        }
    }

    // Generates thumbnails for every existing row that doesn't have one yet
    // (uploaded before this feature existed, or where generation failed).
    // Runs on a background thread since it processes the whole library and
    // can take a while.
    public boolean startThumbnailBackfill() {
        if (!backfillRunning.compareAndSet(false, true)) {
            return false;
        }
        backfillExecutor.submit(this::runThumbnailBackfill);
        return true;
    }

    private void runThumbnailBackfill() {
        try {
            List<MediaFile> pending = mediaFileRepository.findByThumbnailPathIsNull();
            backfillTotal.set(pending.size());
            backfillProcessed.set(0);
            backfillFailed.set(0);
            log.info("Thumbnail backfill started for {} media files", pending.size());

            for (MediaFile mediaFile : pending) {
                String thumbPath = generateThumbnail(
                        mediaFile.getFilePath(), mediaFile.getStoredFilename(), mediaFile.getMediaType());
                if (thumbPath != null) {
                    mediaFile.setThumbnailPath(thumbPath);
                    mediaFileRepository.save(mediaFile);
                } else {
                    backfillFailed.incrementAndGet();
                }
                backfillProcessed.incrementAndGet();
            }
            log.info("Thumbnail backfill finished: {}/{} succeeded",
                    backfillTotal.get() - backfillFailed.get(), backfillTotal.get());
        } finally {
            backfillRunning.set(false);
        }
    }

    public java.util.Map<String, Object> getBackfillStatus() {
        return java.util.Map.of(
                "running", backfillRunning.get(),
                "total", backfillTotal.get(),
                "processed", backfillProcessed.get(),
                "failed", backfillFailed.get());
    }

    private MediaType determineMediaType(String contentType) {
        if (contentType == null) {
            throw new RuntimeException("File type not recognized");
        }
        if (contentType.startsWith("image/")) {
            return MediaType.IMAGE;
        } else if (contentType.startsWith("video/")) {
            return MediaType.VIDEO;
        }
        throw new RuntimeException("Unsupported file type: " + contentType);
    }

    private void validateFileType(String contentType) {
        if (contentType == null) {
            throw new RuntimeException("File type not recognized");
        }
        if (!contentType.startsWith("image/") && !contentType.startsWith("video/")) {
            throw new RuntimeException("Only images and videos are allowed");
        }
    }

    private void validateFileSize(long fileSize) {
        long maxSize = 2L * 1024 * 1024 * 1024;
        if (fileSize > maxSize) {
            throw new RuntimeException("File size exceeds maximum limit of 2GB");
        }
    }

    private String generateStoredFilename(String originalFilename) {
        String extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        return UUID.randomUUID().toString() + extension;
    }

    private MediaFileDTO convertToDTO(MediaFile mediaFile) {
        return MediaFileDTO.builder()
                .id(mediaFile.getId())
                .originalFilename(mediaFile.getOriginalFilename())
                .storedFilename(mediaFile.getStoredFilename())
                .fileType(mediaFile.getFileType())
                .mediaType(mediaFile.getMediaType())
                .fileSize(mediaFile.getFileSize())
                .filePath(mediaFile.getFilePath())
                .createdAt(mediaFile.getCreatedAt())
                .updatedAt(mediaFile.getUpdatedAt())
                .description(mediaFile.getDescription())
                .favorite(Boolean.TRUE.equals(mediaFile.getFavorite()))
                .hasThumbnail(mediaFile.getThumbnailPath() != null)
                .build();
    }
}
