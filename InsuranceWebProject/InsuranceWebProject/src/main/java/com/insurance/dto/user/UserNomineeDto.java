package com.insurance.dto.user;

import lombok.Data;
import java.util.UUID;

@Data
public class UserNomineeDto {
    private UUID id;
    private String name;
    private String relationship;
    private String contactNumber;
    private int sharePercentage;
}
