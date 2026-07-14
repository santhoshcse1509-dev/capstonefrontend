package com.insurance.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * JWT authentication filter that executes once per request.
 *
 * <h3>Flow</h3>
 * <ol>
 *   <li>Extract the {@code Bearer} token from the {@code Authorization} header.</li>
 *   <li>Validate the token's signature and expiration via {@link JwtTokenProvider}.</li>
 *   <li>Load the corresponding {@link UserDetails} from the database.</li>
 *   <li>Set an authenticated {@link UsernamePasswordAuthenticationToken} in the
 *       {@link SecurityContextHolder} so downstream filters and controllers
 *       can rely on {@code @AuthenticationPrincipal}.</li>
 * </ol>
 *
 * <p>If the token is missing or invalid the filter simply passes the request
 * along the chain – Spring Security's {@code AuthorizationFilter} will
 * return 401/403 as appropriate.</p>
 *
 * @author Santhosh
 * @since 1.0
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;
    private final CustomUserDetailsService customUserDetailsService;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        try {
            String jwt = extractJwtFromRequest(request);

            if (StringUtils.hasText(jwt) && jwtTokenProvider.validateToken(jwt)) {
                String userEmail = jwtTokenProvider.getUserEmailFromToken(jwt);

                UserDetails userDetails = customUserDetailsService
                        .loadUserByUsername(userEmail);

                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                                userDetails,
                                null,
                                userDetails.getAuthorities()
                        );

                authentication.setDetails(
                        new WebAuthenticationDetailsSource().buildDetails(request)
                );

                SecurityContextHolder.getContext().setAuthentication(authentication);

                log.debug("Set authentication in SecurityContext for user: '{}'",
                        userEmail);
            }
        } catch (Exception ex) {
            log.error("Cannot set user authentication in SecurityContext", ex);
        }

        filterChain.doFilter(request, response);
    }

    /**
     * Extracts the JWT token from the {@code Authorization} header.
     *
     * <p>Expects the header value to follow the {@code Bearer <token>}
     * format as defined in RFC 6750.</p>
     *
     * @param request the incoming HTTP request
     * @return the raw JWT string, or {@code null} if not present
     */
    private String extractJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
