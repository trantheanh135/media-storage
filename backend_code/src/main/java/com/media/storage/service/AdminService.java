package com.media.storage.service;

import com.media.storage.dto.MediaFileDTO;
import com.media.storage.model.MediaType;
import com.media.storage.repository.GroupRepository;
import com.media.storage.repository.MediaFileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminService {
    private final MediaFileRepository mediaFileRepository;
    private final GroupRepository groupRepository;
    private final AuthenticatedUserService authenticatedUserService;
    private final MediaFileService mediaFileService;

    // ✅ Only super-admin can use these methods

    public Page<MediaFileDTO> getAllFilesAcrossGroups(int page, int size) {
        if (!authenticatedUserService.isSuperAdmin()) {
            throw new RuntimeException("Only super-admin can access all files");
        }

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return mediaFileRepository.findAll(pageable)
                .map(this::convertToDTO);
    }

    public Page<MediaFileDTO> getAllFilesOfType(MediaType mediaType, int page, int size) {
        if (!authenticatedUserService.isSuperAdmin()) {
            throw new RuntimeException("Only super-admin can access all files");
        }

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return mediaFileRepository.findByMediaType(mediaType, pageable)
                .map(this::convertToDTO);
    }

    public Page<MediaFileDTO> searchAllFiles(String filename, int page, int size) {
        if (!authenticatedUserService.isSuperAdmin()) {
            throw new RuntimeException("Only super-admin can search all files");
        }

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return mediaFileRepository.findByOriginalFilenameContainingIgnoreCase(filename, pageable)
                .map(this::convertToDTO);
    }

    public byte[] downloadFileAsAdmin(Long fileId) throws IOException {
        if (!authenticatedUserService.isSuperAdmin()) {
            throw new RuntimeException("Only super-admin can download any file");
        }

        return mediaFileRepository.findById(fileId)
                .map(mediaFile -> {
                    try {
                        return Files.readAllBytes(Paths.get(mediaFile.getFilePath()));
                    } catch (IOException e) {
                        log.error("Error reading file: {}", mediaFile.getId(), e);
                        throw new RuntimeException("Error reading file", e);
                    }
                })
                .orElseThrow(() -> new RuntimeException("File not found"));
    }

    public void deleteFileAsAdmin(Long fileId) throws IOException {
        if (!authenticatedUserService.isSuperAdmin()) {
            throw new RuntimeException("Only super-admin can delete any file");
        }

        var mediaFile = mediaFileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found"));

        Files.deleteIfExists(Paths.get(mediaFile.getFilePath()));
        mediaFileRepository.deleteById(fileId);

        log.warn("Super-admin deleted file: {} (group: {})",
                mediaFile.getOriginalFilename(),
                mediaFile.getGroup().getName());
    }

    public long getTotalFileCount() {
        if (!authenticatedUserService.isSuperAdmin()) {
            throw new RuntimeException("Only super-admin can view statistics");
        }
        return mediaFileRepository.count();
    }

    public long getTotalStorageUsed() {
        if (!authenticatedUserService.isSuperAdmin()) {
            throw new RuntimeException("Only super-admin can view statistics");
        }
        return mediaFileRepository.findAll()
                .stream()
                .mapToLong(file -> file.getFileSize())
                .sum();
    }

    public long getGroupCount() {
        if (!authenticatedUserService.isSuperAdmin()) {
            throw new RuntimeException("Only super-admin can view statistics");
        }
        return groupRepository.count();
    }

    private MediaFileDTO convertToDTO(com.media.storage.model.MediaFile mediaFile) {
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
