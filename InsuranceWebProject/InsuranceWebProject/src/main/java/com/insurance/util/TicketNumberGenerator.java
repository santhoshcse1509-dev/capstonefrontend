package com.insurance.util;

import java.util.UUID;

public class TicketNumberGenerator {
    public static String generate() {
        return "TKT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }
}
