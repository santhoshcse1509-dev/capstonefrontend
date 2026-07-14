package com.insurance.util;

import java.util.UUID;

public class ClaimNumberGenerator {
    public static String generate() {
        return "CLM-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }
}
