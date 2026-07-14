package com.insurance.util;

import javax.crypto.Cipher;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

public class EncryptionUtil {

    private static final String ALGORITHM = "AES";
    private static final String DEFAULT_KEY = "InsureProSecretBankEncryptionKey"; // 32 chars = 256 bits

    private static SecretKeySpec getSecretKey() {
        String secret = System.getenv("BANK_ENCRYPTION_KEY");
        if (secret == null || secret.length() < 16) {
            secret = DEFAULT_KEY;
        }
        // Use exactly 16 bytes (128 bits) for AES compatibility on standard JVM configurations
        byte[] keyBytes = secret.substring(0, 16).getBytes(StandardCharsets.UTF_8);
        return new SecretKeySpec(keyBytes, ALGORITHM);
    }

    public static String encrypt(String data) {
        if (data == null) return null;
        try {
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.ENCRYPT_MODE, getSecretKey());
            byte[] encrypted = cipher.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(encrypted);
        } catch (Exception e) {
            throw new RuntimeException("Failed to encrypt bank detail: " + e.getMessage(), e);
        }
    }

    public static String decrypt(String encryptedData) {
        if (encryptedData == null) return null;
        try {
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.DECRYPT_MODE, getSecretKey());
            byte[] decrypted = cipher.doFinal(Base64.getDecoder().decode(encryptedData));
            return new String(decrypted, StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new RuntimeException("Failed to decrypt bank detail: " + e.getMessage(), e);
        }
    }
}
