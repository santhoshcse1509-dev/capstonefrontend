package com.insurance.entity;

/**
 * Enumeration representing the delivery channel or severity level for notifications.
 *
 * @author Santhosh
 * @since 1.0
 */
public enum NotificationType {

    /** Notification delivered via email */
    EMAIL,

    /** Notification delivered via SMS */
    SMS,

    /** Notification delivered via push notification */
    PUSH,

    /** Informational in-app notification */
    INFO,

    /** Warning in-app notification */
    WARNING
}
