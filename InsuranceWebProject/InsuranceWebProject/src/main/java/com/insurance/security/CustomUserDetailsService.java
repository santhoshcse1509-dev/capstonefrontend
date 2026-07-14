package com.insurance.security;

import com.insurance.entity.User;
import com.insurance.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Custom {@link UserDetailsService} that loads user-specific data from the
 * database using the user's email address as the unique identifier.
 *
 * <p>This service is automatically picked up by Spring Security's
 * {@code DaoAuthenticationProvider} to verify credentials during
 * form/basic/JWT authentication flows.</p>
 *
 * @author Santhosh
 * @since 1.0
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    /**
     * Loads a {@link UserDetails} by the user's email address.
     *
     * <p>The {@code @Transactional(readOnly = true)} annotation ensures that
     * the lazy-loaded {@code roles} collection is fetched within the same
     * persistence context.</p>
     *
     * @param email the email identifying the user whose data is required
     * @return a fully populated {@link CustomUserDetails}
     * @throws UsernameNotFoundException if no user exists with the given email
     */
    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        log.debug("Attempting to load user by email: {}", email);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> {
                    log.warn("Authentication failed – no user found with email: {}", email);
                    return new UsernameNotFoundException(
                            "User not found with email: " + email
                    );
                });

        log.debug("User loaded successfully: {} with {} role(s)",
                user.getEmail(), user.getRoles().size());

        return CustomUserDetails.build(user);
    }
}
