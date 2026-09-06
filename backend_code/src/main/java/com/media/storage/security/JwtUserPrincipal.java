package com.media.storage.security;

public record JwtUserPrincipal(Long id, String username, String email, String role) {
}
