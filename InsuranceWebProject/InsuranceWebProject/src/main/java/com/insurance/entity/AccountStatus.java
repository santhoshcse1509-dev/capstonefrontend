package com.insurance.entity;

/**
 * Represents the administrative account status of a user.
 * <p>
 * ACTIVE    – normal access; default state.
 * SUSPENDED – temporarily blocked (accountNonLocked = false); can be re-activated.
 * DEACTIVATED – permanently disabled (enabled = false); cannot log in.
 *
 * @author Santhosh
 * @since 1.0
 */
public enum AccountStatus {
    ACTIVE,
    SUSPENDED,
    DEACTIVATED
}
