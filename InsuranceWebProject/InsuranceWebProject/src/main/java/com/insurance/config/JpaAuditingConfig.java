package com.insurance.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

/**
 * Enables Spring Data JPA auditing so that {@code @CreatedDate}
 * and {@code @LastModifiedDate} annotations on entities are
 * automatically populated.
 *
 * @author Santhosh
 * @since 1.0
 */
@Configuration
@EnableJpaAuditing
public class JpaAuditingConfig {
}
