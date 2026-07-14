package com.insurance.security;

import com.insurance.entity.User;
import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.io.Serial;
import java.util.Collection;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Custom UserDetails implementation that wraps the application's
 * {@link User} entity for Spring Security authentication and authorization.
 *
 * @author Santhosh
 * @since 1.0
 */
@Getter
@AllArgsConstructor
public class CustomUserDetails implements UserDetails {

    @Serial
    private static final long serialVersionUID = 1L;

    /** The underlying JPA User entity fields. */
    private final UUID id;
    private final String firstName;
    private final String lastName;
    private final String email;
    private final String password;
    private final boolean enabled;
    private final boolean accountNonLocked;
    private final Collection<? extends GrantedAuthority> authorities;

    /**
     * Factory method that constructs a {@code CustomUserDetails} from a
     * persistent {@link User} entity.
     *
     * @param user the JPA user entity – must not be {@code null}
     * @return a fully populated {@code CustomUserDetails}
     */
    public static CustomUserDetails build(User user) {
        List<GrantedAuthority> authorities = user.getRoles().stream()
                .map(role -> new SimpleGrantedAuthority(role.getName().name()))
                .collect(Collectors.toList());

        return new CustomUserDetails(
                user.getId(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                user.getPassword(),
                user.isEnabled(),
                user.isAccountNonLocked(),
                authorities
        );
    }

    // ──────────────────────────────────────────────────────────────
    // UserDetails contract
    // ──────────────────────────────────────────────────────────────

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return accountNonLocked;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return enabled;
    }
}

