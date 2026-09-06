package com.media.storage.service;

import com.media.storage.dto.AuthResponse;
import com.media.storage.dto.UserDTO;
import com.media.storage.model.User;
import com.media.storage.repository.UserRepository;
import com.media.storage.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    public AuthResponse register(String username, String email, String password) {
        if (userRepository.existsByUsername(username)) {
            throw new RuntimeException("Username already taken");
        }
        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("Email already registered");
        }

        boolean isFirstUser = userRepository.count() == 0;

        User user = User.builder()
                .username(username)
                .email(email)
                .passwordHash(passwordEncoder.encode(password))
                .role(isFirstUser ? "SUPER_ADMIN" : "USER")
                .build();
        user = userRepository.save(user);

        return buildResponse(user);
    }

    public AuthResponse login(String username, String password) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Invalid username or password"));

        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new RuntimeException("Invalid username or password");
        }

        return buildResponse(user);
    }

    private AuthResponse buildResponse(User user) {
        String token = jwtTokenProvider.generateToken(user);
        UserDTO userDTO = UserDTO.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole())
                .createdAt(user.getCreatedAt())
                .build();

        return AuthResponse.builder()
                .success(true)
                .message("Success")
                .token(token)
                .user(userDTO)
                .build();
    }
}
