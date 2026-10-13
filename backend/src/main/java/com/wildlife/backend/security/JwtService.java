package com.wildlife.backend.security;

import com.wildlife.backend.entity.UserAccount;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

@Service
public class JwtService {

    private final String secret;
    private final long expirationSeconds;

    public JwtService(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.expiration-seconds:86400}") long expirationSeconds) {

        this.secret = secret;
        this.expirationSeconds = expirationSeconds;
    }

    public String generateToken(UserAccount user) {
        try {
            long now = Instant.now().getEpochSecond();

            String headerJson = "{\"alg\":\"HS256\",\"typ\":\"JWT\"}";
            String payloadJson = "{"
                    + "\"sub\":\"" + escapeJson(user.getEmail()) + "\","
                    + "\"uid\":" + user.getId() + ","
                    + "\"name\":\"" + escapeJson(user.getFullName()) + "\","
                    + "\"role\":\"" + user.getRole().name() + "\","
                    + "\"rangerId\":" + nullableJsonString(user.getRangerId()) + ","
                    + "\"iat\":" + now + ","
                    + "\"exp\":" + (now + expirationSeconds)
                    + "}";

            String unsignedToken =
                    base64Url(headerJson.getBytes(StandardCharsets.UTF_8))
                            + "."
                            + base64Url(payloadJson.getBytes(StandardCharsets.UTF_8));

            return unsignedToken + "." + sign(unsignedToken);
        } catch (Exception exception) {
            throw new IllegalStateException("Unable to create authentication token.", exception);
        }
    }

    public String extractEmail(String token) {
        return readPayload(token).get("sub").toString();
    }

    public boolean isValid(String token) {
        try {
            String[] parts = token.split("\\.");

            if (parts.length != 3) {
                return false;
            }

            String unsignedToken = parts[0] + "." + parts[1];

            if (!constantTimeEquals(sign(unsignedToken), parts[2])) {
                return false;
            }

            Object exp = readPayload(token).get("exp");
            long expiresAt = Long.parseLong(exp.toString());

            return expiresAt > Instant.now().getEpochSecond();
        } catch (Exception exception) {
            return false;
        }
    }

    private Map<String, Object> readPayload(String token) {
        try {
            String[] parts = token.split("\\.");
            byte[] decodedPayload =
                    Base64.getUrlDecoder().decode(parts[1]);
            String json = new String(decodedPayload, StandardCharsets.UTF_8);
            Map<String, Object> payload = new HashMap<>();
            payload.put("sub", extractStringClaim(json, "sub"));
            payload.put("exp", extractLongClaim(json, "exp"));

            return payload;
        } catch (Exception exception) {
            throw new IllegalArgumentException("Invalid authentication token.", exception);
        }
    }

    private String sign(String value) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(
                    secret.getBytes(StandardCharsets.UTF_8),
                    "HmacSHA256"
            ));

            return base64Url(mac.doFinal(
                    value.getBytes(StandardCharsets.UTF_8)
            ));
        } catch (Exception exception) {
            throw new IllegalStateException("Unable to sign authentication token.", exception);
        }
    }

    private String base64Url(byte[] value) {
        return Base64
                .getUrlEncoder()
                .withoutPadding()
                .encodeToString(value);
    }

    private boolean constantTimeEquals(String first, String second) {
        return MessageDigest.isEqual(
                first.getBytes(StandardCharsets.UTF_8),
                second.getBytes(StandardCharsets.UTF_8)
        );
    }

    private String nullableJsonString(String value) {
        return value == null ? "null" : "\"" + escapeJson(value) + "\"";
    }

    private String escapeJson(String value) {
        if (value == null) {
            return "";
        }

        return value
                .replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\b", "\\b")
                .replace("\f", "\\f")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }

    private String extractStringClaim(String json, String claim) {
        String marker = "\"" + claim + "\":\"";
        int start = json.indexOf(marker);

        if (start < 0) {
            throw new IllegalArgumentException("Missing JWT claim: " + claim);
        }

        start += marker.length();
        StringBuilder value = new StringBuilder();

        for (int index = start; index < json.length(); index++) {
            char character = json.charAt(index);

            if (character == '\\') {
                if (index + 1 >= json.length()) {
                    throw new IllegalArgumentException("Invalid escaped JWT claim.");
                }

                value.append(json.charAt(index + 1));
                index++;
            } else if (character == '"') {
                return value.toString();
            } else {
                value.append(character);
            }
        }

        throw new IllegalArgumentException("Unterminated JWT claim: " + claim);
    }

    private long extractLongClaim(String json, String claim) {
        String marker = "\"" + claim + "\":";
        int start = json.indexOf(marker);

        if (start < 0) {
            throw new IllegalArgumentException("Missing JWT claim: " + claim);
        }

        start += marker.length();
        int end = start;

        while (end < json.length() && Character.isDigit(json.charAt(end))) {
            end++;
        }

        if (end == start) {
            throw new IllegalArgumentException("Invalid numeric JWT claim: " + claim);
        }

        return Long.parseLong(json.substring(start, end));
    }
}
