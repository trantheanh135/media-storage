package com.media.storage.controller;

import com.media.storage.dto.GroupDTO;
import com.media.storage.service.GroupService;
import com.media.storage.service.KeycloakUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/groups")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class GroupController {
    private final GroupService groupService;
    private final KeycloakUserService keycloakUserService;

    private Long getCurrentUserId() {
        String userId = keycloakUserService.getCurrentUserId();
        return userId != null ? Long.valueOf(userId.hashCode()) : null;
    }

    @PostMapping
    public ResponseEntity<?> createGroup(@RequestBody Map<String, String> request) {
        try {
            Long userId = getCurrentUserId();
            GroupDTO group = groupService.createGroup(
                    request.get("name"),
                    request.get("description"),
                    userId
            );
            return ResponseEntity.ok(group);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<?> getUserGroups() {
        try {
            Long userId = getCurrentUserId();
            List<GroupDTO> groups = groupService.getUserGroups(userId);
            return ResponseEntity.ok(groups);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{groupId}")
    public ResponseEntity<?> getGroup(@PathVariable Long groupId) {
        try {
            Long userId = getCurrentUserId();
            GroupDTO group = groupService.getGroupById(groupId, userId);
            return ResponseEntity.ok(group);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{groupId}/members/{userId}")
    public ResponseEntity<?> addMember(@PathVariable Long groupId, @PathVariable Long userId) {
        try {
            Long currentUserId = getCurrentUserId();
            GroupDTO group = groupService.addMember(groupId, userId, currentUserId);
            return ResponseEntity.ok(group);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{groupId}/members/{userId}")
    public ResponseEntity<?> removeMember(@PathVariable Long groupId, @PathVariable Long userId) {
        try {
            Long currentUserId = getCurrentUserId();
            GroupDTO group = groupService.removeMember(groupId, userId, currentUserId);
            return ResponseEntity.ok(group);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{groupId}")
    public ResponseEntity<?> deleteGroup(@PathVariable Long groupId) {
        try {
            Long currentUserId = getCurrentUserId();
            groupService.deleteGroup(groupId, currentUserId);
            return ResponseEntity.ok(Map.of("message", "Group deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        }
    }
}
