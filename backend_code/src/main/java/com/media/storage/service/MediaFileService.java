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
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class MediaFileService {
    private final MediaFileRepository mediaFileRepository;
    private final GroupService groupService;

    @Value("${app.upload.dir}")
    private String uploadDir;

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

        MediaFile mediaFile = MediaFile.builder()
                .originalFilename(file.getOriginalFilename())
                .storedFilename(storedFilename)
                .fileType(contentType)
                .mediaType(mediaType)
                .fileSize(file.getSize())
                .filePath(filePath)
                .description(description)
                .group(group)
                .uploadedBy(uploadedBy)
                .build();

        mediaFile = mediaFileRepository.save(mediaFile);
        log.info("File uploaded successfully: {} to group: {}", file.getOriginalFilename(), group.getName());
        return convertToDTO(mediaFile);
    }

    public Page<MediaFileDTO> getGroupFiles(Group group, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return mediaFileRepository.findByGroup(group, pageable).map(this::convertToDTO);
    }

    public Page<MediaFileDTO> getGroupFilesByType(Group group, MediaType mediaType, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return mediaFileRepository.findByGroupAndMediaType(group, mediaType, pageable).map(this::convertToDTO);
    }

    public Page<MediaFileDTO> searchGroupFiles(Group group, String filename, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return mediaFileRepository.findByGroupAndOriginalFilenameContainingIgnoreCase(group, filename, pageable)
                .map(this::convertToDTO);
    }

    public MediaFileDTO getFileById(Long id, Group group) {
        return mediaFileRepository.findByIdAndGroup(id, group)
                .map(this::convertToDTO)
                .orElseThrow(() -> new RuntimeException("File not found with id: " + id));
    }

    public byte[] downloadFile(Long id, Group group) throws IOException {
        MediaFile mediaFile = mediaFileRepository.findByIdAndGroup(id, group)
                .orElseThrow(() -> new RuntimeException("File not found with id: " + id));
        return Files.readAllBytes(Paths.get(mediaFile.getFilePath()));
    }

    public void deleteFile(Long id, Group group) throws IOException {
        MediaFile mediaFile = mediaFileRepository.findByIdAndGroup(id, group)
                .orElseThrow(() -> new RuntimeException("File not found with id: " + id));

        Path filePath = Paths.get(mediaFile.getFilePath());
        Files.deleteIfExists(filePath);

        mediaFileRepository.deleteById(id);
        log.info("File deleted successfully: {}", mediaFile.getOriginalFilename());
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
        long maxSize = 500 * 1024 * 1024;
        if (fileSize > maxSize) {
            throw new RuntimeException("File size exceeds maximum limit of 500MB");
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
                .build();
    }
}
