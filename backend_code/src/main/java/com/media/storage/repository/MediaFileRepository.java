package com.media.storage.repository;

import com.media.storage.model.Group;
import com.media.storage.model.MediaFile;
import com.media.storage.model.MediaType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MediaFileRepository extends JpaRepository<MediaFile, Long> {
    Page<MediaFile> findByGroup(Group group, Pageable pageable);

    Page<MediaFile> findByGroupAndMediaType(Group group, MediaType mediaType, Pageable pageable);

    Page<MediaFile> findByGroupAndOriginalFilenameContainingIgnoreCase(Group group, String filename, Pageable pageable);

    Optional<MediaFile> findByIdAndGroup(Long id, Group group);

    Optional<MediaFile> findByStoredFilename(String storedFilename);

    List<MediaFile> findByGroup(Group group);
}
