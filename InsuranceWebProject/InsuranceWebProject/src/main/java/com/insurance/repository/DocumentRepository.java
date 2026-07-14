package com.insurance.repository;

import com.insurance.entity.Document;
import com.insurance.entity.DocumentType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DocumentRepository extends JpaRepository<Document, UUID> {
    List<Document> findByUserId(UUID userId);
    List<Document> findByClaimId(UUID claimId);
    List<Document> findByUserIdAndDocumentType(UUID userId, DocumentType documentType);
}

