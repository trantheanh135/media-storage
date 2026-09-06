package com.media.storage.controller;

import com.media.storage.dto.AuthResponse;
import com.media.storage.dto.LoginRequest;
import com.media.storage.dto.RegisterRequest;
import com.media.storage.dto.UserDTO;
import com.media.storage.service.AuthService;
import com.media.storage.service.AuthenticatedUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AuthController {

    private final AuthService authService;
    private final AuthenticatedUserService authenticatedUserService;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        try {
            AuthResponse response = authService.register(request.getUsername(), request.getEmail(), request.getPassword());
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            AuthResponse response = authService.login(request.getUsername(), request.getPassword());
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(401).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getCurrentUser() {
        try {
            UserDTO user = UserDTO.builder()
                    .id(Long.valueOf(authenticatedUserService.getCurrentUserId()))
                    .username(authenticatedUserService.getCurrentUsername())
                    .email(authenticatedUserService.getCurrentUserEmail())
                    .role(authenticatedUserService.getUserRoles().stream().findFirst().orElse("USER"))
                    .build();
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to get user info"));
        }
    }
}
