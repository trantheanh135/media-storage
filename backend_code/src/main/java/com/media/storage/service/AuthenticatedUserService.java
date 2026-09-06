package com.media.storage.service;

import com.media.storage.security.JwtUserPrincipal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@Slf4j
public class AuthenticatedUserService {

    private JwtUserPrincipal principal() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return (principal instanceof JwtUserPrincipal jwtUserPrincipal) ? jwtUserPrincipal : null;
    }

    public String getCurrentUsername() {
        JwtUserPrincipal p = principal();
        return p != null ? p.username() : null;
    }

    public String getCurrentUserEmail() {
        JwtUserPrincipal p = principal();
        return p != null ? p.email() : null;
    }

    public String getCurrentUserId() {
        JwtUserPrincipal p = principal();
        return p != null ? String.valueOf(p.id()) : null;
    }

    public String getFirstName() {
        return "";
    }

    public String getLastName() {
        return "";
    }

    public boolean hasRole(String role) {
        JwtUserPrincipal p = principal();
        return p != null && role.equalsIgnoreCase(p.role());
    }

    public boolean isSuperAdmin() {
        return hasRole("SUPER_ADMIN");
    }

    public boolean isAdmin() {
        return hasRole("ADMIN") || isSuperAdmin();
    }

    public List<String> getUserRoles() {
        JwtUserPrincipal p = principal();
        List<String> roles = new ArrayList<>();
        if (p != null) {
            roles.add(p.role());
        }
        return roles;
    }
}
