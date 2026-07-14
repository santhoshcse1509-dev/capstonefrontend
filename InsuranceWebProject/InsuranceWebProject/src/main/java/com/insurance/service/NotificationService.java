package com.insurance.service;

import com.insurance.entity.Notification;
import com.insurance.entity.NotificationCategory;
import com.insurance.entity.NotificationType;
import com.insurance.entity.User;
import com.insurance.exception.ResourceNotFoundException;
import com.insurance.repository.NotificationRepository;
import com.insurance.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Service for managing user notifications — creation, retrieval, and read-status updates.
 *
 * @author Santhosh
 * @since 1.0
 */
@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public NotificationService(NotificationRepository notificationRepository,
                               UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    public List<Notification> getNotifications(UUID userId) {
        return notificationRepository.findByUserId(userId);
    }

    public List<Notification> getUnreadNotifications(UUID userId) {
        return notificationRepository.findByUserIdAndReadFalse(userId);
    }

    public long getUnreadCount(UUID userId) {
        return notificationRepository.findByUserIdAndReadFalse(userId).size();
    }

    @Transactional
    public Notification markAsRead(UUID notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));
        notification.setRead(true);
        return notificationRepository.save(notification);
    }

    @Transactional
    public void markAllAsRead(UUID userId) {
        List<Notification> unread = notificationRepository.findByUserIdAndReadFalse(userId);
        unread.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(unread);
    }

    @Transactional
    public Notification createNotification(UUID userId, String title, String message,
                                           NotificationType type, NotificationCategory category) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Notification notification = Notification.builder()
                .user(user)
                .title(title)
                .message(message)
                .type(type)
                .category(category)
                .read(false)
                .sentAt(LocalDateTime.now())
                .build();

        return notificationRepository.save(notification);
    }
}
