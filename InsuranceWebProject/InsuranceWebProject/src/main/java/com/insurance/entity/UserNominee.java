package com.insurance.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "user_nominees")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserNominee extends BaseEntity {

    @NotNull(message = "User is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @NotBlank(message = "Nominee name is required")
    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @NotBlank(message = "Relationship is required")
    @Column(name = "relationship", nullable = false, length = 50)
    private String relationship;

    @Column(name = "contact_number", length = 15)
    private String contactNumber;

    @Min(value = 1, message = "Percentage must be at least 1")
    @Max(value = 100, message = "Percentage must not exceed 100")
    @Column(name = "share_percentage", nullable = false)
    private int sharePercentage;
}
