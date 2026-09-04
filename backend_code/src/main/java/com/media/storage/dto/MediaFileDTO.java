package com.media.storage.dto;

import com.media.storage.model.MediaType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MediaFileDTO {
    private Long id;
    private String originalFilename;
    private String storedFilename;
    private String fileType;
    private MediaType mediaType;
    private Long fileSize;
    private String filePath;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String description;
}
