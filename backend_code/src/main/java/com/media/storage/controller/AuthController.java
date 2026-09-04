package com.media.storage.controller;

import com.media.storage.dto.UserDTO;
import com.media.storage.service.KeycloakUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AuthController {
    private final KeycloakUserService keycloakUserService;

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getCurrentUser() {
        try {
            UserDTO user = UserDTO.builder()
                    .id(Long.valueOf(keycloakUserService.getCurrentUserId().hashCode()))
                    .username(keycloakUserService.getCurrentUsername())
                    .email(keycloakUserService.getCurrentUserEmail())
                    .build();
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to get user info"));
        }
    }

    @GetMapping("/info")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getUserInfo() {
        Map<String, Object> info = new HashMap<>();
        info.put("username", keycloakUserService.getCurrentUsername());
        info.put("email", keycloakUserService.getCurrentUserEmail());
        info.put("userId", keycloakUserService.getCurrentUserId());
        info.put("firstName", keycloakUserService.getFirstName());
        info.put("lastName", keycloakUserService.getLastName());
        return ResponseEntity.ok(info);
    }
}
