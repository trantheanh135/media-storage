package com.media.storage.service;

import com.media.storage.dto.GroupDTO;
import com.media.storage.dto.UserDTO;
import com.media.storage.model.Group;
import com.media.storage.model.User;
import com.media.storage.repository.GroupRepository;
import com.media.storage.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class GroupService {
    private final GroupRepository groupRepository;
    private final UserRepository userRepository;

    @Transactional
    public GroupDTO createGroup(String name, String description, Long ownerId) {
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new RuntimeException("Owner not found"));

        Group group = Group.builder()
                .name(name)
                .description(description)
                .owner(owner)
                .members(Set.of(owner))
                .build();

        group = groupRepository.save(group);
        log.info("Group created: {} by user: {}", group.getName(), owner.getUsername());
        return convertToDTO(group);
    }

    @Transactional
    public GroupDTO addMember(Long groupId, Long userId, Long currentUserId) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found"));

        if (!group.getOwner().getId().equals(currentUserId)) {
            throw new RuntimeException("Only group owner can add members");
        }

        User userToAdd = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        group.getMembers().add(userToAdd);
        group = groupRepository.save(group);

        log.info("User {} added to group {}", userToAdd.getUsername(), group.getName());
        return convertToDTO(group);
    }

    @Transactional
    public GroupDTO removeMember(Long groupId, Long userId, Long currentUserId) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found"));

        if (!group.getOwner().getId().equals(currentUserId)) {
            throw new RuntimeException("Only group owner can remove members");
        }

        if (group.getOwner().getId().equals(userId)) {
            throw new RuntimeException("Cannot remove group owner");
        }

        User userToRemove = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        group.getMembers().remove(userToRemove);
        group = groupRepository.save(group);

        log.info("User {} removed from group {}", userToRemove.getUsername(), group.getName());
        return convertToDTO(group);
    }

    public List<GroupDTO> getUserGroups(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return groupRepository.findUserGroups(user)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public GroupDTO getGroupById(Long groupId, Long userId) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found"));

        if (!group.getOwner().getId().equals(userId) && !group.getMembers().stream()
                .anyMatch(m -> m.getId().equals(userId))) {
            throw new RuntimeException("You don't have access to this group");
        }

        return convertToDTO(group);
    }

    @Transactional
    public void deleteGroup(Long groupId, Long currentUserId) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found"));

        if (!group.getOwner().getId().equals(currentUserId)) {
            throw new RuntimeException("Only group owner can delete the group");
        }

        groupRepository.deleteById(groupId);
        log.info("Group deleted: {}", group.getName());
    }

    public boolean userHasAccessToGroup(Long userId, Long groupId) {
        Group group = groupRepository.findById(groupId)
                .orElse(null);

        if (group == null) {
            return false;
        }

        return group.getOwner().getId().equals(userId) ||
               group.getMembers().stream().anyMatch(m -> m.getId().equals(userId));
    }

    private GroupDTO convertToDTO(Group group) {
        return GroupDTO.builder()
                .id(group.getId())
                .name(group.getName())
                .description(group.getDescription())
                .owner(convertUserToDTO(group.getOwner()))
                .members(group.getMembers().stream()
                        .map(this::convertUserToDTO)
                        .collect(Collectors.toSet()))
                .createdAt(group.getCreatedAt())
                .updatedAt(group.getUpdatedAt())
                .build();
    }

    private UserDTO convertUserToDTO(User user) {
        return UserDTO.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
