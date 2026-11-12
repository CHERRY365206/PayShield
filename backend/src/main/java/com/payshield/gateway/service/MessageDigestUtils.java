package com.payshield.gateway.service;

import java.security.MessageDigest;

public final class MessageDigestUtils {
    private MessageDigestUtils() {}

    public static boolean constantTimeEquals(String a, String b) {
        if (a == null || b == null) return false;
        return MessageDigest.isEqual(
            a.getBytes(java.nio.charset.StandardCharsets.UTF_8),
            b.getBytes(java.nio.charset.StandardCharsets.UTF_8)
        );
    }
}
