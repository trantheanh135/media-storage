package com.media.storage.repository;

import com.media.storage.model.Group;
import com.media.storage.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GroupRepository extends JpaRepository<Group, Long> {
    List<Group> findByOwnerId(Long ownerId);

    @Query("SELECT g FROM Group g WHERE :user MEMBER OF g.members OR g.owner = :user")
    List<Group> findUserGroups(@Param("user") User user);

    Optional<Group> findByIdAndOwnerId(Long id, Long ownerId);

    boolean existsByIdAndOwnerId(Long id, Long ownerId);

    boolean existsByIdAndMembersContaining(Long groupId, User user);
}
