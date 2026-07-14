package com.insurance.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Custom {@link AuthenticationEntryPoint} for JWT-based stateless APIs.
 *
 * <p>When an unauthenticated user attempts to access a protected resource,
 * this entry point returns a {@code 401 Unauthorized} response with a
 * JSON body instead of redirecting to a login page.</p>
 *
 * <h3>Response Format</h3>
 * <pre>{@code
 * {
 *   "timestamp": "2026-07-03T15:30:00",
 *   "status": 401,
 *   "error": "Unauthorized",
 *   "message": "Full authentication is required to access this resource",
 *   "path": "/api/policies"
 * }
 * }</pre>
 *
 * @author Santhosh
 * @since 1.0
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private final ObjectMapper objectMapper;

    @Override
    public void commence(
            HttpServletRequest request,
            HttpServletResponse response,
            AuthenticationException authException) throws IOException, ServletException {

        log.warn("Unauthorized access attempt to '{}': {}",
                request.getRequestURI(), authException.getMessage());

        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);

        Map<String, Object> errorBody = new LinkedHashMap<>();
        errorBody.put("timestamp", LocalDateTime.now().toString());
        errorBody.put("status", HttpStatus.UNAUTHORIZED.value());
        errorBody.put("error", HttpStatus.UNAUTHORIZED.getReasonPhrase());
        errorBody.put("message", authException.getMessage());
        errorBody.put("path", request.getRequestURI());

        objectMapper.writeValue(response.getOutputStream(), errorBody);
    }
}
