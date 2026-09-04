package com.media.storage.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GroupDTO {
    private Long id;
    private String name;
    private String description;
    private UserDTO owner;
    private Set<UserDTO> members;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
