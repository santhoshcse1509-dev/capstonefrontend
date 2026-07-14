package com.insurance.repository;

import com.insurance.entity.AIConversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AIConversationRepository extends JpaRepository<AIConversation, UUID> {
    List<AIConversation> findByUserIdOrderByCreatedAtDesc(UUID userId);
    Optional<AIConversation> findBySessionId(String sessionId);
}
