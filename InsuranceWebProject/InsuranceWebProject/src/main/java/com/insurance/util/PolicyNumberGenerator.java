package com.insurance.util;

import java.util.UUID;

public class PolicyNumberGenerator {
    public static String generate() {
        return "POL-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }
}
