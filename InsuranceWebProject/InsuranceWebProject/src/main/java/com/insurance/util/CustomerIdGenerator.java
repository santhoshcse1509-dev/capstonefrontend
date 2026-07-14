package com.insurance.util;

import java.util.UUID;

public class CustomerIdGenerator {
    public static String generate() {
        return "CUST-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }
}
