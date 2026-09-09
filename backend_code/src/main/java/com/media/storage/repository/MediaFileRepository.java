package com.media.storage.repository;

import com.media.storage.model.Group;
import com.media.storage.model.MediaFile;
import com.media.storage.model.MediaType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface MediaFileRepository extends JpaRepository<MediaFile, Long> {
    Page<MediaFile> findByGroup(Group group, Pageable pageable);

    Page<MediaFile> findByGroupAndMediaType(Group group, MediaType mediaType, Pageable pageable);

    Page<MediaFile> findByGroupAndOriginalFilenameContainingIgnoreCase(Group group, String filename, Pageable pageable);

    Page<MediaFile> findByMediaType(MediaType mediaType, Pageable pageable);

    Page<MediaFile> findByOriginalFilenameContainingIgnoreCase(String filename, Pageable pageable);

    Optional<MediaFile> findByIdAndGroup(Long id, Group group);

    Optional<MediaFile> findByStoredFilename(String storedFilename);

    List<MediaFile> findByGroup(Group group);

    List<MediaFile> findByRandomOrderIsNull();

    // Re-rolls the random display order for non-favorites so a fresh page load
    // (page 0) looks freshly shuffled, while pagination within that same
    // browsing session (page > 0, no reshuffle in between) stays consistent.
    @Modifying
    @Transactional
    @Query(value = "UPDATE media_files SET random_order = random() WHERE group_id = :groupId AND favorite = false",
            nativeQuery = true)
    void reshuffleNonFavorites(@Param("groupId") Long groupId);

    @Modifying
    @Transactional
    @Query(value = "UPDATE media_files SET random_order = random() WHERE favorite = false", nativeQuery = true)
    void reshuffleAllNonFavorites();
}
